"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import * as THREE from "three";
import {
  sampleFlutter,
  sampleGlassJourney,
  type BubbleSide,
} from "@/lib/axiom/bubble-path";
import { AxiomHeroBackground } from "@/components/AxiomHeroBackground";

const PARALLAX_SPRING = { stiffness: 150, damping: 20, mass: 0.8 };
/** Max orb tilt — keep subtle so the copy column stays readable. */
const TILT_MAX_DEG = 10;
/** Opposite-direction depth shift for bg layers (px). */
const BG_SHIFT_PX = 18;
const GLOW_SHIFT_PX = 12;

const OBSIDIAN = "#030712";
const SOLAR = "#FFE500";
const GOLD = "#FFD700";
/** Bright orange still — the only orb on the hero. */
const ORB_HERO = "/media/axiom-orb-hero.jpg";
const ORB_FALLBACK = "/media/image_f9d4e5.jpg";
/** Edge atmosphere only (no robot / orb footage). */
const LOGO_VIDEO = "/media/particle-logo-axiom.mp4";

const PARTICLE_N = 100;
/** Sparse hero bubbles — 6–8 slots, only 1–2 journeying at a time. */
const ORB_BUBBLE_N = 7;
const GLASS_R = 1.78;
const ORB_CX = 0;
const ORB_CY = -0.06;
const WORLD_UNIT = GLASS_R / 220;
const MAX_VISIBLE_ORB_BUBBLES = 2;

/** Optical glass cut — tight core, short falloff for sharp rim vs soft mud. */
const ORB_MASK =
  "radial-gradient(ellipse 66% 72% at 50% 44%, #000 0%, #000 42%, rgba(0,0,0,0.88) 52%, rgba(0,0,0,0.35) 60%, transparent 68%)";

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
  vec3 col = vec3(0.82, 0.88, 0.95);
  if (vKind > 0.5 && vKind < 1.5) col = vec3(0.58, 0.66, 0.76);
  else if (vKind > 1.5 && vKind < 2.5) col = vec3(0.1, 0.12, 0.16);
  // Solar gold — bloom-ready emissive cores (#FFE500)
  else if (vKind > 2.5) col = vec3(1.0, 0.898, 0.0);
  float a = core * vAlpha * rim;
  float punch = vKind > 2.5 ? 1.55 : 0.65;
  // Cursor proximity: +40% emission + faster flicker for embers
  float flicker = 1.0;
  if (vKind > 2.5) {
    float freq = 9.0 + vProx * 14.0;
    flicker = 0.82 + 0.18 * sin(uTime * freq + gl_FragCoord.x * 0.08);
    punch *= mix(1.0, 1.4, vProx) * flicker;
  }
  gl_FragColor = vec4(col * (punch + rim * 0.5), a * mix(1.0, 1.25, step(2.5, vKind) * vProx));
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

