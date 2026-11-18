"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { AxiomChatDrawer } from "@/components/AxiomChatDrawer";
import {
  CINEMATIC_HERO_FALLBACKS,
  CINEMATIC_HERO_POSTER,
  CINEMATIC_HERO_VIDEO,
} from "@/lib/axiom/cinematic-content-seo";

const CYAN = "#06b6d4";
const CRIMSON = "#ef4444";
const GREEN = "#34d399";
const OBSIDIAN = "#030712";

/** Massive hyper-polished optical bubble — dominant hero centerpiece */
const LENS_R = 1.58;
/** Multi-angular envelope radii relative to the giant glass sphere */
const SHELL_INNER = LENS_R * 1.1;
const SHELL_OUTER = LENS_R * 1.55;
const MAX_R = SHELL_OUTER * 1.12;
/** Layered particle budgets — behind / mid / spherical shell */
const BACK_N = 220;
const MID_N = 240;
const SHELL_N = 320;
const MICRO_N = 200;
const DEBRIS_N = 36;
const FOG_N = 90;
const FREEZE_T = 1.2;
/** Full-viewport tumbling background bubbles (between video plate & glass lens) */
const TUMBLE_N = 150;
const TUMBLE_SPAWN_Y = -3.55;
const TUMBLE_TOP_Y = 3.65;
const TUMBLE_HALF_W = 6.1;
const TUMBLE_LENS_INFLUENCE = LENS_R * 1.95;
const TUMBLE_CURSOR_INFLUENCE = 2.05;

/** Deep-red Axiom core loop mapped inside the glass cavity */
const INNER_CORE_VIDEO = CINEMATIC_HERO_VIDEO; // /media/heroes/axiom-landing.mp4
const INNER_CORE_FALLBACKS = [
  "/media/axiom-landing.mp4",
  "/media/axiom/axiom-logo-loop.mp4",
  "/media/axiom-robot-hero.mp4",
] as const;

/** Differential parallax — multi-angular particle depth vs. heavy glass tracking. */
const PLANE = {
  /** Deep background video plate (CSS) — keep logo readable */
  bgAmp: 0.01,
  bgFollow: 0.04,
  /** Atmospheric fog */
  fogAmp: 0.2,
  fogFollow: 0.06,
  fogZ: -2.4,
  /** Particles floating behind the giant glass sphere */
  backAmp: 0.42,
  backFollow: 0.07,
  backZ: -1.45,
  /** Tumbling bubble field — intermediate depth between video & glass */
  tumbleZ: -0.72,
  /** Midground orbiting debris / ember trails */
  midAmp: 0.68,
  midFollow: 0.09,
  midZ: -0.12,
  /** Giant glass bubble + dense spherical shell — centered focal plane */
  fgAmp: 0.72,
  fgFollow: 0.1,
  fgZ: 0.35,
} as const;

type DepthBand = "back" | "mid" | "shell";

/** Play-once particle logo film → permanent freeze-lock on final break frame. */
const PARTICLE_LOGO_FILM = "/media/particle-logo-axiom.mp4";
const VIDEO_CHAIN = [
  PARTICLE_LOGO_FILM,
  CINEMATIC_HERO_VIDEO,
  "/media/axiom-robot-hero.mp4",
  ...CINEMATIC_HERO_FALLBACKS.filter(
    (u) => u !== CINEMATIC_HERO_VIDEO && u !== "/media/axiom-landing.mp4.mp4",
  ),
] as const;

function expDamp01(t: number, k = 6.5) {
  return 1 - Math.exp(-k * THREE.MathUtils.clamp(t, 0, 1));
}

function nextVideo(current: string): string | null {
  const idx = VIDEO_CHAIN.indexOf(current as (typeof VIDEO_CHAIN)[number]);
  if (idx >= 0 && idx < VIDEO_CHAIN.length - 1) return VIDEO_CHAIN[idx + 1]!;
  if (idx < 0) return VIDEO_CHAIN[0] ?? null;
  return null;
}

/* ------------------------------------------------------------------ */
/* Shared pointer target (NDC → stage)                                */
/* ------------------------------------------------------------------ */

type PointerBus = { x: number; y: number };

/** Independent depth plane — lerps toward pointer * amp with its own inertia. */
function ParallaxPlane({
  pointer,
  amp,
  follow,
  z = 0,
  children,
}: {
  pointer: React.MutableRefObject<PointerBus>;
  amp: number;
  follow: number;
  z?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(delta, 0.033);
    const k = 1 - Math.exp(-follow * 60 * dt);
    g.position.x = THREE.MathUtils.lerp(g.position.x, pointer.current.x * amp, k);
    g.position.y = THREE.MathUtils.lerp(g.position.y, pointer.current.y * amp * 0.85, k);
  });
  return (
    <group ref={ref} position={[0, 0, z]}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Soft additive point sprites                                        */
/* ------------------------------------------------------------------ */

const ptVert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute float aKind;
varying float vAlpha;
varying float vKind;
void main() {
  vAlpha = aAlpha;
  vKind = aKind;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(1.0, aSize * (95.0 / max(0.001, -mv.z)));
  gl_Position = projectionMatrix * mv;
}
`;

const ptFrag = /* glsl */ `
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
  float soft = exp(-d * d * 3.0);
  float rim = smoothstep(1.0, 0.3, d);
  vec3 col = uObsidian;
  if (vKind > 0.5 && vKind < 1.5) col = uCyan;
  else if (vKind > 1.5 && vKind < 2.5) col = uCrimson;
  else if (vKind > 2.5) col = uGreen;
  gl_FragColor = vec4(col * rim, soft * vAlpha * rim);
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
  gl_PointSize = max(2.0, aSize * (130.0 / max(0.001, -mv.z)));
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
  float soft = exp(-d * d * 1.55);
  vec3 col = uCyan;
  if (vKind > 0.5 && vKind < 1.5) col = uGreen;
  else if (vKind > 1.5) col = uCrimson;
  gl_FragColor = vec4(col, soft * vAlpha * 0.5);
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
  fx: number;
  fy: number;
  fz: number;
  frozen: boolean;
};

