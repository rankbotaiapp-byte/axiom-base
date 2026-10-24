export type Speck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
};

const DRAG = 0.985;

/** A teal mote thrown off the swipe. Life is seconds. */
export function spawnSpeck(x: number, y: number, dx: number, dy: number, rand: () => number): Speck {
  const mag = Math.hypot(dx, dy) || 1;
  const nx = dx / mag;
  const ny = dy / mag;
  const along = (rand() - 0.2) * 160;
  const side = (rand() - 0.5) * 200;
  return {
    x,
    y,
    vx: nx * along - ny * side,
    vy: ny * along + nx * side,
    life: 0.35 + rand() * 0.45,
    size: 6 + rand() * 14,
  };
}

/** Move one mote. Returns null when it has faded. */
export function advanceSpeck(speck: Speck, dt: number): Speck | null {
  const life = speck.life - dt;
  if (life <= 0) return null;
  return {
    x: speck.x + speck.vx * dt,
    y: speck.y + speck.vy * dt,
    vx: speck.vx * DRAG,
    vy: speck.vy * DRAG + 36 * dt,
    life,
    size: speck.size,
  };
}

/** Share of sampled pixels that have been erased. Alpha bytes only. */
export function clearedShare(alphas: Uint8ClampedArray): number {
  if (alphas.length === 0) return 0;
  let clear = 0;
  for (let i = 0; i < alphas.length; i += 1) {
    if ((alphas[i] ?? 255) < 24) clear += 1;
  }
  return clear / alphas.length;
}
