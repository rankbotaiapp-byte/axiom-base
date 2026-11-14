import type { Speck } from "./swipe-reveal.ts";

/** Share of the frame above this line is bank and trees. Ripples start on the river. */
export const WATER_LINE = 0.46;

const SPLASH_DRAG = 0.99;
const SPLASH_GRAVITY = 920;

export function inWater(y: number, height: number, line = WATER_LINE): boolean {
  if (height <= 0) return false;
  return y / height >= line;
}

/** One step of the 2D wave equation. `out` becomes the next height. */
export function stepHeight(
  curr: Float32Array,
  prev: Float32Array,
  out: Float32Array,
  cols: number,
  rows: number,
  damp = 0.985,
) {
  out.fill(0);
  for (let y = 1; y < rows - 1; y += 1) {
    const row = y * cols;
    for (let x = 1; x < cols - 1; x += 1) {
      const i = row + x;
      const neighbors = (curr[i - 1] ?? 0) + (curr[i + 1] ?? 0) + (curr[i - cols] ?? 0) + (curr[i + cols] ?? 0);
      const next = (neighbors * 0.5 - (prev[i] ?? 0)) * damp;
      out[i] = Math.max(-2, Math.min(2, next));
    }
  }
}

/** A smooth drop. Coordinates are in simulation cells. */
export function disturb(
  field: Float32Array,
  cols: number,
  rows: number,
  x: number,
  y: number,
  radius: number,
  amount: number,
) {
  const r2 = radius * radius;
  const x0 = Math.max(1, Math.floor(x - radius));
  const x1 = Math.min(cols - 2, Math.ceil(x + radius));
  const y0 = Math.max(1, Math.floor(y - radius));
  const y1 = Math.min(rows - 2, Math.ceil(y + radius));
  for (let yy = y0; yy <= y1; yy += 1) {
    for (let xx = x0; xx <= x1; xx += 1) {
      const dx = xx - x;
      const dy = yy - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const fall = 1 - d2 / r2;
      const i = yy * cols + xx;
      field[i] = Math.max(-2, Math.min(2, (field[i] ?? 0) + amount * fall * fall));
    }
  }
}

/** Open the cover where the wave is moving. Values climb toward 1 and stay there. */
export function washCover(height: Float32Array, mask: Float32Array, gain = 0.5) {
  const n = Math.min(height.length, mask.length);
  for (let i = 0; i < n; i += 1) {
    const amp = Math.abs(height[i] ?? 0);
    if (amp < 0.08) continue;
    mask[i] = Math.min(1, (mask[i] ?? 0) + amp * gain);
  }
}

/** A direct bite out of the cover under the pointer, before the wave arrives. */
export function erodeCover(
  mask: Float32Array,
  cols: number,
  rows: number,
  x: number,
  y: number,
  radius: number,
  amount: number,
) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(x - radius));
  const x1 = Math.min(cols - 1, Math.ceil(x + radius));
  const y0 = Math.max(0, Math.floor(y - radius));
  const y1 = Math.min(rows - 1, Math.ceil(y + radius));
  for (let yy = y0; yy <= y1; yy += 1) {
    for (let xx = x0; xx <= x1; xx += 1) {
      const dx = xx - x;
      const dy = yy - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const fall = 1 - d2 / r2;
      const i = yy * cols + xx;
      mask[i] = Math.min(1, (mask[i] ?? 0) + amount * fall * fall);
    }
  }
}

/** A drop plus a counter-rotating wake, so a drag pulls a swirl instead of a single dent. */
export function wake(
  field: Float32Array,
  cols: number,
  rows: number,
  x: number,
  y: number,
  dx: number,
  dy: number,
  amount: number,
) {
  const mag = Math.hypot(dx, dy) || 1;
  const nx = dx / mag;
  const ny = dy / mag;
  disturb(field, cols, rows, x, y, 3.2, amount);
  disturb(field, cols, rows, x - nx * 4.2 - ny * 2.4, y - ny * 4.2 + nx * 2.4, 2.3, -amount * 0.62);
}

/** Map a 0..1 mask to bytes. */
export function encodeMask(field: Float32Array, bytes: Uint8Array) {
  const n = Math.min(field.length, bytes.length);
  for (let i = 0; i < n; i += 1) {
    bytes[i] = Math.max(0, Math.min(255, Math.round((field[i] ?? 0) * 255)));
  }
}

/** Map a resting field to bytes. 128 is flat water. */
export function encodeHeight(field: Float32Array, bytes: Uint8Array) {
  const n = Math.min(field.length, bytes.length);
  for (let i = 0; i < n; i += 1) {
    const v = field[i] ?? 0;
    bytes[i] = Math.max(0, Math.min(255, Math.round((v * 0.5 + 0.5) * 255)));
  }
}

/** A droplet thrown upward from the contact point. */
export function spawnSplash(x: number, y: number, dx: number, dy: number, rand: () => number): Speck {
  const mag = Math.hypot(dx, dy) || 1;
  return {
    x,
    y,
    vx: (dx / mag) * (40 + rand() * 90) + (rand() - 0.5) * 140,
    vy: -160 - rand() * 260 + (dy / mag) * 30,
    life: 0.4 + rand() * 0.45,
    size: 3 + rand() * 8,
  };
}

export function advanceSplash(speck: Speck, dt: number): Speck | null {
  const life = speck.life - dt;
  if (life <= 0) return null;
  return {
    x: speck.x + speck.vx * dt,
    y: speck.y + speck.vy * dt,
    vx: speck.vx * SPLASH_DRAG,
    vy: speck.vy * SPLASH_DRAG + SPLASH_GRAVITY * dt,
    life,
    size: speck.size,
  };
}
