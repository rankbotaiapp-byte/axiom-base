"use client";

import { AdaptiveDpr, useVideoTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Color, ShaderMaterial, Vector2, type Mesh } from "three";
import type { StorefrontAmbience } from "@/lib/axiom/autopilot";
import { sanitizeAccent } from "@/lib/axiom/autopilot";
import { formatMoney } from "@/lib/utils";

const FALLBACK_FILM = "/media/heroes/universal-fallback.mp4.mp4";

export type HoloShard = {
  id: string;
  label: string;
  meta: string;
  blurb: string;
  priceCents?: number;
  videoUrl?: string;
};

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
uniform sampler2D uVideo;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uAccent;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec2 dir = uv - 0.5;
  float dist = length(dir);
  float aberr = 0.0028 + dist * 0.008;
  vec2 shift = uMouse * 0.003;
  float r = texture2D(uVideo, uv + dir * aberr + shift).r;
  float g = texture2D(uVideo, uv).g;
  float b = texture2D(uVideo, uv - dir * aberr - shift).b;
  vec3 col = vec3(r, g, b);
  float scan = sin((uv.y + uTime * 0.035) * 680.0);
  col *= 0.965 + 0.035 * scan;
  float sweep = smoothstep(0.02, 0.0, abs(fract(uv.y * 0.35 - uTime * 0.06) - 0.5)) * 0.045;
  col += uAccent * (0.028 + sweep);
  float vig = smoothstep(0.92, 0.28, dist);
  col *= mix(0.78, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}
