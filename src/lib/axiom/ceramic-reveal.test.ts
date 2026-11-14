import assert from "node:assert/strict";
import test from "node:test";
import { usesCeramicReveal } from "./ceramic-reveal.ts";

test("detailing and wrap shops get the ceramic swipe hero", () => {
  assert.equal(usesCeramicReveal("detailer"), true);
  assert.equal(usesCeramicReveal("trade", "Auto detailing"), true);
  assert.equal(usesCeramicReveal("trade", "Mobile detailer"), true);
  assert.equal(usesCeramicReveal("trade", "Vinyl wrap shop"), true);
  assert.equal(usesCeramicReveal("trade", "Ceramic coat"), true);
});

test("mechanic and hunting heroes stay on their own films", () => {
  assert.equal(usesCeramicReveal("field", "Auto repair"), false);
  assert.equal(usesCeramicReveal("hunting", "Half day on private ground"), false);
  assert.equal(usesCeramicReveal("location", "Northside Barbers"), false);
});
