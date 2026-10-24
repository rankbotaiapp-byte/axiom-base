/** Stable-fluids grid for the orb. Velocity is in cell-widths per second. */

export const FLUID_SIZE = 36;
export const FIELD_VELOCITY_SCALE = 20;

export type FluidField = {
  size: number;
  vx: Float32Array;
  vy: Float32Array;
  cyan: Float32Array;
  gold: Float32Array;
  /** Letter melt. Advects with the current and stays until the next inquiry. */
  heldCyan: Float32Array;
  heldGold: Float32Array;
  _vx: Float32Array;
  _vy: Float32Array;
  _cyan: Float32Array;
  _gold: Float32Array;
  _heldCyan: Float32Array;
  _heldGold: Float32Array;
  _p: Float32Array;
  _div: Float32Array;
};

export type CoverMap = { mulX: number; mulY: number; addX: number; addY: number };

export function createFluid(size = FLUID_SIZE): FluidField {
  const n = size * size;
  return {
    size,
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    cyan: new Float32Array(n),
    gold: new Float32Array(n),
    heldCyan: new Float32Array(n),
    heldGold: new Float32Array(n),
    _vx: new Float32Array(n),
    _vy: new Float32Array(n),
    _cyan: new Float32Array(n),
    _gold: new Float32Array(n),
    _heldCyan: new Float32Array(n),
    _heldGold: new Float32Array(n),
    _p: new Float32Array(n),
    _div: new Float32Array(n),
  };
}

export function gestureVelocity(dx: number, dy: number, dt: number) {
  const safe = Math.max(dt, 1 / 120);
  let vx = dx / safe;
  let vy = dy / safe;
  let speed = Math.hypot(vx, vy);
  const cap = 2400;
  if (speed > cap) {
    const scale = cap / speed;
    vx *= scale;
    vy *= scale;
    speed = cap;
  }
  return { vx, vy, speed };
}

/** z component of v0 × v1. A turn while the pointer is moving is a vortex. */
export function gestureCurl(vx0: number, vy0: number, vx1: number, vy1: number) {
  return vx0 * vy1 - vy0 * vx1;
}

function cell(size: number, x: number, y: number) {
  return x + y * size;
}

/** Splats drag velocity, a tangential vortex from the curl, and cyan/gold dye. */
export function injectGesture(
  field: FluidField,
  u: number,
  v: number,
  vx: number,
  vy: number,
  curl: number,
) {
  const { size } = field;
  const cx = Math.max(0, Math.min(1, u)) * (size - 1);
  const cy = Math.max(0, Math.min(1, v)) * (size - 1);
  const radius = 6.2;
  const speed = Math.hypot(vx, vy);
  const power = Math.min(1, speed / 900);
  const spin = Math.max(-1, Math.min(1, curl / 1_200_000));
  const dirX = speed > 1 ? vx / speed : 0;
  const dirY = speed > 1 ? vy / speed : 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;
      const weight = Math.exp(-(dist * dist) / (radius * 0.9));
      const i = cell(size, x, y);
      const inv = dist > 0.08 ? 1 / dist : 0;
      const tangentX = -dy * inv;
      const tangentY = dx * inv;
      const vortex = spin * power * 16;
      field.vx[i] += (vx / 700) * weight * 8 + tangentX * vortex * weight;
      field.vy[i] += (vy / 700) * weight * 8 + tangentY * vortex * weight;
      field.cyan[i] += weight * power * (0.55 + 0.45 * dirX);
      field.gold[i] += weight * power * (0.55 - 0.45 * dirY);
    }
  }
}

function sample(src: Float32Array, size: number, x: number, y: number) {
  const xc = Math.max(0, Math.min(size - 1.001, x));
  const yc = Math.max(0, Math.min(size - 1.001, y));
  const i0 = Math.floor(xc);
  const j0 = Math.floor(yc);
  const i1 = i0 + 1 < size ? i0 + 1 : i0;
  const j1 = j0 + 1 < size ? j0 + 1 : j0;
  const sx = xc - i0;
  const sy = yc - j0;
  const a00 = src[cell(size, i0, j0)] ?? 0;
  const a10 = src[cell(size, i1, j0)] ?? 0;
  const a01 = src[cell(size, i0, j1)] ?? 0;
  const a11 = src[cell(size, i1, j1)] ?? 0;
  return (a00 * (1 - sx) + a10 * sx) * (1 - sy) + (a01 * (1 - sx) + a11 * sx) * sy;
}

