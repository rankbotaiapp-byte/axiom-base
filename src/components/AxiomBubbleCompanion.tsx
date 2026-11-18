"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { AxiomChatDrawer } from "@/components/AxiomChatDrawer";

const LENS_R = 0.42;
const FOLLOW = 0.14;

function LoupeMesh({ open }: { open: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const target = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      target.current.set(nx * 0.35, ny * 0.28);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    const m = meshRef.current;
    if (!g || !m) return;
    const dt = Math.min(delta, 0.033);
    const k = 1 - Math.exp(-FOLLOW * 60 * dt);
    g.position.x = THREE.MathUtils.lerp(g.position.x, target.current.x, k);
    g.position.y = THREE.MathUtils.lerp(g.position.y, target.current.y, k);
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, -target.current.y * 0.45, 0.08);
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, target.current.x * 0.45, 0.08);
    const breath = open ? 1.08 : 1 + Math.sin(performance.now() * 0.002) * 0.02;
    m.scale.setScalar(breath);
  });

  return (
    <group ref={groupRef}>
      <Sphere ref={meshRef} args={[LENS_R, 48, 48]} castShadow={false} receiveShadow={false}>
        <MeshTransmissionMaterial
          backside
          samples={8}
          resolution={256}
          transmission={0.98}
          roughness={0.02}
          thickness={1.2}
          ior={1.5}
          chromaticAberration={0.08}
          anisotropy={0.15}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.06}
          color="#ffffff"
          attenuationColor="#06b6d4"
          attenuationDistance={0.5}
        />
      </Sphere>
      <pointLight position={[0.4, 0.35, 0.6]} intensity={2.4} color="#06b6d4" distance={2.5} />
      <pointLight position={[-0.35, -0.2, 0.5]} intensity={1.8} color="#ef4444" distance={2.2} />
      <mesh position={[0, 0, 0.02]} scale={0.22}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

export type AxiomBubbleCompanionProps = {
  className?: string;
  /** Prefer bottom-right corner of the hero (default) or center. */
  placement?: "corner" | "center";
};

/**
 * Collapsed refractive glass bubble — gentle mouse track.
 * Click expands into the Axiom chat drawer (xAI / Grok via `/api/chat`).
 */
export function AxiomBubbleCompanion({
  className,
  placement = "corner",
}: AxiomBubbleCompanionProps) {
  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shell =
    placement === "center"
      ? "absolute left-1/2 top-1/2 z-[8] h-[140px] w-[140px] -translate-x-1/2 -translate-y-1/2"
      : "absolute bottom-6 right-6 z-[8] h-[120px] w-[120px] sm:bottom-8 sm:right-8 sm:h-[140px] sm:w-[140px]";

  return (
    <>
      <div className={className ?? shell} data-axiom-bubble-companion="">
        <button
          type="button"
          aria-label="Open Axiom AI chat"
          aria-expanded={chatOpen}
          onClick={() => setChatOpen(true)}
          className="group relative h-full w-full cursor-pointer rounded-full border border-[#00f2fe]/35 bg-[#030712]/20 shadow-[0_0_32px_rgba(6,182,212,0.35)] outline-none transition hover:border-[#00f2fe]/70 hover:shadow-[0_0_48px_rgba(6,182,212,0.55)] focus-visible:ring-2 focus-visible:ring-[#00f2fe]/70"
        >
          {mounted ? (
            <Canvas
              className="pointer-events-none h-full w-full"
              camera={{ position: [0, 0, 2.1], fov: 40 }}
              dpr={[1, 1.5]}
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
              <ambientLight intensity={0.4} />
              <LoupeMesh open={chatOpen} />
            </Canvas>
          ) : null}
          <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[#00f2fe]/80 opacity-80 transition group-hover:opacity-100">
            Talk
          </span>
        </button>
      </div>

      <AxiomChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        hideTrigger
        deskLabel="Axiom desk"
      />
    </>
  );
}

export default AxiomBubbleCompanion;
