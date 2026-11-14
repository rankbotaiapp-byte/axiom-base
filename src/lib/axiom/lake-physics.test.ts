import assert from "node:assert/strict";
import test from "node:test";
import { createLake, packHeights, pointerToLake, stampLake, stepLake, stillLake, strokeMode } from "./lake-physics.ts";

test("a short press is a droplet and a drag is a wide swipe", () => {
  assert.equal(strokeMode(3), "droplet");
  assert.equal(strokeMode(15.9), "droplet");
  assert.equal(strokeMode(16), "swipe");
  assert.equal(strokeMode(80), "swipe");
});

test("a droplet raises one neighborhood and the wave then leaves it", () => {
  const sim = createLake(32, 32);
  stampLake(sim, 16, 16, 1.4, 0.2);
  const peak = sim.curr[16 * 32 + 16] ?? 0;
  assert.ok(peak > 0.1);
  assert.ok((sim.curr[16 * 32 + 14] ?? 0) < peak);
  for (let i = 0; i < 12; i += 1) stepLake(sim, 0.8, 0.992);
  assert.ok(Math.abs(sim.curr[16 * 32 + 16] ?? 0) < peak);
});

test("a wide stamp covers more cells than a droplet", () => {
  const droplet = createLake(48, 48);
  const swipe = createLake(48, 48);
  stampLake(droplet, 24, 24, 1.5, 0.2);
  stampLake(swipe, 24, 24, 7, 0.08);
  const raised = (sim: ReturnType<typeof createLake>) => sim.curr.reduce((count, value) => count + (value > 0.002 ? 1 : 0), 0);
  assert.ok(raised(swipe) > raised(droplet) * 3);
});

test("sky taps miss the lake and a low tap hits it", () => {
  assert.equal(pointerToLake(100, 8, 400, 240, 128, 72), null);
  const hit = pointerToLake(200, 190, 400, 240, 128, 72);
  assert.ok(hit);
  assert.ok(hit.x > 1 && hit.x < 127);
  assert.ok(hit.y > 1 && hit.y < 71);
});

test("stilling the lake clears a stamp and packing stays in range", () => {
  const sim = createLake(8, 8);
  stampLake(sim, 4, 4, 1.2, 0.4);
  stillLake(sim);
  assert.equal(sim.curr[4 * 8 + 4], 0);
  sim.curr[0] = 2;
  const out = new Uint8Array(8 * 8 * 4);
  packHeights(sim.curr, out);
  assert.equal(out[0], 255);
  assert.ok(out[4] <= 255);
});
