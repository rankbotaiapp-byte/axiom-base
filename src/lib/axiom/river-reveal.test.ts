import assert from "node:assert/strict";
import test from "node:test";
import { usesRiverReveal } from "./river-reveal.ts";

test("fishing guides get the river hero", () => {
  assert.equal(usesRiverReveal("guide"), true);
  assert.equal(usesRiverReveal("trade", "River Hawk Guides"), true);
  assert.equal(usesRiverReveal("trade", "Fishing guide"), true);
});

test("hunting and detailing stay off the river", () => {
  assert.equal(usesRiverReveal("hunting", "Hunting guide"), false);
  assert.equal(usesRiverReveal("detailer", "Auto detailing"), false);
  assert.equal(usesRiverReveal("field", "Auto repair"), false);
});
