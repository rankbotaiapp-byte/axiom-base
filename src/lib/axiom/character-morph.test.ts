import assert from "node:assert/strict";
import test from "node:test";
import {
  CHARACTER_ROSTERS,
  TRAIT_KEYS,
  clampTrait,
  enhancementIndex,
  traitScale,
} from "./character-morph.ts";

test("each catalog has a distinct roster with voice and behavior", () => {
  const ids = new Set<string>();
  for (const gender of ["female", "male"] as const) {
    const roster = CHARACTER_ROSTERS[gender];
    assert.ok(roster.length >= 4);
    const categories = new Set(roster.map((profile) => profile.category));
    assert.ok(categories.has("Cyber Tactical"));
    assert.ok(categories.has("Neo Rogue"));
    assert.ok(categories.has("Apex Operative"));
    assert.ok(categories.has("Vanguard Titan"));
    for (const profile of roster) {
      assert.equal(profile.gender, gender);
      assert.equal(ids.has(profile.id), false);
      ids.add(profile.id);
      assert.match(profile.portraitUrl, /^\/media\/characters\/[a-z-]+\.svg$/);
      assert.ok(profile.bio.length > 20);
      assert.ok(profile.voice.length > 3);
      assert.ok(profile.behavior.length > 10);
      for (const key of TRAIT_KEYS) {
        assert.equal(profile.base[key], clampTrait(profile.base[key]));
      }
    }
  }
});

test("enhancement index is the rounded mean of the five traits", () => {
  assert.equal(enhancementIndex({ chest: 0, glutes: 0, lips: 0, jaw: 0, shoulders: 0 }), 0);
  assert.equal(enhancementIndex({ chest: 100, glutes: 100, lips: 100, jaw: 100, shoulders: 100 }), 100);
  assert.equal(enhancementIndex({ chest: 50, glutes: 60, lips: 70, jaw: 40, shoulders: 80 }), 60);
  assert.equal(enhancementIndex({ chest: 140, glutes: -20, lips: Number.NaN, jaw: 10, shoulders: 10 }), 24);
});

test("trait scale stays inside the requested visual range", () => {
  assert.equal(traitScale(0, 0.8, 1.2), 0.8);
  assert.equal(traitScale(100, 0.8, 1.2), 1.2);
  assert.equal(traitScale(50, 0.8, 1.2), 1);
});
