import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_PLUMBER_OUTREACH,
  PLUMBER_OUTREACH_HERO_VIDEO,
  applyTenantReel,
  inlayIsClean,
  TEST_DISPATCH_GAP_MS,
  TEST_DISPATCH_MAX,
  bidCents,
  businessFromSlug,
  callTarget,
  isPlumbingCampaign,
  plumberCampaignPath,
  checkDispatchMobile,
  emptyOutreachTenant,
  fillTemplate,
  outreachVars,
  parsePlumberOutreach,
  testDispatchAllowed,
} from "./plumber-outreach.ts";

test("junk input falls back to the full default page", () => {
  const parsed = parsePlumberOutreach(null);
  assert.deepEqual(parsed, DEFAULT_PLUMBER_OUTREACH);
  assert.deepEqual(parsePlumberOutreach("{not json"), parsed);
  assert.equal(parsed.hero.videoUrl, "/media/axio-plumber-hero.mp4");
  assert.equal(parsed.hero.mobileVideoUrl, "");
  assert.equal(parsed.hero.headline, "Never miss another emergency call in {city}.");
  assert.equal(parsed.ctas.trialLabel, "Go live for $1");
  assert.equal(parsed.mobileLock.testLabel, "Test Live SMS Dispatch");
  assert.equal(parsed.feature.title, "Inside Your Lines: Real-Time Emergency Diagnostics & Obstruction Clearing");
  assert.equal(parsed.feature.videoUrl, "/media/plumbing-drain-ride.mp4");
  assert.equal(parsed.reel.enabled, true);
  assert.equal(parsed.reel.title, "Live Pipe Diagnostic Reel");
  assert.equal(parsed.reel.videoUrl, "/media/drain-clog.mp4");
});

test("a parsed config round-trips unchanged", () => {
  const once = parsePlumberOutreach(DEFAULT_PLUMBER_OUTREACH);
  assert.deepEqual(parsePlumberOutreach(JSON.stringify(once)), once);
});

test("owner edits survive, trimmed and capped", () => {
  const parsed = parsePlumberOutreach({
    hero: { headline: "  Never   miss a   leak  ", subhead: "", scrim: 400, mobileVideoUrl: "" },
    metric: { count: "27", sampleLabel: "", stats: [{ value: "4 sec", label: "text-back" }, { value: "", label: "x" }] },
    ctas: { trialLabel: "x".repeat(200), fallbackPhone: " (541) 890-1234 " },
    checkout: { presets: [5, 5, 0, "20", 99999], defaultDollars: 0 },
    services: { items: [{ title: "Slab leaks", price: "From $299" }, { title: "" }] },
    booking: { enabled: false, slots: ["  Now ", 7, ""] },
    proof: { items: [] },
    feature: { enabled: false, ctaLabel: "", videoUrl: "http://insecure.example/x.mp4", points: [{ title: "Roots", detail: "Cut" }, { detail: "no title" }] },
  });
  assert.equal(parsed.feature.enabled, false);
  assert.equal(parsed.feature.ctaLabel, "");
  assert.equal(parsed.feature.videoUrl, "/media/plumbing-drain-ride.mp4");
  assert.deepEqual(parsed.feature.points, [{ id: "f1", title: "Roots", detail: "Cut" }]);
  assert.equal(parsed.hero.headline, "Never miss a leak");
  assert.equal(parsed.hero.subhead, "");
  assert.equal(parsed.hero.scrim, 100);
  assert.equal(parsed.hero.mobileVideoUrl, "");
  assert.equal(parsed.metric.count, 27);
  assert.equal(parsed.metric.sampleLabel, "");
  assert.deepEqual(parsed.metric.stats, [{ id: "m1", value: "4 sec", label: "text-back" }]);
  assert.equal(parsed.ctas.trialLabel.length, 40);
  assert.equal(parsed.ctas.fallbackPhone, "(541) 890-1234");
  assert.deepEqual(parsed.checkout.presets, [5, 1, 20, 5000]);
  assert.equal(parsed.checkout.defaultDollars, 1);
  assert.deepEqual(parsed.services.items, [{ id: "s1", title: "Slab leaks", detail: "", price: "From $299", eta: "" }]);
  assert.equal(parsed.booking.enabled, false);
  assert.deepEqual(parsed.booking.slots, ["Now"]);
  assert.deepEqual(parsed.proof.items, []);
});