`;

type Pointer = { x: number; y: number };

function readObsidian(): string {
  if (typeof document === "undefined") return "#050507";
  const value = getComputedStyle(document.documentElement).getPropertyValue("--color-obsidian").trim();
  return value || "#050507";
}

function StageClear() {
  const { scene, gl } = useThree();
  useEffect(() => {
    const color = new Color(readObsidian());
    scene.background = color;
    gl.setClearColor(color, 1);
  }, [gl, scene]);
  return null;
}

function HoloPlane({
  url,
  accent,
  pointer,
  reduced,
}: {
  url: string;
  accent: string;
  pointer: { current: Pointer };
  reduced: boolean;
}) {
  const texture = useVideoTexture(url, {
    muted: true,
    loop: true,
    playsInline: true,
    start: true,
    crossOrigin: "anonymous",
    preload: "auto",
  });
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uVideo: { value: texture },
          uTime: { value: 0 },
          uMouse: { value: new Vector2() },
          uAccent: { value: new Color(accent) },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        toneMapped: false,
        depthWrite: false,
      }),
    [accent, texture],
  );
  const mesh = useRef<Mesh>(null);
  const spring = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const { viewport } = useThree();

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const target = reduced ? { x: 0, y: 0 } : pointer.current;
    const springState = spring.current;
    const stiffness = 18;
    const damping = 8.5;
    springState.vx += (target.x - springState.x) * stiffness * dt;
    springState.vy += (target.y - springState.y) * stiffness * dt;
    const decay = Math.exp(-damping * dt);
    springState.vx *= decay;
    springState.vy *= decay;
    springState.x += springState.vx * dt;
    springState.y += springState.vy * dt;
    const cover = 1.22;
    if (mesh.current) {
      mesh.current.scale.set(viewport.width * cover, viewport.height * cover, 1);
      mesh.current.rotation.y = springState.x * 0.14;
      mesh.current.rotation.x = springState.y * 0.09;
      mesh.current.position.x = springState.x * 0.18;
      mesh.current.position.y = -springState.y * 0.1;
    }
    material.uniforms.uTime.value += dt;
    (material.uniforms.uMouse.value as Vector2).set(springState.x, springState.y);
  });

  return (
    <mesh ref={mesh} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

class FilmBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function noiseSource(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function startAmbience(kind: StorefrontAmbience) {
  const Ctx = window.AudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.25);

  const noise = noiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = kind === "workshop" ? 0.2 : 0.42;
  if (kind === "river") {
    filter.type = "bandpass";
    filter.frequency.value = 820;
    filter.Q.value = 0.5;
  } else if (kind === "forest") {
    filter.type = "lowpass";
    filter.frequency.value = 480;
    filter.Q.value = 0.7;
  } else {
    filter.type = "bandpass";
    filter.frequency.value = 260;
    filter.Q.value = 0.85;
  }
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start();

  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = "sine";
  tone.frequency.value = kind === "workshop" ? 90 : kind === "river" ? 148 : 196;
  toneGain.gain.value = 0.018;
  tone.connect(toneGain);
  toneGain.connect(master);
  tone.start();

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = kind === "river" ? 0.16 : 0.07;
  lfoGain.gain.value = kind === "river" ? 160 : 70;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const stops = [noise, tone, lfo];
  if (kind === "workshop") {
    const pulse = ctx.createOscillator();
    const pulseGain = ctx.createGain();
    pulse.frequency.value = 0.5;
    pulseGain.gain.value = 0.07;
    pulse.connect(pulseGain);
    pulseGain.connect(noiseGain.gain);
    pulse.start();
    stops.push(pulse);
  }

  void ctx.resume();
  return {
    stop() {
      const at = ctx.currentTime;
      master.gain.cancelScheduledValues(at);
      master.gain.linearRampToValueAtTime(0, at + 0.12);
      window.setTimeout(() => {
        for (const node of stops) node.stop();
        void ctx.close();
      }, 160);
    },
  };
}

function ambienceName(kind: StorefrontAmbience) {
  if (kind === "forest") return "Forest";
  if (kind === "river") return "River";
  return "Workshop";
}

export function HolographicStorefront({
  shopName,
  tagline,
  heroVideoUrl,
  accentColor,
  shards,
  telemetry = [],
  ambience = "workshop",
  bookHref,
  corner,
}: {
  shopName: string;
  tagline: string;
  heroVideoUrl: string;
  accentColor: string;
  shards: readonly HoloShard[];
  telemetry?: readonly string[];
  ambience?: StorefrontAmbience;
  bookHref?: string;
  corner?: ReactNode;
}) {
  const accent = sanitizeAccent(accentColor);
  const reduced = Boolean(useReducedMotion());
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const stageRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [film, setFilm] = useState(heroVideoUrl || FALLBACK_FILM);
  const [audioOn, setAudioOn] = useState(false);
  const [open, setOpen] = useState<HoloShard | null>(null);
  const [mounted, setMounted] = useState(false);
  const audio = useRef<ReturnType<typeof startAmbience>>(null);
  const orbit = shards.slice(0, 6);
  const step = orbit.length > 0 ? 360 / orbit.length : 0;
  const detail = telemetry.filter(Boolean).slice(0, 3);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setFilm(heroVideoUrl || FALLBACK_FILM);
  }, [heroVideoUrl]);

  useEffect(() => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.muted = true;
    const fail = () => setFilm(FALLBACK_FILM);
    probe.addEventListener("error", fail);
    probe.src = heroVideoUrl || FALLBACK_FILM;
    return () => {
      probe.removeEventListener("error", fail);
      probe.src = "";
    };
  }, [heroVideoUrl]);

  useEffect(() => {
    audio.current?.stop();
    audio.current = null;
    if (!audioOn) return;
    audio.current = startAmbience(ambience);
    return () => {
      audio.current?.stop();
      audio.current = null;
    };
  }, [ambience, audioOn]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const modal =
    mounted && open
      ? createPortal(
          <AnimatePresence>
            <motion.div
              className="holo-modal"
              role="dialog"
              aria-modal="true"
              aria-label={open.label}
              onClick={() => setOpen(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="holo-glass holo-modal-card"
                onClick={(event) => event.stopPropagation()}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.42 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.86 }}
                transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 170, damping: 22 }}
              >
                <video
                  key={open.id}
                  src={open.videoUrl || film}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label={`${open.label} preview`}
                />
                <div className="grid gap-2 p-4 font-mono">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{open.meta}</p>
                  <h2 className="text-2xl text-fg">{open.label}</h2>
                  {open.blurb ? <p className="text-sm leading-relaxed text-muted">{open.blurb}</p> : null}
                  {open.priceCents ? <p className="text-sm text-fg">{formatMoney(open.priceCents)}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {bookHref ? (
                      <a className="holo-link" href={bookHref}>
                        Book {open.label}
                      </a>
                    ) : null}
                    <button ref={closeRef} type="button" className="holo-link" onClick={() => setOpen(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <section
      ref={stageRef}
      className="holo-stage"
      style={{ ["--holo-accent" as string]: accent }}
      aria-label={`${shopName} storefront`}
      onPointerMove={(event) => {
        const host = stageRef.current;
        if (!host || reduced) return;
        const rect = host.getBoundingClientRect();
        pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      }}
      onPointerLeave={() => {
        pointer.current.x = 0;
        pointer.current.y = 0;
      }}
    >
      <Canvas
        className="holo-canvas"
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 5], fov: 38 }}
      >
        <StageClear />
        <AdaptiveDpr />
        <Suspense fallback={null}>
          <FilmBoundary>
            <HoloPlane url={film} accent={accent} pointer={pointer} reduced={reduced} />
          </FilmBoundary>
        </Suspense>
      </Canvas>

      <div className="holo-hud">
        <div className="flex items-start justify-between gap-3">
          <p className="holo-glass rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-fg">
            GPS ACTIVE // LIVE TELEMETRY
          </p>
          <div className="flex items-center gap-2">
            {corner}
            <button
              type="button"
              className="holo-link"
              aria-pressed={audioOn}
              onClick={() => setAudioOn((on) => !on)}
            >
              {audioOn ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
              {audioOn ? `Mute ${ambienceName(ambience)}` : ambienceName(ambience)}
            </button>
          </div>
        </div>
        <div className="holo-glass max-w-xl rounded-2xl px-4 py-3">
          <h1 className="font-mono text-3xl leading-tight text-fg sm:text-5xl">{shopName}</h1>
          {tagline ? <p className="mt-2 max-w-lg font-mono text-sm leading-relaxed text-muted">{tagline}</p> : null}
          {detail[2] ? <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{detail[2]}</p> : null}
          {bookHref ? (
            <a className="holo-link mt-3" href={bookHref}>
              Book a time
            </a>
          ) : null}
        </div>
      </div>

      {orbit.length > 0 ? (
        <div className="holo-orbit" aria-hidden={false}>
          {orbit.map((shard, index) => {
            const angle = -90 + step / 2 + index * step;
            return (
              <div key={shard.id} className="holo-arm" style={{ transform: `rotate(${angle}deg) translateX(var(--holo-radius))` }}>
                <div className="holo-anchor">
                  <div className="holo-shard-spin">
                    <div style={{ transform: `rotate(${-angle}deg)` }}>
                      <button type="button" className="holo-glass holo-shard font-mono" onClick={() => setOpen(shard)}>
                        <strong className="block text-sm text-fg">{shard.label}</strong>
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-muted">{shard.meta}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {modal}
    </section>
  );
}