/**
 * Multi-angular layered targets:
 *  - back  → hemisphere / cloud behind the glass (negative Z bias)
 *  - mid   → orbiting midground ring with depth scatter
 *  - shell → dense volumetric spherical wrap from every angle
 */
function buildLayerTargets(n: number, band: DepthBand) {
  const out: { x: number; y: number; z: number; kind: number; size: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const yUnit = 1 - t * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
    const theta = golden * i;
    const kind = i % 13 === 0 ? 3 : i % 7 === 0 ? 2 : i % 4 === 0 ? 0 : 1;
    let x: number;
    let y: number;
    let z: number;
    let size: number;

    if (band === "back") {
      // Particles floating directly behind the giant sphere
      const r = LENS_R * (0.95 + (i % 5) * 0.08) + ((i * 13) % 5) * 0.03;
      x = Math.cos(theta) * radiusAtY * r * 1.15;
      y = yUnit * r * 0.95;
      z = -LENS_R * (0.55 + (i % 7) * 0.12) - Math.abs(Math.sin(theta)) * 0.35;
      size = kind === 3 ? 1.4 : kind === 0 ? 0.7 : 1.05 + (i % 4) * 0.08;
    } else if (band === "mid") {
      // Midground orbit — encircles sides / top / bottom with depth scatter
      const elev = (i / n) * Math.PI * 2;
      const r = LENS_R * (1.25 + (i % 6) * 0.07);
      const depth = Math.sin(elev * 2 + i * 0.3) * LENS_R * 0.55;
      x = Math.cos(elev) * r;
      y = Math.sin(elev) * r * 0.72 + yUnit * 0.15;
      z = depth;
      size = kind === 3 ? 1.15 : kind === 0 ? 0.5 : 0.9 + (i % 5) * 0.05;
    } else {
      // Dense spherical shell wrapping every angle
      const layer = i % 7;
      const r =
        SHELL_INNER +
        (layer / 6) * (SHELL_OUTER - SHELL_INNER) +
        ((i * 17) % 7) * 0.008 -
        0.02;
      x = Math.cos(theta) * radiusAtY * r;
      y = yUnit * r;
      z = Math.sin(theta) * radiusAtY * r;
      size = kind === 3 ? 1.35 : kind === 0 ? 0.55 : 0.95 + (i % 5) * 0.06;
    }

    out.push({ x, y, z, kind, size });
  }
  return out;
}

/** Rising micro-bubbles + deep-red video sphere swirling inside the glass cavity. */
function SwirlingFluidCore({ map }: { map: THREE.Texture | null }) {
  const fluidRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const micro = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MICRO_N * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(MICRO_N), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(MICRO_N), 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(MICRO_N), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), LENS_R);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uObsidian: { value: new THREE.Color(OBSIDIAN) },
        uCyan: { value: new THREE.Color(CYAN) },
        uCrimson: { value: new THREE.Color(CRIMSON) },
        uGreen: { value: new THREE.Color(GREEN) },
      },
      vertexShader: ptVert,
      fragmentShader: ptFrag,
    });
    const slots = Array.from({ length: MICRO_N }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.5) * Math.PI;
      const r = LENS_R * (0.18 + Math.random() * 0.52);
      return {
        a,
        elev,
        r,
        rise: 0.12 + Math.random() * 0.28,
        swirl: 0.55 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        size: 0.35 + Math.random() * 0.55,
        kind: i % 5 === 0 ? 1 : i % 3 === 0 ? 3 : 2,
      };
    });
    return {
      geo,
      mat,
      pos: geo.getAttribute("position") as THREE.BufferAttribute,
      size: geo.getAttribute("aSize") as THREE.BufferAttribute,
      alpha: geo.getAttribute("aAlpha") as THREE.BufferAttribute,
      kind: geo.getAttribute("aKind") as THREE.BufferAttribute,
      slots,
    };
  }, []);

  useEffect(
    () => () => {
      micro.geo.dispose();
      micro.mat.dispose();
    },
    [micro],
  );

  useFrame((state, delta) => {
    if (map) map.needsUpdate = true;
    const dt = Math.min(delta, 0.033);
    const t = state.clock.elapsedTime;
    const g = fluidRef.current;
    if (g) {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, t * 0.22, 1 - Math.exp(-3 * dt));
      g.rotation.x = Math.sin(t * 0.35) * 0.08;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.12;
      const breath = 1 + Math.sin(t * 1.4) * 0.018;
      coreRef.current.scale.setScalar(breath);
    }

    const posA = micro.pos.array as Float32Array;
    const sizeA = micro.size.array as Float32Array;
    const alphaA = micro.alpha.array as Float32Array;
    const kindA = micro.kind.array as Float32Array;
    const cavity = LENS_R * 0.78;
    for (let i = 0; i < MICRO_N; i++) {
      const s = micro.slots[i]!;
      s.a += s.swirl * dt;
      s.elev += s.rise * dt * 0.55;
      if (s.elev > Math.PI * 0.48) s.elev = -Math.PI * 0.48;
      const wobble = 1 + Math.sin(t * 2.2 + s.phase) * 0.06;
      const r = Math.min(cavity, s.r * wobble);
      const cy = Math.cos(s.elev);
      const x = Math.cos(s.a) * cy * r;
      const y = Math.sin(s.elev) * r;
      const z = Math.sin(s.a) * cy * r;
      const ix = i * 3;
      posA[ix] = x;
      posA[ix + 1] = y;
      posA[ix + 2] = z;
      sizeA[i] = s.size * (0.85 + Math.sin(t * 3 + s.phase) * 0.15);
      alphaA[i] = 0.45 + Math.sin(t * 1.8 + s.phase) * 0.25;
      kindA[i] = s.kind;
    }
    micro.pos.needsUpdate = true;
    micro.size.needsUpdate = true;
    micro.alpha.needsUpdate = true;
    micro.kind.needsUpdate = true;
  });

  const coreR = LENS_R * 0.62;
  return (
    <group ref={fluidRef} renderOrder={-1}>
      {map ? (
        <mesh ref={coreRef}>
          <sphereGeometry args={[coreR, 64, 64]} />
          <meshStandardMaterial
            map={map}
            emissiveMap={map}
            emissive="#7f1d1d"
            emissiveIntensity={1.35}
            transparent
            opacity={0.96}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
            roughness={0.18}
            metalness={0.12}
          />
        </mesh>
      ) : (
        <mesh>
          <sphereGeometry args={[coreR * 0.92, 32, 32]} />
          <meshStandardMaterial
            color="#450a0a"
            emissive="#7f1d1d"
            emissiveIntensity={1.1}
            transparent
            opacity={0.85}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* Liquid water sheath — clear/crimson volume the micro-bubbles swim through */}
      <mesh>
        <sphereGeometry args={[LENS_R * 0.84, 48, 48]} />
        <meshPhysicalMaterial
          color="#1a0508"
          emissive="#7f1d1d"
          emissiveIntensity={0.42}
          transparent
          opacity={0.28}
          depthWrite={false}
          side={THREE.DoubleSide}
          roughness={0.08}
          metalness={0.02}
          transmission={0.55}
          thickness={0.55}
          ior={1.33}
        />
      </mesh>
      <points geometry={micro.geo} material={micro.mat} frustumCulled={false} renderOrder={2} />
      <pointLight position={[0, 0.15, 0.1]} intensity={3.2} color="#ef4444" distance={LENS_R * 2.4} decay={2} />
      <pointLight position={[0, -0.1, -0.15]} intensity={1.8} color="#7f1d1d" distance={LENS_R * 2} decay={2} />
    </group>
  );
}

