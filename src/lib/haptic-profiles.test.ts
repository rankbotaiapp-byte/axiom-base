import assert from "node:assert/strict";
import test from "node:test";
import {
  CINEMATIC_EFFECTS,
  EFFECT_TREE,
  HAPTIC_CTA_CLICK,
  HAPTIC_PROFILES,
  autopilotEffectForNiche,
  cinematicEffect,
  consumeTimeCues,
  heroInViewThreshold,
  parseBrandMark,
  parseCinematicEffect,
} from "./haptic-profiles.ts";

test("each cinematic effect has a distinct LRA signature", () => {
  assert.equal(CINEMATIC_EFFECTS.length, 7);
  assert.deepEqual([...HAPTIC_CTA_CLICK], [25]);
  assert.ok(HAPTIC_PROFILES.mistSpray[0]! < HAPTIC_PROFILES.waterBurst[0]!);
  assert.ok(HAPTIC_PROFILES.waterTrickle.includes(240) || HAPTIC_PROFILES.waterTrickle.includes(260));
  assert.equal(HAPTIC_PROFILES.neonSpark.length >= 5, true);
  const ids = new Set(CINEMATIC_EFFECTS.map((item) => item.haptic));
  assert.equal(ids.size, CINEMATIC_EFFECTS.length);
});

test("effect tree covers water physics and particle energy", () => {
  assert.deepEqual(
    EFFECT_TREE.map((branch) => branch.family),
    ["water", "energy"],
  );
  assert.equal(parseCinematicEffect("waterBurst"), "waterBurst");
  assert.equal(parseCinematicEffect("nope"), "atmosphericMist");
  assert.equal(parseBrandMark("etch"), "etch");
  assert.equal(cinematicEffect("neonSpark").loopUrl.includes("electrician"), true);
  assert.equal(autopilotEffectForNiche("plumbing"), "waterTrickle");
  assert.equal(autopilotEffectForNiche("electrical"), "neonSpark");
});

test("time cues fire once per loop and reset when the film wraps", () => {
  const cues = [
    { at: 1, pattern: [10] },
    { at: 2, pattern: [12] },
  ];
  const first = consumeTimeCues(cues, 1.05, 0.9, new Set());
  assert.equal(first.has(0), true);
  assert.equal(first.has(1), false);
  const second = consumeTimeCues(cues, 2.1, 1.9, first);
  assert.equal(second.has(1), true);
  const wrapped = consumeTimeCues(cues, 0.1, 4.9, second);
  assert.equal(wrapped.size, 0);
});

test("mobile viewports use a lower intersection floor so scroll still arms LRA", () => {
  assert.equal(heroInViewThreshold(true), 0.2);
  assert.equal(heroInViewThreshold(false), 0.45);
  assert.equal(cinematicEffect("atmosphericMist").haptic, "mistSpray");
  assert.equal(cinematicEffect("waterTrickle").haptic, "waterTrickle");
  assert.equal(cinematicEffect("waterBurst").haptic, "waterBurst");
  assert.equal(cinematicEffect("neonSpark").haptic, "neonSpark");
});
