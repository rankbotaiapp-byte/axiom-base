import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { before } from "node:test";
import { fileURLToPath } from "node:url";

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    throw new Error(`simulation blocked live fetch: ${String(input)}`);
  }) as typeof fetch;
});
import { dailyMotionCapCents } from "./render-credits.ts";
import {
  animateRecreatedBackgroundPrompt,
  remakeUploadedPhotoPrompt,
  withinDailyMotionCap,
} from "./hero-video-studio.ts";
import {
  assertValidBranding,
  AXIOM_VISUAL_STAGES,
  buildAxiomStagePrompt,
  buildGenericPanelPrompt,
  buildHeavyEquipmentPrompt,
  buildKineticMotionPrompt,
  buildSelectiveEnvironmentMotion,
  capEnvironmentalReactions,
  CONTRACTOR_TRADE_PRESETS,
  EnvironmentalReactionType,
  GENERIC_SHOWCASE_PANEL_POSTER,
  getDefaultReactionsForTrade,
  showcaseFallbackForSubject,
  subjectFromStudioUpload,
  TOOL_OR_GENERIC_SHOWCASE,
} from "./studio-visual-blueprint.ts";

test("selective environment motion caps at two reactions and locks subject/text", () => {
  const over = buildSelectiveEnvironmentMotion([
    EnvironmentalReactionType.HeadlightDustBeams,
    EnvironmentalReactionType.BackgroundLightFlicker,
    EnvironmentalReactionType.SkySunGlare,
    EnvironmentalReactionType.HeadlightDustBeams,
  ]);
  assert.equal(over.reactions.length, 2);
  assert.deepEqual(over.reactions, [
    EnvironmentalReactionType.HeadlightDustBeams,
    EnvironmentalReactionType.BackgroundLightFlicker,
  ]);
  assert.equal(over.lockSubjectAndText, true);
  assert.match(over.motionPrompt, /locked people and text/i);
  assert.match(over.motionPrompt, /dust/);
  assert.match(over.motionPrompt, /flicker/);
  assert.doesNotMatch(over.motionPrompt, /sun glare/);
  assert.deepEqual(capEnvironmentalReactions([]), [EnvironmentalReactionType.HeadlightDustBeams]);
});

