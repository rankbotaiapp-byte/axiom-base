/* ==========================================================================
   Abyssal Sanctuary — tactical reef feed
   --------------------------------------------------------------------------
   The uploaded MP4 (shark-hero-animation.mp4, untouched) is the photoreal
   layer. Each frame:
     1. FX     — a transparent 2D canvas paints things that live *in* the
                 water: ink clouds, bubbles, distant baitfish, marine snow.
     2. Ripples— a CPU height-field wave sim encoded as a small normal map.
     3. GL     — WebGL samples the video (cover-cropped, camera-tracked) and
                 the FX layer through the ripple normals, then adds a
                 cinematic grade, volumetric god rays, caustics and grain.
     4. HUD    — a crisp top canvas draws contact brackets, lock-on reticles,
                 sonar pings and the bioluminescent trail.
   Creature positions come from hand-keyed tracks of the clip (video-space
   0–1 coordinates), mapped through the same camera crop as the picture, so
   tap targets line up on any screen shape.
   If WebGL (or video-to-texture) is unavailable, the <video> is shown
   directly with the FX canvas over it.
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ utils */
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const seeded = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const pad2 = (n) => String(n).padStart(2, '0');
  const NEON = '0,255,204';

  /* ------------------------------------------------------------------ state */
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const TIERS = [2, 1.5, 1.25, 1, 0.8, 0.65];
  const S = {
    W: 0, H: 0, U: 1, rs: 1, hs: 1, fs: 1, dpr: 1,
    t: 0, depth: 0, depthRaw: 0,
    tier: 1, quality: 'auto', trail: true, sound: false,
    reduced: reducedMQ.matches,
    par: { x: 0, y: 0, tx: 0, ty: 0 },
    cam: { cx: 0.5, cy: 0.5, sx: 1, sy: 1, fu: 0.5 },
    sel: 'shark', vt: 0, loops: 0, pad: coarse ? 20 : 8
  };
  if (reducedMQ.addEventListener) reducedMQ.addEventListener('change', (e) => { S.reduced = e.matches; });

  const host = document.getElementById('ocean');
  const video = document.getElementById('feed');
  const glc = document.getElementById('ocean-gl');
  const hud = document.getElementById('ocean-hud');
  const hx = hud.getContext('2d');
  const fxc = mk(1, 1);
  const fx = fxc.getContext('2d');

  /* ------------------------------------------------------------------ tracks */
  // Hand-keyed from the clip every 0.5 s: [time, u, v, w, h] in video space (0–1).
  // `null` = contact out of frame.
  const CONTACTS = [
    { id: 'shark', code: 'C-01', name: 'Great white', len: 4.6, status: 'Tracking', keys: [
      [0, .63, .38, .32, .30], [.5, .64, .39, .32, .30], [1, .63, .42, .32, .30], [1.5, .64, .46, .34, .30], [2, .60, .50, .40, .30],
      [2.5, .62, .50, .42, .30], [3, .53, .47, .46, .32], [3.5, .57, .48, .48, .32], [4, .55, .50, .50, .30], [4.5, .50, .50, .40, .30],
      [4.85, .44, .42, .25, .25], [5, .43, .43, .28, .25], [5.5, .43, .47, .28, .25], [6, .42, .49, .30, .28], [6.5, .45, .50, .34, .28],
      [7, .40, .49, .42, .30], [7.5, .45, .52, .42, .30], [8, .40, .50, .50, .32], [8.5, .45, .52, .50, .32], [9, .38, .53, .40, .34],
      [9.5, .44, .50, .55, .36], [10.01, .44, .50, .55, .36]] },
    { id: 'octo', code: 'C-02', name: 'Octopus', len: 1.1, status: 'Holding', keys: [
      [0, .86, .69, .16, .24], [.5, .87, .69, .16, .24], [1, .86, .72, .16, .24], [1.5, .87, .73, .16, .24], [2, .86, .75, .16, .24],
      [2.5, .87, .75, .16, .24], [3, .85, .74, .16, .24], [3.5, .88, .76, .16, .24], [4, .87, .77, .16, .24], [4.5, .88, .75, .16, .22],
      [5, .83, .67, .14, .20], [5.5, .84, .67, .14, .20], [6, .78, .72, .16, .24], [6.5, .82, .71, .16, .24], [7, .76, .72, .18, .26],
      [7.5, .80, .72, .16, .30], [8, .74, .58, .18, .40], [8.5, .78, .55, .18, .40], [9, .70, .46, .20, .42], [9.5, .72, .40, .20, .38],
      [10.01, .72, .40, .20, .38]] },
    { id: 'eel', code: 'C-03', name: 'Moray', len: 1.8, status: 'Holding', keys: [
      [0, .20, .73, .24, .18], [2.5, .21, .74, .24, .18], [3, .17, .76, .24, .18], [4.5, .17, .77, .24, .18], [5, .20, .72, .26, .16],
      [5.5, .20, .71, .26, .16], [6, .15, .75, .26, .16], [6.5, .16, .75, .26, .16], [7, .10, .78, .20, .14], [7.5, .08, .78, .16, .14],
      [8, .05, .78, .12, .12], [9, .04, .78, .10, .12], [9.5, .04, .76, .10, .12], [10.01, .04, .76, .10, .12]] },
    { id: 'school', code: 'C-04', name: 'Barracuda', len: 1.4, status: 'Schooling', keys: [
      [0, .26, .42, .30, .22], [1, .22, .45, .30, .22], [2, .20, .44, .30, .24], [3, .15, .38, .30, .26], [4, .14, .40, .28, .28],
      [4.5, .14, .38, .28, .28], [4.7, .40, .38, .40, .30], [5, .62, .36, .40, .30], [5.5, .88, .36, .25, .40], [5.75, null], [10.01, null]] }
  ];
  const byId = Object.fromEntries(CONTACTS.map((c) => [c.id, c]));
  function track(c, t) {
    const k = c.keys;
    let i = 0;
    while (i < k.length - 2 && k[i + 1][0] <= t) i++;
    const a = k[i], b = k[i + 1];
    if (a[1] == null) return null;
    if (b[1] == null) return t < b[0] ? { u: a[1], v: a[2], w: a[3], h: a[4] } : null;
    const f = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    return { u: lerp(a[1], b[1], f), v: lerp(a[2], b[2], f), w: lerp(a[3], b[3], f), h: lerp(a[4], b[4], f) };
  }

  /* ------------------------------------------------------------------ camera */
  // Cover-crop of the 16:9 feed into any viewport. On narrow screens the crop
  // pans to follow the selected contact.
  const Cam = {
    zoom: 1.06,
    update(dt) {
      const A = (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : 16 / 9;
      const a = S.W / S.H, z = (GLR.ok ? this.zoom : 1) * (1 + S.depth * 0.14);
      let sx, sy;
      if (a >= A) { sx = 1; sy = A / a; } else { sx = a / A; sy = 1; }
      sx /= z; sy /= z;
      const c = byId[S.sel], tr = c && track(c, S.vt);
      const fu = tr ? tr.u : 0.55, fv = tr ? tr.v : 0.5;
      S.cam.fu = damp(S.cam.fu, fu, 1.6, dt);
      const pu = GLR.ok ? -S.par.x * 0.02 : 0, pv = GLR.ok ? -S.par.y * 0.015 : 0;
      const wantX = sx < 0.98 ? S.cam.fu : 0.5;
      const wantY = sy < 0.98 ? lerp(0.52, fv, 0.4) : 0.5;
      S.cam.cx = clamp(damp(S.cam.cx, wantX, 2.2, dt) + 0, sx / 2, 1 - sx / 2);
      S.cam.cy = clamp(damp(S.cam.cy, wantY, 2.2, dt), sy / 2, 1 - sy / 2);
      S.cam.sx = sx; S.cam.sy = sy;
      S.cam.ox = clamp(S.cam.cx + pu, sx / 2, 1 - sx / 2);
      S.cam.oy = clamp(S.cam.cy + pv, sy / 2, 1 - sy / 2);
      if (!GLR.ok) {
        const px = sx >= 1 ? 50 : (S.cam.ox - sx / 2) / (1 - sx) * 100, py = sy >= 1 ? 50 : (S.cam.oy - sy / 2) / (1 - sy) * 100;
        video.style.objectPosition = `${px.toFixed(2)}% ${py.toFixed(2)}%`;
      }
    },
    toScreen(u, v) { const c = S.cam; return { x: ((u - c.ox) / c.sx + 0.5) * S.W, y: ((v - c.oy) / c.sy + 0.5) * S.H }; },
    boxOf(tr) {
      const p = this.toScreen(tr.u, tr.v), c = S.cam;
      return { x: p.x, y: p.y, w: tr.w / c.sx * S.W, h: tr.h / c.sy * S.H };
    }
  };

  /* ------------------------------------------------------------------ audio */
  // The Sound toggle unmutes the feed's own soundtrack and adds small UI cues.
  const Snd = {
    ctx: null, out: null, noise: null,
    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      const c = this.ctx;
      this.out = c.createGain(); this.out.gain.value = 0.4;
      const comp = c.createDynamicsCompressor(); this.out.connect(comp); comp.connect(c.destination);
      const len = c.sampleRate, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
      return true;
    },
    set(on) {
      S.sound = on;
      video.muted = !on;
      if (on) { this.ensure(); video.volume = 0.8; const p = video.play(); if (p && p.catch) p.catch(() => {}); }
      return on;
    },
    tone(f0, f1, dur, vol, type = 'sine') {
      if (!S.sound || !this.ctx) return;
      const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.05);
    },
    hiss(dur, f0, f1, vol) {
      if (!S.sound || !this.ctx) return;
      const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noise;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.out); s.start(t); s.stop(t + dur + 0.05);
    },
    water() { this.tone(340, 110, 0.3, 0.12); this.hiss(0.22, 1200, 380, 0.04); },
    ping() { this.tone(1480, 1460, 0.5, 0.06); this.tone(2960, 2940, 0.2, 0.02); },
    lock() { this.tone(880, 880, 0.06, 0.06, 'square'); setTimeout(() => this.tone(1320, 1320, 0.08, 0.05, 'square'), 90); },
    ink() { this.hiss(0.9, 260, 1500, 0.2); this.tone(110, 42, 0.5, 0.22); },
    pop() { this.tone(950, 2000, 0.06, 0.06, 'triangle'); }
  };

  /* ---------------------------------------------------------------- ripples */
  const Rip = {
    gw: 8, gh: 8, cx: 8, cy: 8, a: null, b: null, out: null, acc: 0, active: false, dirty: true, idle: 0,
    resize() {
      const cell = clamp(S.U / 95, 4, 9);
      this.gw = Math.max(8, Math.round(S.W / cell)); this.gh = Math.max(8, Math.round(S.H / cell));
      this.cx = S.W / this.gw; this.cy = S.H / this.gh;
      const n = this.gw * this.gh;
      this.a = new Float32Array(n); this.b = new Float32Array(n);
      this.out = new Uint8Array(n * 4).fill(128);
      this.active = false; this.dirty = true;
    },
    drop(x, y, rPx, amp) {
      if (!this.a) return;
      const gx = x / this.cx, gy = y / this.cy, r = Math.max(1.3, rPx / this.cx);
      const x0 = Math.max(1, Math.floor(gx - r)), x1 = Math.min(this.gw - 2, Math.ceil(gx + r));
      const y0 = Math.max(1, Math.floor(gy - r)), y1 = Math.min(this.gh - 2, Math.ceil(gy + r));
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const d = Math.hypot(i - gx, j - gy) / r; if (d >= 1) continue;
        this.a[j * this.gw + i] += amp * (0.5 + 0.5 * Math.cos(Math.PI * d));
      }
      this.active = true; this.idle = 0;
    },
    step() {
      const gw = this.gw, gh = this.gh, a = this.a, b = this.b;
      for (let j = 1; j < gh - 1; j++) {
        let i = j * gw + 1;
        for (let x = 1; x < gw - 1; x++, i++) b[i] = ((a[i - 1] + a[i + 1] + a[i - gw] + a[i + gw]) * 0.5 - b[i]) * 0.984;
      }
      this.a = b; this.b = a;
    },
    update(dt) {
      if (!this.active) return;
      this.acc += dt; let n = 0;
      while (this.acc >= 1 / 60 && n < 3) { this.step(); this.acc -= 1 / 60; n++; }
      if (n === 3) this.acc = 0;
      if (n) this.encode();
    },
    encode() {
      const gw = this.gw, gh = this.gh, a = this.a, o = this.out;
      let e = 0;
      for (let j = 0; j < gh; j++) {
        const jm = j > 0 ? -gw : 0, jp = j < gh - 1 ? gw : 0;
        for (let x = 0; x < gw; x++) {
          const i = j * gw + x, k = i * 4;
          o[k] = clamp(128 + (a[x < gw - 1 ? i + 1 : i] - a[x > 0 ? i - 1 : i]) * 64, 0, 255);
          o[k + 1] = clamp(128 + (a[i + jp] - a[i + jm]) * 64, 0, 255);
          o[k + 2] = clamp(128 + a[i] * 70, 0, 255);
          e += a[i] < 0 ? -a[i] : a[i];
        }
      }
      this.dirty = true;
      if (e / (gw * gh) < 0.0006) {
        if (++this.idle > 20) { a.fill(0); this.b.fill(0); o.fill(128); this.active = false; }
      } else this.idle = 0;
    },
    grad(x, y) {
      if (!this.active) return { dx: 0, dy: 0 };
      const i = clamp(Math.round(x / this.cx), 1, this.gw - 2), j = clamp(Math.round(y / this.cy), 1, this.gh - 2), k = j * this.gw + i;
      return { dx: this.a[k + 1] - this.a[k - 1], dy: this.a[k + this.gw] - this.a[k - this.gw] };
    }
  };

  /* ---------------------------------------------------------------- WebGL */
  const GLR = {
    ok: false, gl: null, u: {}, tVid: null, tFx: null, tRip: null, ripW: 0, ripH: 0, hasVid: false, lastVT: -1,
    init() {
      let gl = null;
      try {
        const o = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
        gl = glc.getContext('webgl', o) || glc.getContext('experimental-webgl', o);
      } catch (e) { gl = null; }
      if (!gl) return false;
      const vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}';
      const fs = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uVid; uniform sampler2D uFx; uniform sampler2D uRip;
uniform vec4 uCam; uniform vec2 uRes; uniform float uTime; uniform float uDepth; uniform float uDisp; uniform float uHasVid;
varying vec2 v;
float h1(float n){ return fract(sin(n) * 43758.5453); }
float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float caustic(vec2 p, float t){
  vec2 i = p; float c = 1.0; float inten = 0.005;
  for (int n = 0; n < 3; n++){
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 3.0; c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}
vec3 feed(vec2 sd){
  vec2 vu = uCam.xy + (sd - 0.5) * uCam.zw;
  vec3 base = mix(vec3(0.03, 0.12, 0.15), vec3(0.01, 0.03, 0.04), sd.y);
  if (uHasVid < 0.5) return base;
  return texture2D(uVid, vec2(vu.x, 1.0 - vu.y)).rgb;
}
void main(){
  vec2 sd = vec2(v.x, 1.0 - v.y);                // screen uv, y down
  vec4 r = texture2D(uRip, v);
  vec2 n = (r.rg - 0.5) * 2.0;
  float h = (r.b - 0.5) * 2.0;
  vec2 d = n * uDisp / uRes;
  vec2 q = sd + d;
  float ca = min(0.18, length(n) * 0.15) + 0.04;
  vec2 cad = (sd - 0.5) * 0.0025;               // slight lens fringing toward the edges
  vec3 col;
  col.r = feed(q + d * ca + cad).r;
  col.g = feed(q).g;
  col.b = feed(q - d * ca - cad).b;

  // in-water FX layer (ink, bubbles, baitfish, snow), refracted with the picture
  vec4 f = texture2D(uFx, vec2(q.x, 1.0 - q.y));
  col = mix(col, f.rgb, f.a);

  // cinematic grade: crush, cool, desaturate, deepen with depth
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 0.84);
  col *= vec3(0.9, 1.0, 1.03);
  col = clamp((col - 0.06) * 1.14, 0.0, 1.0);
  col = pow(col, vec3(1.12));
  col *= 1.0 - uDepth * 0.45;

  // volumetric shafts from a light source above the frame
  float aspect = uRes.x / uRes.y;
  vec2 lp = vec2(0.5 + sin(uTime * 0.05) * 0.06, -0.25);
  vec2 rp = (sd - lp) * vec2(aspect, 1.0);
  float ang = atan(rp.x, rp.y);
  float shafts = n1(ang * 26.0 + uTime * 0.22) * n1(ang * 61.0 - uTime * 0.31 + 4.0);
  shafts = pow(shafts, 2.2) * exp(-rp.y * 1.7) * smoothstep(1.2, 0.0, abs(ang));
  col += vec3(0.42, 0.82, 0.86) * shafts * 0.34 * (1.0 - uDepth * 0.8);

  // ripple crests and surface caustics
  float lit = dot(n, vec2(-0.5, -0.8));
  col += vec3(0.5, 0.95, 0.95) * max(lit, 0.0) * 0.22;
  col -= vec3(0.02, 0.04, 0.05) * max(-lit, 0.0);
  col += vec3(0.0, 0.5, 0.42) * max(h, 0.0) * 0.05;
  vec2 cp = sd * vec2(aspect, 1.0) * 2.4 * 6.28318 - 250.0;
  float c = caustic(cp + n * 0.8, uTime * 0.32 + 23.0);
  float top = smoothstep(0.9, 0.0, sd.y);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += vec3(0.4, 0.85, 0.85) * clamp(c, 0.0, 1.5) * top * 0.12 * (0.25 + lum * 1.6) * (1.0 - uDepth);

  // vignette + film grain
  vec2 vq = (sd - 0.5) * vec2(0.95, 1.15);
  col *= 1.0 - dot(vq, vq) * 0.85;
  col += (h2(sd * uRes + fract(uTime) * 91.0) - 0.5) * 0.045;
  gl_FragColor = vec4(col, 1.0);
}`;
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
      const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
      if (!v || !f) return false;
      const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const k of ['uVid', 'uFx', 'uRip', 'uCam', 'uRes', 'uTime', 'uDepth', 'uDisp', 'uHasVid']) this.u[k] = gl.getUniformLocation(pr, k);
      const tex = (unit) => {
        const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        return t;
      };
      this.tVid = tex(0); this.tFx = tex(1); this.tRip = tex(2);
      gl.uniform1i(this.u.uVid, 0); gl.uniform1i(this.u.uFx, 1); gl.uniform1i(this.u.uRip, 2);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      this.gl = gl; this.ok = true;
      glc.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fallback2D(); }, false);
      return true;
    },
    resize(pw, ph) { if (!this.ok) return; glc.width = pw; glc.height = ph; this.gl.viewport(0, 0, pw, ph); this.ripW = 0; },
    draw() {
      const gl = this.gl;
      if (video.readyState >= 2 && video.currentTime !== this.lastVT) {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tVid);
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video); this.hasVid = true; this.lastVT = video.currentTime; }
        catch (e) { fallback2D(); return; } // e.g. a cross-origin video host
      }
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tFx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fxc);
      if (Rip.dirty || this.ripW !== Rip.gw || this.ripH !== Rip.gh) {
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.tRip);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Rip.gw, Rip.gh, 0, gl.RGBA, gl.UNSIGNED_BYTE, Rip.out);
        this.ripW = Rip.gw; this.ripH = Rip.gh; Rip.dirty = false;
      }
      const c = S.cam;
      gl.uniform4f(this.u.uCam, c.ox, c.oy, c.sx, c.sy);
      gl.uniform2f(this.u.uRes, glc.width, glc.height);
      gl.uniform1f(this.u.uTime, S.t);
      gl.uniform1f(this.u.uDepth, S.depth);
      gl.uniform1f(this.u.uDisp, 22 * S.rs * clamp(S.U / 700, 0.7, 1.3));
      gl.uniform1f(this.u.uHasVid, this.hasVid ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };

  function fallback2D() {
    if (!GLR.ok && host.classList.contains('no-gl')) return;
    GLR.ok = false;
    host.classList.add('no-gl');
    glc.style.display = 'none';
    fxc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    if (!fxc.parentNode) host.insertBefore(fxc, hud);
  }

  /* ---------------------------------------------------------------- sprites */
  const Spr = {
    ink: [], bubble: null, bokeh: null, glow: null,
    build() {
      // Ink: fbm value-noise clouds with a soft radial falloff (organic edges, not discs)
      const s = 160, grid = (rng, n) => { const g = new Float32Array((n + 1) * (n + 1)); for (let i = 0; i < g.length; i++) g[i] = rng(); return g; };
      this.ink = [];
      for (let k = 0; k < 3; k++) {
        const rng = seeded(71 + k * 31), octs = [[4, grid(rng, 4)], [8, grid(rng, 8)], [16, grid(rng, 16)], [32, grid(rng, 32)]];
        const cv = mk(s, s), c = cv.getContext('2d'), img = c.createImageData(s, s), d = img.data;
        const sample = (g, n, x, y) => { const fx = x * n, fy = y * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), w = n + 1;
          const a = g[iy * w + ix], b = g[iy * w + ix + 1], cc = g[(iy + 1) * w + ix], dd = g[(iy + 1) * w + ix + 1]; return lerp(lerp(a, b, sx), lerp(cc, dd, sx), sy); };
        for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
          const u = x / s, v = y / s;
          let f = 0, amp = 0.55;
          for (const [n, g] of octs) { f += sample(g, n, Math.min(u, 0.9999), Math.min(v, 0.9999)) * amp; amp *= 0.5; }
          const r = Math.hypot(u - 0.5, v - 0.5) * 2;
          const a = clamp((f - 0.28) * 2.2, 0, 1) * clamp(1 - Math.pow(r, 1.6), 0, 1);
          const i = (y * s + x) * 4;
          d[i] = 14 + f * 10; d[i + 1] = 10 + f * 6; d[i + 2] = 9 + f * 6; d[i + 3] = a * 235;
        }
        c.putImageData(img, 0, 0);
        this.ink.push(cv);
      }
      // Bubble: thin bright rim, dark refraction ring, specular highlights
      let b = 64, c;
      this.bubble = mk(b, b); c = this.bubble.getContext('2d');
      let g = c.createRadialGradient(b / 2, b / 2, b * 0.18, b / 2, b / 2, b * 0.48);
      g.addColorStop(0, 'rgba(180,230,235,0.02)'); g.addColorStop(0.72, 'rgba(10,40,48,0.18)'); g.addColorStop(0.9, 'rgba(200,245,250,0.55)'); g.addColorStop(1, 'rgba(220,250,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(b / 2, b / 2, b * 0.48, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(b * 0.36, b * 0.3, b * 0.09, b * 0.045, -0.7, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = b * 0.025; c.beginPath(); c.arc(b / 2, b / 2, b * 0.36, 0.3, 1.2); c.stroke();
      // Out-of-focus particle
      this.bokeh = mk(64, 64); c = this.bokeh.getContext('2d');
      g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(200,235,235,0.5)'); g.addColorStop(0.7, 'rgba(190,230,230,0.35)'); g.addColorStop(0.85, 'rgba(210,245,245,0.45)'); g.addColorStop(1, 'rgba(200,240,240,0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      // Bioluminescent glow (HUD layer)
      this.glow = mk(64, 64); c = this.glow.getContext('2d');
      g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(225,255,248,1)'); g.addColorStop(0.18, 'rgba(0,255,204,0.85)'); g.addColorStop(0.45, 'rgba(0,200,190,0.22)'); g.addColorStop(1, 'rgba(0,160,170,0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    }
  };

  /* ---------------------------------------------------------------- FX: in-water layer */
  const Snow = {
    list: [],
    build() {
      const n = Math.round(clamp(S.W * S.H / 11000, 40, 140));
      this.list = Array.from({ length: n }, () => ({ x: rand(0, S.W), y: rand(0, S.H), z: Math.pow(Math.random(), 2), ph: rand(0, TAU) }));
    },
    update(dt) {
      const k = S.reduced ? 0.3 : 1;
      for (const p of this.list) {
        p.y += (4 + p.z * 14) * dt * k; p.x += Math.sin(S.t * 0.3 + p.ph) * (2 + p.z * 6) * dt * k - S.par.x * p.z * 0.4;
        if (p.y > S.H + 30) { p.y = -30; p.x = rand(0, S.W); }
        if (p.x < -30) p.x = S.W + 30; else if (p.x > S.W + 30) p.x = -30;
      }
    },
    draw(c) {
      for (const p of this.list) {
        if (p.z > 0.82) { const s = 6 + (p.z - 0.82) * 120; c.globalAlpha = 0.08 + (1 - p.z) * 0.3; c.drawImage(Spr.bokeh, p.x - s / 2, p.y - s / 2, s, s); }
        else { c.globalAlpha = 0.15 + p.z * 0.4; c.fillStyle = 'rgb(205,235,235)'; const s = 0.8 + p.z * 2; c.fillRect(p.x, p.y, s, s); }
      }
      c.globalAlpha = 1;
    }
  };

  // Distant baitfish: small silver silhouettes that scatter from taps
  const Bait = {
    list: [], fl: 10,
    build(first, sxk, syk) {
      this.fl = clamp(S.U * 0.018, 7, 15);
      const n = Math.round(clamp(S.W / 30, 16, 42));
      if (first || this.list.length !== n) {
        this.list = Array.from({ length: n }, () => { const a = rand(0, TAU), r = Math.sqrt(Math.random()); return { x: S.W * 0.5 + rand(-60, 60), y: S.H * 0.25 + rand(-30, 30), vx: this.fl * 3, vy: 0, ox: Math.cos(a) * r * this.fl * 9, oy: Math.sin(a) * r * this.fl * 3.5, p: 0, fx: 0, fy: 0, ph: rand(0, TAU), s: rand(0.75, 1.2), glint: 0 }; });
      } else for (const f of this.list) { f.x *= sxk; f.y *= syk; }
    },
    startle(x, y, R) {
      for (const f of this.list) {
        const dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy);
        if (d > R) continue;
        const s = 1 - d / R;
        f.p = Math.min(1, f.p + 0.5 + s); f.fx = x; f.fy = y; f.glint = 1;
        f.vx += dx / (d || 1) * this.fl * 30 * s + rand(-1, 1) * this.fl * 4; f.vy += dy / (d || 1) * this.fl * 30 * s + rand(-1, 1) * this.fl * 4;
      }
    },
    update(dt) {
      const fl = this.fl, top = 90;
      const cx = S.W * (0.5 + 0.38 * Math.sin(S.t * 0.04 + 2)), cy = top + (S.H * 0.35 - top) * (0.5 + 0.4 * Math.sin(S.t * 0.07));
      const L = this.list;
      for (let i = 0; i < L.length; i++) {
        const f = L[i];
        for (let j = i + 1; j < L.length; j++) {
          const g = L[j], dx = f.x - g.x, dy = f.y - g.y, d2 = dx * dx + dy * dy, R = fl * 1.6;
          if (d2 < R * R && d2 > 0.01) { const d = Math.sqrt(d2), s = (1 - d / R) * fl * 10 * dt; f.vx += dx / d * s; f.vy += dy / d * s; g.vx -= dx / d * s; g.vy -= dy / d * s; }
        }
        let ax = (cx + f.ox - f.x) * 0.7, ay = (cy + f.oy - f.y) * 0.7;
        if (f.p > 0) { const dx = f.x - f.fx, dy = f.y - f.fy, d = Math.hypot(dx, dy) || 1; ax += dx / d * fl * 60 * f.p; ay += dy / d * fl * 60 * f.p; }
        f.vx += ax * dt; f.vy += ay * dt;
        const sp = Math.hypot(f.vx, f.vy), mx = fl * (4 + 16 * f.p);
        if (sp > mx) { f.vx *= mx / sp; f.vy *= mx / sp; }
        const dk = Math.exp(-0.7 * dt); f.vx *= dk; f.vy *= dk;
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.p = Math.max(0, f.p - dt / 1.8); f.glint = Math.max(0, f.glint - dt * 1.8);
        f.ph += dt * (8 + sp / fl);
      }
    },
    draw(c) {
      const fl = this.fl;
      for (const f of this.list) {
        const a = Math.atan2(f.vy, f.vx), L = fl * f.s, w = L * 0.16;
        c.save(); c.translate(f.x, f.y); c.rotate(a);
        c.globalAlpha = 0.5 + f.glint * 0.4;
        c.fillStyle = f.glint > 0.05 ? `rgb(${200 + f.glint * 55 | 0},${225 + f.glint * 30 | 0},230)` : 'rgb(150,182,190)';
        c.beginPath(); c.ellipse(0, 0, L * 0.5, w, 0, 0, TAU); c.fill();
        const tw = Math.sin(f.ph) * w * 1.2;
        c.beginPath(); c.moveTo(-L * 0.42, 0); c.lineTo(-L * 0.68, -w * 1.5 + tw); c.lineTo(-L * 0.62, tw * 0.5); c.lineTo(-L * 0.68, w * 1.5 + tw); c.closePath(); c.fill();
        c.restore();
      }
      c.globalAlpha = 1;
    }
  };

  const Bub = {
    list: [],
    spawn(x, y, r) { if (this.list.length < 90) this.list.push({ x, y, r: r * clamp(S.U / 600, 0.75, 1.4), vy: -(30 + r * 9) * clamp(S.U / 700, 0.7, 1.3), ph: rand(0, TAU), wob: rand(5, 14) }); },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const b = this.list[i];
        b.y += b.vy * dt; b.x += Math.sin(S.t * 2.6 + b.ph) * b.wob * dt; b.r *= 1 + dt * 0.03;
        if (b.y < -24) this.list.splice(i, 1);
      }
    },
    popAt(x, y) {
      let hit = false;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const b = this.list[i];
        if (Math.hypot(x - b.x, y - b.y) < b.r + S.pad + 4) {
          for (let k = 0; k < 8; k++) Glow.sparkle(b.x, b.y);
          Rip.drop(b.x, b.y, b.r * 3 + 10, 0.4); Snd.pop();
          this.list.splice(i, 1); hit = true;
        }
      }
      return hit;
    },
    draw(c) { for (const b of this.list) c.drawImage(Spr.bubble, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); }
  };

  const Ink = {
    list: [], veil: null,
    burst(x, y, R, dir) {
      for (let i = 0; i < 30; i++) {
        const a = dir + rand(-1.1, 1.1), sp = rand(R * 1.5, R * 9);
        this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(R * 0.35, R * 0.8), g: rand(R * 2, R * 5.5), a: 0, peak: rand(0.7, 1), life: -i * 0.012, max: rand(3.5, 6), rot: rand(0, TAU), vr: rand(-0.5, 0.5), spr: i % 3 });
      }
      for (let i = 0; i < 6; i++) {
        const a = dir + rand(-0.5, 0.5), sp = rand(R, R * 4);
        this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: R, g: R * rand(10, 16), a: 0, peak: 0.6, life: -0.05 - i * 0.03, max: rand(2.6, 3.4), rot: rand(0, TAU), vr: rand(-0.3, 0.3), spr: i % 3 });
      }
      this.veil = { x, y, t: 0 };
    },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i]; p.life += dt;
        if (p.life < 0) continue;
        if (p.life >= p.max) { this.list.splice(i, 1); continue; }
        const dk = Math.exp(-1.7 * dt);
        p.vx *= dk; p.vy = p.vy * dk - 4 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.g * dt; p.g *= Math.exp(-1.1 * dt); p.rot += p.vr * dt;
        const gr = Rip.grad(p.x, p.y); p.x += gr.dx * 30 * dt; p.y += gr.dy * 30 * dt;
        p.a = p.peak * Math.min(1, p.life / 0.12) * (1 - smooth(p.max * 0.3, p.max, p.life));
      }
      if (this.veil) { this.veil.t += dt; if (this.veil.t > 3.4) this.veil = null; }
    },
    draw(c) {
      for (const p of this.list) {
        if (p.life < 0 || p.a <= 0.01) continue;
        c.save(); c.globalAlpha = p.a; c.translate(p.x, p.y); c.rotate(p.rot);
        c.drawImage(Spr.ink[p.spr], -p.r, -p.r, p.r * 2, p.r * 2); c.restore();
      }
      const v = this.veil;
      if (v) {
        const R = Math.max(S.W, S.H) * 0.95 * easeOut(v.t / 0.8), a = 0.6 * (1 - smooth(0.4, 3.4, v.t)) * Math.min(1, v.t / 0.12);
        if (R > 2 && a > 0.01) {
          const g = c.createRadialGradient(v.x, v.y, 0, v.x, v.y, R);
          g.addColorStop(0, `rgba(10,7,6,${a})`); g.addColorStop(0.55, `rgba(12,9,8,${a * 0.7})`); g.addColorStop(1, 'rgba(12,9,8,0)');
          c.fillStyle = g; c.fillRect(0, 0, S.W, S.H);
        }
      }
    }
  };

  /* ---------------------------------------------------------------- HUD: glow + pings */
  const Glow = {
    list: [],
    get max() { return coarse ? 240 : 480; },
    push(p) { if (this.list.length >= this.max) this.list.splice(0, 1); this.list.push(p); },
    plankton(x, y) { const k = clamp(S.U / 700, 0.75, 1.3); this.push({ x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-10, 10), vy: rand(-14, 6), life: 0, max: rand(1.3, 3), s: rand(1.2, 3.2) * k, tw: rand(0, TAU), kind: 0 }); },
    sparkle(x, y) { const a = rand(0, TAU), v = rand(40, 140) * clamp(S.U / 700, 0.7, 1.3); this.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rand(0.35, 0.8), s: rand(1, 2.2), tw: 0, kind: 1 }); },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i]; p.life += dt;
        if (p.life >= p.max) { this.list.splice(i, 1); continue; }
        const dk = Math.exp(-(p.kind ? 3 : 1.4) * dt);
        p.vx *= dk; p.vy = p.vy * dk - (p.kind ? 0 : 5 * dt); p.x += p.vx * dt; p.y += p.vy * dt;
      }
    },
    draw(c) {
      if (!this.list.length) return;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const p of this.list) {
        const t = p.life / p.max, a = (1 - t) * (p.kind ? 1 : 0.6 + 0.4 * Math.sin(S.t * 9 + p.tw)) * Math.min(1, p.life * 8);
        c.globalAlpha = clamp(a * 0.9 * (1 + S.depth * 0.5), 0, 1);
        const s = p.s * (1 + t * 0.6) * 3; c.drawImage(Spr.glow, p.x - s, p.y - s, s * 2, s * 2);
      }
      c.restore();
    }
  };
  const Pings = {
    list: [],
    add(x, y, big) { this.list.push({ x, y, t: 0, max: big ? 1.4 : 0.9, R: big ? S.U * 0.4 : S.U * 0.16 }); },
    update(dt) { for (let i = this.list.length - 1; i >= 0; i--) { const p = this.list[i]; p.t += dt; if (p.t > p.max) this.list.splice(i, 1); } },
    draw(c) {
      for (const p of this.list) {
        const k = p.t / p.max, r = p.R * easeOut(k);
        c.strokeStyle = `rgba(${NEON},${0.7 * (1 - k)})`; c.lineWidth = 1;
        c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.stroke();
        c.setLineDash([2, 6]); c.beginPath(); c.arc(p.x, p.y, r * 0.62, 0, TAU); c.stroke(); c.setLineDash([]);
      }
    }
  };

  /* ---------------------------------------------------------------- HUD: contacts */
  const Contacts = {
    locks: {}, hover: null, el: {}, boxes: {}, lastUI: 0,
    build() {
      const ul = document.getElementById('contact-list');
      ul.innerHTML = '';
      for (const c of CONTACTS) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'contact'; b.setAttribute('aria-pressed', String(c.id === S.sel));
        b.innerHTML = `<span class="cid">${c.code}</span><span class="cname">${c.name}</span><span class="crng">--</span>`;
        b.addEventListener('click', () => this.lock(c.id, true));
        li.appendChild(b); ul.appendChild(li);
        this.el[c.id] = b;
      }
    },
    visible(c) {
      const tr = track(c, S.vt); if (!tr) return null;
      const b = Cam.boxOf(tr);
      if (b.x + b.w / 2 < 0 || b.x - b.w / 2 > S.W || b.y + b.h / 2 < 0 || b.y - b.h / 2 > S.H) return null;
      return b;
    },
    hitTest(x, y) {
      let best = null, bd = 1e9;
      for (const c of CONTACTS) {
        const b = this.boxes[c.id]; if (!b) continue;
        const px = Math.max(S.pad, 0), dx = Math.abs(x - b.x) / (b.w * 0.42 + px), dy = Math.abs(y - b.y) / (b.h * 0.42 + px);
        const d = Math.max(dx, dy);
        if (d < 1 && d * b.w * b.h < bd) { bd = d * b.w * b.h; best = c; } // prefer the smaller, more specific target
      }
      return best;
    },
    lock(id, fromList) {
      S.sel = id;
      for (const c of CONTACTS) this.el[c.id].setAttribute('aria-pressed', String(c.id === id));
      this.locks[id] = { t: 0, status: byId[id].status };
      Snd.lock();
      const b = this.boxes[id];
      if (b && !fromList) Pings.add(b.x, b.y, true);
    },
    act(c, x, y) {
      this.lock(c.id, false);
      const b = this.boxes[c.id];
      if (c.id === 'octo') {
        const R = Math.max(b.w, b.h) * 0.22;
        const dir = Math.atan2(y - b.y, x - b.x) + Math.PI * 0.15;
        Ink.burst(b.x, b.y - b.h * 0.12, R, dir);
        Ink.veil = { x, y, t: 0 };
        Rip.drop(b.x, b.y, R * 2.6, 1.8);
        this.locks.octo.status = 'Ink discharged'; this.locks.octo.warn = true;
        Snd.ink();
        Bait.startle(b.x, b.y, S.U * 0.6);
      } else if (c.id === 'shark') {
        Rip.drop(b.x, b.y, Math.min(b.w, b.h) * 0.4, 1.7);
        for (let i = 0; i < 6; i++) Bub.spawn(b.x + rand(-b.w * 0.2, b.w * 0.2), b.y + rand(-10, 20), rand(2, 5));
        this.locks.shark.status = 'Locked · tracking';
        Bait.startle(b.x, b.y, S.U * 0.5);
      } else if (c.id === 'school') {
        Rip.drop(x, y, S.U * 0.06, 1.4);
        this.locks.school.status = 'Scattered';
        Bait.startle(x, y, S.U * 0.7);
      } else {
        Rip.drop(x, y, S.U * 0.05, 1.2);
      }
    },
    update(dt) {
      for (const c of CONTACTS) {
        this.boxes[c.id] = this.visible(c);
        const L = this.locks[c.id];
        if (L) { L.t += dt; if (L.t > 5) delete this.locks[c.id]; }
      }
      // list readouts at ~5 Hz
      this.lastUI -= dt;
      if (this.lastUI <= 0) {
        this.lastUI = 0.2;
        let n = 0;
        for (const c of CONTACTS) {
          const tr = track(c, S.vt), el = this.el[c.id];
          if (!el) continue;
          el.classList.toggle('lost', !tr);
          el.querySelector('.crng').textContent = tr ? this.range(c, tr).toFixed(1) + ' m' : 'LOST';
          if (tr) n++;
        }
        document.getElementById('contacts-n').textContent = n + ' tracked';
      }
    },
    range(c, tr) { return clamp(c.len * 0.55 / Math.max(tr.w, 0.05), 1, 40); },
    bearing(x) { return ((Math.round((S.cam.ox - 0.5) * 80 + (x / S.W - 0.5) * 80 * S.cam.sx) + 360) % 360); },
    draw(c) {
      const pulse = 0.5 + 0.5 * Math.sin(S.t * 3);
      c.font = `500 ${Math.round(clamp(S.U / 70, 9, 11))}px "IBM Plex Mono", ui-monospace, monospace`;
      c.textBaseline = 'top';
      for (const ct of CONTACTS) {
        const b = this.boxes[ct.id]; if (!b) continue;
        const L = this.locks[ct.id], hov = this.hover === ct.id;
        const k = L ? easeOut(L.t / 0.3) : 1, grow = L ? lerp(1.5, 1, k) : 1;
        const fade = L ? 1 - smooth(4, 5, L.t) : 0;
        const a = Math.max(0.28 + (hov ? 0.4 : 0) + (ct.id === S.sel ? 0.12 : 0), fade);
        const w = b.w * 0.84 * grow, h = b.h * 0.84 * grow, x0 = b.x - w / 2, y0 = b.y - h / 2;
        const t = Math.max(8, Math.min(w, h) * 0.16);
        const col = L && L.warn ? '255,181,71' : NEON;
        c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = L ? 1.6 : 1;
        c.shadowColor = `rgba(${col},${a})`; c.shadowBlur = L ? 8 : 0;
        c.beginPath();
        c.moveTo(x0, y0 + t); c.lineTo(x0, y0); c.lineTo(x0 + t, y0);
        c.moveTo(x0 + w - t, y0); c.lineTo(x0 + w, y0); c.lineTo(x0 + w, y0 + t);
        c.moveTo(x0 + w, y0 + h - t); c.lineTo(x0 + w, y0 + h); c.lineTo(x0 + w - t, y0 + h);
        c.moveTo(x0 + t, y0 + h); c.lineTo(x0, y0 + h); c.lineTo(x0, y0 + h - t);
        c.stroke();
        c.shadowBlur = 0;
        // code tag
        c.fillStyle = `rgba(${col},${Math.min(1, a + 0.2)})`;
        c.fillText(ct.code, x0 + 3, y0 + 4);
        if (L || hov) {
          const la = L ? fade : 0.8;
          // rotating segmented ring
          if (L) {
            const r = Math.min(w, h) * 0.3, rot = S.t * 1.4;
            c.strokeStyle = `rgba(${col},${0.8 * la})`; c.lineWidth = 1.2;
            for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(b.x, b.y, r, rot + i * TAU / 4, rot + i * TAU / 4 + 0.9); c.stroke(); }
            c.beginPath(); c.moveTo(b.x - 6, b.y); c.lineTo(b.x + 6, b.y); c.moveTo(b.x, b.y - 6); c.lineTo(b.x, b.y + 6); c.stroke();
          }
          // data block with leader line
          const tr = track(ct, S.vt);
          const lines = [`${ct.code}  ${ct.name.toUpperCase()}`, `RNG ${this.range(ct, tr).toFixed(1)} m   BRG ${pad2(this.bearing(b.x)).padStart(3, '0')}°`, L ? (L.t < 0.6 && pulse > 0.5 ? '■ LOCK' : '■ ' + L.status.toUpperCase()) : 'TAP TO LOCK'];
          const fs = Math.round(clamp(S.U / 70, 9, 11)), lh = fs + 5, bw = Math.max(...lines.map((s) => c.measureText(s).width)) + 16, bh = lines.length * lh + 10;
          let bx = x0 + w + 12, by = y0 - 4;
          if (bx + bw > S.W - 12) bx = x0 - bw - 12;
          if (bx < 12) { bx = clamp(b.x - bw / 2, 12, S.W - bw - 12); by = y0 + h + 10; }
          by = clamp(by, 80, S.H - bh - 12);
          c.globalAlpha = la;
          c.strokeStyle = `rgba(${col},0.7)`; c.lineWidth = 1;
          c.beginPath(); c.moveTo(bx < x0 ? x0 : x0 + w, y0); c.lineTo(bx < x0 ? bx + bw : bx, by + 8); c.stroke();
          c.fillStyle = 'rgba(1,10,12,0.72)'; c.fillRect(bx, by, bw, bh);
          c.strokeStyle = `rgba(${col},0.55)`; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
          c.fillStyle = `rgba(${col},1)`; c.fillRect(bx, by, 2, bh);
          lines.forEach((s, i) => { c.fillStyle = i === 0 ? `rgba(${col},1)` : 'rgba(220,240,236,0.85)'; c.fillText(s, bx + 9, by + 6 + i * lh); });
          c.globalAlpha = 1;
        }
      }
    }
  };

  /* ---------------------------------------------------------------- input */
  const UI_SEL = '[data-ui], a, button, input, select, textarea, label';
  const Input = {
    p: { x: -999, y: -999, seen: false, down: false, water: false, id: null, sx: 0, sy: 0, st: 0, lx: 0, ly: 0, tx: -999, ty: 0, moved: 0, type: 'mouse' },
    isUI(t) { return !!(t && t.closest && t.closest(UI_SEL)); },
    splash(x, y) {
      Rip.drop(x, y, clamp(S.U * 0.035, 14, 34), 1.6);
      for (let i = 0; i < 4; i++) Bub.spawn(x + rand(-8, 8), y + rand(-4, 8), rand(1.5, 3.5));
      for (let i = 0; i < 5; i++) Glow.sparkle(x, y);
      Pings.add(x, y, false);
      Bait.startle(x, y, Math.max(120, S.U * 0.26));
      Snd.water();
    },
    act(x, y) { const c = Contacts.hitTest(x, y); if (c) Contacts.act(c, x, y); },
    trailTo(x, y) {
      const P = this.p;
      if (S.trail && P.tx > -900) {
        const d = Math.hypot(x - P.tx, y - P.ty), n = Math.min(12, Math.floor(d / 7));
        for (let i = 1; i <= n; i++) Glow.plankton(lerp(P.tx, x, i / n), lerp(P.ty, y, i / n));
      }
      P.tx = x; P.ty = y;
    },
    dragTo(x, y) {
      const P = this.p, d = Math.hypot(x - P.lx, y - P.ly);
      P.moved += d;
      const step = Rip.cx * 1.6;
      if (d >= step) {
        const n = Math.min(8, Math.floor(d / step));
        for (let i = 1; i <= n; i++) Rip.drop(lerp(P.lx, x, i / n), lerp(P.ly, y, i / n), Rip.cx * 2.2, 0.5);
        P.lx = x; P.ly = y;
      }
      Bub.popAt(x, y);
    },
    init() {
      const P = this.p;
      window.addEventListener('pointerdown', (e) => {
        if (video.paused) { const pr = video.play(); if (pr && pr.catch) pr.catch(() => {}); }
        P.type = e.pointerType || 'mouse'; P.x = e.clientX; P.y = e.clientY; P.seen = true; P.tx = P.x; P.ty = P.y;
        if (this.isUI(e.target)) { P.water = false; return; }
        P.water = true; P.down = true; P.id = e.pointerId; P.sx = P.lx = P.x; P.sy = P.ly = P.y; P.st = performance.now(); P.moved = 0;
        this.splash(P.x, P.y);
        Bub.popAt(P.x, P.y);
        // Mouse/pen lock instantly; touch waits for a clean tap so a scroll never fires the octopus.
        if (P.type !== 'touch') this.act(P.x, P.y);
      }, { passive: true });
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        P.type = e.pointerType; P.x = e.clientX; P.y = e.clientY; P.seen = true;
        S.par.tx = (P.x / S.W - 0.5) * 2; S.par.ty = (P.y / S.H - 0.5) * 2;
        this.trailTo(P.x, P.y);
        if (P.down && P.water && e.pointerId === P.id) this.dragTo(P.x, P.y);
        const c = this.isUI(e.target) ? null : Contacts.hitTest(P.x, P.y);
        Contacts.hover = c ? c.id : null;
        document.body.style.cursor = c ? 'crosshair' : '';
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        const t = e.touches[0]; if (!t) return;
        P.x = t.clientX; P.y = t.clientY; P.seen = true;
        this.trailTo(P.x, P.y);
        if (P.water) this.dragTo(P.x, P.y);
      }, { passive: true });
      const end = (cancelled) => {
        if (P.water && P.type === 'touch' && !cancelled && P.moved < 14 && performance.now() - P.st < 500) this.act(P.sx, P.sy);
        P.down = false; P.water = false;
        if (P.type === 'touch') setTimeout(() => { if (!P.down) { P.seen = false; P.tx = -999; } }, 900);
      };
      window.addEventListener('pointerup', () => end(false), { passive: true });
      window.addEventListener('pointercancel', () => end(true), { passive: true });
      document.addEventListener('pointerleave', () => { P.seen = false; P.tx = -999; Contacts.hover = null; }, { passive: true });
      window.addEventListener('blur', () => { P.down = false; P.water = false; });
    }
  };

  /* ---------------------------------------------------------------- layout */
  let ready = false;
  function resize(force) {
    const r = host.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    const dpr = window.devicePixelRatio || 1;
    const cap = S.quality === 'hd' ? TIERS[0] : S.quality === 'eco' ? TIERS[4] : TIERS[S.tier];
    const rs = Math.min(dpr, cap);
    if (!force && W === S.W && H === S.H && Math.abs(rs - S.rs) < 0.01) return;
    const first = !ready, sxk = S.W ? W / S.W : 1, syk = S.H ? H / S.H : 1;
    S.W = W; S.H = H; S.rs = rs; S.dpr = dpr; S.U = Math.min(W, H);
    S.hs = Math.min(dpr, 2); S.fs = GLR.ok ? Math.max(0.5, rs * 0.75) : rs;
    glc.width; GLR.resize(Math.round(W * rs), Math.round(H * rs));
    fxc.width = Math.round(W * S.fs); fxc.height = Math.round(H * S.fs);
    hud.width = Math.round(W * S.hs); hud.height = Math.round(H * S.hs);
    Rip.resize(); Snow.build(); Bait.build(first, sxk, syk);
    document.documentElement.classList.toggle('low-fx', S.tier >= 4 || S.quality === 'eco');
    ready = true;
  }

  /* ---------------------------------------------------------------- loop */
  let ambientT = 2, lastVT = 0;
  function update(dt) {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    S.depthRaw = clamp(window.scrollY / max, 0, 1);
    S.depth = damp(S.depth, S.depthRaw, 4, dt);
    document.documentElement.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.35);
    // video clock (+ loop counter for the timecode)
    const vt = video.currentTime || 0;
    if (vt + 0.5 < lastVT) S.loops++;
    lastVT = vt; S.vt = vt;
    const P = Input.p;
    if (!P.seen) { S.par.tx = S.reduced ? 0 : Math.sin(S.t * 0.13) * 0.35; S.par.ty = S.reduced ? 0 : Math.sin(S.t * 0.09) * 0.2; }
    const pk = S.reduced ? 0.35 : 1;
    S.par.x = damp(S.par.x, S.par.tx * pk, 3, dt); S.par.y = damp(S.par.y, S.par.ty * pk, 3, dt);
    if (!S.reduced) { ambientT -= dt; if (ambientT <= 0) { ambientT = rand(1.8, 3.6); Rip.drop(rand(0, S.W), rand(0, S.H * 0.6), clamp(S.U * 0.02, 8, 18), 0.18); } }
    Cam.update(dt);
    Contacts.update(dt);
    Snow.update(dt); Bait.update(dt); Bub.update(dt); Ink.update(dt); Glow.update(dt); Pings.update(dt);
    Rip.update(dt);
  }

  function renderFx() {
    const c = fx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, fxc.width, fxc.height);
    c.setTransform(S.fs, 0, 0, S.fs, 0, 0);
    Bait.draw(c);
    Snow.draw(c);
    Ink.draw(c);
    Bub.draw(c);
  }
  function renderHud() {
    const c = hx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, hud.width, hud.height);
    c.setTransform(S.hs, 0, 0, S.hs, 0, 0);
    if (S.depth < 0.5) { c.globalAlpha = 1 - S.depth * 2; Contacts.draw(c); c.globalAlpha = 1; }
    Pings.draw(c);
    Glow.draw(c);
  }

  const Perf = {
    acc: 0, n: 0, slow: 0, warm: 3,
    tick(dt) {
      if (S.quality !== 'auto') return;
      if (this.warm > 0) { this.warm -= dt; return; }
      this.acc += dt; this.n++;
      if (this.acc < 1.5) return;
      const avg = this.acc / this.n; this.acc = 0; this.n = 0;
      if (avg > 1 / 42) { if (++this.slow >= 2 && S.tier < TIERS.length - 1) { S.tier++; this.slow = 0; this.warm = 1.5; resize(true); } }
      else this.slow = 0;
    }
  };

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    S.t += dt;
    update(dt); renderFx(); renderHud();
    if (GLR.ok) GLR.draw();
    Perf.tick(dt);
    UI.tick();
  }

  /* ---------------------------------------------------------------- UI */
  const store = {
    get(k) { try { return localStorage.getItem('abyss.' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('abyss.' + k, v); } catch (e) { /* storage unavailable */ } }
  };
  const UI = {
    lastDepth: -1, lastTC: '', tape: null,
    init() {
      const $ = (id) => document.getElementById(id);
      const toggle = $('nav-toggle'), links = $('nav-links');
      const setMenu = (open) => { links.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? 'Close' : 'Menu'; };
      toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
      links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

      const bs = $('t-sound');
      bs.addEventListener('click', () => { const on = Snd.set(!S.sound); bs.setAttribute('aria-pressed', String(on)); if (on) Snd.ping(); });

      const bt = $('t-trail');
      if (store.get('trail') === '0') S.trail = false;
      bt.setAttribute('aria-pressed', String(S.trail));
      bt.addEventListener('click', () => { S.trail = !S.trail; bt.setAttribute('aria-pressed', String(S.trail)); store.set('trail', S.trail ? '1' : '0'); });

      const bq = $('t-quality'), lq = $('t-quality-l'), names = { auto: 'Auto', hd: 'HD', eco: 'Eco' };
      const q = store.get('quality'); if (q && names[q]) S.quality = q;
      lq.textContent = names[S.quality];
      bq.addEventListener('click', () => {
        S.quality = S.quality === 'auto' ? 'hd' : S.quality === 'hd' ? 'eco' : 'auto';
        if (S.quality === 'auto') { S.tier = 1; Perf.warm = 2; }
        lq.textContent = names[S.quality]; store.set('quality', S.quality); resize(true);
      });

      // bearing tape
      const tape = document.createElement('div'); tape.className = 'hud-tape';
      let html = '';
      for (let r = 0; r < 3; r++) for (let d = 0; d < 360; d += 10) html += `<span>${d % 30 === 0 ? String(d).padStart(3, '0') : ''}</span>`;
      tape.innerHTML = html; $('hud-bearing').appendChild(tape); this.tape = tape;

      const form = $('book-form'), out = $('book-out'), date = $('f-date');
      const d0 = new Date(); d0.setDate(d0.getDate() + 3);
      date.value = d0.toISOString().slice(0, 10); date.min = new Date().toISOString().slice(0, 10);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dive = $('f-dive').value, n = +$('f-divers').value;
        if (!date.value) { out.textContent = 'Pick a date first, then check again.'; date.focus(); return; }
        const when = new Date(date.value + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        out.textContent = `${dive} on ${when} for ${n} diver${n > 1 ? 's' : ''}. This is a demo, so nothing was booked. The live version checks the calendar and takes a deposit here.`;
      });
    },
    tick() {
      const m = Math.round(6 + S.depthRaw * 36);
      if (m !== this.lastDepth) {
        this.lastDepth = m;
        document.getElementById('g-depth').textContent = pad2(m) + ' m';
        document.getElementById('g-temp').textContent = Math.round(14 - S.depthRaw * 5) + ' °C';
      }
      const total = S.loops * (video.duration || 10) + S.vt, f = Math.floor((total % 1) * 24);
      const tc = `${pad2(Math.floor(total / 3600))}:${pad2(Math.floor(total / 60) % 60)}:${pad2(Math.floor(total) % 60)}:${pad2(f)}`;
      if (tc !== this.lastTC) { this.lastTC = tc; document.getElementById('feed-tc').textContent = tc; }
      if (this.tape) {
        const brg = (S.cam.ox - 0.5) * 80 + 40; // degrees; 40px per 10°
        this.tape.style.transform = `translateX(${(-(360 + brg) * 4 + this.tape.parentNode.clientWidth / 2 - 20).toFixed(1)}px)`;
      }
    }
  };

  /* ---------------------------------------------------------------- boot */
  function boot() {
    if (!GLR.init()) fallback2D();
    Spr.build();
    UI.init();
    Contacts.build();
    resize(true);
    Input.init();
    video.muted = true;
    const pr = video.play(); if (pr && pr.catch) pr.catch(() => {});
    video.addEventListener('error', () => { document.getElementById('feed-tc').textContent = 'NO SIGNAL'; });
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => { clearTimeout(boot.rt); boot.rt = setTimeout(() => resize(false), 120); }).observe(host);
    window.addEventListener('resize', () => { clearTimeout(boot.rt); boot.rt = setTimeout(() => resize(false), 120); });
    document.addEventListener('visibilitychange', () => { last = 0; if (!document.hidden && video.paused) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } });
    requestAnimationFrame(frame);
    window.Abyss = { S, Cam, Contacts, GLR, CONTACTS, track, video, resize };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
