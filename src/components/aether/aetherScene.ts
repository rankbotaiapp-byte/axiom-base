// @ts-nocheck
/* Aether scene — Three.js + GSAP, scoped to React-owned DOM nodes */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AETHER_ASSETS } from "./assets";

gsap.registerPlugin(ScrollTrigger);

const AETHER_POSTER = AETHER_ASSETS.poster;
const AETHER_VIDEO = AETHER_ASSETS.video;

/** DOM helpers — keep the ported scene logic working without per-node React refs. */
const $ = (s, base = document) => (base || document).querySelector(s);
const $$ = (s, base = document) => Array.from((base || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Attach the full Aether experience to React refs; returns teardown. */
export function createAetherScene({ root, canvas, video }) {

/* ---------------------------------------------------------
   Config
   --------------------------------------------------------- */
const CONFIG = {
  // UV window of the engine inside the source footage (v measured from the bottom).
  // The source video has a mock UI baked in; this crop keeps only the engine + planet.
  videoCrop: { u0: 0.34, v0: 0.14, w: 0.44, h: 0.68 },
  videoAspect: 16 / 9,
  colors: {
    bg: 0x04060a,
    cyan: 0x00f3ff,
    violet: 0x8b3dff,
    deepViolet: 0x4a1fb8,
    ember: 0xffa04a,
    star: 0xbcd6ff,
  },
  particles: { high: 9000, mobile: 4500 },
  maxDpr: { high: 2, mobile: 1.5 },
  bloom: { strength: 0.42, radius: 0.32, threshold: 0.78 },
  lens: { aberration: 0.0065, distortion: 0.07 },
  // Set to a real URL (e.g. a Formspree / serverless endpoint) to POST briefing requests as JSON.
  portalEndpoint: '',
};

/* ---------------------------------------------------------
   Shared state
   --------------------------------------------------------- */
const state = {
  tier: 'high',
  pointer: { nx: 0, ny: 0 },   // target, -1..1
  pointerActive: 0,             // 0..1 decays after movement
  zoom: 0,
  zoomTarget: 0,
  scroll: 0,
  scrollTarget: 0,
  audio: 0,
  boost: 0,                     // CTA hover throttle
  intensity: 0.5,
  fps: 60,
  camX: 0,
  camY: 0,
  camZ: 10,
};
let listeners = new AbortController();
const on = (target, type, fn, opts = {}) => {
  if (!target) return;
  target.addEventListener(type, fn, { passive: true, ...opts, signal: listeners.signal });
};

/** Track GSAP side-effects so React unmount can fully tear them down. */
const tickerFns = [];
const gsapContexts = [];
const addTicker = (fn) => {
  gsap.ticker.add(fn);
  tickerFns.push(fn);
  return fn;
};

/* ---------------------------------------------------------
   Performance tiering
   --------------------------------------------------------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch {
    return false;
  }
}

function detectTier() {
  const forced = new URLSearchParams(location.search).get('tier');
  if (forced === 'high' || forced === 'mobile' || forced === 'fallback') return forced;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  if (reduced || saveData || memory <= 2 || cores <= 2 || !hasWebGL()) return 'fallback';
  if (coarse || window.innerWidth < 860) return 'mobile';
  return 'high';
}

/* ---------------------------------------------------------
   Video source
   --------------------------------------------------------- */
video.src = AETHER_VIDEO;
video.setAttribute('poster', AETHER_POSTER);
const igniteBtn = $('#ignite');

function playVideo() {
  const attempt = video.play();
  if (attempt && typeof attempt.catch === 'function') {
    attempt.then(() => { igniteBtn.hidden = true; }).catch(() => { igniteBtn.hidden = false; });
  }
}
on(igniteBtn, 'click', () => { playVideo(); igniteBtn.hidden = true; });
on(document, 'visibilitychange', () => {
  if (document.hidden) video.pause();
  else playVideo();
});

/* ---------------------------------------------------------
   Audio reactor (Web Audio API)
   Routes the footage's own soundtrack + a synthesized ion-drive
   rumble through an analyser; level() feeds the visuals.
   --------------------------------------------------------- */
class AudioReactor {
  constructor(mediaEl) {
    this.media = mediaEl;
    this.ctx = null;
    this.enabled = false;
    this.smoothed = 0;
    this.bins = null;
  }

  build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.78;
    this.bins = new Uint8Array(this.analyser.frequencyBinCount);

    // Footage soundtrack
    this.mediaSource = ctx.createMediaElementSource(this.media);
    this.mediaSource.connect(this.analyser);

    // Synthesized drive rumble: detuned saws through a low-pass + band-passed hiss
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 160;
    this.rumbleFilter.Q.value = 6;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.05;

    this.oscA = ctx.createOscillator();
    this.oscA.type = 'sawtooth';
    this.oscA.frequency.value = 46;
    this.oscB = ctx.createOscillator();
    this.oscB.type = 'sawtooth';
    this.oscB.frequency.value = 46.7;
    this.oscA.connect(this.rumbleFilter);
    this.oscB.connect(this.rumbleFilter);
    this.rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.analyser);

    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = ctx.createBufferSource();
    this.noise.buffer = noiseBuf;
    this.noise.loop = true;
    this.hissFilter = ctx.createBiquadFilter();
    this.hissFilter.type = 'bandpass';
    this.hissFilter.frequency.value = 1400;
    this.hissFilter.Q.value = 0.8;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.012;
    this.noise.connect(this.hissFilter);
    this.hissFilter.connect(hissGain);
    hissGain.connect(this.analyser);

    this.analyser.connect(this.master);
    this.master.connect(ctx.destination);

    this.oscA.start();
    this.oscB.start();
    this.noise.start();
    return true;
  }

  async enable() {
    if (!this.ctx && !this.build()) return false;
    await this.ctx.resume();
    this.media.muted = false;
    playVideo();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.9, now, 0.25);
    this.enabled = true;
    return true;
  }

  disable() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.12);
    this.enabled = false;
    setTimeout(() => {
      if (!this.enabled) {
        this.media.muted = true;
        this.ctx.suspend();
      }
    }, 600);
  }

  // Throttle couples scroll/intensity into the synth voice.
  setThrottle(t) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    this.rumbleFilter.frequency.setTargetAtTime(140 + t * 380, now, 0.2);
    this.hissFilter.frequency.setTargetAtTime(1100 + t * 1600, now, 0.2);
    this.oscA.frequency.setTargetAtTime(44 + t * 10, now, 0.3);
    this.oscB.frequency.setTargetAtTime(44.7 + t * 10.4, now, 0.3);
  }

  level() {
    if (!this.enabled || !this.analyser) {
      this.smoothed *= 0.92;
      return this.smoothed;
    }
    this.analyser.getByteFrequencyData(this.bins);
    let low = 0;
    let mid = 0;
    for (let i = 1; i < 12; i++) low += this.bins[i];
    for (let i = 12; i < 48; i++) mid += this.bins[i];
    const raw = clamp((low / 11 / 255) * 0.65 + (mid / 36 / 255) * 0.75, 0, 1);
    this.smoothed += (raw - this.smoothed) * 0.22;
    return this.smoothed;
  }

  spectrum(count) {
    const out = new Array(count).fill(0);
    if (!this.enabled || !this.analyser) return out;
    const step = Math.floor(48 / count);
    for (let i = 0; i < count; i++) {
      let s = 0;
      for (let j = 0; j < step; j++) s += this.bins[1 + i * step + j];
      out[i] = s / step / 255;
    }
    return out;
  }

  dispose() {
    if (this.ctx) this.ctx.close();
    this.ctx = null;
  }
}

