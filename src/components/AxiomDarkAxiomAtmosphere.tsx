"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const OBSIDIAN = "#030712";
const CYAN = "#06b6d4";
const CRIMSON = "#ef4444";
const NEON_GREEN = "#34d399";

const CORE = 0.7;
const RING = CORE * 1.5;
const MAX_R = CORE * 1.55;
const BURST_N = 480;
const FREEZE_T = 1.0;
const FOG_N = 140;

function expDamp01(t: number, k = 6.5) {
  return 1 - Math.exp(-k * THREE.MathUtils.clamp(t, 0, 1));
}

/* ------------------------------------------------------------------ */
/* Soft circular additive sprites                                     */
/* ------------------------------------------------------------------ */

const pointVert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute float aKind;
varying float vAlpha;
varying float vKind;
void main() {
  vAlpha = aAlpha;
  vKind = aKind;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(0.001, -mv.z);
  gl_PointSize = max(1.0, aSize * (110.0 / dist));
  gl_Position = projectionMatrix * mv;
}
`;

const pointFrag = /* glsl */ `
uniform vec3 uObsidian;
uniform vec3 uCyan;
uniform vec3 uCrimson;
uniform vec3 uGreen;
varying float vAlpha;
varying float vKind;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  if (d > 1.0) discard;
  float soft = exp(-d * d * 2.8);
  float rim = smoothstep(1.0, 0.28, d);
  vec3 col = uObsidian;
  if (vKind > 0.5 && vKind < 1.5) col = uCyan;
  else if (vKind > 1.5 && vKind < 2.5) col = uCrimson;
  else if (vKind > 2.5) col = uGreen;
  col *= rim;
  gl_FragColor = vec4(col, soft * vAlpha * rim);
}
`;

const fogVert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute float aKind;
varying float vAlpha;
varying float vKind;
void main() {
  vAlpha = aAlpha;
  vKind = aKind;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(0.001, -mv.z);
  gl_PointSize = max(2.0, aSize * (140.0 / dist));
  gl_Position = projectionMatrix * mv;
}
`;

const fogFrag = /* glsl */ `
uniform vec3 uCyan;
uniform vec3 uCrimson;
uniform vec3 uGreen;
varying float vAlpha;
varying float vKind;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  if (d > 1.0) discard;
  // Soft volumetric mist — no hard edges / square sprites
  float soft = exp(-d * d * 1.6);
  vec3 col = uCyan;
  if (vKind > 0.5 && vKind < 1.5) col = uGreen;
  else if (vKind > 1.5) col = uCrimson;
  gl_FragColor = vec4(col, soft * vAlpha * 0.55);
}
`;

type BurstP = {
  tx: number;
  ty: number;
  tz: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  kind: number;
  age: number;
  frozen: boolean;
  fx: number;
  fy: number;
  fz: number;
};

function buildHalo(count: number) {
  const out: { x: number; y: number; z: number; kind: number; size: number }[] = [];
  const ringN = Math.floor(count * 0.5);
  for (let i = 0; i < ringN; i++) {
    const a = (i / ringN) * Math.PI * 2;
    const r = RING * (0.9 + (i % 6) * 0.015);
    const kind = i % 11 === 0 ? 3 : i % 7 === 0 ? 2 : i % 3 === 0 ? 0 : 1;
    out.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r * 0.72,
      z: (i % 5) * 0.03 - 0.06,
      kind,
      size: kind === 3 ? 1.15 : kind === 0 ? 0.7 : 1.0,
    });
  }
  while (out.length < count) {
    const a = Math.random() * Math.PI * 2;
    const b = (Math.random() - 0.5) * 1.1;
    const r = RING * (0.7 + Math.random() * 0.35);
    const kind = Math.random() < 0.22 ? 3 : Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? 1 : 2;
    out.push({
      x: Math.cos(a) * Math.cos(b) * r,
      y: Math.sin(b) * r * 0.65,
      z: Math.sin(a) * Math.cos(b) * r * 0.5,
      kind,
      size: 0.6 + Math.random() * 0.55,
    });
  }
  return out.slice(0, count);
}

function paletteUniforms() {
  return {
    uObsidian: { value: new THREE.Color(OBSIDIAN) },
    uCyan: { value: new THREE.Color(CYAN) },
    uCrimson: { value: new THREE.Color(CRIMSON) },
    uGreen: { value: new THREE.Color(NEON_GREEN) },
  };
}