test("unsafe media and links are refused", () => {
  const parsed = parsePlumberOutreach({
    hero: { videoUrl: "javascript:alert(1)", posterUrl: "//evil.example/x.jpg" },
    checkout: { fallbackHref: "javascript:alert(1)" },
    telemetry: { videoUrl: "/media/../secret.mp4" },
  });
  assert.equal(parsed.hero.videoUrl, PLUMBER_OUTREACH_HERO_VIDEO);
  assert.equal(parsed.hero.posterUrl, DEFAULT_PLUMBER_OUTREACH.hero.posterUrl);
  assert.equal(parsed.checkout.fallbackHref, DEFAULT_PLUMBER_OUTREACH.checkout.fallbackHref);
  assert.equal(parsed.telemetry.videoUrl, DEFAULT_PLUMBER_OUTREACH.telemetry.videoUrl);
});

test("the mobile lock rejects 555 placeholder lines", () => {
  for (const raw of ["(541) 555-0142", "541-555-1234", "+1 555 867 5309", "5555551212", "1-503-555-0100"]) {
    const check = checkDispatchMobile(raw);
    assert.equal(check.ok, false, raw);
    if (!check.ok) assert.match(check.reason, /555/);
  }
});

test("the mobile lock rejects short, impossible, toll-free and filler numbers", () => {
  for (const raw of [
    "",
    "541-890",
    "041-890-1234",
    "541-090-1234",
    "541-190-1234",
    "800-890-1234",
    "888 222 3333",
    "900-890-1234",
    "1234567890",
    "2222222222",
    "541-222-2222",
    "5035035033",
    "44 20 7946 0958",
  ]) {
    assert.equal(checkDispatchMobile(raw).ok, false, raw);
  }
});

test("the mobile lock accepts a real cell in any common format", () => {
  for (const raw of ["5418901234", "(541) 890-1234", "541.890.1234", "+1 541 890 1234", "1-541-890-1234"]) {
    assert.deepEqual(checkDispatchMobile(raw), { ok: true, e164: "+15418901234", display: "(541) 890-1234" }, raw);
  }
});

test("the bid never drops below the $1 floor", () => {
  assert.equal(bidCents(1), 100);
  assert.equal(bidCents(0), 100);
  assert.equal(bidCents(-5), 100);
  assert.equal(bidCents("abc"), 100);
  assert.equal(bidCents("$25"), 2500);
  assert.equal(bidCents(7.5), 750);
  assert.equal(bidCents(9_999_999), 500_000);
});

test("the call button dials the tenant's own line before the studio fallback", () => {
  const cfg = parsePlumberOutreach({ ctas: { fallbackPhone: "(541) 890-1234" } });
  assert.deepEqual(callTarget({ phone: "541-773-2000" }, cfg), { dial: "+15417732000", display: "(541) 773-2000" });
  assert.deepEqual(callTarget({ phone: "" }, cfg), { dial: "+15418901234", display: "(541) 890-1234" });
  assert.equal(callTarget({ phone: "" }, DEFAULT_PLUMBER_OUTREACH), null);
  assert.equal(callTarget({ phone: "n/a" }, DEFAULT_PLUMBER_OUTREACH), null);
});