const audio = new AudioReactor(video);
const audioBtn = $('#audioToggle');
on(audioBtn, 'click', async () => {
  if (audio.enabled) {
    audio.disable();
    audioBtn.setAttribute('aria-pressed', 'false');
    $('.audio-label', audioBtn).textContent = 'AUDIO OFF';
  } else {
    const ok = await audio.enable();
    if (!ok) return;
    audioBtn.setAttribute('aria-pressed', 'true');
    $('.audio-label', audioBtn).textContent = 'AUDIO ON';
    gsap.fromTo(state, { boost: 1.2 }, { boost: 0, duration: 1.6, ease: 'power3.out' });
  }
});

/* ---------------------------------------------------------
   Input: mouse parallax, touch pan, pinch zoom
   --------------------------------------------------------- */
const pointerNdc = { x: 0, y: 0 };
let returnTween = null;

function setPointer(clientX, clientY) {
  if (returnTween) { returnTween.kill(); returnTween = null; }
  state.pointer.nx = clamp((clientX / window.innerWidth) * 2 - 1, -1, 1);
  state.pointer.ny = clamp(-((clientY / window.innerHeight) * 2 - 1), -1, 1);
  pointerNdc.x = state.pointer.nx;
  pointerNdc.y = state.pointer.ny;
  state.pointerActive = 1;
}

function releasePointer(delay = 0) {
  returnTween = gsap.to(state.pointer, { nx: 0, ny: 0, duration: 1.6, delay, ease: 'power3.inOut' });
}

on(window, 'pointermove', (e) => { if (e.pointerType !== 'touch') setPointer(e.clientX, e.clientY); });
on(document.documentElement, 'mouseleave', () => releasePointer());

const hero = $('.hero');
let pinch = null;
const touchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

