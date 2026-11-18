/** Shared 4-stage glass-pod bubble trajectory. */

export type BubbleSide = -1 | 1;

export type PathSample = {
  x: number;
  y: number;
  opacity: number;
  thrusterGlow: number;
  stretchX: number;
  stretchY: number;
};

const DEG = Math.PI / 180;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / Math.max(1e-6, e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * Stages 1–3 (pathT 0→1 maps to overall journey 0→0.72).
 * Units are whatever cx/cy/R use (px or world).
 * `unit` is ~1px equivalent in those units (1 for screen px, ~R/220 for Three.js).
 */
export function sampleGlassJourney(
  pathT: number,
  cx: number,
  cy: number,
  R: number,
  side: BubbleSide,
  bubbleR: number,
  seed: number,
  time: number,
  unit: number,
): PathSample {
  const t = Math.max(0, Math.min(1, pathT));
  const u = t * 0.72;
  const j1 = Math.sin(time * 2.1 + seed) * unit;
  const j2 = Math.sin(time * 3.4 + seed * 1.7) * unit * 0.5;

  // Stage 1 — under glass into booster (0 → 0.15)
  if (u < 0.15) {
    const s = u / 0.15;
    const x0 = cx + side * 8 * unit;
    const yUnder = cy + R * 0.92;
    const yDip = cy + R * 1.06;
    const y = s < 0.5 ? lerp(yUnder, yDip, s / 0.5) : yDip;
    const x = lerp(x0, x0 + side * 6 * unit, s);
    return {
      x: x + j1 * 0.2,
      y,
      opacity: lerp(0.12, 0.88, smoothstep(0, 0.55, s)),
      thrusterGlow: lerp(0.95, 0.4, s),
      stretchX: 1 + Math.sin(time * 3 + seed) * 0.05,
      stretchY: 1 - Math.sin(time * 3 + seed) * 0.05,
    };
  }

  // Stage 2 — around bottom lip (0.15 → 0.32)
  if (u < 0.32) {
    const s = (u - 0.15) / 0.17;
    const phi = lerp(-95 * DEG, -75 * DEG, smoothstep(0, 1, s));
    const outR = lerp(R * 0.62, R + bubbleR * 0.5, smoothstep(0.15, 1, s));
    return {
      x: cx + side * Math.cos(phi) * outR + j1 * 0.35,
      y: cy - Math.sin(phi) * outR + Math.sin(time * 1.5 + seed) * unit * 0.7,
      opacity: 0.92,
      thrusterGlow: lerp(0.4, 0.06, s),
      stretchX: 1 + Math.sin(time * 2.6 + seed) * 0.06,
      stretchY: 1 - Math.sin(time * 2.6 + seed) * 0.06,
    };
  }

  // Stage 3 — trickle up outer glass -75° → +58° (0.32 → 0.72)
  const s = (u - 0.32) / 0.4;
  const phi = lerp(-75 * DEG, 58 * DEG, smoothstep(0, 1, s));
  const surfaceR = R + bubbleR * 0.5 + unit * 1.2;
  const slide = Math.sin(time * 2.8 + seed * 2) * unit * 1.5;
  return {
    x: cx + side * Math.cos(phi) * surfaceR + j1 * 0.25 + j2,
    y: cy - Math.sin(phi) * surfaceR + slide * 0.35,
    opacity: 0.96,
    thrusterGlow: 0,
    stretchX: 1 + Math.sin(time * 2.2 + seed) * 0.06,
    stretchY: 1 - Math.sin(time * 2.2 + seed) * 0.06,
  };
}

/** Stage 4 — peel off shoulder and flutter upward. */
export function sampleFlutter(
  originX: number,
  originY: number,
  flutterT: number,
  side: BubbleSide,
  seed: number,
  speed: number,
  swayAmp: number,
  unit: number,
): PathSample {
  const y = originY - speed * flutterT;
  const sway =
    Math.sin(flutterT * 1.15 + seed) * swayAmp +
    Math.sin(flutterT * 2.05 + seed * 1.3) * swayAmp * 0.45;
  return {
    x: originX + sway + side * 6 * unit * Math.min(1, flutterT * 0.22),
    y,
    opacity: flutterT < 0.3 ? lerp(0.75, 1, flutterT / 0.3) : 1,
    thrusterGlow: 0,
    stretchX: 1 + Math.sin(flutterT * 3.1 + seed) * 0.06,
    stretchY: 1 - Math.sin(flutterT * 3.1 + seed) * 0.06,
  };
}

/** Shoulder release angle in radians (+52° … +64°). */
export function releasePhi(seed: number) {
  return (52 + (Math.abs(seed) % 13)) * DEG;
}
