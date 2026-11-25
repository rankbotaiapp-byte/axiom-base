import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { before } from "node:test";
import { fileURLToPath } from "node:url";
import { applyPitchAngleToSms } from "./outreach-pitch-angles.ts";
import {
  applyClaimUrl,
  industrialNoirHeroDirective,
  leadHasDatasetImages,
  leadHasPhone,
  leadIsUnverified,
  matchDatasetInspectorFilters,
  outreachPresentationForVisualMode,
  parseShowcaseThemeId,
  parseVisualMode,
  showcaseTheme,
  VISUAL_MODE_CUSTOM,
  type DatasetLeadRecord,
} from "./outreach-desk.ts";
import { renderOutreachMessage } from "./funnel.ts";

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    throw new Error(`simulation blocked live fetch: ${String(input)}`);
  }) as typeof fetch;
});

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function lead(over: Partial<DatasetLeadRecord> = {}): DatasetLeadRecord {
  return {
    id: "lead_1",
    leadSlug: "rogue-valley-heating",
    businessName: "Rogue Valley Heating & Air",
    tradeType: "hvac",
    tradeLabel: "HVAC",
    contactName: "",
    contactPhone: "5418908126",
    contactEmail: "desk@example.com",
    streetAddress: "12 Main St",
    city: "Medford",
    county: "Jackson",
    state: "OR",
    zipCode: "97501",
    website: "https://example.com",
    source: "import",
    claimed: false,
    datasetImages: ["/media/van.jpg"],
    heroImageUrl: "",
    heroVideoUrl: "",
    visualMode: "sample_loop",
    visualStatus: "unverified",
    ...over,
  };
}

test("inspector filters phone, dataset images, and unverified custom heroes", () => {
  assert.equal(leadHasPhone(lead()), true);
  assert.equal(leadHasPhone(lead({ contactPhone: "541" })), false);
  assert.equal(leadHasDatasetImages(lead({ datasetImages: [] })), false);
  assert.equal(leadHasDatasetImages(lead({ datasetImages: [], heroImageUrl: "/x.jpg" })), true);
  assert.equal(leadIsUnverified(lead({ visualMode: VISUAL_MODE_CUSTOM, visualStatus: "approved" })), false);
  assert.equal(
    matchDatasetInspectorFilters(lead({ contactPhone: "" }), { hasPhone: true }),
    false,
  );
  assert.equal(matchDatasetInspectorFilters(lead(), { hasPhone: true, hasDatasetImages: true, unverified: true }), true);
});

test("custom hero outreach pitches the real shop photo; sample loop discloses AI concept", () => {
  const claimUrl = "https://axiom.example/t/rogue-valley-heating";
  const custom = outreachPresentationForVisualMode("custom_hero");
  const sample = outreachPresentationForVisualMode("sample_loop");
  const customSms = renderOutreachMessage(applyClaimUrl(custom.sms, claimUrl), {
    business: "Rogue Valley Heating & Air",
    url: claimUrl,
    owner: "Rogue Valley Heating & Air",
  });
  const sampleSms = renderOutreachMessage(applyClaimUrl(sample.sms, claimUrl), {
    business: "Rogue Valley Heating & Air",
    url: claimUrl,
  });
  assert.match(customSms, /actual shop\/truck photo/);
  assert.match(customSms, /night-shift live booking preview/);
  assert.match(customSms, /axiom\.example\/t\/rogue-valley-heating/);
  assert.doesNotMatch(customSms, /sample shop and van/);
  assert.match(sampleSms, /AI concept/);
  assert.match(sampleSms, /sample shop and van, not your building/);
  assert.match(sample.emailBody, /\{\{claimUrl\}\}/);
  assert.equal(parseVisualMode("nope"), "sample_loop");
});

test("industrial noir directive keeps the exact shop name and locked camera", () => {
  const prompt = industrialNoirHeroDirective("Cascade Electric");
  assert.match(prompt, /Cascade Electric/);
  assert.match(prompt, /#00ffcc/);
  assert.match(prompt, /#FFE500/);
  assert.match(prompt, /Locked camera/);
  assert.doesNotMatch(prompt, /555/);
});

test("showcase defaults to solar gold and exposes cyan / amber / cobalt presets", () => {
  assert.equal(parseShowcaseThemeId("bogus"), "solar_gold");
  assert.equal(showcaseTheme("solar_gold").ring, "#FFE500");
  assert.equal(showcaseTheme("solar_gold").ringHot, "#FF9900");
  assert.equal(showcaseTheme("solar_gold").book, "#00ffcc");
  assert.equal(showcaseTheme("pure_cyan").ring, "#00ffcc");
  assert.equal(showcaseTheme("emergency_amber").call, "#ff2a3d");
  assert.equal(showcaseTheme("cobalt_ice").ring, "#3d7eff");
});

test("0106 verification SQL is additive and does not rewrite 0103", () => {
  const sql = readFileSync(join(root, "migrations/0106_master_lead_verification.sql"), "utf8");
  assert.match(sql, /add column if not exists qa_notes/);
  assert.doesNotMatch(sql, /drop table/i);
  const visual = readFileSync(join(root, "migrations/0103_lead_visual_hero.sql"), "utf8");
  assert.doesNotMatch(visual, /prime_score/);
});

test("0103 is additive on preloaded_leads and does not rewrite earlier migrations", () => {
  const sql = readFileSync(join(root, "migrations/0103_lead_visual_hero.sql"), "utf8");
  assert.match(sql, /add column if not exists visual_mode/);
  assert.match(sql, /add column if not exists visual_status/);
  assert.match(sql, /add column if not exists dataset_images/);
  assert.doesNotMatch(sql, /drop table/i);
  const older = readFileSync(join(root, "migrations/0075_autopilot_active.sql"), "utf8");
  assert.doesNotMatch(older, /visual_mode/);
});

test("pitch-angle helper still wraps SMS after visual-mode copy is chosen", () => {
  const body = applyPitchAngleToSms("Preview {{claimUrl}}", "missed_call", { city: "Medford", county: "Jackson" });
  assert.ok(body.includes("Preview"));
});
