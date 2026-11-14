"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { Environment } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  Raycaster,
  Vector2,
  Vector3,
  type Group,
  type Mesh,
  type PointLight,
} from "three";
import { createLiquidMaterial, createLiquidUniforms, SPECTRUM } from "@/components/LiquidOrbShader";

export type OrbPointer = {
  x: number;
  y: number;
  over: boolean;
  down: boolean;
  pulse: number;
};

function StudioLights({ calm }: { calm: boolean }) {
  const cyan = useRef<PointLight>(null);
  const violet = useRef<PointLight>(null);
  const magenta = useRef<PointLight>(null);
  const gold = useRef<PointLight>(null);

  useFrame(({ clock }) => {
    const t = calm ? 0.6 : clock.elapsedTime;
    cyan.current?.position.set(-1.55 + Math.sin(t * 0.32) * 0.4, 0.85, 2.15);
    violet.current?.position.set(Math.sin(t * 0.2) * 1.1, 1.15, -2.45);
    magenta.current?.position.set(Math.cos(t * 0.72) * 2.35, Math.sin(t * 0.58) * 1.35, Math.sin(t * 0.72) * 1.15);
    gold.current?.position.set(Math.sin(t * 0.26) * 0.85, -1.85, 0.55);
  });

  return (
    <>
      <ambientLight intensity={0.16} />
      <pointLight ref={cyan} intensity={42} color={SPECTRUM.cyan} distance={9} />
      <pointLight ref={violet} intensity={30} color={SPECTRUM.violet} distance={9} />
      <pointLight ref={magenta} intensity={32} color={SPECTRUM.magenta} distance={8} />
      <pointLight ref={gold} intensity={24} color={SPECTRUM.gold} distance={7} />
    </>
  );
}

function LiquidSphere({
  pointer,
  calm,
  amplitudeRef,
  listening,
  dissolve,
}: {
  pointer: RefObject<OrbPointer>;
  calm: boolean;
  amplitudeRef: RefObject<number>;
  listening: boolean;
  dissolve: MotionValue<number>;
}) {
  const tilt = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const uniforms = useMemo(() => createLiquidUniforms(), []);
  const material = useMemo(() => createLiquidMaterial(uniforms), [uniforms]);
  useEffect(() => () => material.dispose(), [material]);
  const raycaster = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);
  const hitPoint = useMemo(() => new Vector3(), []);
  const sim = useRef({ pull: 0, vel: 0, lastPulse: 0, slot: 0, age: [-1, -1, -1] });

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.033);
    const group = tilt.current;
    const surface = mesh.current;
    if (!group || !surface) return;
    if (!calm) uniforms.uTime.value += step;
    uniforms.uVoice.value = Math.min(1, amplitudeRef.current ?? 0);
    uniforms.uListen.value = listening ? 1 : 0;
    uniforms.dissolveProgress.value = Math.min(0.3, Math.max(0, dissolve.get()));

    const aim = pointer.current;
    const ease = Math.min(1, step * 4);
    group.rotation.y += ((aim?.x ?? 0) * 0.28 - group.rotation.y) * ease;
    group.rotation.x += ((aim?.y ?? 0) * 0.18 - group.rotation.x) * ease;

    surface.updateMatrixWorld();
    let hovering = false;
    if (aim?.over) {
      ndc.set(aim.x, aim.y);
      raycaster.setFromCamera(ndc, state.camera);
      const hit = raycaster.intersectObject(surface, false)[0];
      if (hit) {
        hovering = true;
        hitPoint.copy(surface.worldToLocal(hit.point.clone())).normalize();
        uniforms.uHit.value.copy(hitPoint);
      }
    }

    const spring = sim.current;
    const target = calm ? 0 : hovering ? (aim?.down ? 1 : 0.62) : 0;
    spring.vel += ((target - spring.pull) * 34 - spring.vel * 8.5) * step;
    spring.pull = Math.max(0, Math.min(1.25, spring.pull + spring.vel * step));
    uniforms.uPull.value = spring.pull;

    if (aim && aim.pulse !== spring.lastPulse) {
      spring.lastPulse = aim.pulse;
      if (hovering) {
        const slot = spring.slot % 3;
        spring.slot += 1;
        const origin = slot === 0 ? uniforms.uWave0 : slot === 1 ? uniforms.uWave1 : uniforms.uWave2;
        origin.value.copy(uniforms.uHit.value);
        spring.age[slot] = 0;
      }
    }
    if (!calm) {
      for (let i = 0; i < 3; i += 1) {
        if (spring.age[i] >= 0) spring.age[i] += step;
        if (spring.age[i] > 1.3) spring.age[i] = -1;
      }
    }
    uniforms.uWaveAge.value.set(spring.age[0], spring.age[1], spring.age[2]);
  });

  return (
    <group ref={tilt}>
      <mesh ref={mesh} material={material}>
        <sphereGeometry args={[1, 80, 80]} />
      </mesh>
    </group>
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function CinematicOrb({
  pointer,
  calm,
  amplitudeRef,
  listening,
  dissolve,
}: {
  pointer: RefObject<OrbPointer>;
  calm: boolean;
  amplitudeRef: RefObject<number>;
  listening: boolean;
  dissolve: MotionValue<number>;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.4], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <StudioLights calm={calm} />
      <LiquidSphere pointer={pointer} calm={calm} amplitudeRef={amplitudeRef} listening={listening} dissolve={dissolve} />
      <SceneBoundary>
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.8} resolution={128} frames={1} />
        </Suspense>
      </SceneBoundary>
    </Canvas>
  );
}
