"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import * as THREE from "three";
import { AxiomHeroBackground } from "@/components/AxiomHeroBackground";

const PARALLAX_SPRING = { stiffness: 150, damping: 20, mass: 0.8 };
/** Opposite-direction depth shift for bg layers (px). */
const BG_SHIFT_PX = 14;
/** Black + silver Axiom logo particle loop. */
const LOGO_VIDEO = "/media/axiom/axiom-logo-loop.mp4";
const LOGO_POSTER = "/media/axiom/axiom-logo-poster.jpg";

const PARTICLE_N = 220;

type PointerBus = { x: number; y: number };

const ptVert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute float aKind;
uniform float uProximity;
uniform float uTime;
varying float vAlpha;
varying float vKind;
varying float vProx;
void main() {
  vAlpha = aAlpha;
  vKind = aKind;
  vProx = uProximity;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float proxSize = 1.0 + uProximity * 0.35;
  gl_PointSize = max(0.8, aSize * proxSize * (90.0 / max(0.001, -mv.z)));
  gl_Position = projectionMatrix * mv;
}
`;

const ptFrag = /* glsl */ `
uniform float uProximity;
uniform float uTime;
varying float vAlpha;
varying float vKind;
varying float vProx;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  if (d > 0.92) discard;
  float core = exp(-d * d * 6.5);
  float rim = smoothstep(0.92, 0.22, d);
  // Pure black + silver — no green / cyan tint
  vec3 col = vec3(0.78, 0.80, 0.84);
  if (vKind > 0.5 && vKind < 1.5) col = vec3(0.92, 0.93, 0.95);
  else if (vKind > 1.5 && vKind < 2.5) col = vec3(0.35, 0.37, 0.40);
  else if (vKind > 2.5) col = vec3(1.0, 1.0, 1.0);
  float a = core * vAlpha * rim;
  float punch = vKind > 2.5 ? 2.0 : 1.25;
  float flicker = 1.0;
  if (vKind > 2.5) {
    float freq = 9.0 + vProx * 14.0;
    flicker = 0.82 + 0.18 * sin(uTime * freq + gl_FragCoord.x * 0.08);
    punch *= mix(1.0, 1.45, vProx) * flicker;
  }
  gl_FragColor = vec4(col * (punch + rim * 0.55), a * mix(1.05, 1.35, step(2.5, vKind) * vProx));
}
`;

type FgParticle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  kind: number;
  life: number;
  maxLife: number;
  phase: number;
};

/**
 * Real 3D particle burst — spherical shells explode from the character,
 * then stream toward the camera for depth parallax.
 */
function spawnFg(deep = true): FgParticle {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const shell = deep ? 0.35 + Math.random() * 2.8 : 0.2 + Math.random() * 1.2;
  const sx = Math.sin(phi) * Math.cos(theta);
  const sy = Math.cos(phi);
  const sz = Math.sin(phi) * Math.sin(theta);
  const burst = 2.2 + Math.random() * 5.5;
  return {
    x: sx * shell * 0.12,
    y: sy * shell * 0.1,
    z: deep ? -58 - Math.random() * 14 : -5 - Math.random() * 2,
    vx: sx * burst * 0.08,
    vy: sy * burst * 0.06,
    vz: 7 + Math.random() * 16 + Math.abs(sz) * 4,
    size: 0.25 + Math.random() * 1.35,
    kind:
      Math.random() < 0.28 ? 3 : Math.random() < 0.45 ? 1 : Math.random() < 0.7 ? 0 : 2,
    life: 0,
    maxLife: 10 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
  };
}

function ForegroundParticles({ pointer }: { pointer: React.MutableRefObject<PointerBus> }) {
  const slots = useRef<FgParticle[]>([]);
  const proxRef = useRef(0);

  const { geo, mat, pos, size, alpha, kind } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PARTICLE_N * 3), 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(PARTICLE_N), 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(PARTICLE_N), 1));
    geometry.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(PARTICLE_N), 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uProximity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: ptVert,
      fragmentShader: ptFrag,
    });
    return {
      geo: geometry,
      mat: material,
      pos: geometry.getAttribute("position") as THREE.BufferAttribute,
      size: geometry.getAttribute("aSize") as THREE.BufferAttribute,
      alpha: geometry.getAttribute("aAlpha") as THREE.BufferAttribute,
      kind: geometry.getAttribute("aKind") as THREE.BufferAttribute,
    };
  }, []);

  useEffect(() => {
    slots.current = Array.from({ length: PARTICLE_N }, () => {
      const p = spawnFg(true);
      // Stagger depth so the warp field is already filled on first frame
      p.z = -60 + Math.random() * 65;
      p.life = Math.random() * p.maxLife * 0.4;
      return p;
    });
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    const posA = pos.array as Float32Array;
    const sizeA = size.array as Float32Array;
    const alphaA = alpha.array as Float32Array;
    const kindA = kind.array as Float32Array;
    const px = pointer.current.x * 0.18;
    const py = pointer.current.y * 0.12;

    // Proximity via shared hero pointer bus (−1…1) toward orb / eye focus
    const dist = Math.hypot(pointer.current.x - -0.2, pointer.current.y - 0.25);
    const targetProx = THREE.MathUtils.clamp(1 - dist / 0.95, 0, 1);
    proxRef.current = THREE.MathUtils.lerp(proxRef.current, targetProx, 1 - Math.exp(-dt * 6));
    const prox = proxRef.current;

    mat.uniforms.uProximity.value = prox;
    mat.uniforms.uTime.value = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_N; i++) {
      const p = slots.current[i]!;
      const lifeRate = p.kind === 3 ? 1 + prox * 0.35 : 1;
      p.life += dt * lifeRate;
      const wobble = 0.004 * (1 + prox * 0.4);
      p.x += p.vx * dt + Math.sin(p.life * 0.9 + p.phase) * wobble;
      p.y += p.vy * dt + Math.cos(p.life * 0.75 + p.phase) * wobble * 0.7;
      // Continuous warp: stream toward camera along +Z
      const speed = p.vz * (1 + prox * 0.25);
      p.z += speed * dt;

      // Recycle past the camera threshold into deep background
      if (p.z > 5 || p.life > p.maxLife) {
        Object.assign(p, spawnFg(true));
      }

      // Depth cue: farther = smaller/dimmer; near-camera streaks brighten
      const depthT = THREE.MathUtils.clamp((p.z + 60) / 65, 0, 1);
      const fadeIn = Math.min(1, p.life * 2.2);
      const nearCam = THREE.MathUtils.clamp((p.z + 2) / 7, 0, 1);
      const fade = fadeIn * (0.35 + depthT * 0.65) * (1 - nearCam * 0.15);
      const ix = i * 3;
      posA[ix] = p.x + px * depthT * 0.35;
      posA[ix + 1] = p.y + py * depthT * 0.35;
      posA[ix + 2] = p.z;
      const sizeBoost = p.kind === 3 ? 1 + prox * 0.35 : 1;
      // Motion stretch as particles rush toward camera
      sizeA[i] = p.size * (0.2 + depthT * 1.35) * sizeBoost * (1 + nearCam * 0.8);
      const emberBoost = p.kind === 3 ? 0.9 * (1 + prox * 0.35) : p.kind === 2 ? 0.22 : 0.4;
      alphaA[i] = fade * emberBoost * (0.35 + depthT * 0.65);
      kindA[i] = p.kind;
    }
    pos.needsUpdate = true;
    size.needsUpdate = true;
    alpha.needsUpdate = true;
    kind.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={20} />;
}

function OverlayScene({ pointer }: { pointer: React.MutableRefObject<PointerBus> }) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[2.0, 1.5, 3.0]} intensity={0.9} color="#e2e8f0" distance={11} decay={2} />
      <pointLight position={[-2.0, 0.8, 2.6]} intensity={0.7} color="#94a3b8" distance={11} decay={2} />
      <pointLight position={[0.2, -0.4, 2.2]} intensity={0.45} color="#f8fafc" distance={8} decay={2} />
      {/* Silver particle burst only — no glass bubbles / no green shimmer */}
      <ForegroundParticles pointer={pointer} />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.58}
          luminanceSmoothing={0.86}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export type AxiomEliteOrbPortalProps = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Full-hero black logo particle pipeline:
 *  z-0  — Viewport-wide centered logo loop + WebGL burst (`pointer-events-none`)
 *  z-10 — Neon glass conversion CTAs below center (`pointer-events-auto`)
 */
export function AxiomEliteOrbPortal({ className, children }: AxiomEliteOrbPortalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerBus>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, PARALLAX_SPRING);
  const springY = useSpring(rawY, PARALLAX_SPRING);

  const bgX = useTransform(springX, [-1, 1], [BG_SHIFT_PX, -BG_SHIFT_PX]);
  const bgY = useTransform(springY, [-1, 1], [-BG_SHIFT_PX, BG_SHIFT_PX]);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!reduceMotion) return;
    rawX.set(0);
    rawY.set(0);
  }, [reduceMotion, rawX, rawY]);

  const updatePointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const nx = THREE.MathUtils.clamp(((clientX - r.left) / r.width) * 2 - 1, -1, 1);
      const ny = THREE.MathUtils.clamp(((clientY - r.top) / r.height) * 2 - 1, -1, 1);
      // Three.js dust bus (y flipped for camera space)
      pointer.current.x = nx;
      pointer.current.y = -ny;
      // Framer Motion parallax (y: +1 = bottom)
      if (!reduceMotion) {
        rawX.set(nx);
        rawY.set(ny);
      }
    },
    [rawX, rawY, reduceMotion],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => updatePointer(e.clientX, e.clientY);
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const el = rootRef.current;
    el?.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el?.removeEventListener("pointerleave", onLeave);
    };
  }, [updatePointer, rawX, rawY]);

  return (
    <section
      ref={rootRef}
      className={
        className ??
        "relative w-full min-h-[100svh] overflow-hidden bg-[#030712]"
      }
      style={{ perspective: 1200 }}
      aria-label="Axiom 24/7 booking engine hero"
      data-axiom-elite-orb-portal=""
      onPointerMove={(e) => updatePointer(e.clientX, e.clientY)}
    >
      {/* ── z-0: Full-viewport black logo + particle burst (unclipped) ─ */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 h-full min-h-[100svh] w-full overflow-hidden will-change-transform"
        style={{ x: bgX, y: bgY }}
        aria-hidden
        data-layer="logo-particle-stage"
      >
        <AxiomHeroBackground videoSrc={LOGO_VIDEO} posterSrc={LOGO_POSTER} />
      </motion.div>

      {mounted ? (
        <Canvas
          className="pointer-events-none absolute inset-0 z-0"
          style={{ pointerEvents: "none", background: "transparent" }}
          camera={{ position: [0, 0, 5.4], fov: 38 }}
          dpr={[1, 1.6]}
          frameloop="always"
          gl={{
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          data-layer="webgl-particle-burst"
        >
          <OverlayScene pointer={pointer} />
        </Canvas>
      ) : null}

      {/* Soft floor fade — center logo stays fully visible */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[22%] bg-gradient-to-t from-[#030712] via-[#030712]/75 to-transparent"
        aria-hidden
      />

      {/* ── z-10: Neon conversion CTAs — below center, zero occlusion ── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pb-10 lg:pb-12"
        data-layer="conversion-ui"
      >
        <div className="pointer-events-auto w-full max-w-2xl">{children}</div>
      </div>
    </section>
  );
}

export default AxiomEliteOrbPortal;
