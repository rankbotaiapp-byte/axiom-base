import assert from "node:assert/strict";
import test from "node:test";
import { ZIPPER_BREACH, tentPhaseIndex, zipperBreach } from "./tent-chase.ts";

test("the zipper breach is a single threshold and the phases stay ordered", () => {
  assert.equal(zipperBreach(ZIPPER_BREACH - 0.01), false);
  assert.equal(zipperBreach(ZIPPER_BREACH), true);
  assert.equal(tentPhaseIndex("stealth"), 0);
  assert.equal(tentPhaseIndex("chase"), 1);
  assert.equal(tentPhaseIndex("cover"), 2);
});
