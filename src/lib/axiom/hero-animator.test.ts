import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEMO_NICHES, heroIntroPlan } from "./demoNiches.ts";
import {
  HERO_ANIMATOR_SECONDS,
  clipHeroTagline,
  heroAnimatorPrompt,
  isHeroAnimatorPreset,
} from "./hero-animator.ts";

test("animator presets stay short and do not ask the model to paint words", () => {
  assert.equal(isHeroAnimatorPreset("liquid_chrome"), true);
  assert.equal(isHeroAnimatorPreset("liquid_chrome_orb"), true);
  assert.equal(isHeroAnimatorPreset("cinematic"), false);
  assert.equal(HERO_ANIMATOR_SECONDS <= 5, true);
  for (const preset of ["liquid_chrome", "frosted_glass", "obsidian_carbon", "liquid_chrome_orb"] as const) {
    const prompt = heroAnimatorPrompt(preset);
    assert.match(prompt, /No words/);
    assert.equal(prompt.length < 400, true);
  }
});

test("custom taglines stay short and niches still own their line", () => {
  assert.equal(clipHeroTagline("  Held   in light  "), "Held in light");
  assert.equal(clipHeroTagline("x".repeat(90)).length, 80);
  const custom = heroIntroPlan("obsidian_carbon", "");
  assert.equal(custom?.substance, "obsidian_carbon");
  assert.equal(custom?.tagline, "");
  assert.equal(heroIntroPlan("liquid_chrome", "craft-bourbon")?.tagline, "Dark grain, cut from carbon.");
});

test("showcase niches map a still, a line, and a substance into the intro plan", () => {
  const expected = {
    "luxury-watches": "liquid_chrome",
    "organic-skincare": "frosted_glass",
    "craft-bourbon": "obsidian_carbon",
  } as const;
  for (const niche of DEMO_NICHES) {
    const plan = heroIntroPlan("frosted_glass", niche.id);
    assert.ok(plan);
    assert.equal(plan.substance, expected[niche.id]);
    assert.equal(plan.previewUrl, niche.imageUrl);
    assert.equal(plan.tagline, niche.tagline);
    assert.equal(plan.durationSec <= 5, true);
    assert.equal(plan.resolution, "480p");
    assert.match(plan.prompt, /No words/);
    const still = readFileSync(new URL(`../../../public${niche.imageUrl}`, import.meta.url));
    assert.equal(still[0], 0x89);
    assert.equal(still[1], 0x50);
  }
  assert.equal(heroIntroPlan("liquid_chrome", "not-a-niche"), null);
  const loose = heroIntroPlan("liquid_chrome_orb", "");
  assert.equal(loose?.substance, "liquid_chrome");
  assert.equal(loose?.previewUrl, "");
});
