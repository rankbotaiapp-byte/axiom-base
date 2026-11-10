import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PLUMBING_STOREFRONT,
  PLUMBING_DIAGNOSTIC_VIDEO,
  PLUMBING_FIELD_OPS_VIDEO,
  PLUMBING_HERO_VIDEO,
  dialDigits,
  dialNumber,
  fillTemplate,
  filmTierFromSrc,
  formatRevenueLoss,
  missedCallScript,
  monthlyRevenueLoss,
  parsePlumbingStorefront,
  pinPlumbingTenantFilm,
  safeHref,
  safeMediaUrl,
} from "./plumbing-storefront.ts";

test("tenant overlay film helpers are exported and pin campaign files", () => {
  assert.equal(filmTierFromSrc(PLUMBING_DIAGNOSTIC_VIDEO), "diagnostic");
  assert.equal(filmTierFromSrc(PLUMBING_FIELD_OPS_VIDEO), "field");
  assert.equal(filmTierFromSrc(PLUMBING_HERO_VIDEO), "drain");
  assert.equal(pinPlumbingTenantFilm("/media/plumbing-diagnostic-telemetry.mp4?v=1"), PLUMBING_DIAGNOSTIC_VIDEO);
  assert.equal(pinPlumbingTenantFilm("/media/plumber-field-operations.mp4"), PLUMBING_FIELD_OPS_VIDEO);
  assert.equal(pinPlumbingTenantFilm("/media/unknown.mp4"), PLUMBING_HERO_VIDEO);
});

test("junk input falls back to the full default storefront", () => {
  const parsed = parsePlumbingStorefront(null);
  assert.equal(parsed.company, DEFAULT_PLUMBING_STOREFRONT.company);
  assert.equal(parsed.badges.length, DEFAULT_PLUMBING_STOREFRONT.badges.length);
  assert.equal(parsed.phoneDial, "");
  assert.equal(dialNumber(parsed), "+15415550142");
  assert.equal(dialNumber({ phoneDisplay: "(541) 555-0142", phoneDial: "541-555-9999" }), "541-555-9999");
  assert.deepEqual(parsePlumbingStorefront("{not json"), parsed);
});

test("edits survive and are trimmed and capped", () => {
  const parsed = parsePlumbingStorefront({
    company: "  Valley   Rooter  ",
    hero: { headline: "x".repeat(400), grade: 180 },
    badges: [{ label: "Bonded", icon: "nope" }, { label: "" }],
  });
  assert.equal(parsed.company, "Valley Rooter");
  assert.equal(parsed.hero.headline.length, 120);
  assert.equal(parsed.hero.grade, 100);
  assert.deepEqual(parsed.badges, [{ id: "b1", icon: "shield", label: "Bonded" }]);
});

test("unsafe links and media are refused", () => {
  assert.equal(safeHref("javascript:alert(1)", "/x"), "/x");
  assert.equal(safeHref("//evil.example", "/x"), "/x");
  assert.equal(safeHref("tel:+15415550142", "/x"), "tel:+15415550142");
  assert.equal(safeHref("https://stripe.com/pay", "/x"), "https://stripe.com/pay");
  assert.equal(safeMediaUrl("/media/../../etc/passwd", "/a.mp4"), "/a.mp4");
  assert.equal(safeMediaUrl("data:video/mp4;base64,AAAA", "/a.mp4"), "/a.mp4");
});

test("phone numbers become dialable", () => {
  assert.equal(dialDigits("(541) 555-0142"), "+15415550142");
  assert.equal(dialDigits("+44 20 7946 0958"), "+442079460958");
  assert.equal(dialDigits("call us"), "");
});

test("an explicit empty proof list and disabled feed are respected", () => {
  const parsed = parsePlumbingStorefront({ proof: { enabled: false, items: [] } });
  assert.equal(parsed.proof.enabled, false);
  assert.deepEqual(parsed.proof.items, []);
});