function OpticalGlassBubble({
  map,
  pointer,
}: {
  map: THREE.Texture | null;
  pointer: React.MutableRefObject<PointerBus>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const m = meshRef.current;
    if (!m) return;
    const dt = Math.min(delta, 0.033);
    // Physical weight — damped lean into cursor travel
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, -pointer.current.y * 0.42, 1 - Math.exp(-7 * dt));
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, pointer.current.x * 0.42, 1 - Math.exp(-7 * dt));
    const breath = 1 + Math.sin(performance.now() * 0.0012) * 0.012;
    m.scale.setScalar(breath);
  });

  const rim = LENS_R * 0.95;
  return (
    <group>
      <SwirlingFluidCore map={map} />
      <Sphere ref={meshRef} args={[LENS_R, 128, 128]} castShadow={false} receiveShadow={false}>
        <MeshTransmissionMaterial
          backside
          samples={18}
          resolution={896}
          transmission={0.99}
          roughness={0.01}
          thickness={2.2}
          ior={1.58}
          chromaticAberration={0.15}
          anisotropy={0.35}
          distortion={0.12}
          distortionScale={0.32}
          temporalDistortion={0.1}
          color="#ffffff"
          attenuationColor="#fecaca"
          attenuationDistance={1.15}
        />
      </Sphere>
      {/* Super-bright prismatic rim + stage fill */}
      <pointLight position={[rim, rim * 0.7, rim * 1.05]} intensity={7.4} color={CYAN} distance={7.2} decay={2} />
      <pointLight position={[-rim * 0.95, rim * 0.35, rim * 0.9]} intensity={6.2} color={GREEN} distance={7.0} decay={2} />
      <pointLight position={[rim * 0.2, -rim * 0.95, rim * 0.8]} intensity={4.6} color={CRIMSON} distance={6.2} decay={2} />
      <pointLight position={[rim * 0.55, rim * 0.2, -rim * 0.85]} intensity={4.0} color={GREEN} distance={5.8} decay={2} />
      <pointLight position={[-rim * 0.4, rim * 0.85, -rim * 0.65]} intensity={3.8} color={CYAN} distance={5.6} decay={2} />
      <pointLight position={[0, rim * 1.15, rim * 0.35]} intensity={5.5} color="#ffffff" distance={6.5} decay={2} />
      <pointLight position={[0, 0, -rim * 1.4]} intensity={4.8} color={GREEN} distance={8.5} decay={2} />
      <pointLight position={[rim * 0.2, rim * 0.3, -rim * 1.1]} intensity={4.2} color={CYAN} distance={8} decay={2} />
      <spotLight
        position={[rim * 1.6, rim * 1.8, rim * 2.2]}
        angle={0.55}
        penumbra={0.65}
        intensity={3.8}
        color="#e0f2fe"
        distance={12}
        decay={2}
      />
    </group>
  );
}