function spawnFg(): FgParticle {
  const sideBias = Math.random() < 0.7 ? (Math.random() < 0.5 ? -1 : 1) : 0;
  const angle = Math.random() * Math.PI * 2;
  const r = 0.2 + Math.random() * 1.1;
  return {
    x: Math.cos(angle) * r * 0.7 + sideBias * (0.9 + Math.random() * 1.6),
    y: -0.8 + (Math.random() - 0.3) * 1.4,
    z: -4.0 - Math.random() * 0.9,
    vx: sideBias * (0.08 + Math.random() * 0.22) + (Math.random() - 0.5) * 0.12,
    vy: 0.18 + Math.random() * 0.55,
    vz: 0.7 + Math.random() * 1.1,
    size: 0.25 + Math.random() * 1.15,
    kind:
      Math.random() < 0.22 ? 3 : Math.random() < 0.4 ? 2 : Math.random() < 0.65 ? 1 : 0,
    life: 0,
    maxLife: 3.2 + Math.random() * 4.2,
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
      const p = spawnFg();
      p.life = Math.random() * p.maxLife;
      p.x += p.vx * p.life * 0.35;
      p.y += p.vy * p.life * 0.35;
      p.z += p.vz * p.life * 0.35;
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
    const px = pointer.current.x * 0.22;
    const py = pointer.current.y * 0.14;

    // Proximity via shared hero pointer bus (−1…1) toward orb / eye focus
    const dist = Math.hypot(pointer.current.x - -0.2, pointer.current.y - 0.25);
    const targetProx = THREE.MathUtils.clamp(1 - dist / 0.95, 0, 1);
    proxRef.current = THREE.MathUtils.lerp(proxRef.current, targetProx, 1 - Math.exp(-dt * 6));
    const prox = proxRef.current;

    mat.uniforms.uProximity.value = prox;
    mat.uniforms.uTime.value = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_N; i++) {
      const p = slots.current[i]!;
      // Faster life/flicker cadence near cursor for embers
      const lifeRate = p.kind === 3 ? 1 + prox * 0.4 : 1;
      p.life += dt * lifeRate;
      const wobble = 0.008 * (1 + prox * 0.5);
      p.x += p.vx * dt + Math.sin(p.life * (1.1 + prox * 2.2) + p.phase) * wobble;
      p.y += p.vy * dt + Math.cos(p.life * (0.9 + prox * 1.8) + p.phase) * wobble * 0.75;
      p.z += p.vz * dt;
      const depthT = THREE.MathUtils.clamp((p.z + 4.2) / 8.4, 0, 1);
      if (p.life > p.maxLife || p.z > 4.0 || p.y > 3.4) {
        Object.assign(p, spawnFg());
      }
      const fade =
        Math.min(1, p.life * 1.8) * (1 - Math.max(0, (p.life - p.maxLife + 0.9) / 0.9));
      const ix = i * 3;
      posA[ix] = p.x + px * (1 - depthT);
      posA[ix + 1] = p.y + py * (1 - depthT);
      posA[ix + 2] = p.z;
      const sizeBoost = p.kind === 3 ? 1 + prox * 0.4 : 1;
      sizeA[i] = p.size * (0.35 + depthT * 0.95) * sizeBoost;
      const emberBoost = p.kind === 3 ? 0.85 * (1 + prox * 0.4) : p.kind === 2 ? 0.18 : 0.36;
      alphaA[i] = fade * emberBoost * (0.4 + depthT * 0.5);
      kindA[i] = p.kind;
    }
    pos.needsUpdate = true;
    size.needsUpdate = true;
    alpha.needsUpdate = true;
    kind.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={20} />;
}

