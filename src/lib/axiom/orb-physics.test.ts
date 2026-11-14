import assert from "node:assert/strict";
import test from "node:test";
import { kickOrbTouch, stepOrbTouch, type OrbTouch } from "./orb-physics.ts";

function fresh(): OrbTouch {
  return { whirl: 0, currentX: 0, currentY: 0, stretch: 0, stretchV: 0, held: false };
}

test("a swipe leaves a whirlpool that is still turning a second later", () => {
  const state = fresh();
  kickOrbTouch(state, 48, -12);
  const kicked = state.whirl;
  for (let i = 0; i < 60; i += 1) stepOrbTouch(state, 1 / 60);
  assert.equal(Math.abs(state.whirl) > Math.abs(kicked) * 0.45, true);
  assert.equal(Math.abs(state.currentX) + Math.abs(state.currentY) > 0.05, true);
});

test("letting go slings the stretch back through center", () => {
  const state = fresh();
  state.held = true;
  kickOrbTouch(state, 36, 0);
  for (let i = 0; i < 12; i += 1) stepOrbTouch(state, 1 / 60);
  const held = state.stretch;
  state.held = false;
  let crossed = false;
  for (let i = 0; i < 90; i += 1) {
    const before = state.stretch;
    stepOrbTouch(state, 1 / 60);
    if (before > 0 && state.stretch < 0) crossed = true;
  }
  assert.equal(held > 0, true);
  assert.equal(crossed, true);
});
