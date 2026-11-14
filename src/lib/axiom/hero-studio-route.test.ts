import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HERO_STUDIO_SLUG, heroStudioPath, resolveHeroStudioSlug } from "./hero-studio-route.ts";

test("Hero Studio falls back to the axiom-auto tenant when no slug is given", () => {
  assert.equal(DEFAULT_HERO_STUDIO_SLUG, "axiom-auto");
  assert.equal(resolveHeroStudioSlug(""), "axiom-auto");
  assert.equal(resolveHeroStudioSlug("admin"), "axiom-auto");
  assert.equal(resolveHeroStudioSlug("night-circuit"), "night-circuit");
  assert.equal(heroStudioPath("axiom-auto"), "/axiom-auto/admin/hero-studio");
});