on(window, 'touchstart', (e) => {
  if (e.touches.length === 1) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  if (e.touches.length === 2 && hero.contains(e.target)) {
    pinch = { d: touchDist(e.touches), z: state.zoomTarget };
  }
});
on(window, 'touchmove', (e) => {
  if (e.touches.length === 1) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  if (e.touches.length === 2 && pinch) {
    state.zoomTarget = clamp(pinch.z + (touchDist(e.touches) - pinch.d) * 0.012, -2.5, 3.2);
    state.pointerActive = 1;
  }
});
on(window, 'touchend', (e) => {
  if (e.touches.length < 2) pinch = null;
  if (e.touches.length === 0) releasePointer(0.4);
});

/* ---------------------------------------------------------
   Scroll depth → throttle
   --------------------------------------------------------- */
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => { state.scrollTarget = self.progress; },
});

$$('[data-section]').forEach((section) => {
  const id = section.dataset.section;
  ScrollTrigger.create({
    trigger: section,
    start: 'top 45%',
    end: 'bottom 45%',
    onToggle: (self) => {
      if (!self.isActive) return;
      $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
    },
  });
});

const ctaPrimary = $('#ctaPrimary');
on(ctaPrimary, 'mouseenter', () => gsap.to(state, { boost: 1, duration: 0.8, ease: 'power2.out' }));
on(ctaPrimary, 'mouseleave', () => gsap.to(state, { boost: 0, duration: 1.2, ease: 'power2.inOut' }));

/* ---------------------------------------------------------
   HUD telemetry
   --------------------------------------------------------- */
const hud = {
  thrust: $('#thrustVal'),
  ring: $('#thrustRing'),
  vector: $('#vectorVal'),
  coreTemp: $('#coreTemp'),
  coreState: $('#coreState'),
  plasma: $('#plasmaVal'),
  segs: $('#plasmaSegs'),
  xenon: $('#xenonVal'),
  meter: $('#audioMeter'),
  audioState: $('#audioState'),
  fps: $('#fpsVal'),
  lat: $('#latVal'),
  tier: $('#hudTier'),
  roCam: $('#roCam'),
  roZoom: $('#roZoom'),
  roScroll: $('#roScroll'),
};

const SEG_COUNT = 14;
if (hud.segs) {
  for (let i = 0; i < SEG_COUNT; i++) hud.segs.appendChild(document.createElement('i'));
}
const segEls = hud.segs ? Array.from(hud.segs.children) : [];
const METER_COUNT = 10;
if (hud.meter) {
  for (let i = 0; i < METER_COUNT; i++) hud.meter.appendChild(document.createElement('i'));
}
const meterEls = hud.meter ? Array.from(hud.meter.children) : [];
const RING_C = 2 * Math.PI * 26;

let hudClock = 0;
function updateHud(dt, t) {
  hudClock += dt;
  if (hudClock < 0.12) return;
  hudClock = 0;

  const i = state.intensity;
  const a = state.audio;
  const jitter = (Math.sin(t * 7.3) + Math.sin(t * 13.1)) * 0.5;

  const thrust = clamp(98.4 + (i - 0.5) * 1.1 + jitter * 0.12, 90, 99.9);
  hud.thrust.textContent = thrust.toFixed(1);
  hud.ring.style.strokeDashoffset = (RING_C * (1 - thrust / 100)).toFixed(2);

  const yaw = state.camX * 2.2;
  hud.vector.textContent = Math.abs(yaw) < 0.05 ? 'LOCKED −0.01°' : `${yaw >= 0 ? '+' : '−'}${Math.abs(yaw).toFixed(2)}°`;

  const temp = Math.round(452 + i * 36 + a * 70 + jitter * 1.5);
  hud.coreTemp.textContent = temp;
  hud.coreState.textContent = temp > 520 ? 'SURGE' : 'ACTIVE';

  const kpa = Math.round(296 + i * 150 + a * 110 + jitter * 3);
  hud.plasma.textContent = kpa;
  const lit = Math.round(clamp((kpa - 280) / 260, 0, 1) * SEG_COUNT);
  segEls.forEach((el, idx) => {
    el.classList.toggle('on', idx < lit);
    el.classList.toggle('hot', idx >= SEG_COUNT - 3);
  });

  hud.xenon.textContent = (4.5 + i * 0.7 + a * 0.5).toFixed(2);

  const spec = audio.spectrum(METER_COUNT);
  meterEls.forEach((el, idx) => {
    const v = audio.enabled ? spec[idx] : 0.08 + 0.06 * Math.abs(Math.sin(t * 2 + idx));
    el.style.height = `${Math.round(clamp(v, 0.06, 1) * 100)}%`;
  });
  hud.audioState.textContent = audio.enabled ? `LIVE · ${Math.round(a * 100).toString().padStart(2, '0')}%` : 'IDLE · TAP AUDIO';

  hud.fps.textContent = state.tier === 'fallback' ? 'CSS' : Math.round(state.fps);
  hud.lat.textContent = Math.round(14 + (1 - Math.min(state.fps, 60) / 60) * 30 + jitter * 2);

  hud.roCam.textContent = `${state.camX >= 0 ? '+' : ''}${state.camX.toFixed(2)} / ${state.camY >= 0 ? '+' : ''}${state.camY.toFixed(2)}`;
  hud.roZoom.textContent = state.camZ.toFixed(1);
  hud.roScroll.textContent = `${Math.round(state.scroll * 100).toString().padStart(3, '0')}%`;

  root.style.setProperty('--pulse', clamp(a * 1.2 + state.boost * 0.4, 0, 1).toFixed(3));
}

