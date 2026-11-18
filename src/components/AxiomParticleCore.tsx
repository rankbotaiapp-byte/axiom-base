"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CYAN = "#06b6d4";
const CRIMSON = "#ef4444";
const OBSIDIAN = "#030712";
const NEON_GREEN = "#34d399";

/** Soft core marker size — debris ring locks at ~1.5× this. */
const CORE_RADIUS = 0.55;
const RING_RADIUS = CORE_RADIUS * 1.5;
const MAX_FIELD_RADIUS = CORE_RADIUS * 1.55;

const BURST_COUNT = 420;
const FREEZE_DURATION = 1.0;
const DEBRIS_COUNT = 28;

function expDamp01(t: number, k = 6.5): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return 1 - Math.exp(-k * x);
}

/* ------------------------------------------------------------------ */
/* Soft circular additive point sprites                               */
/* ------------------------------------------------------------------ */

const burstVert = /* glsl */ `
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
  gl_PointSize = max(1.0, aSize * (90.0 / dist));
  gl_Position = projectionMatrix * mv;
}
`;

const burstFrag = /* glsl */ `
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
  float soft = exp(-d * d * 3.2);
  float rim = smoothstep(1.0, 0.32, d);
  vec3 col = uObsidian;
  if (vKind > 0.5 && vKind < 1.5) col = uCyan;
  else if (vKind > 1.5 && vKind < 2.5) col = uCrimson;
  else if (vKind > 2.5) col = uGreen;
  col *= rim;
  gl_FragColor = vec4(col, soft * vAlpha * rim);
}
`;

type BurstParticle = {
  ox: number;
  oy: number;
  oz: number;
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

/** Halo / constellation targets tightly around the core. */
function buildHaloTargets(count: number): { x: number; y: number; z: number; kind: number; size: number }[] {
  const out: { x: number; y: number; z: number; kind: number; size: number }[] = [];
  const ringN = Math.floor(count * 0.55);
  for (let i = 0; i < ringN; i++) {
    const a = (i / ringN) * Math.PI * 2;
    const r = RING_RADIUS * (0.92 + (i % 5) * 0.012);
    const kind = i % 11 === 0 ? 3 : i % 7 === 0 ? 2 : i % 3 === 0 ? 0 : 1;
    out.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r * 0.88,
      z: (i % 4) * 0.02 - 0.03,
      kind,
      size: kind === 3 ? 1.15 : kind === 0 ? 0.7 : 1.05,
    });
  }
  while (out.length < count) {
    const a = Math.random() * Math.PI * 2;
    const b = (Math.random() - 0.5) * Math.PI * 0.55;
    const r = RING_RADIUS * (0.75 + Math.random() * 0.28);
    const kind = Math.random() < 0.2 ? 3 : Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? 1 : 2;
    out.push({
      x: Math.cos(a) * Math.cos(b) * r,
      y: Math.sin(b) * r * 0.7,
      z: Math.sin(a) * Math.cos(b) * r * 0.55,
      kind,
      size: 0.65 + Math.random() * 0.45,
    });
  }
  return out.slice(0, count);
}