test("missed-call script is ordered and uses the company name", () => {
  const steps = missedCallScript(DEFAULT_PLUMBING_STOREFRONT);
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i].at > steps[i - 1].at);
  assert.equal(steps[0].kind, "ring");
  assert.equal(steps.at(-1)?.kind, "booked");
  const first = steps.find((s) => s.kind === "sms-out");
  assert.ok(first && "body" in first && first.body.includes("Rogue Rapid Plumbing"));
  assert.equal(fillTemplate("{a} {b} {c}", { a: "1", b: "2" }), "1 2 {c}");
});

test("ROI calculator defaults parse and compute monthly revenue loss", () => {
  const d = DEFAULT_PLUMBING_STOREFRONT.roi;
  assert.equal(d.enabled, true);
  assert.equal(monthlyRevenueLoss(8, 450, 4.33), Math.round(8 * 4.33 * 450));
  assert.equal(formatRevenueLoss(15_588), "$15,588");

  const parsed = parsePlumbingStorefront({
    roi: {
      enabled: true,
      missedCallsDefault: 99,
      missedCallsMin: 2,
      missedCallsMax: 20,
      jobValueDefault: 50,
      jobValueMin: 200,
      jobValueMax: 800,
      weeksPerMonth: 4,
      ctaHint: "  Recover it with the trial  ",
    },
  });
  assert.equal(parsed.roi.missedCallsDefault, 20);
  assert.equal(parsed.roi.jobValueDefault, 200);
  assert.equal(parsed.roi.weeksPerMonth, 4);
  assert.equal(parsed.roi.ctaHint, "Recover it with the trial");
  assert.match(parsed.roi.headline, /missed calls/i);
  assert.equal(monthlyRevenueLoss(parsed.roi.missedCallsDefault, parsed.roi.jobValueDefault, parsed.roi.weeksPerMonth), 16_000);
});

test("legacy storefront rows without roi still hydrate defaults", () => {
  const parsed = parsePlumbingStorefront({ company: "Legacy Plumb Co", roi: undefined });
  assert.equal(parsed.company, "Legacy Plumb Co");
  assert.equal(parsed.roi.enabled, true);
  assert.equal(parsed.roi.jobValueDefault, DEFAULT_PLUMBING_STOREFRONT.roi.jobValueDefault);
});

test("geo proof config hydrates and stays editable from admin drafts", () => {
  const parsed = parsePlumbingStorefront({
    city: "Ashland, OR",
    geo: { proofEnabled: true, tickerEnabled: false, jobsThisWeek: 30, headline: "Wins in {city}" },
  });
  assert.equal(parsed.geo.tickerEnabled, false);
  assert.equal(parsed.geo.jobsThisWeek, 30);
  assert.equal(parsed.geo.headline, "Wins in {city}");
  assert.equal(parsed.geo.stats.length > 0, true);
  const legacy = parsePlumbingStorefront({ company: "No Geo Yet" });
  assert.equal(legacy.geo.proofEnabled, true);
  assert.equal(legacy.geo.tickerEnabled, true);
});

test("land-grab config hydrates with competitor defaults for legacy rows", () => {
  const parsed = parsePlumbingStorefront({
    landGrab: {
      comparisonEnabled: true,
      bannerEnabled: true,
      slotsRemaining: 2,
      capacity: 7,
      headline: "Swap the answering service",
    },
  });
  assert.equal(parsed.landGrab.slotsRemaining, 2);
  assert.equal(parsed.landGrab.capacity, 7);
  assert.equal(parsed.landGrab.headline, "Swap the answering service");
  assert.ok(parsed.landGrab.rows.length >= 1);
  const legacy = parsePlumbingStorefront({ company: "No Land Grab Yet" });
  assert.equal(legacy.landGrab.comparisonEnabled, true);
  assert.equal(legacy.landGrab.bannerEnabled, true);
});
