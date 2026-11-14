import assert from "node:assert/strict";
import test from "node:test";
import { advanceSpeck, clearedShare, spawnSpeck } from "./swipe-reveal.ts";

test("a swipe mote travels and then fades out", () => {
  const speck = spawnSpeck(10, 20, 1, 0, () => 0.5);
  const next = advanceSpeck(speck, 0.1);
  assert.ok(next);
  assert.ok(next.x !== speck.x || next.y !== speck.y);
  assert.ok(next.life < speck.life);
  assert.equal(advanceSpeck({ ...speck, life: 0.01 }, 0.05), null);
});

test("cleared pixels are the erased share of the cover", () => {
  const alphas = new Uint8ClampedArray([255, 10, 0, 200]);
  assert.equal(clearedShare(alphas), 0.5);
  assert.equal(clearedShare(new Uint8ClampedArray()), 0);
});
