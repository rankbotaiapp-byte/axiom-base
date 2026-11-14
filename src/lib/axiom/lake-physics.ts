export type LakeSim = {
  cols: number;
  rows: number;
  curr: Float32Array;
  prev: Float32Array;
  next: Float32Array;
};

export type StrokeMode = "droplet" | "swipe";

/** Shared with the lake shader so a tap lands on the water the camera sees. */
export const LAKE_CAMERA = {
  eyeY: 1.55,
  eyeZ: 3.1,
  focal: 1.55,
  scaleX: 0.22,
  scaleZ: 0.28,
  biasX: 0.5,
  biasZ: 0.55,
};

export function createLake(cols = 128, rows = 72): LakeSim {
  const count = cols * rows;
  return {
    cols,
    rows,
    curr: new Float32Array(count),
    prev: new Float32Array(count),
    next: new Float32Array(count),
  };
}

export function stillLake(sim: LakeSim): void {
  sim.curr.fill(0);
  sim.prev.fill(0);
  sim.next.fill(0);
}

/** Discrete wave step. Tension is the wave speed. Damping is the keep-per-frame. */
export function stepLake(sim: LakeSim, tension: number, damping: number): void {
  const { cols, rows, curr, prev, next } = sim;
  const speed = Math.min(1, Math.max(0.2, tension));
  const c2 = speed * speed * 0.18;
  const damp = Math.min(0.999, Math.max(0.9, damping));
  for (let y = 1; y < rows - 1; y += 1) {
    const row = y * cols;
    for (let x = 1; x < cols - 1; x += 1) {
      const i = row + x;
      const lap = curr[i - 1]! + curr[i + 1]! + curr[i - cols]! + curr[i + cols]! - 4 * curr[i]!;
      next[i] = damp * (2 * curr[i]! - prev[i]! + c2 * lap);
    }
  }
  prev.set(curr);
  curr.set(next);
}

/** Smooth gaussian. A small radius is a droplet. A wide radius is a swipe wake. */
export function stampLake(sim: LakeSim, x: number, y: number, radius: number, amp: number): void {
  const { cols, rows, curr } = sim;
  const r = Math.max(0.6, radius);
  const reach = r * 3;
  const x0 = Math.max(1, Math.floor(x - reach));
  const x1 = Math.min(cols - 2, Math.ceil(x + reach));
  const y0 = Math.max(1, Math.floor(y - reach));
  const y1 = Math.min(rows - 2, Math.ceil(y + reach));
  const inv = 1 / (2 * r * r);
  const reachSq = reach * reach;
  for (let yy = y0; yy <= y1; yy += 1) {
    for (let xx = x0; xx <= x1; xx += 1) {
      const dx = xx - x;
      const dy = yy - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > reachSq) continue;
      curr[yy * cols + xx]! += amp * Math.exp(-d2 * inv);
    }
  }
}

export function strokeMode(distancePx: number, threshold = 16): StrokeMode {
  return distancePx >= threshold ? "swipe" : "droplet";
}

/** Map a canvas pixel onto the lake grid. Sky taps return null. */
export function pointerToLake(
  px: number,
  py: number,
  width: number,
  height: number,
  cols: number,
  rows: number,
): { x: number; y: number } | null {
  if (width <= 0 || height <= 0) return null;
  const uvx = px / width;
  const uvy = 1 - py / height;
  const aspect = width / height;
  const rdx = (uvx * 2 - 1) * aspect;
  const rdy = uvy * 2 - 1;
  const rdz = -LAKE_CAMERA.focal;
  const len = Math.hypot(rdx, rdy, rdz) || 1;
  const dy = rdy / len;
  if (dy >= -0.02) return null;
  const t = -LAKE_CAMERA.eyeY / dy;
  const x = (rdx / len) * t;
  const z = LAKE_CAMERA.eyeZ + (rdz / len) * t;
  const u = x * LAKE_CAMERA.scaleX + LAKE_CAMERA.biasX;
  const v = z * LAKE_CAMERA.scaleZ + LAKE_CAMERA.biasZ;
  if (u < 0.02 || u > 0.98 || v < 0.02 || v > 0.98) return null;
  return { x: u * (cols - 1), y: v * (rows - 1) };
}

export function packHeights(curr: Float32Array, out: Uint8Array): void {
  for (let i = 0; i < curr.length; i += 1) {
    const packed = Math.max(0, Math.min(1, curr[i]! * 4 + 0.5));
    const byte = Math.round(packed * 255);
    const o = i * 4;
    out[o] = byte;
    out[o + 1] = byte;
    out[o + 2] = byte;
    out[o + 3] = 255;
  }
}
