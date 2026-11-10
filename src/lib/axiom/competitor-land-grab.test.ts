import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_COMPETITOR_LAND_GRAB,
  localizeCompetitorLandGrab,
  parseCompetitorLandGrab,
} from "./competitor-land-grab.ts";

describe("competitor replacement & land-grab", () => {
  it("localizes comparison copy and territory banner to the lead market", () => {
    const data = localizeCompetitorLandGrab(DEFAULT_COMPETITOR_LAND_GRAB, {
      city: "Medford, OR",
      county: "Jackson County",
      niche: "plumbing",
      trade: "Emergency Plumbing",
      business: "Rogue Rapid Plumbing",
      greet: true,
    });
    assert.equal(data.showComparison, true);
    assert.equal(data.showBanner, true);
    assert.match(data.subhead, /Medford/);
    assert.match(data.bannerLine, /Jackson County/);
    assert.match(data.bannerLine, /Medford/);
    assert.equal(data.rows.length, 3);
    assert.ok(data.rows.every((r) => r.legacy && r.axiom));
    assert.match(data.ctaHref, /niche=plumbing/);
  });

  it("respects requireGreet so non-greet visits can hide the stacks", () => {
    const gated = parseCompetitorLandGrab({ requireGreet: true, slotsRemaining: 2, capacity: 6 });
    const hidden = localizeCompetitorLandGrab(gated, {
      city: "Grants Pass",
      county: "Josephine County",
      niche: "electrical",
      greet: false,
    });
    assert.equal(hidden.showComparison, false);
    assert.equal(hidden.showBanner, false);

    const shown = localizeCompetitorLandGrab(gated, {
      city: "Grants Pass",
      county: "Josephine County",
      niche: "electrical",
      greet: true,
    });
    assert.equal(shown.showComparison, true);
    assert.equal(shown.showBanner, true);
    assert.match(shown.bannerLine, /Josephine County|Grants Pass/);
  });

  it("parses admin overrides for rows, slots, and CTA", () => {
    const parsed = parseCompetitorLandGrab({
      comparisonEnabled: true,
      bannerEnabled: false,
      headline: "Beat the old stack",
      slotsRemaining: 1,
      capacity: 5,
      rows: [{ id: "x", legacy: "Paper forms", axiom: "Text-back in seconds" }],
      ctaHref: "/onboard?niche=auto",
    });
    assert.equal(parsed.bannerEnabled, false);
    assert.equal(parsed.slotsRemaining, 1);
    assert.equal(parsed.capacity, 5);
    assert.equal(parsed.rows[0]?.axiom, "Text-back in seconds");
    const localized = localizeCompetitorLandGrab(parsed, { city: "Ashland", niche: "auto", greet: true });
    assert.equal(localized.showBanner, false);
    assert.equal(localized.ctaHref, "/onboard?niche=auto");
  });
});