function BurstAndDebris({
  armed,
  band,
  count,
  debrisCount = 0,
  cycle = 0,
  onSettled,
}: {
  armed: boolean;
  band: DepthBand;
  count: number;
  debrisCount?: number;
  /** Increments on each logo-loop wrap to re-detonate the shell. */
  cycle?: number;
  onSettled?: () => void;
}) {
  const targets = useMemo(() => buildLayerTargets(count, band), [count, band]);
  const particles = useRef<BurstP[]>([]);
  const detonated = useRef(false);
  const settled = useRef(false);
  const age = useRef(0);
  const lastCycle = useRef(cycle);

  // Seamless loop — re-arm burst when the logo film wraps
  useEffect(() => {
    if (cycle === lastCycle.current) return;
    lastCycle.current = cycle;
    detonated.current = false;
    settled.current = false;
    age.current = 0;
    particles.current = [];
  }, [cycle]);

  const burst = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(count), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(count), 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(count), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), MAX_R + 1.2);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uObsidian: { value: new THREE.Color(OBSIDIAN) },
        uCyan: { value: new THREE.Color(CYAN) },
        uCrimson: { value: new THREE.Color(CRIMSON) },
        uGreen: { value: new THREE.Color(GREEN) },
      },
      vertexShader: ptVert,
      fragmentShader: ptFrag,
    });
    return {
      geo,
      mat,
      pos: geo.getAttribute("position") as THREE.BufferAttribute,
      size: geo.getAttribute("aSize") as THREE.BufferAttribute,
      alpha: geo.getAttribute("aAlpha") as THREE.BufferAttribute,
      kind: geo.getAttribute("aKind") as THREE.BufferAttribute,
    };
  }, [count]);

  const debrisSpecs = useMemo(() => {
    if (debrisCount <= 0) return [] as {
      tx: number;
      ty: number;
      tz: number;
      scale: number;
      kind: number;
      spin: THREE.Euler;
    }[];
    const golden = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: debrisCount }, (_, i) => {
      const t = i / Math.max(1, debrisCount - 1);
      const y = 1 - t * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i + (Math.random() - 0.5) * 0.15;
      const r = SHELL_INNER + 0.1 + Math.random() * (SHELL_OUTER - SHELL_INNER);
      const zBias = band === "back" ? -LENS_R * 0.7 : band === "mid" ? (Math.random() - 0.5) * LENS_R : Math.sin(theta) * radiusAtY * r;
      return {
        tx: Math.cos(theta) * radiusAtY * r,
        ty: y * r,
        tz: band === "shell" ? Math.sin(theta) * radiusAtY * r : zBias,
        scale: 0.045 + Math.random() * 0.07,
        kind: i % 3,
        spin: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      };
    });
  }, [debrisCount, band]);

  const geos = useMemo(
    () =>
      [
        new THREE.DodecahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0),
      ] as const,
    [],
  );

  const debrisRefs = useRef<(THREE.Mesh | null)[]>([]);
  const wasArmed = useRef(false);

  useEffect(
    () => () => {
      burst.geo.dispose();
      burst.mat.dispose();
      geos.forEach((g) => g.dispose());
    },
    [burst, geos],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);

    if (!armed) {
      if (wasArmed.current) {
        wasArmed.current = false;
        detonated.current = false;
        settled.current = false;
        age.current = 0;
        particles.current = [];
        const alphas = burst.alpha.array as Float32Array;
        const sizes = burst.size.array as Float32Array;
        for (let i = 0; i < count; i++) {
          alphas[i] = 0;
          sizes[i] = 0;
        }
        burst.alpha.needsUpdate = true;
        burst.size.needsUpdate = true;
        for (let i = 0; i < debrisCount; i++) {
          const mesh = debrisRefs.current[i];
          if (mesh) mesh.visible = false;
        }
      }
      return;
    }
    wasArmed.current = true;
    for (let i = 0; i < debrisCount; i++) {
      const mesh = debrisRefs.current[i];
      if (mesh) mesh.visible = true;
    }

    if (!detonated.current) {
      detonated.current = true;
      age.current = 0;
      settled.current = false;
      const next: BurstP[] = [];
      const speedScale = band === "back" ? 0.85 : band === "mid" ? 1.05 : 1.25;
      for (let i = 0; i < count; i++) {
        const t = targets[i]!;
        const len = Math.hypot(t.x, t.y, t.z) || 1;
        const overshoot = 1.02 + Math.random() * 0.14;
        const speed0 = (1.15 + Math.random() * 1.85) * speedScale;
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
          fx: t.x,
          fy: t.y,
          fz: t.z,
          frozen: false,
        });
      }
      particles.current = next;
    }

    if (!settled.current) {
      age.current += dt;
      const pos = burst.pos.array as Float32Array;
      const sizes = burst.size.array as Float32Array;
      const alphas = burst.alpha.array as Float32Array;
      const kinds = burst.kind.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const p = particles.current[i];
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
          p.vx *= Math.exp(-5.8 * dt);
          p.vy *= Math.exp(-5.8 * dt);
          p.vz *= Math.exp(-5.8 * dt);
          let bx = p.vx * p.age * velScale;
          let by = p.vy * p.age * velScale;
          let bz = p.vz * p.age * velScale;
          // Soft repulsion — mid/shell flow around glass; back layer stays behind
          if (band !== "back") {
            const br = Math.hypot(bx, by, bz) || 0.0001;
            const glassClear = LENS_R * 1.06;
            if (br < glassClear) {
              const push = glassClear / br;
              bx *= push;
              by *= push;
              bz *= push;
            }
          }
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
        const glow = band === "back" ? 0.75 : band === "mid" ? 0.95 : 1;
        alphas[i] = THREE.MathUtils.smoothstep(t, 0, 0.05) * (p.kind === 0 ? 0.4 : 0.95) * glow;
      }
      burst.pos.needsUpdate = true;
      burst.size.needsUpdate = true;
      burst.alpha.needsUpdate = true;
      burst.kind.needsUpdate = true;

      const debrisDamp = expDamp01(Math.min(1, age.current / FREEZE_T), 5.5);
      for (let i = 0; i < debrisCount; i++) {
        const mesh = debrisRefs.current[i];
        const spec = debrisSpecs[i]!;
        if (!mesh || !spec) continue;
        const fly = 1 - debrisDamp;
        mesh.position.set(
          THREE.MathUtils.lerp(spec.tx * 0.15, spec.tx, debrisDamp) + Math.sin(age.current + i) * 0.02 * fly,
          THREE.MathUtils.lerp(spec.ty * 0.15, spec.ty, debrisDamp),
          THREE.MathUtils.lerp(spec.tz * 0.15, spec.tz, debrisDamp),
        );
        mesh.rotation.x = spec.spin.x + age.current * (0.35 * fly + 0.02);
        mesh.rotation.y = spec.spin.y + age.current * (0.28 * fly + 0.015);
      }

      if (age.current >= FREEZE_T + 0.05 && !settled.current) {
        settled.current = true;
        onSettled?.();
      }
    }
  });

  if (!armed) return null;

  const order = band === "back" ? 4 : band === "mid" ? 8 : 14;
  return (
    <group>
      <points geometry={burst.geo} material={burst.mat} frustumCulled={false} renderOrder={order} />
      {debrisSpecs.map((spec, i) => {
        const color = spec.kind === 1 ? CYAN : spec.kind === 2 ? CRIMSON : GREEN;
        return (
          <mesh
            key={i}
            ref={(el) => {
              debrisRefs.current[i] = el;
            }}
            geometry={geos[spec.kind % 3]!}
            scale={spec.scale}
            frustumCulled={false}
            renderOrder={order - 1}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.9}
              transparent
              opacity={0.92}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              roughness={0.35}
              metalness={0.18}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function VolumetricFog() {
  const slots = useRef(
    Array.from({ length: FOG_N }, () => ({
      x: (Math.random() - 0.5) * 7,
      y: (Math.random() - 0.5) * 4.5,
      z: -1.4 - Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.07,
      vy: (Math.random() - 0.5) * 0.04,
      phase: Math.random() * Math.PI * 2,
      size: 9 + Math.random() * 16,
      kind: Math.random() < 0.4 ? 1 : Math.random() < 0.55 ? 0 : 2,
      alpha: 0.1 + Math.random() * 0.2,
    })),
  );

  const { geo, mat, pos, size, alpha, kind } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FOG_N * 3), 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(FOG_N), 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(FOG_N), 1));
    geometry.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(FOG_N), 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uCyan: { value: new THREE.Color(CYAN) },
        uCrimson: { value: new THREE.Color(CRIMSON) },
        uGreen: { value: new THREE.Color(GREEN) },
      },
      vertexShader: fogVert,
      fragmentShader: fogFrag,
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

  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    const t = state.clock.elapsedTime;
    const posA = pos.array as Float32Array;
    const sizeA = size.array as Float32Array;
    const alphaA = alpha.array as Float32Array;
    const kindA = kind.array as Float32Array;
    for (let i = 0; i < FOG_N; i++) {
      const s = slots.current[i]!;
      s.x += s.vx * dt + Math.sin(t * 0.2 + s.phase) * 0.002;
      s.y += s.vy * dt + Math.cos(t * 0.17 + s.phase) * 0.0015;
      if (Math.abs(s.x) > 3.8) s.x *= -0.98;
      if (Math.abs(s.y) > 2.5) s.y *= -0.98;
      const ix = i * 3;
      posA[ix] = s.x;
      posA[ix + 1] = s.y;
      posA[ix + 2] = s.z;
      sizeA[i] = s.size;
      alphaA[i] = s.alpha * (0.75 + Math.sin(t * 0.45 + s.phase) * 0.25);
      kindA[i] = s.kind;
    }
    pos.needsUpdate = true;
    size.needsUpdate = true;
    alpha.needsUpdate = true;
    kind.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={1} />;
}

