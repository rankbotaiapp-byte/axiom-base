export type OrbTouch = {
  whirl: number;
  currentX: number;
  currentY: number;
  stretch: number;
  stretchV: number;
  held: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function kickOrbTouch(state: OrbTouch, dx: number, dy: number) {
  state.whirl = clamp(state.whirl + dx * 0.012, -2.2, 2.2);
  state.currentX = clamp(state.currentX + dx * 0.008, -1.4, 1.4);
  state.currentY = clamp(state.currentY - dy * 0.008, -1.4, 1.4);
  const kick = Math.hypot(dx, dy) * 0.035;
  state.stretchV += dx === 0 ? kick : Math.sign(dx) * kick;
}

export function stepOrbTouch(state: OrbTouch, dt: number) {
  const step = Math.min(Math.max(dt, 0), 0.05);
  const spring = state.held ? 6.5 : 28;
  const damp = state.held ? 7.5 : 3.2;
  state.stretchV += (-spring * state.stretch - damp * state.stretchV) * step;
  state.stretch = clamp(state.stretch + state.stretchV * step, -0.85, 0.85);
  const flowDrag = state.held ? 0.15 : 0.42;
  state.whirl *= Math.exp(-step * (state.held ? 0.12 : 0.38));
  const flow = Math.exp(-step * flowDrag);
  state.currentX *= flow;
  state.currentY *= flow;
}