function DarkAxiomBurstFreeze({ onSettled }: { onSettled?: () => void }) {
  const targets = useMemo(() => buildHalo(BURST_N), []);
  const particles = useRef<BurstP[]>([]);
  const detonated = useRef(false);
  const settled = useRef(false);
  const age = useRef(0);

  const { geometry, material, posAttr, sizeAttr, alphaAttr, kindAttr } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BURST_N * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(BURST_N), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(BURST_N), 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(BURST_N), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), MAX_R + 0.5);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: paletteUniforms(),
      vertexShader: pointVert,
      fragmentShader: pointFrag,
    });
    return {
      geometry: geo,
      material: mat,
      posAttr: geo.getAttribute("position") as THREE.BufferAttribute,
      sizeAttr: geo.getAttribute("aSize") as THREE.BufferAttribute,
      alphaAttr: geo.getAttribute("aAlpha") as THREE.BufferAttribute,
      kindAttr: geo.getAttribute("aKind") as THREE.BufferAttribute,
    };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);
    if (!detonated.current) {
      detonated.current = true;
      const next: BurstP[] = [];
      for (let i = 0; i < BURST_N; i++) {
        const t = targets[i]!;
        const len = Math.hypot(t.x, t.y, t.z) || 1;
        const overshoot = 1.02 + Math.random() * 0.14;
        const speed0 = 1.35 + Math.random() * 1.8;
        const radial = Math.min(len * overshoot, MAX_R);
        const s = radial / len;
        next.push({
          tx: t.x,
          ty: t.y,
          tz: t.z,
          vx: (t.x / len) * speed0 * s,
          vy: (t.y / len) * speed0 * s,
          vz: (t.z / len) * speed0 * s,
          size: t.size,
          kind: t.kind,
          age: 0,
          frozen: false,
          fx: t.x,
          fy: t.y,
          fz: t.z,
        });
      }
      particles.current = next;
    }

    if (settled.current) return;
    age.current += dt;

    const list = particles.current;
    const pos = posAttr.array as Float32Array;
    const sizes = sizeAttr.array as Float32Array;
    const alphas = alphaAttr.array as Float32Array;
    const kinds = kindAttr.array as Float32Array;

    for (let i = 0; i < BURST_N; i++) {
      const p = list[i];
      if (!p) {
        alphas[i] = 0;
        continue;
      }
      p.age += dt;
      const t = Math.min(1, p.age / FREEZE_T);
      const damp = expDamp01(t, 6.5);
      const velScale = THREE.MathUtils.lerp(1, 0, damp);

      let x: number;
      let y: number;
      let z: number;
      if (t < 1) {
        p.vx *= Math.exp(-6.2 * dt);
        p.vy *= Math.exp(-6.2 * dt);
        p.vz *= Math.exp(-6.2 * dt);
        let bx = p.vx * p.age * velScale;
        let by = p.vy * p.age * velScale;
        let bz = p.vz * p.age * velScale;
        const sr = Math.hypot(bx, by, bz);
        if (sr > MAX_R) {
          const s = MAX_R / sr;
          bx *= s;
          by *= s;
          bz *= s;
        }
        x = THREE.MathUtils.lerp(bx, p.tx, damp);
        y = THREE.MathUtils.lerp(by, p.ty, damp);
        z = THREE.MathUtils.lerp(bz, p.tz, damp);
        p.fx = x;
        p.fy = y;
        p.fz = z;
        p.frozen = false;
      } else {
        x = p.fx;
        y = p.fy;
        z = p.fz;
        p.frozen = true;
      }

      const ix = i * 3;
      pos[ix] = x;
      pos[ix + 1] = y;
      pos[ix + 2] = z;
      kinds[i] = p.kind;
      sizes[i] = p.size * THREE.MathUtils.lerp(0.5, 1, damp);
      alphas[i] = THREE.MathUtils.smoothstep(t, 0, 0.05) * (p.kind === 0 ? 0.35 : 0.88);
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    kindAttr.needsUpdate = true;

    if (!settled.current && age.current >= FREEZE_T + 0.05) {
      settled.current = true;
      onSettled?.();
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}

/* ------------------------------------------------------------------ */
/* Volumetric neon mist — keeps drifting after constellation freeze   */
/* ------------------------------------------------------------------ */

type FogSlot = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
  kind: number;
  alpha: number;
};