/* ------------------------------------------------------------------ */
/* Full-viewport tumbling background bubbles                          */
/* ------------------------------------------------------------------ */

const tumbleVert = /* glsl */ `
attribute float aOpacity;
attribute float aTint;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vOpacity;
varying float vTint;
void main() {
  vOpacity = aOpacity;
  vTint = aTint;
  vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const tumbleFrag = /* glsl */ `
uniform vec3 uCyan;
uniform vec3 uGreen;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vOpacity;
varying float vTint;
void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.4);
  vec3 rim = mix(uCyan, uGreen, clamp(vTint, 0.0, 1.0));
  vec3 core = rim * 0.22;
  vec3 col = core + rim * fresnel * 1.35;
  float alpha = vOpacity * (0.18 + fresnel * 0.82);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

type TumbleSlot = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
  buoyancy: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  tint: number;
  life: number;
};

function spawnTumbleSlot(partialY?: number): TumbleSlot {
  const scale = 0.028 + Math.random() * 0.12 + (Math.random() < 0.12 ? Math.random() * 0.1 : 0);
  return {
    x: (Math.random() * 2 - 1) * TUMBLE_HALF_W,
    y: partialY ?? TUMBLE_SPAWN_Y - Math.random() * 0.8,
    z: -1.65 + Math.random() * 2.35,
    vx: (Math.random() - 0.5) * 0.12,
    vy: 0.28 + Math.random() * 0.55,
    vz: (Math.random() - 0.5) * 0.1,
    scale,
    buoyancy: 0.85 + Math.random() * 0.55,
    swayAmp: 0.12 + Math.random() * 0.35,
    swayFreq: 0.35 + Math.random() * 0.85,
    phase: Math.random() * Math.PI * 2,
    tint: Math.random(),
    life: 0,
  };
}

/**
 * Dense InstancedMesh bubble field — rises from the lower viewport edge with
 * organic sway, cursor/lens repulsion + whirlpool, Fresnel cyan/green rims.
 * Lives in the intermediate depth between the side-blend plate and glass lens.
 */
