/** Pure camera path for the cinematic freeze-pan (unit-tested, no WebGL). */

export function easeInOutCubic(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export type FreezePanOrbit = {
  x: number;
  y: number;
  z: number;
  angle: number;
  ease: number;
  radius: number;
  /** 0 at start/end of the orbit, 1 at the far side — use for overlay fade. */
  depth: number;
};

/** Smooth 360° boom-orbit around the origin, looking at the frozen subject. */
export function freezePanOrbit(
  progress: number,
  opts?: { radius?: number; boom?: number },
): FreezePanOrbit {
  const ease = easeInOutCubic(progress);
  const angle = ease * Math.PI * 2;
  const base = opts?.radius ?? 5.55;
  const boom = opts?.boom ?? 0.42;
  const radius = base + Math.sin(ease * Math.PI) * 0.62;
  const depth = Math.sin(ease * Math.PI);
  return {
    x: Math.sin(angle) * radius,
    y: 0.18 + depth * boom,
    z: Math.cos(angle) * radius,
    angle,
    ease,
    radius,
    depth,
  };
}

export function freezeOverlayAmount(progress: number): number {
  const u = Math.min(1, Math.max(0, progress));
  const fadeIn = Math.min(1, u / 0.08);
  const fadeOut = u > 0.88 ? 1 - (u - 0.88) / 0.12 : 1;
  return Math.min(1, Math.max(0, fadeIn * fadeOut));
}
