/** Camera path and the four physical states of the presence core. */

export const CORE_STATES = ["water", "goop", "metal", "fog"] as const;

export type CoreStateId = (typeof CORE_STATES)[number];

export type CoreSurface = {
  roughness: number;
  metal: number;
  warp: number;
  displace: number;
  fog: number;
  flow: number;
};

export const CORE_SURFACES: Record<CoreStateId, CoreSurface> = {
  water: { roughness: 0.04, metal: 0.04, warp: 0.04, displace: 0.035, fog: 0, flow: 0.55 },
  goop: { roughness: 0.48, metal: 0, warp: 0.09, displace: 0.16, fog: 0.04, flow: 0.16 },
  metal: { roughness: 0.16, metal: 0.94, warp: 0.02, displace: 0.012, fog: 0, flow: 0 },
  fog: { roughness: 0.86, metal: 0, warp: 0.05, displace: 0.2, fog: 0.84, flow: 0.12 },
};

export const ORBIT_RADIUS = 3.1;

/** Close inspection point, still outside the glass. */
export const INSIDE_CAMERA = { x: 0.4, y: 0.18, z: 1.9 };

/** Nearest the portal camera may sit. The glass radius is 1. */
export const GLASS_CLEARANCE = 1.55;

export function stateIndex(id: CoreStateId): number {
  const index = CORE_STATES.indexOf(id);
  return index < 0 ? 0 : index;
}

export function lerpSurface(a: CoreSurface, b: CoreSurface, t: number): CoreSurface {
  const mix = (left: number, right: number) => left + (right - left) * t;
  return {
    roughness: mix(a.roughness, b.roughness),
    metal: mix(a.metal, b.metal),
    warp: mix(a.warp, b.warp),
    displace: mix(a.displace, b.displace),
    fog: mix(a.fog, b.fog),
    flow: mix(a.flow, b.flow),
  };
}

/** Continuous blend. 0 is water, 3 is fog. */
export function surfaceAt(index: number): CoreSurface {
  const t = Math.max(0, Math.min(CORE_STATES.length - 1, index));
  const i0 = Math.floor(t);
  const i1 = Math.min(CORE_STATES.length - 1, i0 + 1);
  const from = CORE_SURFACES[CORE_STATES[i0] ?? "water"];
  const to = CORE_SURFACES[CORE_STATES[i1] ?? "fog"];
  return lerpSurface(from, to, t - i0);
}

/** One smooth turn. The point at 0 and at 1 is the same place. */
export function orbitCamera(turns: number): { x: number; y: number; z: number } {
  const angle = turns * Math.PI * 2;
  return {
    x: Math.sin(angle) * ORBIT_RADIUS,
    y: 0.16 + Math.sin(angle * 2) * 0.24,
    z: Math.cos(angle) * ORBIT_RADIUS,
  };
}

export function smoothStep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function mixCamera(
  orbit: { x: number; y: number; z: number },
  flight: number,
): { x: number; y: number; z: number } {
  const p = smoothStep(flight);
  return {
    x: orbit.x + (INSIDE_CAMERA.x - orbit.x) * p,
    y: orbit.y + (INSIDE_CAMERA.y - orbit.y) * p,
    z: orbit.z + (INSIDE_CAMERA.z - orbit.z) * p,
  };
}

export function cameraDistance(point: { x: number; y: number; z: number }): number {
  return Math.hypot(point.x, point.y, point.z);
}

/**
 * Fly forward through the current view, toward the orb, and stop outside the glass.
 * The direction matches the camera that is already on the orbit spline.
 */
export function approachCamera(
  from: { x: number; y: number; z: number },
  distance = cameraDistance(INSIDE_CAMERA),
): { x: number; y: number; z: number } {
  const len = Math.hypot(from.x, from.y, from.z);
  const stop = Math.max(GLASS_CLEARANCE, distance);
  if (len < 1e-4) return { x: 0, y: 0.18, z: stop };
  const scale = stop / len;
  return { x: from.x * scale, y: from.y * scale, z: from.z * scale };
}

/** Object-fit cover of the filmed frame across the whole core, top-left origin. */
export function frameCover(cardW: number, cardH: number, videoW: number, videoH: number) {
  const scale = Math.max(cardW / Math.max(videoW, 1), cardH / Math.max(videoH, 1));
  const offX = (videoW * scale - cardW) / 2;
  const offY = (videoH * scale - cardH) / 2;
  return {
    mulX: cardW / (scale * Math.max(videoW, 1)),
    mulY: cardH / (scale * Math.max(videoH, 1)),
    addX: offX / (scale * Math.max(videoW, 1)),
    addY: offY / (scale * Math.max(videoH, 1)),
  };
}