test("tool_or_generic showcase is a branded panel, not a missing vehicle asset", () => {
  const fallback = showcaseFallbackForSubject("tool_or_generic", {
    shopName: "A+ Painting & Finishing",
    tagline: "Precision Finish",
    phone: "5415550148",
  });
  assert.equal(fallback.subject, "tool_or_generic");
  assert.equal(fallback.posterUrl, GENERIC_SHOWCASE_PANEL_POSTER);
  assert.equal(fallback.posterUrl, TOOL_OR_GENERIC_SHOWCASE.posterUrl);
  const panel = buildGenericPanelPrompt({
    shopName: "A+ Painting & Finishing",
    tagline: "Precision Finish",
    phone: "5417700148",
  });
  assert.match(panel, /A\+ Painting & Finishing/);
  assert.match(panel, /Precision Finish/);
  assert.match(panel, /541\.770\.0148/);
  assert.match(panel, /#00ffcc/);
  assert.doesNotMatch(panel, /\[INSERT/);
  const unnamed = buildGenericPanelPrompt({ shopName: "placeholder", phone: "5555550148" });
  assert.doesNotMatch(unnamed, /\[INSERT/);
  assert.match(unnamed, /blank smoked-glass plate/);
  const blank = buildGenericPanelPrompt({ shopName: "", tagline: "", phone: "" });
  assert.match(blank, /blank smoked-glass plate/);
  assert.doesNotMatch(blank, /555/);
  const prompt = buildAxiomStagePrompt({
    stage: "base_neon_trim",
    subject: "tool_or_generic",
    hasUpload: false,
    shopName: "Ridge Electric",
  });
  assert.match(prompt, /Noir \+ Neon/);
  assert.match(prompt, /#00f2fe/);
  assert.equal(AXIOM_VISUAL_STAGES.length, 4);
});

test("heavy equipment still and kinetic motion lock the machine and skip fake HUD text", () => {
  const still = buildHeavyEquipmentPrompt({ niche: "construction", machineType: "Caterpillar D9T Bulldozer" });
  assert.match(still, /Caterpillar D9T Bulldozer/);
  assert.match(still, /#00ffcc/);
  assert.doesNotMatch(still, /\[INSERT/);
  const kinetic = buildKineticMotionPrompt({
    niche: "construction",
    replicateBalanceUnits: 47,
  });
  assert.equal(kinetic.lockSubjectAndText, true);
  assert.equal(kinetic.reactions.length, 2);
  assert.match(kinetic.motionPrompt, /REPLICATE BALANCE: 47 units/);
  assert.match(kinetic.motionPrompt, /STAGE: KINETIC RE-CREATION/);
  const bare = buildKineticMotionPrompt({ niche: "construction" });
  assert.doesNotMatch(bare.motionPrompt, /REPLICATE BALANCE/);
  assert.doesNotMatch(bare.motionPrompt, /INSERT DYNAMIC BALANCE/);
});

test("assertValidBranding blocks placeholders and 555 phones", () => {
  assert.equal(assertValidBranding({ shopName: "Cascade Electric" }).ok, true);
  assert.equal(assertValidBranding({ shopName: "placeholder" }).ok, false);
  assert.equal(assertValidBranding({ shopName: "Ridge Electric", phone: "5555550148" }).ok, false);
});

test("plumbing van uses rain + dust beams; missing vehicle uses the generic showcase panel", () => {
  const van = getDefaultReactionsForTrade("plumbing", "vehicle");
  assert.deepEqual(van, [
    EnvironmentalReactionType.RainStreaksAndRipples,
    EnvironmentalReactionType.HeadlightDustBeams,
  ]);
  const motion = buildSelectiveEnvironmentMotion(van);
  assert.equal(motion.reactions.length, 2);
  assert.equal(motion.lockSubjectAndText, true);
  assert.match(motion.motionPrompt, /rain/);
  assert.match(motion.motionPrompt, /dust/);
  const missing = showcaseFallbackForSubject("tool_or_generic");
  assert.equal(missing.subject, "tool_or_generic");
  assert.equal(missing.posterUrl, "/media/axiom-generic-showcase-panel.png");
  assert.equal(GENERIC_SHOWCASE_PANEL_POSTER, "/media/axiom-generic-showcase-panel.png");
});

test("plumbing and sub-contractor trades default to 1-2 capped reactions", () => {
  const plumbing = getDefaultReactionsForTrade("plumbing", "vehicle");
  assert.equal(plumbing.length, 2);
  assert.deepEqual(plumbing, buildSelectiveEnvironmentMotion(plumbing).reactions);
  assert.ok(plumbing.includes(EnvironmentalReactionType.RainStreaksAndRipples));
  assert.ok(plumbing.includes(EnvironmentalReactionType.HeadlightDustBeams));
  const plumberLead = getDefaultReactionsForTrade("plumber", "tool_or_generic");
  assert.ok(plumberLead.length >= 1 && plumberLead.length <= 2);
  assert.deepEqual(plumberLead, getDefaultReactionsForTrade("plumbing", "tool_or_generic"));
  const electrical = getDefaultReactionsForTrade("electrical", "building");
  assert.equal(electrical.length, 2);
  assert.ok(electrical.includes(EnvironmentalReactionType.ShopBayPowerSequence));
  const painting = getDefaultReactionsForTrade("painting_finishing", "tool_or_generic");
  assert.ok(painting.length <= 2);
  const earth = getDefaultReactionsForTrade("excavation_earthwork", "vehicle");
  assert.deepEqual(earth, [
    EnvironmentalReactionType.HeadlightDustBeams,
    EnvironmentalReactionType.BackgroundLightFlicker,
  ]);
  const hvac = getDefaultReactionsForTrade("hvac", "tool_or_generic");
  assert.ok(hvac.includes(EnvironmentalReactionType.ColdEngineVaporGlow));
  const gc = getDefaultReactionsForTrade("general_contractor", "building");
  assert.equal(gc.length, 2);
  assert.equal(subjectFromStudioUpload({ hasFile: false }), "tool_or_generic");
  assert.equal(subjectFromStudioUpload({ hasFile: true, inlay: "vehicle" }), "vehicle");
  for (const trade of CONTRACTOR_TRADE_PRESETS) {
    const capped = getDefaultReactionsForTrade(trade, "tool_or_generic");
    assert.ok(capped.length >= 1 && capped.length <= 2, trade);
  }
});

test("hero-video-studio remake and motion consume the blueprint helpers", () => {
  const still = remakeUploadedPhotoPrompt({
    shopName: "Cascade Electric",
    niche: "electrical",
    slotLabel: "Hero",
    hasUpload: true,
  });
  assert.match(still, /Noir \+ Neon/);
  assert.match(still, /bucket truck|heavy-duty/);
  const motion = animateRecreatedBackgroundPrompt({
    niche: "electrical",
    shopName: "Cascade Electric",
    motion: "smoke",
  });
  assert.equal(motion.lockSubjectAndText, true);
  assert.ok(motion.reactions.length >= 1 && motion.reactions.length <= 2);
  assert.equal(withinDailyMotionCap({ monthlyLimitCents: 3000, spentTodayCents: 0, priceCents: 100 }), true);
  assert.equal(typeof dailyMotionCapCents, "function");
  const storefront = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../../components/outbound/OutboundStorefront.tsx"),
    "utf8",
  );
  assert.match(storefront, /getDefaultReactionsForTrade/);
  assert.match(storefront, /tool_or_generic/);
  assert.match(storefront, /https:\\\/\\\//);
});
