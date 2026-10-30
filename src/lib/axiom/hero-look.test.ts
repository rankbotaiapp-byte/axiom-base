import assert from "node:assert/strict";
import test from "node:test";
import { heroLookFromProfile, parseHeroLook } from "./hero-look.ts";

test("frame presets survive a trade profile rewrite", () => {
  const look = parseHeroLook({ brackets: true, glow: true, overlay: false });
  assert.deepEqual(look, { brackets: true, glow: true, overlay: false });
  const stored = JSON.stringify({ heroBrand: { tagline: "Open late", look } });
  assert.deepEqual(heroLookFromProfile(stored), look);
  assert.equal(heroLookFromProfile("{}").overlay, true);
  assert.equal(heroLookFromProfile("not-json").brackets, false);
});
