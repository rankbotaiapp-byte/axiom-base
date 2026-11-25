import type { AxiomExpression } from "@/lib/axiom/landing/config";

export interface FaceTarget {
  lidTop: number;
  lidBottom: number;
  lidAngle: number;
  eyeScale: [number, number];
  browLift: [number, number];
  browTilt: number;
  pupil: number;
}

export const FACES: Record<AxiomExpression, FaceTarget> = {
  neutral:   { lidTop: 0,    lidBottom: 0,    lidAngle: 0,    eyeScale: [1, 1],       browLift: [0, 0],         browTilt: 0,     pupil: 1 },
  happy:     { lidTop: 0,    lidBottom: 0.56, lidAngle: 0,    eyeScale: [1.05, 1.05], browLift: [0.18, 0.18],   browTilt: -0.08, pupil: 1 },
  curious:   { lidTop: 0.05, lidBottom: 0,    lidAngle: 0,    eyeScale: [0.9, 1.22],  browLift: [-0.08, 0.4],   browTilt: 0.12,  pupil: 0.9 },
  sleepy:    { lidTop: 0.5,  lidBottom: 0.05, lidAngle: -0.1, eyeScale: [1, 1],       browLift: [-0.15, -0.15], browTilt: -0.18, pupil: 1.05 },
  focused:   { lidTop: 0.3,  lidBottom: 0.08, lidAngle: 0.5,  eyeScale: [0.95, 0.95], browLift: [-0.22, -0.22], browTilt: 0.38,  pupil: 0.85 },
  surprised: { lidTop: 0,    lidBottom: 0,    lidAngle: 0,    eyeScale: [1.25, 1.25], browLift: [0.45, 0.45],   browTilt: -0.05, pupil: 0.55 },
};

/** Damped spring step. Mutates and returns [x, v]. */
export function springStep(state: { x: number; v: number }, target: number, k: number, c: number, dt: number) {
  const a = k * (target - state.x) - c * state.v;
  state.v += a * dt;
  state.x += state.v * dt;
  return state.x;
}

export const spring = (x = 0) => ({ x, v: 0 });
