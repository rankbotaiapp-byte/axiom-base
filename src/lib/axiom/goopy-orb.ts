export type GoopNode = { x: number; y: number; vx: number; vy: number };

export type GoopCursor = { active: boolean; down: boolean; x: number; y: number };

export type GoopField = {
  cx: number;
  cy: number;
  radius: number;
  time: number;
  calm: boolean;
  cursor: GoopCursor;
};

const STICK_IDLE = 5;
const STICK_HOLD = 12;

export function restPoint(index: number, count: number, field: GoopField) {
  const turn = field.calm ? 0 : field.time * 0.18;
  const angle = (index / count) * Math.PI * 2 + turn;
  const lobe = field.calm
    ? 1
    : 1 + Math.sin(field.time * 0.72 + index * 0.62) * 0.075 + Math.sin(field.time * 0.31 - index * 0.95) * 0.045;
  return {
    x: field.cx + Math.cos(angle) * field.radius * lobe,
    y: field.cy + Math.sin(angle) * field.radius * lobe,
  };
}

export function createGoop(count: number, field: GoopField): GoopNode[] {
  return Array.from({ length: count }, (_, index) => {
    const rest = restPoint(index, count, field);
    return { x: rest.x, y: rest.y, vx: 0, vy: 0 };
  });
}

function grips(nodes: readonly GoopNode[], field: GoopField) {
  const weights = new Float32Array(nodes.length);
  if (!field.cursor.active) return weights;
  const reach = field.cursor.down ? field.radius * 2.15 : field.radius * 0.95;
  const ranked: { index: number; distance: number }[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node) continue;
    const distance = Math.hypot(node.x - field.cursor.x, node.y - field.cursor.y);
    if (distance <= reach) ranked.push({ index, distance });
  }
  ranked.sort((a, b) => a.distance - b.distance);
  const limit = field.cursor.down ? STICK_HOLD : STICK_IDLE;
  for (let rank = 0; rank < Math.min(limit, ranked.length); rank += 1) {
    const item = ranked[rank];
    if (!item) continue;
    const near = 1 - item.distance / reach;
    const band = 1 - rank / limit;
    weights[item.index] = Math.max(0, near * 0.55 + band * 0.45);
  }
  return weights;
}

/** One viscoelastic step. A local patch sticks to the pointer; the rest of the skin springs home. */
export function stepGoop(nodes: GoopNode[], field: GoopField, dt: number) {
  const count = nodes.length;
  if (count < 3) return;
  const step = Math.min(1.35, Math.max(0.4, dt * 60));
  const weights = grips(nodes, field);
  const restLength = (Math.PI * 2 * field.radius) / count;
  for (let index = 0; index < count; index += 1) {
    const node = nodes[index];
    if (!node) continue;
    const rest = restPoint(index, count, field);
    const grip = weights[index] ?? 0;
    const holding = field.cursor.down && grip > 0.12;
    const restK = holding ? 0.035 + (1 - grip) * 0.05 : field.calm ? 0.2 : 0.13;
    let ax = (rest.x - node.x) * restK;
    let ay = (rest.y - node.y) * restK;
    const prev = nodes[(index + count - 1) % count];
    const next = nodes[(index + 1) % count];
    for (const other of [prev, next]) {
      if (!other) continue;
      const dx = other.x - node.x;
      const dy = other.y - node.y;
      const dist = Math.hypot(dx, dy) || 1;
      const tension = ((dist - restLength) / dist) * (holding ? 0.045 : 0.1);
      ax += dx * tension;
      ay += dy * tension;
    }
    if (grip > 0 && !field.cursor.down) {
      ax += (field.cursor.x - node.x) * 0.12 * grip;
      ay += (field.cursor.y - node.y) * 0.12 * grip;
    }
    const damp = holding ? 0.58 : field.calm ? 0.76 : 0.8;
    node.vx = (node.vx + ax * step) * damp;
    node.vy = (node.vy + ay * step) * damp;
    node.x += node.vx * step;
    node.y += node.vy * step;
    if (holding) {
      const follow = 0.2 + grip * 0.8;
      const aimX = rest.x + (field.cursor.x - rest.x) * follow;
      const aimY = rest.y + (field.cursor.y - rest.y) * follow;
      const stick = 0.46 * step;
      node.x += (aimX - node.x) * stick;
      node.y += (aimY - node.y) * stick;
      node.vx *= 1 - grip * 0.75;
      node.vy *= 1 - grip * 0.75;
    }
  }
}