/* ---------------------------------------------------------
   UI motion (GSAP)
   --------------------------------------------------------- */
function introUI() {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    // clearProps: leftover inline transform would make the bar a containing block for the fixed mobile nav dock
    tl.from('.topbar', { y: -30, autoAlpha: 0, duration: 1.1, clearProps: 'transform,opacity,visibility' })
      .from('.hero .eyebrow', { x: -20, autoAlpha: 0, duration: 0.9 }, '-=0.7')
      .from('.hero-title .line-inner', { yPercent: 110, duration: 1.2, stagger: 0.09 }, '-=0.7')
      .from('.lede, .cta-row', { y: 20, autoAlpha: 0, duration: 1, stagger: 0.1 }, '-=0.8')
      .from('.hud', { y: 30, autoAlpha: 0, duration: 1.1 }, '-=0.8')
      .from('.hud .widget', { y: 10, autoAlpha: 0, duration: 0.6, stagger: 0.05 }, '-=0.8')
      .from('.frame .corner', { scale: 0.4, autoAlpha: 0, duration: 0.8, stagger: 0.05 }, 0.2)
      .from('.hero-hint', { autoAlpha: 0, duration: 1 }, '-=0.4');
  }, root);
  gsapContexts.push(ctx);
}

function revealOnScroll() {
  const ctx = gsap.context(() => {
    gsap.set('.reveal', { y: 34, autoAlpha: 0 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }),
    });
    $$('.spec').forEach((card) => {
      const meter = $('.spec-meter i', card);
      if (!meter) return;
      gsap.from(meter, {
        scaleX: 0,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 85%', once: true },
      });
    });
  }, root);
  gsapContexts.push(ctx);
}

function fallbackParallax() {
  const cur = { x: 0, y: 0 };
  addTicker(() => {
    const k = 1 - Math.pow(0.94, gsap.ticker.deltaRatio());
    cur.x += (state.pointer.nx * -14 - cur.x) * k;
    cur.y += (state.pointer.ny * 10 - state.scrollTarget * 40 - cur.y) * k;
    root.style.setProperty('--fx', `${cur.x.toFixed(2)}px`);
    root.style.setProperty('--fy', `${cur.y.toFixed(2)}px`);
  });
}

/* ---------------------------------------------------------
   Briefing form
   --------------------------------------------------------- */