function VolumetricFogLayer() {
  const slots = useRef<FogSlot[]>([]);
  const { geometry, material, posAttr, sizeAttr, alphaAttr, kindAttr } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FOG_N * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(FOG_N), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(FOG_N), 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(FOG_N), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uCyan: { value: new THREE.Color(CYAN) },
        uCrimson: { value: new THREE.Color(CRIMSON) },
        uGreen: { value: new THREE.Color(NEON_GREEN) },
      },
      vertexShader: fogVert,
      fragmentShader: fogFrag,
    });
    return {
      geometry: geo,
      material: mat,
      posAttr: geo.getAttribute("position") as THREE.BufferAttribute,
      sizeAttr: geo.getAttribute("aSize") as THREE.BufferAttribute,
      alphaAttr: geo.getAttribute("aAlpha") as THREE.BufferAttribute,
      kindAttr: geo.getAttribute("aKind") as THREE.BufferAttribute,
    };
  }, []);

  useEffect(() => {
    const next: FogSlot[] = [];
    for (let i = 0; i < FOG_N; i++) {
      next.push({
        x: (Math.random() - 0.5) * 6.5,
        y: (Math.random() - 0.5) * 4.2,
        z: -1.2 - Math.random() * 2.4,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.05,
        phase: Math.random() * Math.PI * 2,
        size: 8 + Math.random() * 18,
        kind: Math.random() < 0.4 ? 1 : Math.random() < 0.55 ? 0 : 2,
        alpha: 0.12 + Math.random() * 0.22,
      });
    }
    slots.current = next;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    const t = state.clock.elapsedTime;
    const pos = posAttr.array as Float32Array;
    const sizes = sizeAttr.array as Float32Array;
    const alphas = alphaAttr.array as Float32Array;
    const kinds = kindAttr.array as Float32Array;

    for (let i = 0; i < FOG_N; i++) {
      const s = slots.current[i];
      if (!s) continue;
      // Gentle parallax sway — atmospheric depth behind the upload UI
      s.x += s.vx * dt + Math.sin(t * 0.22 + s.phase) * 0.002;
      s.y += s.vy * dt + Math.cos(t * 0.18 + s.phase * 1.3) * 0.0015;
      if (s.x > 3.6) s.x = -3.6;
      if (s.x < -3.6) s.x = 3.6;
      if (s.y > 2.4) s.y = -2.4;
      if (s.y < -2.4) s.y = 2.4;

      const ix = i * 3;
      pos[ix] = s.x;
      pos[ix + 1] = s.y;
      pos[ix + 2] = s.z + Math.sin(t * 0.15 + s.phase) * 0.15;
      sizes[i] = s.size * (0.85 + Math.sin(t * 0.4 + s.phase) * 0.15);
      alphas[i] = s.alpha * (0.75 + Math.sin(t * 0.5 + s.phase) * 0.25);
      kinds[i] = s.kind;
    }
    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    kindAttr.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}

function AtmosphereScene() {
  return (
    <group>
      <ambientLight intensity={0.25} />
      <pointLight position={[2, 2, 3]} intensity={3} color={CYAN} distance={12} />
      <pointLight position={[-2, -1, 2]} intensity={2.2} color={NEON_GREEN} distance={10} />
      <pointLight position={[0.5, -2, 2]} intensity={1.8} color={CRIMSON} distance={9} />
      <VolumetricFogLayer />
      <DarkAxiomBurstFreeze />
    </group>
  );
}

export type AxiomDarkAxiomAtmosphereProps = {
  className?: string;
  style?: React.CSSProperties;
  /** `fixed` covers the viewport behind studio/upload; `absolute` fills a relative parent. */
  mode?: "fixed" | "absolute";
};

/**
 * DarkAxiom freeze-lock constellation + neon-green accents + volumetric fog.
 * pointer-events-none, clearAlpha 0 — sits at z-0 behind upload / creator UI (z-10).
 */
export function AxiomDarkAxiomAtmosphere({
  className,
  style,
  mode = "fixed",
}: AxiomDarkAxiomAtmosphereProps) {
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !webglOk) {
    return (
      <div
        className={
          className ??
          `${mode === "fixed" ? "fixed" : "absolute"} inset-0 z-0 pointer-events-none`
        }
        style={style}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={
        className ??
        `${mode === "fixed" ? "fixed" : "absolute"} inset-0 z-0 h-full w-full pointer-events-none`
      }
      style={style}
      data-axiom-dark-atmosphere=""
      aria-hidden
    >
      <Canvas
        className="h-full w-full pointer-events-none"
        style={{ pointerEvents: "none", background: "transparent" }}
        camera={{ position: [0, 0.1, 4.2], fov: 48 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          const canvas = gl.domElement;
          canvas.style.pointerEvents = "none";
          canvas.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              setWebglOk(false);
            },
            false,
          );
        }}
      >
        <AtmosphereScene />
      </Canvas>
    </div>
  );
}

export default AxiomDarkAxiomAtmosphere;