function ParticleBurstFreeze({
  armed,
  dynamicsLocked,
  onSettled,
}: {
  armed: boolean;
  dynamicsLocked: boolean;
  onSettled?: () => void;
}) {
  const particles = useRef<BurstParticle[]>([]);
  const targets = useMemo(() => buildHaloTargets(BURST_COUNT), []);
  const detonated = useRef(false);
  const settled = useRef(false);
  const cycleAge = useRef(0);

  const { geometry, material, posAttr, sizeAttr, alphaAttr, kindAttr } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(BURST_COUNT * 3);
    const sizes = new Float32Array(BURST_COUNT);
    const alphas = new Float32Array(BURST_COUNT);
    const kinds = new Float32Array(BURST_COUNT);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(kinds, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), MAX_FIELD_RADIUS + 0.4);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uObsidian: { value: new THREE.Color(OBSIDIAN) },
        uCyan: { value: new THREE.Color(CYAN) },
        uCrimson: { value: new THREE.Color(CRIMSON) },
        uGreen: { value: new THREE.Color(NEON_GREEN) },
      },
      vertexShader: burstVert,
      fragmentShader: burstFrag,
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

  const detonate = () => {
    if (detonated.current) return;
    detonated.current = true;
    settled.current = false;
    cycleAge.current = 0;
    const next: BurstParticle[] = [];
    for (let i = 0; i < BURST_COUNT; i++) {
      const target = targets[i]!;
      const len = Math.hypot(target.x, target.y, target.z) || 1;
      const overshoot = 1.02 + Math.random() * 0.12;
      const speed0 = 1.2 + Math.random() * 1.6;
      const radial = Math.min(len * overshoot, MAX_FIELD_RADIUS);
      const scale = radial / len;
      next.push({
        ox: 0,
        oy: 0,
        oz: 0,
        tx: target.x,
        ty: target.y,
        tz: target.z,
        vx: (target.x / len) * speed0 * scale,
        vy: (target.y / len) * speed0 * scale,
        vz: (target.z / len) * speed0 * scale,
        size: target.size,
        kind: target.kind,
        age: 0,
        frozen: false,
        fx: target.x,
        fy: target.y,
        fz: target.z,
      });
    }
    particles.current = next;
  };

  useFrame((_, delta) => {
    if (dynamicsLocked) return;
    const dt = Math.min(delta, 0.033);
    if (armed && !detonated.current) detonate();
    if (!detonated.current) return;
    cycleAge.current += dt;

    const list = particles.current;
    const posArr = posAttr.array as Float32Array;
    const sizeArr = sizeAttr.array as Float32Array;
    const alphaArr = alphaAttr.array as Float32Array;
    const kindArr = kindAttr.array as Float32Array;

    for (let i = 0; i < BURST_COUNT; i++) {
      const p = list[i];
      if (!p) {
        alphaArr[i] = 0;
        sizeArr[i] = 0;
        continue;
      }

      p.age += dt;
      const t = Math.min(1, p.age / FREEZE_DURATION);
      const damp = expDamp01(t, 6.5);
      const velScale = THREE.MathUtils.lerp(1, 0, damp);

      let x: number;
      let y: number;
      let z: number;

      if (t < 1) {
        p.vx *= Math.exp(-6.2 * dt);
        p.vy *= Math.exp(-6.2 * dt);
        p.vz *= Math.exp(-6.2 * dt);

        let bx = p.ox + p.vx * p.age * velScale;
        let by = p.oy + p.vy * p.age * velScale;
        let bz = p.oz + p.vz * p.age * velScale;
        const sr = Math.hypot(bx, by, bz);
        if (sr > MAX_FIELD_RADIUS) {
          const s = MAX_FIELD_RADIUS / sr;
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
        p.vx = p.vy = p.vz = 0;
      }

      const ix = i * 3;
      posArr[ix] = x;
      posArr[ix + 1] = y;
      posArr[ix + 2] = z;
      kindArr[i] = p.kind;

      const hold = p.frozen ? 0.96 : 1;
      sizeArr[i] = p.size * hold * THREE.MathUtils.lerp(0.5, 1, damp);
      const entrance = THREE.MathUtils.smoothstep(t, 0, 0.05);
      alphaArr[i] = entrance * (p.kind === 0 ? 0.38 : 0.9) * hold;
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    kindAttr.needsUpdate = true;

    // Single burst settled — notify parent to halt the frame loop
    if (!settled.current && cycleAge.current >= FREEZE_DURATION + 0.05) {
      settled.current = true;
      onSettled?.();
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />;
}

/* ------------------------------------------------------------------ */
/* Low-poly rock / crystal debris — lazy frozen orbit                 */
/* ------------------------------------------------------------------ */

type DebrisSpec = {
  radius: number;
  elev: number;
  phase: number;
  spin: THREE.Euler;
  scale: number;
  kind: number;
  shape: 0 | 1 | 2;
};

function buildDebrisSpecs(count: number): DebrisSpec[] {
  const specs: DebrisSpec[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
    specs.push({
      radius: RING_RADIUS * (0.88 + Math.random() * 0.22),
      elev: (Math.random() - 0.5) * 0.28,
      phase: a,
      spin: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ),
      scale: 0.045 + Math.random() * 0.07,
      kind: i % 3,
      shape: (i % 3) as 0 | 1 | 2,
    });
  }
  return specs;
}

function DebrisRock({
  spec,
  geometry,
  dynamicsLocked,
  orbitTime,
}: {
  spec: DebrisSpec;
  geometry: THREE.BufferGeometry;
  dynamicsLocked: boolean;
  orbitTime: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => {
    if (spec.kind === 1) return new THREE.Color(CYAN);
    if (spec.kind === 2) return new THREE.Color(CRIMSON);
    return new THREE.Color(OBSIDIAN);
  }, [spec.kind]);

  const emissive = useMemo(() => {
    if (spec.kind === 0) return new THREE.Color(CYAN).multiplyScalar(0.15);
    return color.clone().multiplyScalar(0.55);
  }, [color, spec.kind]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || dynamicsLocked) return;
    const t = orbitTime.current;
    const a = spec.phase + t * 0.085;
    mesh.position.set(
      Math.cos(a) * spec.radius,
      spec.elev + Math.sin(t * 0.35 + spec.phase) * 0.04,
      Math.sin(a) * spec.radius * 0.72,
    );
    mesh.rotation.x = spec.spin.x + t * 0.12;
    mesh.rotation.y = spec.spin.y + t * 0.08;
    mesh.rotation.z = spec.spin.z + t * 0.05;
  });

  // Initial placement before first frame
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const a = spec.phase;
    mesh.position.set(Math.cos(a) * spec.radius, spec.elev, Math.sin(a) * spec.radius * 0.72);
    mesh.rotation.copy(spec.spin);
  }, [spec]);

  return (
    <mesh ref={meshRef} geometry={geometry} scale={spec.scale} frustumCulled={false} renderOrder={8}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={spec.kind === 0 ? 0.35 : 0.85}
        roughness={0.45}
        metalness={0.2}
        transparent
        opacity={spec.kind === 0 ? 0.72 : 0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function FrozenDebrisRing({
  armed,
  dynamicsLocked,
}: {
  armed: boolean;
  dynamicsLocked: boolean;
}) {
  const specs = useMemo(() => buildDebrisSpecs(DEBRIS_COUNT), []);
  const geos = useMemo(() => {
    const dode = new THREE.DodecahedronGeometry(1, 0);
    const octa = new THREE.OctahedronGeometry(1, 0);
    const tetra = new THREE.TetrahedronGeometry(1, 0);
    return [dode, octa, tetra] as const;
  }, []);
  const orbitTime = useRef(0);
  const ringRef = useRef<THREE.Group>(null);

  useEffect(
    () => () => {
      geos.forEach((g) => g.dispose());
    },
    [geos],
  );

  useFrame((_, delta) => {
    if (!armed || dynamicsLocked) return;
    orbitTime.current += delta;
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.045;
  });

  return (
    <group ref={ringRef} visible={armed}>
      {specs.map((spec, i) => (
        <DebrisRock
          key={i}
          spec={spec}
          geometry={geos[spec.shape]!}
          dynamicsLocked={dynamicsLocked}
          orbitTime={orbitTime}
        />
      ))}
    </group>
  );
}

/** Soft luminous core the halo frames. */
function CoreMarker({ dynamicsLocked }: { dynamicsLocked: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m || dynamicsLocked) return;
    const t = state.clock.elapsedTime;
    const s = CORE_RADIUS * (0.55 + Math.sin(t * 1.4) * 0.04);
    m.scale.setScalar(s);
  });
  useEffect(() => {
    if (ref.current) ref.current.scale.setScalar(CORE_RADIUS * 0.55);
  }, []);
  return (
    <mesh ref={ref} renderOrder={5}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={OBSIDIAN}
        emissive={CYAN}
        emissiveIntensity={1.4}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function ParticleCoreScene({
  armed,
  dynamicsLocked,
  onSettled,
}: {
  armed: boolean;
  dynamicsLocked: boolean;
  onSettled?: () => void;
}) {
  return (
    <group>
      <ambientLight intensity={0.35} />
      <pointLight position={[1.2, 1.4, 2]} intensity={4} color={CYAN} distance={8} />
      <pointLight position={[-1.1, -0.8, 1.6]} intensity={3} color={CRIMSON} distance={7} />
      {armed ? (
        <>
          <CoreMarker dynamicsLocked={dynamicsLocked} />
          <FrozenDebrisRing armed={armed} dynamicsLocked={dynamicsLocked} />
          <ParticleBurstFreeze armed={armed} dynamicsLocked={dynamicsLocked} onSettled={onSettled} />
        </>
      ) : null}
    </group>
  );
}

export type AxiomParticleCoreProps = {
  className?: string;
  style?: React.CSSProperties;
  /** When true, fire the single shockwave → freeze-lock constellation. */
  armed?: boolean;
  /** After settle, stop all simulation and hold the frozen frame. */
  dynamicsLocked?: boolean;
  onSettled?: () => void;
};

/**
 * Cinematic Axiom Particle Burst + Frozen Orbiting Debris Ring.
 * Transparent WebGL overlay — clearAlpha 0 — for hero / stage compositing.
 * Bursts only when `armed` (video freeze-lock); then locks permanently.
 */
export function AxiomParticleCore({
  className,
  style,
  armed = false,
  dynamicsLocked = false,
  onSettled,
}: AxiomParticleCoreProps) {
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !webglOk) {
    return (
      <div
        className={className ?? "pointer-events-none absolute inset-0"}
        style={style}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={className ?? "pointer-events-none absolute inset-0 z-[3]"}
      style={style}
      data-axiom-particle-core=""
      data-armed={armed ? "" : undefined}
      data-locked={dynamicsLocked ? "" : undefined}
      aria-hidden
    >
      <Canvas
        className="h-full w-full"
        style={{ pointerEvents: "none", background: "transparent" }}
        camera={{ position: [0, 0.15, 3.1], fov: 42 }}
        dpr={[1, 1.75]}
        frameloop={dynamicsLocked ? "never" : armed ? "always" : "demand"}
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
        <ParticleCoreScene armed={armed} dynamicsLocked={dynamicsLocked} onSettled={onSettled} />
      </Canvas>
    </div>
  );
}

export default AxiomParticleCore;