/** Diffuse, project, then advect. One fixed step of the stable-fluids loop. */
export function stepFluid(field: FluidField, dt: number) {
  const step = Math.max(0, Math.min(dt, 0.05));
  if (step === 0) return;
  const { size, vx, vy, cyan, gold } = field;
  const nvx = field._vx;
  const nvy = field._vy;
  const blend = Math.min(0.25, step * 6);
  const at = (x: number, y: number) => cell(size, x, y);

  for (let y = 0; y < size; y += 1) {
    const y0 = y > 0 ? y - 1 : 0;
    const y1 = y < size - 1 ? y + 1 : size - 1;
    for (let x = 0; x < size; x += 1) {
      const x0 = x > 0 ? x - 1 : 0;
      const x1 = x < size - 1 ? x + 1 : size - 1;
      const i = at(x, y);
      const neighborsX = vx[at(x0, y)]! + vx[at(x1, y)]! + vx[at(x, y0)]! + vx[at(x, y1)]!;
      const neighborsY = vy[at(x0, y)]! + vy[at(x1, y)]! + vy[at(x, y0)]! + vy[at(x, y1)]!;
      nvx[i] = (vx[i]! + blend * neighborsX) / (1 + 4 * blend);
      nvy[i] = (vy[i]! + blend * neighborsY) / (1 + 4 * blend);
    }
  }

  const div = field._div;
  const pressure = field._p;
  pressure.fill(0);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      div[at(x, y)] =
        -0.5 *
        (nvx[at(x + 1, y)]! - nvx[at(x - 1, y)]! + nvy[at(x, y + 1)]! - nvy[at(x, y - 1)]!) /
        size;
    }
  }
  for (let pass = 0; pass < 6; pass += 1) {
    for (let y = 1; y < size - 1; y += 1) {
      for (let x = 1; x < size - 1; x += 1) {
        const i = at(x, y);
        pressure[i] =
          (div[i]! + pressure[at(x - 1, y)]! + pressure[at(x + 1, y)]! + pressure[at(x, y - 1)]! + pressure[at(x, y + 1)]!) /
          4;
      }
    }
  }
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const i = at(x, y);
      nvx[i] = Math.max(-8, Math.min(8, nvx[i]! - 0.5 * size * (pressure[at(x + 1, y)]! - pressure[at(x - 1, y)]!)));
      nvy[i] = Math.max(-8, Math.min(8, nvy[i]! - 0.5 * size * (pressure[at(x, y + 1)]! - pressure[at(x, y - 1)]!)));
    }
  }

  field._cyan.set(cyan);
  field._gold.set(gold);
  field._heldCyan.set(field.heldCyan);
  field._heldGold.set(field.heldGold);
  const damp = Math.exp(-step * 1.35);
  const dyeDamp = Math.exp(-step * 0.42);
  const dt0 = step * size * 0.9;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = at(x, y);
      const px = x - dt0 * nvx[i]!;
      const py = y - dt0 * nvy[i]!;
      vx[i] = sample(nvx, size, px, py) * damp;
      vy[i] = sample(nvy, size, px, py) * damp;
      cyan[i] = sample(field._cyan, size, px, py) * dyeDamp;
      gold[i] = sample(field._gold, size, px, py) * dyeDamp;
      field.heldCyan[i] = sample(field._heldCyan, size, px, py);
      field.heldGold[i] = sample(field._heldGold, size, px, py);
    }
  }
}

/** The next inquiry drops melted type. Gesture dye fades on its own. */
export function clearInquiry(field: FluidField) {
  field.cyan.fill(0);
  field.gold.fill(0);
  field.heldCyan.fill(0);
  field.heldGold.fill(0);
}

export function textShear(field: FluidField, u: number, v: number) {
  const x = Math.max(0, Math.min(field.size - 1, Math.round(u * (field.size - 1))));
  const y = Math.max(0, Math.min(field.size - 1, Math.round(v * (field.size - 1))));
  const i = cell(field.size, x, y);
  const vx = field.vx[i] ?? 0;
  const vy = field.vy[i] ?? 0;
  const speed = Math.hypot(vx, vy);
  return {
    x: vx * 0.42,
    y: vy * 0.42,
    dissolve: Math.max(0, Math.min(1, (speed - 0.35) / 1.4)),
  };
}

/** True when a current crosses the band where the answer sits. */
export function swipeBreaksGlyphs(field: FluidField) {
  let hits = 0;
  for (const u of [0.44, 0.5, 0.56]) {
    for (const v of [0.46, 0.5, 0.54]) {
      if (textShear(field, u, v).dissolve > 0.42) hits += 1;
    }
  }
  return hits >= 2;
}

/** Leave the broken letters in the dye so they do not snap back into type. */
export function diffuseGlyphs(field: FluidField) {
  const { size } = field;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const dist = Math.hypot((u - 0.5) / 0.36, (v - 0.5) / 0.18);
      if (dist > 1) continue;
      const weight = 1 - dist;
      const i = cell(size, x, y);
      field.heldCyan[i] = Math.min(1, (field.heldCyan[i] ?? 0) + weight * 0.45);
      field.heldGold[i] = Math.min(1, (field.heldGold[i] ?? 0) + weight * 0.28);
    }
  }
}

export function packField(field: FluidField, out: Uint8Array) {
  const { size, vx, vy, cyan, gold } = field;
  for (let i = 0; i < size * size; i += 1) {
    const offset = i * 4;
    out[offset] = byte((vx[i] ?? 0) * FIELD_VELOCITY_SCALE + 128);
    out[offset + 1] = byte((vy[i] ?? 0) * FIELD_VELOCITY_SCALE + 128);
    out[offset + 2] = byte(Math.min(1, Math.max(0, (cyan[i] ?? 0) + (field.heldCyan[i] ?? 0))) * 255);
    out[offset + 3] = byte(Math.min(1, Math.max(0, (gold[i] ?? 0) + (field.heldGold[i] ?? 0))) * 255);
  }
}

export function unpackVelocity(red: number, green: number) {
  return {
    vx: (red - 128) / FIELD_VELOCITY_SCALE,
    vy: (green - 128) / FIELD_VELOCITY_SCALE,
  };
}

function byte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** Maps a square orb canvas onto the object-fit cover video. */
export function videoCoverMap(input: {
  cardW: number;
  cardH: number;
  videoW: number;
  videoH: number;
  orbX: number;
  orbY: number;
  orbSize: number;
}): CoverMap {
  const scale = Math.max(input.cardW / input.videoW, input.cardH / input.videoH);
  const offX = (input.videoW * scale - input.cardW) / 2;
  const offY = (input.videoH * scale - input.cardH) / 2;
  return {
    mulX: input.orbSize / (scale * input.videoW),
    mulY: input.orbSize / (scale * input.videoH),
    addX: (input.orbX + offX) / (scale * input.videoW),
    addY: (input.orbY + offY) / (scale * input.videoH),
  };
}