const form = $('#briefForm');
const formStatus = $('#formStatus');
on(form, 'submit', async (e) => {
  e.preventDefault();
  formStatus.classList.remove('is-error');
  let valid = true;
  $$('input, select', form).forEach((el) => {
    const ok = el.checkValidity();
    el.closest('.field').classList.toggle('is-invalid', !ok);
    if (!ok) valid = false;
  });
  if (!valid) {
    formStatus.textContent = 'CHECK HIGHLIGHTED FIELDS';
    formStatus.classList.add('is-error');
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());
  const ref = `AX-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  formStatus.textContent = 'TRANSMITTING…';
  gsap.fromTo(state, { boost: 0.8 }, { boost: 0, duration: 2, ease: 'power2.out' });

  try {
    if (CONFIG.portalEndpoint) {
      const res = await fetch(CONFIG.portalEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, ref }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
    formStatus.textContent = `REQUEST QUEUED · REF ${ref} · EXPECT CONTACT WITHIN 1 BUSINESS DAY`;
    form.reset();
  } catch {
    formStatus.textContent = 'UPLINK FAILED · PLEASE RETRY';
    formStatus.classList.add('is-error');
  }
}, { passive: false });
if (form) {
  $$('input, select', form).forEach((el) => on(el, 'input', () => el.closest('.field')?.classList.remove('is-invalid')));
}

const yearEl = $('#year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---------------------------------------------------------
   Shaders
   --------------------------------------------------------- */
const ENGINE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ENGINE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec4 uCrop;
  uniform float uIntensity;
  uniform float uTime;
  uniform vec3 uBg;
  uniform vec2 uFeather;
  uniform float uDim;
  varying vec2 vUv;

  // Textures are uploaded raw (NoColorSpace) and decoded here, so the result is identical
  // on every browser regardless of whether it supports sRGB video uploads.
  vec3 srgbToLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }

  void main() {
    // Heat shimmer concentrated where the plumes sit (lower-left of the crop)
    float plumeZone = smoothstep(0.7, 0.0, distance(vUv, vec2(0.25, 0.3)));
    vec2 local = vUv;
    local.x += sin(vUv.y * 90.0 + uTime * 9.0) * 0.0011 * plumeZone * (0.4 + uIntensity);
    vec2 uv = uCrop.xy + local * uCrop.zw;

    vec3 c = srgbToLinear(texture2D(uMap, uv).rgb);

    // Push the bright cyan/violet plume above the bloom threshold, leave the hull alone
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float hot = smoothstep(0.18, 0.75, l);
    float cool = smoothstep(0.0, 0.12, c.b - c.r * 0.8);
    c += c * hot * cool * (0.35 + min(uIntensity, 1.3) * 1.1);
    c *= uDim;

    // Feather the crop so it dissolves into the backdrop
    vec2 f = smoothstep(vec2(0.0), uFeather, vUv) * smoothstep(vec2(0.0), uFeather, 1.0 - vUv);
    float m = f.x * f.y;
    m = m * m * (3.0 - 2.0 * m);
    gl_FragColor = vec4(c, m);
  }
`;

// Fullscreen obsidian backdrop with a faint nebula that drifts against the camera for depth.
const BACKDROP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const BACKDROP_FRAG = /* glsl */ `
  uniform vec3 uBg;
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  uniform vec2 uOffset;
  uniform float uAspect;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uAspect;
    vec2 o = uOffset * 0.04;
    float g1 = exp(-6.0 * dot(p - vec2(0.35, 0.05) * vec2(uAspect, 1.0) - o, p - vec2(0.35, 0.05) * vec2(uAspect, 1.0) - o));
    float g2 = exp(-9.0 * dot(p - vec2(-0.1, -0.35) - o * 1.6, p - vec2(-0.1, -0.35) - o * 1.6));
    vec3 col = uBg + uCyan * g1 * (0.006 + uIntensity * 0.006) + uViolet * g2 * (0.009 + uIntensity * 0.006);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const PARTICLE_VERT = /* glsl */ `
  uniform float uFlow;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uIntensity;
  uniform float uPointerStrength;
  uniform float uTanHalf;
  uniform float uAspect;
  uniform vec2 uPointer;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSeed;
  attribute float aSpeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y = mod(p.y + 9.0 + uFlow * aSpeed, 18.0) - 9.0;
    p.x += sin(uFlow * 0.35 + aSeed * 31.0) * aSpeed * 1.1;
    p.z += cos(uFlow * 0.27 + aSeed * 17.0) * 0.2;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;

    // Pointer field: repulsion + tangential swirl (magnetic sway)
    vec2 d = ndc - uPointer;
    d.x *= uAspect;
    float dist = length(d);
    float infl = smoothstep(0.34, 0.0, dist) * uPointerStrength * step(0.0, clip.w);
    vec2 dir = d / max(dist, 1e-4);
    vec2 swirl = vec2(-dir.y, dir.x);
    vec2 push = (dir * 0.8 + swirl * 0.4) * infl;
    mv.xy += push * (-mv.z) * uTanHalf * 0.32;

    gl_Position = projectionMatrix * mv;

    float depth = max(-mv.z, 0.001);
    float twinkle = 0.6 + 0.4 * sin(uTime * (1.4 + aSeed * 3.0) + aSeed * 40.0);
    float size = aSize * uPixelRatio * (1.0 + uIntensity * 0.45 + infl * 0.9) * (10.0 / depth);
    gl_PointSize = clamp(size, 0.0, 48.0 * uPixelRatio);

    vColor = aColor * (1.0 + uIntensity * 0.9 + infl * 1.6);
    vAlpha = twinkle * smoothstep(0.8, 3.0, depth);
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 2.2) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`;

const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAberration: { value: CONFIG.lens.aberration },
    uDistortion: { value: CONFIG.lens.distortion },
    uTime: { value: 0 },
    uResolution: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAberration;
    uniform float uDistortion;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      // Mild barrel distortion, rescaled so corners stay in frame
      vec2 uv = c * (1.0 + uDistortion * r2) / (1.0 + uDistortion * 0.5) + 0.5;

      // Chromatic aberration grows toward the edges
      float edge = smoothstep(0.04, 0.5, r2);
      vec2 off = c * uAberration * edge * 2.0;
      float r = texture2D(tDiffuse, uv + off).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - off).b;
      vec3 col = vec3(r, g, b);

      // Vignette + fine grain
      col *= mix(1.0, 0.5, smoothstep(0.12, 0.62, r2));
      float n = fract(sin(dot(vUv * uResolution + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
      col += (n - 0.5) * 0.012;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/* ---------------------------------------------------------
   WebGL stage
   --------------------------------------------------------- */
async function startWebGL(tier) {
  const THREE = await import('three');
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }] =
    await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/ShaderPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
    ]);
  setBoot(0.55);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    stencil: false,
    powerPreference: tier === 'high' ? 'high-performance' : 'default',
  });
  let dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr[tier]);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const lookTarget = new THREE.Vector3(0, 0, -2);

  /* ---- Backdrop ---- */
  const backdropMat = new THREE.ShaderMaterial({
    uniforms: {
      uBg: { value: new THREE.Color(CONFIG.colors.bg) },
      uCyan: { value: new THREE.Color(CONFIG.colors.cyan) },
      uViolet: { value: new THREE.Color(CONFIG.colors.violet) },
      uOffset: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uIntensity: { value: 0.5 },
    },
    vertexShader: BACKDROP_VERT,
    fragmentShader: BACKDROP_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backdropMat);
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -1;
  scene.add(backdrop);

  /* ---- Engine footage plane ---- */
  const posterTex = new THREE.TextureLoader().load(AETHER_POSTER);
  posterTex.colorSpace = THREE.NoColorSpace;

  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.NoColorSpace;
  videoTex.minFilter = THREE.LinearFilter;
  videoTex.magFilter = THREE.LinearFilter;
  videoTex.generateMipmaps = false;

  const crop = CONFIG.videoCrop;
  const planeAspect = (crop.w / crop.h) * CONFIG.videoAspect;
  const planeH = 9.6;
  const planeW = planeH * planeAspect;
  const engineGeo = new THREE.PlaneGeometry(planeW, planeH, 48, 32);
  const gp = engineGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const y = gp.getY(i);
    gp.setZ(i, -(x * x) * 0.018 - (y * y) * 0.01);
  }
  gp.needsUpdate = true;

  const engineMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: posterTex },
      uCrop: { value: new THREE.Vector4(crop.u0, crop.v0, crop.w, crop.h) },
      uIntensity: { value: 0.5 },
      uTime: { value: 0 },
      uBg: { value: new THREE.Color(CONFIG.colors.bg) },
      uFeather: { value: new THREE.Vector2(0.24, 0.22) },
      uDim: { value: 0 },
    },
    vertexShader: ENGINE_VERT,
    fragmentShader: ENGINE_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const engine = new THREE.Mesh(engineGeo, engineMat);
  engine.position.z = -2;
  engine.renderOrder = 0;
  scene.add(engine);

  const useVideo = () => { engineMat.uniforms.uMap.value = videoTex; };
  if (video.readyState >= 2 && !video.paused) useVideo();
  else video.addEventListener('playing', useVideo, { once: true, signal: listeners.signal });

  /* ---- Volumetric particles ---- */
  const count = CONFIG.particles[tier === 'high' ? 'high' : 'mobile'];
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const speeds = new Float32Array(count);

  const cCyan = new THREE.Color(CONFIG.colors.cyan);
  const cViolet = new THREE.Color(CONFIG.colors.violet);
  const cDeep = new THREE.Color(CONFIG.colors.deepViolet);
  const cEmber = new THREE.Color(CONFIG.colors.ember);
  const cStar = new THREE.Color(CONFIG.colors.star);
  const tmp = new THREE.Color();
  const rand = (a, b) => a + Math.random() * (b - a);

  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let x;
    let y;
    let z;
    let size;
    let speed;
    if (r < 0.3) {
      // far starfield behind the engine
      x = rand(-22, 22); y = rand(-9, 9); z = rand(-20, -7);
      size = rand(0.5, 1.3); speed = rand(0.01, 0.04);
      tmp.copy(cStar).multiplyScalar(rand(0.35, 0.8));
    } else if (r < 0.94) {
      // mid dust layer straddling the engine plane
      x = rand(-14, 14); y = rand(-9, 9); z = rand(-6, 4);
      size = rand(0.9, 3.0); speed = rand(0.12, 0.55);
      const c = Math.random();
      if (c < 0.52) tmp.copy(cCyan);
      else if (c < 0.8) tmp.copy(cViolet);
      else if (c < 0.92) tmp.copy(cDeep).multiplyScalar(1.6);
      else tmp.copy(cEmber);
      tmp.multiplyScalar(rand(0.45, 1.0));
    } else {
      // near-camera bokeh embers in the foreground
      x = rand(-6, 6); y = rand(-9, 9); z = rand(4, 7.5);
      size = rand(2.5, 6); speed = rand(0.3, 0.8);
      tmp.copy(Math.random() < 0.6 ? cCyan : cViolet).multiplyScalar(rand(0.15, 0.35));
    }
    positions.set([x, y, z], i * 3);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    sizes[i] = size;
    seeds[i] = Math.random();
    speeds[i] = speed;
  }

  const ptsGeo = new THREE.BufferGeometry();
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  ptsGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  ptsGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  ptsGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  ptsGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

  const ptsMat = new THREE.ShaderMaterial({
    uniforms: {
      uFlow: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: dpr },
      uIntensity: { value: 0.5 },
      uPointerStrength: { value: 0 },
      uTanHalf: { value: Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) },
      uAspect: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(ptsGeo, ptsMat);
  points.renderOrder = 1;
  points.frustumCulled = false;
  scene.add(points);

  /* ---- Post-processing ---- */
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), CONFIG.bloom.strength, CONFIG.bloom.radius, CONFIG.bloom.threshold);
  const lensPass = new ShaderPass(LensShader);
  lensPass.uniforms.uResolution.value = new THREE.Vector2(1, 1);
  if (tier === 'mobile') lensPass.uniforms.uAberration.value *= 0.6;
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(lensPass);
  composer.addPass(outputPass);

  /* ---- Layout + resize ---- */
  // camZ pulls the camera back on narrow screens so the engine fits the top of the viewport.
  const layout = { x: 2.5, y: 0.1, scale: 1, camZ: 0 };
  function layoutEngine(aspect) {
    if (aspect < 0.8) { layout.x = 0.3; layout.y = 3.4; layout.scale = 0.74; layout.camZ = 7; }
    else if (aspect < 1.25) { layout.x = 0.8; layout.y = 1.6; layout.scale = 0.85; layout.camZ = 3; }
    else if (aspect < 1.6) { layout.x = 2.0; layout.y = 0.2; layout.scale = 0.95; layout.camZ = 0.5; }
    else { layout.x = 2.6; layout.y = 0.1; layout.scale = 1; layout.camZ = 0; }
    backdropMat.uniforms.uAspect.value = aspect;
    engine.position.x = layout.x;
    engine.position.y = layout.y;
    engine.scale.setScalar(layout.scale);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    ptsMat.uniforms.uAspect.value = w / h;
    lensPass.uniforms.uResolution.value.set(w * dpr, h * dpr);
    layoutEngine(w / h);
  }
  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  resize();

  /* ---- Intro camera dolly ---- */
  const intro = { z: 7, dim: 0 };
  gsap.to(intro, { z: 0, dim: 1, duration: 3.2, ease: 'expo.out', delay: 0.2 });

  /* ---- Loop ---- */
  const clock = new THREE.Clock();
  let raf = 0;
  let flow = 0;
  let roll = 0;
  let perfAcc = 0;
  let perfFrames = 0;
  let slowStrikes = 0;
  let degradeLevel = 0;
  let disposed = false;

  function degrade() {
    degradeLevel += 1;
    if (degradeLevel === 1) {
      lensPass.enabled = false;
      dpr = 1;
      renderer.setPixelRatio(dpr);
      composer.setPixelRatio(dpr);
      ptsMat.uniforms.uPixelRatio.value = dpr;
      resize();
    } else if (degradeLevel === 2) {
      bloomPass.enabled = false;
      ptsGeo.setDrawRange(0, Math.floor(count / 2));
    } else {
      teardown();
      enterFallback();
    }
    hud.tier.textContent = `TIER ${tier.toUpperCase()} · D${degradeLevel}`;
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden) { clock.getDelta(); return; }

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const k = 1 - Math.pow(0.95, dt * 60);     // ~0.05 lerp per 60fps frame
    const ks = 1 - Math.pow(0.9, dt * 60);

    state.scroll += (state.scrollTarget - state.scroll) * ks;
    state.zoom += (state.zoomTarget - state.zoom) * k;
    state.audio = audio.level();
    state.intensity = clamp(0.45 + state.scroll * 0.45 + state.audio * 0.9 + state.boost * 0.5, 0, 2);
    audio.setThrottle(clamp(state.scroll + state.boost * 0.5, 0, 1));

    // Camera parallax with inertia
    const strength = tier === 'high' ? 1 : 0.8;
    const tx = state.pointer.nx * 1.15 * strength;
    const ty = state.pointer.ny * 0.7 * strength - state.scroll * 0.8;
    const tz = 10 + layout.camZ - state.scroll * 1.6 - state.zoom + intro.z;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    lookTarget.set(layout.x * 0.25 - camera.position.x * 0.12, layout.y * 0.2 - state.scroll * 0.6, -2);
    camera.lookAt(lookTarget);
    roll += (-state.pointer.nx * 0.035 - roll) * k;
    camera.rotateZ(roll);

    state.camX = camera.position.x;
    state.camY = camera.position.y;
    state.camZ = camera.position.z;

    // Engine plane
    engine.rotation.y = -0.1 + state.scroll * 0.28 + Math.sin(t * 0.3) * 0.015 + state.pointer.nx * -0.05;
    engine.rotation.x = Math.sin(t * 0.23) * 0.012 + state.pointer.ny * 0.03;
    engineMat.uniforms.uTime.value = t;
    engineMat.uniforms.uIntensity.value = state.intensity;
    const s = clamp(state.scroll / 0.3, 0, 1);
    engineMat.uniforms.uDim.value = intro.dim * (1 - s * s * (3 - 2 * s) * 0.62);
    backdropMat.uniforms.uOffset.value.set(camera.position.x, camera.position.y);
    backdropMat.uniforms.uIntensity.value = state.intensity;

    // Particles
    flow += dt * (0.55 + state.scroll * 1.5 + state.audio * 2.6 + state.boost * 1.2);
    state.pointerActive *= Math.pow(0.35, dt);
    const pu = ptsMat.uniforms;
    pu.uFlow.value = flow;
    pu.uTime.value = t;
    pu.uIntensity.value = state.intensity;
    pu.uPointerStrength.value += (state.pointerActive - pu.uPointerStrength.value) * ks;
    pu.uPointer.value.x += (pointerNdc.x - pu.uPointer.value.x) * ks;
    pu.uPointer.value.y += (pointerNdc.y - pu.uPointer.value.y) * ks;
    points.rotation.y = state.scroll * 0.15;

    // Bloom + lens react to intensity / audio
    bloomPass.strength = CONFIG.bloom.strength + Math.min(state.intensity, 1.2) * 0.3;
    bloomPass.radius = CONFIG.bloom.radius + state.audio * 0.25;
    lensPass.uniforms.uTime.value = t;
    lensPass.uniforms.uAberration.value =
      CONFIG.lens.aberration * (tier === 'mobile' ? 0.6 : 1) * (1 + state.audio * 1.4 + state.boost * 0.6);

    composer.render(dt);
    updateHud(dt, t);

    // Performance governor
    perfAcc += dt;
    perfFrames += 1;
    if (perfAcc >= 1) {
      state.fps = perfFrames / perfAcc;
      perfAcc = 0;
      perfFrames = 0;
      if (t > 4) {
        if (state.fps < 28) slowStrikes += 1;
        else slowStrikes = Math.max(0, slowStrikes - 1);
        if (slowStrikes >= 3) { slowStrikes = 0; degrade(); }
      }
    }
  }

  function teardown() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    raf = 0;
    ro.disconnect();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material.dispose?.();
      }
    });
    posterTex.dispose();
    videoTex.dispose();
    bloomPass.dispose();
    lensPass.dispose && lensPass.dispose();
    outputPass.dispose && outputPass.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    teardown();
    enterFallback();
  }, { signal: listeners.signal });

  // Compile shaders + warm up before revealing
  renderer.compile(scene, camera);
  composer.render(0);
  frame();
  return { teardown };
}

/* ---------------------------------------------------------
   Fallback (CSS video + CSS dust)
   --------------------------------------------------------- */
let fallbackActive = false;
function enterFallback() {
  if (fallbackActive) return;
  fallbackActive = true;
  state.tier = 'fallback';
  root.classList.add('is-fallback');
  hud.tier.textContent = 'TIER FALLBACK · CSS';
  fallbackParallax();
  addTicker(() => {
    const dt = gsap.ticker.deltaRatio() / 60;
    state.scroll += (state.scrollTarget - state.scroll) * 0.1;
    state.audio = audio.level();
    state.intensity = clamp(0.45 + state.scroll * 0.45 + state.audio * 0.9 + state.boost * 0.5, 0, 2);
    state.fps = 60;
    updateHud(dt, performance.now() / 1000);
  });
}

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
function setBoot(p) {
  const bootBar = $('#bootBar');
  if (bootBar) bootBar.style.width = `${Math.round(p * 100)}%`;
}

let stage = null;
async function boot() {
  state.tier = detectTier();
  root.dataset.tier = state.tier;
  hud.tier.textContent = `TIER ${state.tier.toUpperCase()}`;
  setBoot(0.2);
  playVideo();

  if (state.tier === 'fallback') {
    enterFallback();
  } else {
    try {
      stage = await startWebGL(state.tier);
    } catch (err) {
      console.warn('[aether] WebGL stage failed, using CSS fallback.', err);
      enterFallback();
    }
  }

  setBoot(1);
  await new Promise((r) => setTimeout(r, 350));
  root.classList.remove('is-booting');
  introUI();
  revealOnScroll();
  ScrollTrigger.refresh();
}

  if (listeners.signal.aborted) listeners = new AbortController();
  void boot();
  const onHide = (e) => {
    if (e && e.persisted) return;
    if (stage) {
      stage.teardown();
      stage = null;
    }
    try {
      video.pause();
      video.removeAttribute("src");
      video.load();
    } catch { /* ignore */ }
    audio.dispose();
    listeners.abort();
    while (tickerFns.length) {
      const fn = tickerFns.pop();
      gsap.ticker.remove(fn);
    }
    while (gsapContexts.length) {
      gsapContexts.pop()?.revert();
    }
    ScrollTrigger.getAll().forEach((st) => st.kill());
    gsap.killTweensOf(state);
    gsap.killTweensOf(state.pointer);
    window.removeEventListener("pagehide", onHide);
  };
  window.addEventListener("pagehide", onHide);
  return () => onHide({ persisted: false });
}