function TumblingBackgroundBubbles({
  pointer,
}: {
  pointer: React.MutableRefObject<PointerBus>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const slots = useRef<TumbleSlot[]>([]);
  const opacityAttr = useRef<THREE.InstancedBufferAttribute | null>(null);
  const tintAttr = useRef<THREE.InstancedBufferAttribute | null>(null);

  const { geo, mat } = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const opacities = new Float32Array(TUMBLE_N);
    const tints = new Float32Array(TUMBLE_N);
    const aOpacity = new THREE.InstancedBufferAttribute(opacities, 1);
    const aTint = new THREE.InstancedBufferAttribute(tints, 1);
    geometry.setAttribute("aOpacity", aOpacity);
    geometry.setAttribute("aTint", aTint);
    opacityAttr.current = aOpacity;
    tintAttr.current = aTint;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uCyan: { value: new THREE.Color(CYAN) },
        uGreen: { value: new THREE.Color(GREEN) },
      },
      vertexShader: tumbleVert,
      fragmentShader: tumbleFrag,
    });
    return { geo: geometry, mat: material };
  }, []);

  useEffect(() => {
    slots.current = Array.from({ length: TUMBLE_N }, () =>
      spawnTumbleSlot(TUMBLE_SPAWN_Y + Math.random() * (TUMBLE_TOP_Y - TUMBLE_SPAWN_Y)),
    );
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const opac = opacityAttr.current;
    const tints = tintAttr.current;
    if (!mesh || !opac || !tints) return;
    const dt = Math.min(delta, 0.033);
    const t = state.clock.elapsedTime;

    // Cursor + focal lens attractors in stage space
    const cx = pointer.current.x * 4.4;
    const cy = pointer.current.y * 2.6;
    const cz = PLANE.tumbleZ;
    const lx = pointer.current.x * PLANE.fgAmp;
    const ly = pointer.current.y * PLANE.fgAmp * 0.85;
    const lz = PLANE.fgZ;

    for (let i = 0; i < TUMBLE_N; i++) {
      const s = slots.current[i]!;
      s.life += dt;

      // Buoyant rise + sinusoidal orbital sway
      s.vy = THREE.MathUtils.lerp(s.vy, s.buoyancy * (0.45 + s.scale * 2.2), 1 - Math.exp(-2 * dt));
      s.x += s.vx * dt + Math.sin(t * s.swayFreq + s.phase) * s.swayAmp * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt + Math.cos(t * s.swayFreq * 0.73 + s.phase) * s.swayAmp * 0.55 * dt;

      // Cursor repulsion
      let dx = s.x - cx;
      let dy = s.y - cy;
      let dz = s.z - cz;
      let dist = Math.hypot(dx, dy, dz) || 0.0001;
      if (dist < TUMBLE_CURSOR_INFLUENCE) {
        const falloff = 1 - dist / TUMBLE_CURSOR_INFLUENCE;
        const push = falloff * falloff * 3.4 * dt;
        s.x += (dx / dist) * push;
        s.y += (dy / dist) * push * 0.65;
        s.z += (dz / dist) * push;
        // Soft whirl around cursor
        s.x += (-dy / dist) * falloff * 1.1 * dt;
        s.y += (dx / dist) * falloff * 0.55 * dt;
      }

      // Lens repulsion + whirlpool around the giant glass bubble
      dx = s.x - lx;
      dy = s.y - ly;
      dz = s.z - lz;
      dist = Math.hypot(dx, dy, dz) || 0.0001;
      if (dist < TUMBLE_LENS_INFLUENCE) {
        const falloff = 1 - dist / TUMBLE_LENS_INFLUENCE;
        const push = falloff * falloff * 4.8 * dt;
        s.x += (dx / dist) * push;
        s.y += (dy / dist) * push;
        s.z += (dz / dist) * push * 1.15;
        // Tangential swirl (orbit the focal lens)
        const tx = -dy;
        const ty = dx;
        const tLen = Math.hypot(tx, ty) || 1;
        s.x += (tx / tLen) * falloff * 2.2 * dt;
        s.y += (ty / tLen) * falloff * 2.2 * dt;
        // Keep clear of glass interior
        if (dist < LENS_R * 1.08) {
          const clear = (LENS_R * 1.12) / dist;
          s.x = lx + dx * clear;
          s.y = ly + dy * clear;
          s.z = lz + dz * clear;
        }
      }

      // Soft lateral wrap so the field stays full-viewport
      if (s.x > TUMBLE_HALF_W) s.x = -TUMBLE_HALF_W;
      if (s.x < -TUMBLE_HALF_W) s.x = TUMBLE_HALF_W;
      if (s.z > 1.15) s.z = -1.65;
      if (s.z < -1.85) s.z = 1.0;

      // Respawn at lower Y when exiting the top
      if (s.y > TUMBLE_TOP_Y) {
        Object.assign(s, spawnTumbleSlot());
      }

      // Fade-in near spawn, fade-out near top
      const fadeIn = THREE.MathUtils.smoothstep(s.y, TUMBLE_SPAWN_Y - 0.2, TUMBLE_SPAWN_Y + 0.85);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(s.y, TUMBLE_TOP_Y - 1.1, TUMBLE_TOP_Y);
      const birth = Math.min(1, s.life * 1.8);
      const alpha = fadeIn * fadeOut * birth * (0.35 + s.scale * 3.2);

      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(s.scale);
      dummy.rotation.set(t * 0.15 + s.phase, t * 0.22 + s.phase * 0.5, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      opac.array[i] = alpha;
      tints.array[i] = s.tint;
    }

    mesh.instanceMatrix.needsUpdate = true;
    opac.needsUpdate = true;
    tints.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, TUMBLE_N]}
      frustumCulled={false}
      renderOrder={6}
    />
  );
}

