"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { defaultNicheFilm } from "@/config/catalog";
import { blenderEffectForNiche, blenderEffectIndex, blenderEffectLabel, type BlenderEffect } from "@/lib/blender/effects";
import { HeroLoopVideo } from "@/components/loop-video";
import {
  FALLBACK_HERO_POSTER,
  resolvePublicMediaUrl,
  resolvePublicPosterUrl,
} from "@/lib/axiom/public-media";
import "./cinematic-hero-canvas.css";

const CinematicShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uEffectType: 0,
    uResolution: new THREE.Vector2(1, 1),
  },
  /* glsl */ `
    uniform float uTime;
    uniform float uEffectType;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vec3 p = position;
      float wave = sin(p.x * 2.8 + uTime * 1.35) * cos(p.y * 2.1 - uTime * 0.9);
      float frost = sin(p.x * 7.0 + p.y * 9.0 + uTime * 0.4) * 0.04;
      float ember = abs(sin(p.x * 5.0 - uTime * 2.2)) * 0.12;
      float lift = mix(wave * 0.12, frost, step(0.5, uEffectType));
      lift = mix(lift, ember, step(1.5, uEffectType));
      p.z += lift;
      vPosition = p;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uEffectType;
    uniform vec2 uResolution;
    varying vec2 vUv;
    varying vec3 vPosition;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    vec3 hydro(vec2 uv, float t) {
      vec2 p = uv * 4.0;
      float rings = sin(length(uv - 0.5) * 28.0 - t * 3.2);
      float caustic = noise(p + vec2(t * 0.4, -t * 0.25));
      float splash = smoothstep(0.15, 0.95, abs(rings) * caustic);
      vec3 obsidian = vec3(0.012, 0.02, 0.047);
      vec3 cyan = vec3(0.0, 0.949, 0.996);
      return mix(obsidian, cyan, splash * 0.55 + caustic * 0.18);
    }

    vec3 frost(vec2 uv, float t) {
      vec2 p = uv * 8.0;
      float n = noise(p + t * 0.12);
      float cell = abs(fract(n * 6.0) - 0.5);
      float crystal = smoothstep(0.42, 0.02, cell);
      vec3 obsidian = vec3(0.012, 0.02, 0.047);
      vec3 ice = vec3(0.72, 0.93, 1.0);
      vec3 cyan = vec3(0.0, 0.949, 0.996);
      return mix(obsidian, mix(ice, cyan, crystal), 0.22 + crystal * 0.55);
    }

    vec3 embers(vec2 uv, float t) {
      float sparks = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 q = uv * (3.0 + fi) + vec2(0.0, -t * (0.35 + fi * 0.12));
        sparks += step(0.92, hash(floor(q * 18.0) + fi));
      }
      float heat = noise(uv * 5.0 + vec2(t * 0.7, -t));
      vec3 obsidian = vec3(0.012, 0.02, 0.047);
      vec3 crimson = vec3(1.0, 0.165, 0.239);
      vec3 cyan = vec3(0.0, 0.949, 0.996);
      vec3 core = mix(obsidian, crimson, heat * 0.55 + sparks);
      return mix(core, cyan, sparks * 0.35);
    }

    void main() {
      vec3 col = hydro(vUv, uTime);
      col = mix(col, frost(vUv, uTime), smoothstep(0.35, 0.65, uEffectType));
      col = mix(col, embers(vUv, uTime), smoothstep(1.35, 1.65, uEffectType));
      float scan = 0.92 + 0.08 * sin(vUv.y * uResolution.y * 0.7 + uTime * 8.0);
      float vignette = smoothstep(0.95, 0.28, length(vUv - 0.5));
      gl_FragColor = vec4(col * scan * vignette, 0.96);
    }
  `,
);

extend({ CinematicShaderMaterial });

type CinematicShaderImpl = THREE.ShaderMaterial & {
  uTime: number;
  uEffectType: number;
  uResolution: THREE.Vector2;
};

