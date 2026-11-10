"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* Rising embers + drifting smoke dust, rendered over the hero centerpiece. */

const FIELD = { x: 16, y: 10, z: 6 };

function makeSoftDot(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type LayerProps = { count: number; color: string; size: number; opacity: number; rise: number; sway: number };

function ParticleLayer({ count, color, size, opacity, rise, sway }: LayerProps) {
  const points = useRef<THREE.Points>(null);
  const texture = useMemo(() => makeSoftDot(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    return () => {
      const geom = points.current?.geometry;
      const mat = points.current?.material;
      geom?.dispose();
      if (mat && !Array.isArray(mat)) mat.dispose();
    };
  }, []);

  const { positions, seeds } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Bias embers toward the center column where the engine sits.
      const spread = Math.random() < 0.7 ? 0.45 : 1;
      p[i * 3] = (Math.random() - 0.5) * FIELD.x * spread;
      p[i * 3 + 1] = (Math.random() - 0.5) * FIELD.y;
      p[i * 3 + 2] = -Math.random() * FIELD.z;
      s[i] = Math.random();
    }
    return { positions: p, seeds: s };
  }, [count]);

  useFrame(({ clock }, delta) => {
    const geom = points.current?.geometry;
    if (!geom) return;
    const attr = geom.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const seed = seeds[i];
      arr[ix + 1] += rise * (0.4 + seed) * dt;
      arr[ix] += Math.sin(t * 0.6 + seed * 40) * sway * dt;
      if (arr[ix + 1] > FIELD.y / 2) {
        arr[ix + 1] = -FIELD.y / 2;
        arr[ix] = (Math.random() - 0.5) * FIELD.x * (Math.random() < 0.7 ? 0.45 : 1);
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export default function EmberField({ density = 1 }: { density?: number }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      className="!pointer-events-none !absolute inset-0"
      aria-hidden
    >
      <ParticleLayer count={Math.round(420 * density)} color="#fb7a3c" size={0.055} opacity={0.9} rise={0.5} sway={0.25} />
      <ParticleLayer count={Math.round(600 * density)} color="#94a3b8" size={0.04} opacity={0.18} rise={0.1} sway={0.35} />
    </Canvas>
  );
}