/** Endless gateway pulse — expand/contract the particle constellation forever. */
function EndlessDepthPulse({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 0.55) * 0.045 + Math.sin(t * 0.21) * 0.02;
    g.scale.setScalar(pulse);
    g.rotation.z = Math.sin(t * 0.12) * 0.04;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * Multi-plane environmental depth:
 *   fog → back particles → tumbling bubbles → mid orbit → centered glass + shell
 * Background logo loop (P0) is the HTML plate with infinite-depth drift.
 */
function ExperienceScene({
  armed,
  brandMap,
  pointer,
  cycle,
  onSettled,
}: {
  armed: boolean;
  brandMap: THREE.Texture | null;
  pointer: React.MutableRefObject<PointerBus>;
  cycle: number;
  onSettled?: () => void;
}) {
  return (
    <>
      <ambientLight intensity={0.68} />
      <directionalLight position={[3.6, 4.6, 2.8]} intensity={2.15} color={CYAN} />
      <directionalLight position={[-3.2, -2.0, 1.4]} intensity={1.85} color={GREEN} />
      <directionalLight position={[0, 2.2, -3.2]} intensity={1.65} color={GREEN} />
      <directionalLight position={[2.4, 3.2, 4.0]} intensity={1.45} color="#ffffff" />
      <pointLight position={[0, 1.4, 2.4]} intensity={3.6} color={CRIMSON} distance={14} />
      <pointLight position={[-2.4, 0.6, -2.8]} intensity={4.0} color={CYAN} distance={12} />
      <pointLight position={[2.2, -0.4, -2.4]} intensity={3.6} color={GREEN} distance={11} />
      <pointLight position={[0, 0, 0]} intensity={2.4} color="#e0f2fe" distance={8} />

      {/* Plane 1 — atmospheric volumetric fog */}
      <ParallaxPlane
        pointer={pointer}
        amp={PLANE.fogAmp}
        follow={PLANE.fogFollow}
        z={PLANE.fogZ}
      >
        <VolumetricFog />
      </ParallaxPlane>

      <EndlessDepthPulse>
        {/* Plane 2 — particles floating behind the giant glass sphere */}
        <ParallaxPlane
          pointer={pointer}
          amp={PLANE.backAmp}
          follow={PLANE.backFollow}
          z={PLANE.backZ}
        >
          <BurstAndDebris
            armed={armed}
            band="back"
            count={BACK_N}
            debrisCount={10}
            cycle={cycle}
          />
        </ParallaxPlane>

        {/* Plane 2.5 — full-viewport tumbling bubbles (between video & glass) */}
        <group position={[0, 0, PLANE.tumbleZ]}>
          <TumblingBackgroundBubbles pointer={pointer} />
        </group>

        {/* Plane 3 — midground orbiting debris / ember trails */}
        <ParallaxPlane
          pointer={pointer}
          amp={PLANE.midAmp}
          follow={PLANE.midFollow}
          z={PLANE.midZ}
        >
          <BurstAndDebris
            armed={armed}
            band="mid"
            count={MID_N}
            debrisCount={12}
            cycle={cycle}
          />
        </ParallaxPlane>

        {/* Plane 4 — centered massive glass + dense spherical shell */}
        <ParallaxPlane pointer={pointer} amp={PLANE.fgAmp} follow={PLANE.fgFollow} z={PLANE.fgZ}>
          <OpticalGlassBubble map={brandMap} pointer={pointer} />
          <BurstAndDebris
            armed={armed}
            band="shell"
            count={SHELL_N}
            debrisCount={DEBRIS_N - 22}
            cycle={cycle}
            onSettled={onSettled}
          />
        </ParallaxPlane>
      </EndlessDepthPulse>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Endless infinite-loop central logo stage                           */
/* ------------------------------------------------------------------ */

/** Plane 0 — centered logo burst looping forever with infinite-depth drift. */
function InfiniteLogoStage({
  active,
  pointer,
  onLoopCycle,
}: {
  active: boolean;
  pointer: React.MutableRefObject<PointerBus>;
  onLoopCycle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const driftRef = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState<string | null>(PARTICLE_LOGO_FILM);
  const driftPos = useRef({ x: 0, y: 0, pulse: 1 });
  const lastT = useRef(0);
  const cycleGate = useRef(false);

  useEffect(() => {
    if (!active || !src) return;
    const v = videoRef.current;
    if (!v) return;
    v.loop = true;
    lastT.current = 0;
    cycleGate.current = false;
    const onTime = () => {
      const t = v.currentTime;
      const dur = v.duration;
      // Detect seamless loop wrap → re-trigger 3D particle burst cycle
      if (Number.isFinite(dur) && dur > 0.5) {
        if (lastT.current > dur * 0.72 && t < dur * 0.18) {
          if (!cycleGate.current) {
            cycleGate.current = true;
            onLoopCycle();
            window.setTimeout(() => {
              cycleGate.current = false;
            }, 400);
          }
        }
      }
      lastT.current = t;
    };
    v.addEventListener("timeupdate", onTime);
    void v.play().catch(() => undefined);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [active, src, onLoopCycle]);

  // Infinite-depth parallax + gentle breathing scale ("endless place")
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const el = driftRef.current;
      if (el) {
        const now = performance.now() - start;
        const breath = 1.06 + Math.sin(now * 0.00055) * 0.035;
        driftPos.current.x += (pointer.current.x * PLANE.bgAmp * 140 - driftPos.current.x) * PLANE.bgFollow;
        driftPos.current.y += (-pointer.current.y * PLANE.bgAmp * 110 - driftPos.current.y) * PLANE.bgFollow;
        driftPos.current.pulse = breath;
        el.style.transform = `translate3d(${driftPos.current.x}%, ${driftPos.current.y}%, 0) scale(${breath})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pointer]);

  const isLogoBurst = src === PARTICLE_LOGO_FILM || (src?.includes("particle-logo") ?? false);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-transparent">
      {/* Soft neon backlight only — fluid stage shows through */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 52% 46% at 50% 48%, rgba(255,255,255,0.18), rgba(186,230,253,0.1) 40%, transparent 72%)",
            "radial-gradient(ellipse 58% 52% at 50% 48%, rgba(52,211,153,0.16), transparent 70%)",
            "radial-gradient(ellipse 50% 44% at 52% 50%, rgba(6,182,212,0.14), transparent 68%)",
          ].join(","),
          mixBlendMode: "screen",
        }}
        aria-hidden
      />

      {/* Centered looping logo explosion */}
      <div
        ref={driftRef}
        className="absolute inset-[-3%] flex items-center justify-center will-change-transform"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 86% 80% at 50% 48%, #000 0%, #000 58%, rgba(0,0,0,0.75) 76%, transparent 96%)",
          maskImage:
            "radial-gradient(ellipse 86% 80% at 50% 48%, #000 0%, #000 58%, rgba(0,0,0,0.75) 76%, transparent 96%)",
        }}
      >
        {active && src ? (
          <video
            ref={videoRef}
            key={src}
            src={src}
            className="h-full w-full object-contain"
            style={{
              objectPosition: "center center",
              mixBlendMode: "normal",
              filter: isLogoBurst
                ? "brightness(1.75) contrast(1.4) saturate(1.25)"
                : "brightness(1.15)",
              transform: "scale(1.14)",
            }}
            autoPlay
            muted
            playsInline
            preload="auto"
            loop
            onError={() => {
              if (!src) return;
              const next = nextVideo(src);
              if (next) setSrc(next);
            }}
          />
        ) : null}
      </div>

      {/* Asymmetric side-fade — center stays vibrant, edges dissolve to obsidian */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(90deg, rgba(3,7,18,0.55) 0%, transparent 22%, transparent 58%, rgba(3,7,18,0.5) 78%, #030712 96%)",
            "linear-gradient(to top, #030712 0%, rgba(3,7,18,0.4) 16%, transparent 44%)",
            "radial-gradient(ellipse 78% 70% at 50% 48%, transparent 0%, transparent 52%, rgba(3,7,18,0.3) 78%, rgba(3,7,18,0.92) 100%)",
          ].join(","),
        }}
        aria-hidden
      />

      {/* Pulsing radiant backlight */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: [
            "radial-gradient(ellipse 46% 40% at 50% 48%, rgba(255,255,255,0.16), transparent 60%)",
            "radial-gradient(ellipse 54% 48% at 50% 48%, rgba(52,211,153,0.26), transparent 68%)",
            "radial-gradient(ellipse 48% 42% at 50% 50%, rgba(6,182,212,0.22), transparent 66%)",
          ].join(","),
          animationDuration: "4.5s",
        }}
        aria-hidden
      />
    </div>
  );
}

export type AxiomCinematicExperienceProps = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Multi-plane Axiom workspace depth:
 *   P0 endless centered logo loop → fog → tumble bubbles → glass + pulsing shell.
 * Canvas z-0 / pointer-events-none; UI at z-10.
 */
export function AxiomCinematicExperience({ className, style }: AxiomCinematicExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerBus>({ x: 0, y: 0 });
  const [inView, setInView] = useState(false);
  const [burstCycle, setBurstCycle] = useState(0);
  const [brandMap, setBrandMap] = useState<THREE.Texture | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const onLoopCycle = useCallback(() => {
    setBurstCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll into hero → start pipeline
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.28 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Deep-dark-red Axiom MP4 → VideoTexture inside the glass cavity (loops smoothly)
  useEffect(() => {
    if (!mounted) return;
    let disposed = false;
    let video: HTMLVideoElement | null = null;
    let tex: THREE.Texture | null = null;
    let candidate = 0;
    const chain = [INNER_CORE_VIDEO, ...INNER_CORE_FALLBACKS];

    const loadPoster = () => {
      new THREE.TextureLoader().load(
        CINEMATIC_HERO_POSTER,
        (t) => {
          if (disposed) {
            t.dispose();
            return;
          }
          t.colorSpace = THREE.SRGBColorSpace;
          tex = t;
          setBrandMap(t);
        },
        undefined,
        () => undefined,
      );
    };

    const trySrc = (src: string) => {
      video?.pause();
      video = document.createElement("video");
      video.src = src;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.setAttribute("playsinline", "true");

      const onReady = () => {
        if (disposed || !video) return;
        const vt = new THREE.VideoTexture(video);
        vt.colorSpace = THREE.SRGBColorSpace;
        vt.minFilter = THREE.LinearFilter;
        vt.magFilter = THREE.LinearFilter;
        vt.generateMipmaps = false;
        tex = vt;
        setBrandMap(vt);
        void video.play().catch(() => undefined);
      };

      const onError = () => {
        candidate += 1;
        if (candidate < chain.length) trySrc(chain[candidate]!);
        else loadPoster();
      };

      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });
    };

    trySrc(chain[0]!);
    return () => {
      disposed = true;
      video?.pause();
      tex?.dispose();
    };
  }, [mounted]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.current.x = THREE.MathUtils.clamp(nx, -1, 1);
      pointer.current.y = THREE.MathUtils.clamp(ny, -1, 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={rootRef}
      className={
        className ??
        "relative w-full overflow-hidden rounded-2xl border border-[#00f2fe]/25 bg-[#030712] shadow-[0_0_60px_rgba(0,242,254,0.12)]"
      }
      style={style ?? { minHeight: "min(78vh, 720px)", height: "680px" }}
      data-axiom-cinematic-experience=""
      data-in-view={inView ? "" : undefined}
      data-burst-cycle={burstCycle}
    >
      <InfiniteLogoStage active={inView} pointer={pointer} onLoopCycle={onLoopCycle} />

      {/* WebGL stage — z-0, no pointer capture except explicit bubble button */}
      {mounted ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Canvas
            className="h-full w-full"
            style={{ pointerEvents: "none", background: "transparent" }}
            camera={{ position: [0, 0, 5.15], fov: 38 }}
            dpr={[1, 2]}
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
          >
            <ExperienceScene
              armed={inView}
              brandMap={brandMap}
              pointer={pointer}
              cycle={burstCycle}
              onSettled={() => undefined}
            />
          </Canvas>
        </div>
      ) : null}

      {/* Invisible hit target — centered over the glass orb */}
      <button
        type="button"
        aria-label="Open Axiom AI chat"
        onClick={() => setChatOpen(true)}
        className="absolute left-1/2 top-1/2 z-[8] h-[min(68%,480px)] w-[min(58%,440px)] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-transparent bg-transparent focus-visible:border-[#00f2fe]/50 focus-visible:outline-none"
      />

      <AxiomChatDrawer open={chatOpen} onOpenChange={setChatOpen} hideTrigger deskLabel="Axiom desk" />
    </div>
  );
}

export default AxiomCinematicExperience;