test("copy is personalised from the tenant, with safe fallbacks for a bare slug", () => {
  assert.equal(businessFromSlug("rogue-rapid-plumbing"), "Rogue Rapid Plumbing");
  const bare = outreachVars(emptyOutreachTenant("valley-rooter"));
  assert.equal(bare.business, "Valley Rooter");
  assert.equal(bare.city, "your area");
  assert.equal(bare.county, "your area");
  assert.equal(bare.owner, "Valley Rooter");
  const full = outreachVars({
    ...emptyOutreachTenant("x"),
    business: "Ace Drain",
    city: "Medford",
    county: "Jackson County",
    phone: "5418901234",
    reviewScore: 4.8,
    reviewCount: 112,
  });
  assert.equal(fillTemplate("Built for {business} in {city} · {county} · {unknown}", full), "Built for Ace Drain in Medford · Jackson County · {unknown}");
  assert.equal(full.phone, "(541) 890-1234");
  assert.equal(full.reviews, "4.8★ · 112 reviews");
  const d = DEFAULT_PLUMBER_OUTREACH;
  for (const text of [
    fillTemplate(d.hero.headline, full),
    fillTemplate(d.hero.subhead, full),
    fillTemplate(d.hero.eyebrow, full),
    fillTemplate(d.metric.line, full),
    fillTemplate(d.feature.ctaLabel, full),
    fillTemplate(d.booking.confirmBody, { ...full, service: "Drain", slot: "ASAP" }),
    fillTemplate(d.closing.headline, full),
    fillTemplate(d.closing.blurb, full),
  ]) {
    assert.equal(inlayIsClean(text), true, text);
    assert.doesNotMatch(text, /undefined|null|\{[a-z]+\}/i);
  }
});

test("tenant desk can swap or hide the diagnostic reel", () => {
  const swapped = applyTenantReel(DEFAULT_PLUMBER_OUTREACH, { diagnosticReelUrl: "/media/plumbing-drain-ride.mp4" });
  assert.equal(swapped.reel.videoUrl, "/media/plumbing-drain-ride.mp4");
  assert.equal(swapped.feature.videoUrl, DEFAULT_PLUMBER_OUTREACH.feature.videoUrl);
  const hidden = applyTenantReel(DEFAULT_PLUMBER_OUTREACH, { diagnosticReelEnabled: false });
  assert.equal(hidden.reel.enabled, false);
  const refused = applyTenantReel(DEFAULT_PLUMBER_OUTREACH, { diagnosticReelUrl: "javascript:alert(1)" });
  assert.equal(refused.reel.videoUrl, "/media/drain-clog.mp4");
});

test("industrial plumbing campaign urls never route through otter demos", () => {
  assert.equal(isPlumbingCampaign("plumbing"), true);
  assert.equal(isPlumbingCampaign("Emergency Plumbing"), true);
  assert.equal(isPlumbingCampaign("otter"), false);
  assert.equal(plumberCampaignPath("accurate-plumbing"), "/t/accurate-plumbing?niche=plumbing&greet=1");
});

test("root route and leftover Next page both render industrial plumbing outreach", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const index = readFileSync(join(root, "routes/index.tsx"), "utf8");
  const nextPage = readFileSync(join(root, "app/page.tsx"), "utf8");
  const admin = readFileSync(join(root, "routes/axiom-auto/admin.tsx"), "utf8");
  assert.match(index, /PlumberOutreachLive/);
  assert.match(index, /greet=\{true\}/);
  assert.doesNotMatch(index, /AxiomMasterLanding/);
  assert.match(nextPage, /PlumberOutreachLive/);
  assert.doesNotMatch(nextPage, /AxiomMasterLanding/);
  assert.match(admin, /PlumberOutreachStudio/);
});

test("test dispatch is throttled per number", () => {
  const now = 1_000_000;
  assert.deepEqual(testDispatchAllowed({ count: 0, lastAt: null }, now), { ok: true });
  assert.equal(testDispatchAllowed({ count: 1, lastAt: now - 1000 }, now).ok, false);
  assert.deepEqual(testDispatchAllowed({ count: 1, lastAt: now - TEST_DISPATCH_GAP_MS }, now), { ok: true });
  assert.equal(testDispatchAllowed({ count: TEST_DISPATCH_MAX, lastAt: null }, now).ok, false);
});
