"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { AxiomConfig, AxiomExpression } from "@/lib/axiom/landing/config";
import { axiomRuntime } from "@/lib/axiom/landing/runtime";
import { boosterFragment, boosterVertex, characterFragment, characterVertex } from "./shaders";
import { FACES, spring, springStep } from "./expressions";

// Face landmarks measured on the Axiom render (UV, origin bottom-left).
const VISOR_C: [number, number] = [0.512, 0.716];
const VISOR_R: [number, number] = [0.178, 0.098];
const EYE_L: [number, number] = [0.435, 0.704];
const EYE_R: [number, number] = [0.594, 0.704];
const EYE_RADIUS = 0.036;

const col = (hex: string) => new THREE.Color(hex);

export interface AxiomCharacterProps {
  config: AxiomConfig;
  /** Expression requested by the page (e.g. current CRO layer). Hover/click still win. */
  expression?: AxiomExpression;
  /** Fraction of viewport height Axiom may occupy. */
  fitHeight?: number;
  /** Offset in viewport fractions (-0.5..0.5). */
  offset?: [number, number];
}

export function AxiomCharacter({ config, expression, fitHeight = 0.8, offset = [0, 0] }: AxiomCharacterProps) {
  const c = config.companion;
  const b = config.boosters;
  const tex = useTexture(c.imageUrl);
  const { viewport, camera } = useThree();

  useEffect(() => {
    tex.colorSpace = THREE.NoColorSpace; // canvas runs `linear` — keep raw sRGB end to end
    tex.anisotropy = 8;
    tex.needsUpdate = true;
  }, [tex]);

  const img = tex.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 0.724;
  const w = Math.min(c.scale, viewport.height * fitHeight * aspect, viewport.width * 0.82);
  const h = w / aspect;

  const group = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);

  /* ---------- materials ---------- */
  const charMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: characterVertex,
        fragmentShader: characterFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: null },
          uTime: { value: 0 },
          uAspect: { value: 0.724 },
          uDepth: { value: 0 },
          uFeather: { value: 0.3 },
          uArmorShift: { value: 0.6 },
          uArmorSpeed: { value: 0.6 },
          uSheen: { value: new THREE.Color() },
          uVisorC: { value: new THREE.Vector2(...VISOR_C) },
          uVisorR: { value: new THREE.Vector2(...VISOR_R) },
          uEyeL: { value: new THREE.Vector2(...EYE_L) },
          uEyeR: { value: new THREE.Vector2(...EYE_R) },
          uEyeRadius: { value: EYE_RADIUS },
          uEyeColor: { value: new THREE.Color() },
          uLook: { value: new THREE.Vector2() },
          uBlink: { value: new THREE.Vector2() },
          uLidTop: { value: 0 },
          uLidBottom: { value: 0 },
          uLidAngle: { value: 0 },
          uEyeScale: { value: new THREE.Vector2(1, 1) },
          uBrowLift: { value: new THREE.Vector2() },
          uBrowTilt: { value: 0 },
          uPupil: { value: 1 },
          uHover: { value: 0 },
          uBoost: { value: 1 },
        },
      }),
    []
  );

  const makeBooster = (seed: number) =>
    new THREE.ShaderMaterial({
      vertexShader: boosterVertex,
      fragmentShader: boosterFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uPulse: { value: 1 },
        uSeed: { value: seed },
        uLength: { value: 1 },
        uCore: { value: new THREE.Color() },
        uGlow: { value: new THREE.Color() },
        uFlare: { value: new THREE.Color() },
      },
    });
  const boosterMats = useMemo(() => [makeBooster(0.3), makeBooster(1.7), makeBooster(3.1)], []);

  useEffect(() => () => [charMat, ...boosterMats].forEach((m) => m.dispose()), [charMat, boosterMats]);

  // push config into uniforms whenever it changes (live from /axiom-studio)
  useEffect(() => {
    const u = charMat.uniforms;
    u.uMap.value = tex;
    u.uAspect.value = aspect;
    u.uDepth.value = c.depth * w * 0.12;
    u.uFeather.value = c.edgeFeather;
    u.uArmorShift.value = c.armorShift;
    u.uArmorSpeed.value = c.armorShiftSpeed;
    u.uSheen.value.set(c.armorSheenColor);
    u.uEyeColor.value.set(c.eyeColor);
    boosterMats.forEach((m, i) => {
      m.uniforms.uIntensity.value = b.enabled ? b.intensity * (i === 2 ? 0.35 : 1) : 0;
      m.uniforms.uPulse.value = b.pulseSpeed;
      m.uniforms.uLength.value = i === 2 ? 0.25 : b.plumeLength;
      m.uniforms.uCore.value.set(b.coreColor);
      m.uniforms.uGlow.value.set(b.glowColor);
      m.uniforms.uFlare.value.set(b.flareColor);
    });
  }, [c, b, tex, aspect, w, charMat, boosterMats]);

  /* ---------- animation state ---------- */
  const s = useRef({
    rx: spring(), ry: spring(), rz: spring(), px: spring(), py: spring(),
    lookX: spring(), lookY: spring(),
    lidTop: spring(), lidBottom: spring(), lidAngle: spring(),
    scaleL: spring(1), scaleR: spring(1), browL: spring(), browR: spring(), browTilt: spring(), pupil: spring(1),
    hover: spring(),
    blinkStart: -1, blinkDur: 0.16, blinkEyes: [1, 1] as [number, number], nextBlink: 1.5,
    moodIdx: 0, nextMood: 0,
    boopUntil: 0, happyUntil: 0, lastBoops: 0, wasHover: false,
  });

  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

  const scheduleBlink = (t: number, wink = false, eye: 0 | 1 = 1) => {
    const st = s.current;
    st.blinkStart = t;
    st.blinkDur = wink ? 0.42 : 0.15;
    st.blinkEyes = wink ? (eye === 0 ? [1, 0] : [0, 1]) : [1, 1];
    const r = c.blinkMinMs + Math.random() * Math.max(0, c.blinkMaxMs - c.blinkMinMs);
    st.nextBlink = t + r / 1000 + (Math.random() < 0.15 ? -r / 1000 + 0.28 : 0); // occasional double-blink
  };

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const t = state.clock.elapsedTime;
    const rt = axiomRuntime;
    const st = s.current;
    const calm = rt.reducedMotion;

    /* hover test: pointer inside Axiom's projected ellipse */
    if (group.current) {
      group.current.getWorldPosition(tmp.a).project(camera);
      tmp.b.set(w * 0.34, h * 0.42, 0).add(group.current.position).project(camera);
      const rx = Math.abs(tmp.b.x - tmp.a.x) || 1, ry = Math.abs(tmp.b.y - tmp.a.y) || 1;
      const dx = (rt.pointer.x - tmp.a.x) / rx, dy = (rt.pointer.y - (tmp.a.y + ry * 0.15)) / ry;
      rt.hovering = rt.pointer.active && dx * dx + dy * dy < 1;
    }
    if (rt.hovering && !st.wasHover) scheduleBlink(t, Math.random() < 0.6, Math.random() < 0.5 ? 0 : 1); // cheeky wink on hover-in
    st.wasHover = rt.hovering;
    if (rt.boops !== st.lastBoops) {
      st.lastBoops = rt.boops;
      st.boopUntil = t + 0.9;
      st.happyUntil = t + 2.4;
    }

    /* pick expression: boop > hover > page override > mood cycle */
    if (c.moodCycle.length && t > st.nextMood) {
      st.moodIdx = (st.moodIdx + 1) % c.moodCycle.length;
      st.nextMood = t + c.moodCycleMs / 1000;
    }
    let expr: AxiomExpression = c.moodCycle.length ? c.moodCycle[st.moodIdx] : c.idleExpression;
    if (expression) expr = expression;
    if (rt.hovering) expr = c.hoverExpression;
    if (t < st.happyUntil) expr = "happy";
    if (t < st.boopUntil) expr = c.clickExpression;
    const face = FACES[expr] ?? FACES.neutral;

    /* blink */
    if (t > st.nextBlink && !calm) scheduleBlink(t, Math.random() < c.winkChance, Math.random() < 0.5 ? 0 : 1);
    let blink = 0;
    if (st.blinkStart >= 0) {
      const k = (t - st.blinkStart) / st.blinkDur;
      if (k >= 1) st.blinkStart = -1;
      else blink = st.blinkDur > 0.3 ? Math.min(1, Math.sin(Math.PI * k) * 1.6) : Math.sin(Math.PI * k);
    }

    /* body springs — cursor tilt with real depth */
    const px = rt.pointer.active ? rt.pointer.x : Math.sin(t * 0.3) * 0.25;
    const py = rt.pointer.active ? rt.pointer.y : Math.cos(t * 0.23) * 0.15;
    const K = c.springStiffness, C = c.springDamping, T = calm ? 0.25 : 1;
    const ry = springStep(st.ry, px * c.tiltStrength * T, K, C, dt);
    const rx = springStep(st.rx, -py * c.tiltStrength * 0.6 * T, K, C, dt);
    const rz = springStep(st.rz, -px * c.tiltStrength * 0.18 * T + st.ry.v * -0.02, K * 0.7, C, dt);
    const ox = springStep(st.px, px * 0.18 * T, K * 0.6, C, dt);
    const oy = springStep(st.py, py * 0.12 * T, K * 0.6, C, dt);

    if (group.current) {
      const bob = calm ? 0 : Math.sin(t * c.floatSpeed * 2) * c.floatAmplitude + Math.sin(t * c.floatSpeed * 3.7) * c.floatAmplitude * 0.25;
      group.current.position.set(offset[0] * viewport.width + ox, offset[1] * viewport.height + oy + bob, 0);
    }
    if (tiltRef.current) tiltRef.current.rotation.set(rx, ry, rz);

    /* face springs */
    const FK = 220, FC = 24;
    const u = charMat.uniforms;
    u.uTime.value = t;
    const lookOn = c.eyeTracking ? 1 : 0;
    u.uLook.value.set(springStep(st.lookX, px * lookOn, 160, 20, dt), springStep(st.lookY, py * lookOn, 160, 20, dt));
    u.uLidTop.value = springStep(st.lidTop, face.lidTop, FK, FC, dt);
    u.uLidBottom.value = springStep(st.lidBottom, face.lidBottom, FK, FC, dt);
    u.uLidAngle.value = springStep(st.lidAngle, face.lidAngle, FK, FC, dt);
    u.uEyeScale.value.set(springStep(st.scaleL, face.eyeScale[0], FK * 1.4, FC * 0.8, dt), springStep(st.scaleR, face.eyeScale[1], FK * 1.4, FC * 0.8, dt));
    u.uBrowLift.value.set(springStep(st.browL, face.browLift[0], FK, FC, dt), springStep(st.browR, face.browLift[1], FK, FC, dt));
    u.uBrowTilt.value = springStep(st.browTilt, face.browTilt, FK, FC, dt);
    u.uPupil.value = springStep(st.pupil, face.pupil, FK, FC, dt);
    u.uBlink.value.set(blink * st.blinkEyes[0], blink * st.blinkEyes[1]);
    u.uHover.value = springStep(st.hover, rt.hovering ? 1 : 0, 120, 18, dt);

    /* boosters: pulse harder with scroll velocity + hover */
    const surge = 1 + Math.min(rt.scrollVelocity, 1.5) * 0.6 + st.hover.x * 0.25;
    u.uBoost.value = (b.enabled ? b.intensity : 0) * surge;
    boosterMats.forEach((m, i) => {
      m.uniforms.uTime.value = t;
      m.uniforms.uIntensity.value = (b.enabled ? b.intensity : 0) * (i === 2 ? 0.35 : 1) * surge;
    });
  });

  /* ---------- geometry ---------- */
  const nozzle = (uv: [number, number]) => [(uv[0] - 0.5) * w, (uv[1] - 0.5) * h] as const;
  const bw = w * 0.62, bh = h * 0.62;
  const [lx, ly] = nozzle(b.leftNozzle);
  const [rx, ry] = nozzle(b.rightNozzle);
  const [cx, cy] = nozzle([0.512, 0.318]);
  const zFront = c.depth * w * 0.05 + 0.02;

  return (
    <group ref={group}>
      <group ref={tiltRef}>
        <mesh material={charMat} renderOrder={1}>
          <planeGeometry args={[w, h, 96, 96]} />
        </mesh>
        <mesh material={boosterMats[0]} position={[lx, ly - 0.28 * bh, zFront]} renderOrder={2}>
          <planeGeometry args={[bw, bh]} />
        </mesh>
        <mesh material={boosterMats[1]} position={[rx, ry - 0.28 * bh, zFront]} renderOrder={2}>
          <planeGeometry args={[bw, bh]} />
        </mesh>
        <mesh material={boosterMats[2]} position={[cx, cy - 0.28 * bh * 0.4, zFront * 1.5]} renderOrder={2}>
          <planeGeometry args={[bw * 0.4, bh * 0.4]} />
        </mesh>
      </group>
    </group>
  );
}
