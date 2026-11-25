"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { AxiomConfig } from "@/lib/axiom/landing/config";
import { axiomRuntime } from "@/lib/axiom/landing/runtime";
import { particleFragment, particleVertex } from "./shaders";

const BOX: [number, number, number] = [26, 18, 12];

/** GPU particle stream: all motion lives in the vertex shader — zero per-frame CPU work per particle. */
export function ParticleField({ config, mode = "page" }: { config: AxiomConfig; mode?: "page" | "hero" }) {
  const p = config.particles;
  const { size, gl } = useThree();

  // fewer particles on small / low-power screens
  const count = useMemo(() => {
    if (typeof window === "undefined") return p.count;
    const small = window.innerWidth < 768;
    const weak = (navigator.hardwareConcurrency || 8) <= 4;
    return Math.round(p.count * (small ? 0.45 : 1) * (weak ? 0.6 : 1));
  }, [p.count]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOX[0];
      pos[i * 3 + 1] = (Math.random() - 0.5) * BOX[1];
      pos[i * 3 + 2] = -Math.random() * BOX[2] + 2;
      seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.5 },
          uTurb: { value: 0.6 },
          uSize: { value: 1 },
          uBoost: { value: 0 },
          uOpacity: { value: 0.9 },
          uPixelRatio: { value: 1 },
          uMouse: { value: new THREE.Vector2(9, 9) },
          uMouseActive: { value: 0 },
          uMouseR: { value: 0.2 },
          uMouseF: { value: 1 },
          uAspect: { value: 1 },
          uBox: { value: new THREE.Vector3(...BOX) },
          uC0: { value: new THREE.Color() },
          uC1: { value: new THREE.Color() },
          uC2: { value: new THREE.Color() },
          uC3: { value: new THREE.Color() },
        },
      }),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const u = material.uniforms;
    u.uSpeed.value = p.speed;
    u.uTurb.value = p.turbulence;
    u.uSize.value = p.size;
    u.uOpacity.value = p.opacity;
    u.uMouseR.value = p.mouseRadius;
    u.uMouseF.value = p.mouseForce;
    const cs = p.colors.length ? p.colors : ["#06b6d4"];
    [u.uC0, u.uC1, u.uC2, u.uC3].forEach((un, i) => un.value.set(cs[i % cs.length]));
  }, [p, material]);

  useFrame((state) => {
    const u = material.uniforms;
    const rt = axiomRuntime;
    u.uTime.value = rt.reducedMotion ? 0 : state.clock.elapsedTime;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uAspect.value = size.width / size.height;
    u.uMouse.value.set(rt.pointer.x, rt.pointer.y);
    u.uMouseActive.value += ((rt.pointer.active ? 1 : 0) - u.uMouseActive.value) * 0.08;
    // intensity rises with how far down the page you are AND how fast you're scrolling
    const progress = mode === "hero" ? Math.min(rt.scroll * 3, 1) : rt.scroll;
    const target = (progress * 0.6 + Math.min(rt.scrollVelocity, 1.5)) * p.scrollBoost;
    u.uBoost.value += (target - u.uBoost.value) * 0.06;
  });

  if (!p.enabled) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