/** Bloom-fed solar eye sparks — react to cursor proximity */
function SolarEyeSparks({ pointer }: { pointer: React.MutableRefObject<PointerBus> }) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const lightL = useRef<THREE.PointLight>(null);
  const lightR = useRef<THREE.PointLight>(null);
  const prox = useRef(0);

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(SOLAR),
        transparent: true,
        opacity: 0.95,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    const dist = Math.hypot(pointer.current.x - -0.2, pointer.current.y - 0.25);
    const target = THREE.MathUtils.clamp(1 - dist / 0.95, 0, 1);
    prox.current = THREE.MathUtils.lerp(prox.current, target, 1 - Math.exp(-dt * 7));
    const p = prox.current;
    const t = state.clock.elapsedTime;
    const flicker = 0.85 + 0.15 * Math.sin(t * (10 + p * 16));
    const intensity = (1.15 + p * 0.4) * flicker;
    const s = 0.048 * intensity;
    const ox = pointer.current.x * 0.06;
    const oy = pointer.current.y * 0.04;
    if (left.current) {
      left.current.position.set(-0.28 + ox, 0.42 + oy, 0.35);
      left.current.scale.setScalar(s);
      (left.current.material as THREE.MeshBasicMaterial).opacity = 0.75 + p * 0.25;
    }
    if (right.current) {
      right.current.position.set(0.22 + ox, 0.42 + oy, 0.35);
      right.current.scale.setScalar(s);
      (right.current.material as THREE.MeshBasicMaterial).opacity = 0.75 + p * 0.25;
    }
    if (lightL.current) lightL.current.intensity = 1.0 + p * 0.55;
    if (lightR.current) lightR.current.intensity = 0.85 + p * 0.5;
  });

  useEffect(() => () => mat.dispose(), [mat]);

  return (
    <group>
      <mesh ref={left} material={mat} renderOrder={30}>
        <sphereGeometry args={[1, 16, 16]} />
      </mesh>
      <mesh ref={right} material={mat} renderOrder={30}>
        <sphereGeometry args={[1, 16, 16]} />
      </mesh>
      <pointLight ref={lightL} position={[-0.28, 0.42, 0.5]} color={SOLAR} intensity={1.2} distance={2.4} decay={2} />
      <pointLight ref={lightR} position={[0.22, 0.42, 0.5]} color={GOLD} intensity={1.0} distance={2.4} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sparse photoreal glass bubbles — cling to orb, then peel upward   */
/* ------------------------------------------------------------------ */

type OrbBubble = {
  side: -1 | 1;
  progress: number;
  speed: number;
  radius: number;
  seed: number;
  phaseA: number;
  phaseB: number;
  freeX: number;
  freeY: number;
  freeZ: number;
  vy: number;
  cling: boolean;
  active: boolean;
  wait: number;
  life: number;
  maxLife: number;
};

/** 0.015–0.038 world units — mostly tiny, occasional larger. */
function microRadius() {
  return Math.random() < 0.8 ? 0.015 + Math.random() * 0.01 : 0.032 + Math.random() * 0.006;
}

function respawnWait() {
  return 4 + Math.random() * 10;
}

function makeOrbSlot(side: -1 | 1): OrbBubble {
  return {
    side,
    progress: 0,
    speed: 0.05 + Math.random() * 0.08,
    radius: microRadius(),
    seed: Math.random() * 1000,
    phaseA: Math.random() * Math.PI * 2,
    phaseB: Math.random() * Math.PI * 2,
    freeX: 0,
    freeY: 0,
    freeZ: 0.5,
    vy: 0,
    cling: true,
    active: false,
    wait: Math.random() * 10,
    life: 0,
    maxLife: 6,
  };
}

function activateOrbBubble(b: OrbBubble) {
  b.active = true;
  b.cling = true;
  b.progress = Math.random() * 0.08;
  b.speed = 0.045 + Math.random() * 0.07;
  b.radius = microRadius();
  b.vy = 0;
  b.life = 0;
  b.maxLife = 5 + Math.random() * 4;
  b.wait = 0;
  b.phaseA = Math.random() * Math.PI * 2;
  b.phaseB = Math.random() * Math.PI * 2;
}

function glassPolar(progress: number, side: number, seed: number) {
  const phi = THREE.MathUtils.lerp(-1.32, 0.62, Math.min(1, progress / 0.62));
  const theta = side * (Math.PI * 0.5 + Math.sin(seed) * 0.2);
  const wobble = Math.sin(progress * 12 + seed) * 0.045;
  const r = GLASS_R + 0.06 + wobble * 0.55;
  return {
    x: Math.cos(phi) * Math.sin(theta) * r + side * 0.04,
    y: Math.sin(phi) * r - 0.05,
    z: Math.cos(phi) * Math.cos(theta) * r * 0.3 + 0.7,
  };
}

/** One-time canvas texture: hollow glass + fresnel rim + amber bounce + glint. */
function makeGlassBubbleTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const mid = size / 2;
  const r = size * 0.46;

  const body = ctx.createRadialGradient(mid, mid, r * 0.1, mid, mid, r);
  body.addColorStop(0, "rgba(255,255,255,0.03)");
  body.addColorStop(0.6, "rgba(255,255,255,0.02)");
  body.addColorStop(0.85, "rgba(255,255,255,0.05)");
  body.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(mid, mid, r, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(mid, mid, r * 0.92, 0.2, 1.5);
  ctx.strokeStyle = "rgba(251,191,36,0.28)";
  ctx.lineWidth = size * 0.035;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(mid, mid, r * 0.96, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(mid, mid, r * 0.88, Math.PI * 0.95, Math.PI * 1.55);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = size * 0.02;
  ctx.stroke();

  // Pinpoint glint ~22% top / 26% left
  ctx.beginPath();
  ctx.arc(mid - r * 0.48, mid - r * 0.56, size * 0.035, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function AxiomOrbBubbles({
  pointer,
  viewportTop,
}: {
  pointer: React.MutableRefObject<PointerBus>;
  viewportTop: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const slots = useRef<OrbBubble[]>([]);

  const { geo, mat, tex } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const texture = makeGlassBubbleTexture();
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    return { geo: geometry, mat: material, tex: texture };
  }, []);

  useEffect(() => {
    slots.current = Array.from({ length: ORB_BUBBLE_N }, (_, i) =>
      makeOrbSlot(i % 2 === 0 ? -1 : 1),
    );
    return () => {
      geo.dispose();
      mat.dispose();
      tex.dispose();
    };
  }, [geo, mat, tex]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.033);
    const t = state.clock.elapsedTime;
    const cam = state.camera;

    let visible = 0;
    for (const s of slots.current) if (s.active) visible++;

    for (let i = 0; i < ORB_BUBBLE_N; i++) {
      const b = slots.current[i]!;

      if (!b.active) {
        b.wait -= dt;
        if (b.wait <= 0 && visible < MAX_VISIBLE_ORB_BUBBLES) {
          activateOrbBubble(b);
          visible++;
        } else {
          dummy.position.set(0, -99, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }

      b.life += dt;
      b.progress += b.speed * dt;
      b.phaseA += dt * 1.1;
      b.phaseB += dt * 0.7;

      let x: number;
      let y: number;
      let z: number;
      let sx = b.radius;
      let sy = b.radius;

      if (b.cling && b.progress < 0.62) {
        const g = glassPolar(b.progress, b.side, b.seed);
        x = g.x + Math.sin(t * 2.2 + b.phaseA) * 0.008;
        y = g.y + Math.cos(t * 1.8 + b.phaseB) * 0.006;
        z = g.z;
        // gentle surface tension squash ±6%
        sx = b.radius * (1 + Math.sin(b.phaseA) * 0.06);
        sy = b.radius * (1 - Math.sin(b.phaseA) * 0.06);
      } else {
        if (b.vy === 0) {
          const g = glassPolar(Math.min(0.62, b.progress), b.side, b.seed);
          b.freeX = g.x + (Math.random() - 0.5) * 0.08;
          b.freeY = g.y;
          b.freeZ = g.z + 0.12;
          b.vy = 0.18 + Math.random() * 0.28;
          b.cling = false;
        }
        b.vy += 0.22 * dt;
        b.freeY += b.vy * dt;
        // Dual-frequency lazy flutter
        b.freeX +=
          (Math.sin(b.phaseA) * 0.22 + Math.sin(b.phaseB * 1.65) * 0.12) * dt;
        b.freeZ += Math.sin(b.phaseB) * 0.01 * dt;
        x = b.freeX + pointer.current.x * 0.03;
        y = b.freeY;
        z = b.freeZ;
        sx = b.radius * (1 + Math.sin(b.phaseA * 1.2) * 0.06);
        sy = b.radius * (1 - Math.sin(b.phaseA * 1.2) * 0.06);

        if (y > viewportTop + 0.9 || b.life > b.maxLife) {
          b.active = false;
          b.wait = respawnWait();
          dummy.position.set(0, -99, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }

      dummy.position.set(x, y, z);
      dummy.scale.set(sx * 2.2, sy * 2.2, 1);
      dummy.quaternion.copy(cam.quaternion);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, ORB_BUBBLE_N]}
      frustumCulled={false}
      renderOrder={28}
    />
  );
}

/** Crystal-clear optical glass bubble — water/borosilicate refraction, no tint */
function CrystalGlassBubble() {
  return (
    <mesh position={[0, 0.06, 0.15]} renderOrder={24}>
      <sphereGeometry args={[GLASS_R, 96, 96]} />
      <MeshTransmissionMaterial
        transmission={1}
        roughness={0}
        thickness={1.2}
        ior={1.5}
        chromaticAberration={0.03}
        anisotropicBlur={0.08}
        distortion={0.14}
        distortionScale={0.22}
        temporalDistortion={0.06}
        samples={8}
        resolution={384}
        backside
        backsideThickness={0.6}
        color="#ffffff"
        attenuationColor="#ffffff"
        attenuationDistance={4}
        toneMapped={false}
      />
    </mesh>
  );
}

function OverlayScene({ pointer }: { pointer: React.MutableRefObject<PointerBus> }) {
  const chromaOffset = useMemo(() => new THREE.Vector2(0.03, 0.03), []);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[2.0, 1.5, 3.0]} intensity={1.35} color={SOLAR} distance={11} decay={2} />
      <pointLight position={[-2.0, 0.8, 2.6]} intensity={0.55} color="#e8f7ff" distance={11} decay={2} />
      <pointLight position={[0.2, -0.4, 2.2]} intensity={0.95} color={GOLD} distance={8} decay={2} />
      <pointLight position={[-0.35, 0.55, 2.8]} intensity={0.7} color={SOLAR} distance={6} decay={2} />
      <ForegroundParticles pointer={pointer} />
      <SolarEyeSparks pointer={pointer} />
      <CrystalGlassBubble />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.65}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration offset={chromaOffset} radialModulation={false} modulationOffset={0} />
      </EffectComposer>
    </>
  );
}

export type AxiomEliteOrbPortalProps = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Hero: logo MP4 → hi-def orange orb with cursor parallax tilt → ad copy.
 * Copy column stays static; only orb + background layers track the pointer.
 */
export function AxiomEliteOrbPortal({ className, children }: AxiomEliteOrbPortalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerBus>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState(ORB_HERO);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Normalized cursor offset (−1…1) across the hero section
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, PARALLAX_SPRING);
  const springY = useSpring(rawY, PARALLAX_SPRING);

  // Orb: subtle 3D tilt toward cursor (max ±10°)
  const rotateY = useTransform(springX, [-1, 1], [-TILT_MAX_DEG, TILT_MAX_DEG]);
  const rotateX = useTransform(springY, [-1, 1], [TILT_MAX_DEG, -TILT_MAX_DEG]);
  const orbX = useTransform(springX, [-1, 1], [-8, 8]);
  const orbY = useTransform(springY, [-1, 1], [8, -8]);

  // Background / glow: opposite-direction depth shift
  const bgX = useTransform(springX, [-1, 1], [BG_SHIFT_PX, -BG_SHIFT_PX]);
  const bgY = useTransform(springY, [-1, 1], [-BG_SHIFT_PX, BG_SHIFT_PX]);
  const glowX = useTransform(springX, [-1, 1], [GLOW_SHIFT_PX, -GLOW_SHIFT_PX]);
  const glowY = useTransform(springY, [-1, 1], [-GLOW_SHIFT_PX, GLOW_SHIFT_PX]);

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
        "relative w-full overflow-hidden bg-[#030712]"
      }
      style={{ perspective: 1200 }}
      aria-label="Axiom 24/7 booking engine hero"
      data-axiom-elite-orb-portal=""
      onPointerMove={(e) => updatePointer(e.clientX, e.clientY)}
    >
      {/* Full-bleed atmosphere — opposite parallax for depth */}
      <motion.div
        className="pointer-events-none absolute inset-[-24px] z-0 overflow-hidden will-change-transform"
        style={{ x: bgX, y: bgY }}
        aria-hidden
      >
        <AxiomHeroBackground videoSrc={LOGO_VIDEO} />
        {/* Neutral obsidian vignette only — no burgundy / red wash */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              `radial-gradient(ellipse 92% 78% at 50% 40%, transparent 0%, transparent 52%, rgba(3,7,18,0.35) 78%, ${OBSIDIAN} 100%)`,
              "linear-gradient(to bottom, rgba(3,7,18,0.22) 0%, transparent 14%, transparent 80%, rgba(3,7,18,0.5) 100%)",
            ].join(","),
          }}
        />
      </motion.div>

      {/* Dust stays under typography so it never blocks copy */}
      {mounted ? (
        <Canvas
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ pointerEvents: "none", background: "transparent" }}
          camera={{ position: [0, 0.08, 5.6], fov: 40 }}
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
        >
          <OverlayScene pointer={pointer} />
        </Canvas>
      ) : null}

      {/* Clean two-column hero — orb | copy (stack on mobile) */}
      <div className="relative z-10 mx-auto grid min-h-[min(88vh,900px)] w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 py-12 sm:gap-12 sm:px-8 sm:py-14 lg:grid-cols-2 lg:gap-10 lg:px-12 lg:py-16">
        {/* Column 1 — optically sharp orb + glass rim */}
        <div
          className="relative order-1 flex min-h-[300px] items-center justify-center sm:min-h-[360px] lg:min-h-[540px]"
          style={{ perspective: 900, transformStyle: "preserve-3d" }}
        >
          {/* Neutral depth ring — no colored wash */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
            style={{
              x: glowX,
              y: glowY,
              background:
                "radial-gradient(circle at 50% 48%, transparent 0%, transparent 45%, rgba(3,7,18,0.2) 70%, rgba(3,7,18,0.5) 100%)",
            }}
            aria-hidden
          />
          <motion.div
            className="relative aspect-square w-[min(72vw,420px)] will-change-transform sm:w-[min(58vw,480px)] lg:w-[min(42vw,560px)]"
            style={{
              rotateX,
              rotateY,
              x: orbX,
              y: orbY,
              transformStyle: "preserve-3d",
              transformPerspective: 900,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt="Axiom robot in glass orb — 24/7 automated booking engine"
              className="relative z-[1] h-full w-full select-none object-contain"
              style={{
                WebkitMaskImage: ORB_MASK,
                maskImage: ORB_MASK,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                mixBlendMode: "normal",
                // Neutral grade — no burgundy / red hue shifts
                filter: "contrast(1.12) saturate(1.02) brightness(1.06)",
                imageRendering: "auto",
              }}
              draggable={false}
              decoding="async"
              fetchPriority="high"
              onError={() => {
                if (imgSrc !== ORB_FALLBACK) setImgSrc(ORB_FALLBACK);
              }}
            />
            {/* Eye-lens solar micro-sparks (neutral glass sits above via R3F) */}
            <div
              className="pointer-events-none absolute z-[3]"
              style={{
                left: "38%",
                top: "36%",
                width: "7%",
                height: "7%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${SOLAR} 0%, ${GOLD} 35%, transparent 70%)`,
                boxShadow: `0 0 14px ${SOLAR}, 0 0 28px rgba(255,215,0,0.55)`,
                mixBlendMode: "screen",
                opacity: 0.85,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute z-[3]"
              style={{
                left: "54%",
                top: "36%",
                width: "7%",
                height: "7%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${SOLAR} 0%, ${GOLD} 35%, transparent 70%)`,
                boxShadow: `0 0 14px ${SOLAR}, 0 0 28px rgba(255,215,0,0.55)`,
                mixBlendMode: "screen",
                opacity: 0.85,
              }}
              aria-hidden
            />
            {/* Crystal liquid-glass rim — clear specular only, zero tint */}
            <div
              className="pointer-events-none absolute inset-[1.5%] z-[2] rounded-full"
              style={{
                background: [
                  "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 14%, transparent 34%)",
                  "radial-gradient(circle at 72% 28%, rgba(255,255,255,0.12) 0%, transparent 20%)",
                  "radial-gradient(circle at 50% 50%, transparent 58%, rgba(255,255,255,0.08) 78%, rgba(255,255,255,0.28) 92%, transparent 100%)",
                ].join(","),
                boxShadow: [
                  "inset 0 0 0 1.5px rgba(255,255,255,0.28)",
                  "inset 0 -20px 36px rgba(255,255,255,0.05)",
                  "inset 0 16px 28px rgba(255,255,255,0.07)",
                  "0 0 0 1px rgba(255,255,255,0.1)",
                ].join(","),
                mixBlendMode: "screen",
              }}
              aria-hidden
            />
          </motion.div>
        </div>

        {/* Column 2 — typography + CTAs stay locked (no tilt) */}
        <div className="relative order-2 flex items-center justify-center lg:justify-start lg:pl-6 xl:pl-10">
          {children}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[8%] bg-gradient-to-t from-[#030712] via-[#030712]/30 to-transparent"
        aria-hidden
      />
    </section>
  );
}

export default AxiomEliteOrbPortal;