function PhysicsPlate({ effectType }: { effectType: number }) {
  const mat = useRef<CinematicShaderImpl>(null);
  const { size } = useThree();

  useFrame((state) => {
    const material = mat.current;
    if (!material) return;
    material.uTime = state.clock.elapsedTime;
    material.uEffectType = effectType;
    material.uResolution.set(size.width, size.height);
  });

  return (
    <mesh>
      <planeGeometry args={[7, 4.5, 32, 32]} />
      {/* @ts-expect-error drei shaderMaterial registers this element via extend() */}
      <cinematicShaderMaterial ref={mat} uTime={0} uEffectType={effectType} transparent />
    </mesh>
  );
}

export type CinematicHeroCanvasProps = {
  effectType?: BlenderEffect | number;
  niche?: string | null;
  brandTitle?: string;
  loopSrc?: string | null;
  posterSrc?: string | null;
};

export function CinematicHeroCanvas({
  effectType = 0,
  niche,
  brandTitle = "AXIOM CORE",
  loopSrc,
  posterSrc,
}: CinematicHeroCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [motion, setMotion] = useState(true);
  const [filmFailed, setFilmFailed] = useState(false);
  const [origin, setOrigin] = useState("");
  const effect: BlenderEffect =
    effectType === "hydro-splash" || effectType === "frost-crystals" || effectType === "embers-sparks"
      ? effectType
      : typeof effectType === "number"
        ? ((["hydro-splash", "frost-crystals", "embers-sparks"][Math.max(0, Math.min(2, Math.round(effectType)))] as BlenderEffect) ?? "hydro-splash")
        : blenderEffectForNiche(niche);
  const index = blenderEffectIndex(effect);
  const rawFilm = (loopSrc && loopSrc.trim()) || (niche ? defaultNicheFilm(niche) : "");
  const film = resolvePublicMediaUrl(rawFilm, origin);
  const plate = resolvePublicPosterUrl(posterSrc || FALLBACK_HERO_POSTER, origin);

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setFilmFailed(false);
  }, [film]);

  return (
    <div
      className={`cinematic-hero-canvas${filmFailed || !film ? " is-fallback" : ""}`}
      data-tactile-film=""
      aria-label={`${blenderEffectLabel(effect)} hero engine`}
    >
      <span className="cinematic-hero-canvas__bracket cinematic-hero-canvas__bracket--tl" />
      <span className="cinematic-hero-canvas__bracket cinematic-hero-canvas__bracket--tr" />
      <span className="cinematic-hero-canvas__bracket cinematic-hero-canvas__bracket--bl" />
      <span className="cinematic-hero-canvas__bracket cinematic-hero-canvas__bracket--br" />
      <div className="cinematic-hero-canvas__hud">
        <div className="cinematic-hero-canvas__row cinematic-hero-canvas__row--head">
          <span>[System: active_render]</span>
          <span>Hud locked</span>
          <span>{blenderEffectLabel(effect)}</span>
        </div>
        <div className="cinematic-hero-canvas__row cinematic-hero-canvas__row--foot">
          <div className="cinematic-hero-canvas__brand">
            <p>{brandTitle}</p>
            <span>Precision 3D fluid & frost engine</span>
          </div>
          <div className="cinematic-hero-canvas__status">
            <strong>{motion ? "60 fps synced" : "Still frame"}</strong>
            Status · cyan #00f2fe
          </div>
        </div>
      </div>
      {film && !filmFailed ? (
        <HeroLoopVideo
          className="cinematic-hero-canvas__film"
          src={film}
          poster={plate}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setFilmFailed(true)}
        />
      ) : (
        <img className="cinematic-hero-canvas__film cinematic-hero-canvas__poster" src={plate} alt="" />
      )}
      <div className="cinematic-hero-canvas__stage">
        {mounted ? (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 60 }}
            dpr={[1, 1.5]}
            frameloop={motion ? "always" : "demand"}
            gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#030712"]} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} color="#00f2fe" />
            <pointLight position={[-3, -1, 3]} intensity={0.7} color="#ff2a3d" />
            <PhysicsPlate effectType={index} />
          </Canvas>
        ) : null}
      </div>
    </div>
  );
}
