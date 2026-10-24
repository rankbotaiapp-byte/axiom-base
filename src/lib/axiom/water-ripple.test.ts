import assert from "node:assert/strict";
import test from "node:test";
import { advanceSplash, disturb, encodeHeight, inWater, spawnSplash, stepHeight, wake, washCover } from "./water-ripple.ts";

test("a drop spreads outward and stays bounded", () => {
  const cols = 48;
  const rows = 32;
  const curr = new Float32Array(cols * rows);
  const prev = new Float32Array(cols * rows);
  const out = new Float32Array(cols * rows);
  disturb(curr, cols, rows, 24, 16, 2.5, 1);
  assert.ok((curr[16 * cols + 24] ?? 0) > 0.5);
  const center = 16 * cols + 24;
  const far = 16 * cols + 32;
  for (let i = 0; i < 2; i += 1) {
    stepHeight(curr, prev, out, cols, rows);
    prev.set(curr);
    curr.set(out);
  }
  assert.ok(Math.abs(curr[far] ?? 0) < 0.05);
  for (let i = 0; i < 10; i += 1) {
    stepHeight(curr, prev, out, cols, rows);
    prev.set(curr);
    curr.set(out);
  }
  assert.ok(Math.abs(curr[far] ?? 0) > 0.01);
  let peak = 0;
  for (let i = 0; i < curr.length; i += 1) peak = Math.max(peak, Math.abs(curr[i] ?? 0));
  assert.ok(peak < 2);
  assert.ok(Math.abs(curr[center] ?? 0) < 1.5);
});

test("flat water encodes to mid gray", () => {
  const bytes = new Uint8Array(1);
  encodeHeight(new Float32Array([0]), bytes);
  assert.equal(bytes[0], 128);
});

test("a drag pulls a swirl and the wave washes the cover open", () => {
  const cols = 40;
  const rows = 30;
  const field = new Float32Array(cols * rows);
  wake(field, cols, rows, 20, 15, 1, 0, 1);
  assert.ok((field[15 * cols + 20] ?? 0) > 0);
  assert.ok((field[17 * cols + 16] ?? 0) < 0);
  const mask = new Float32Array(field.length);
  washCover(field, mask);
  assert.ok((mask[15 * cols + 20] ?? 0) > 0);
  assert.equal(mask[0], 0);
});

test("splashes rise off the water and the banks stay dry", () => {
  assert.equal(inWater(10, 100), false);
  assert.equal(inWater(70, 100), true);
  const drop = spawnSplash(20, 80, 1, 0, () => 0.2);
  const risen = advanceSplash(drop, 0.05);
  assert.ok(risen);
  assert.ok(risen.y < drop.y);
  assert.ok(risen.vy < 0);
});
