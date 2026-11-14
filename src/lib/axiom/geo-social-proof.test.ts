import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_GEO_SOCIAL_PROOF,
  countyForCity,
  geoSeed,
  localizeGeoSocialProof,
  parseGeoSocialProof,
  placesForLocale,
} from "./geo-social-proof.ts";

describe("geo-targeted proof-of-work", () => {
  it("binds city/county into localized stats", () => {
    const proof = localizeGeoSocialProof(DEFAULT_GEO_SOCIAL_PROOF, {
      city: "Medford, OR",
      county: "Jackson County",
      niche: "plumbing",
    });
    assert.equal(proof.city, "Medford");
    assert.equal(proof.county, "Jackson County");
    assert.match(proof.headline, /Medford/);
    assert.match(proof.subhead, /Jackson County/);
    assert.equal(proof.stats.length, 3);
    assert.ok(proof.stats.every((s) => s.value && s.label));
    assert.match(proof.stats[0]!.label, /Medford/);
  });

  it("infers county from city and rotates nearby places into the ticker", () => {
    assert.equal(countyForCity("Grants Pass"), "Josephine County");
    const places = placesForLocale({ city: "Grants Pass" });
    assert.ok(places.includes("Grants Pass"));
    assert.ok(places.includes("Cave Junction"));

    const proof = localizeGeoSocialProof(DEFAULT_GEO_SOCIAL_PROOF, {
      city: "Grants Pass",
      niche: "auto",
      trade: "Mobile mechanic",
    });
    assert.equal(proof.tickerEnabled, true);
    assert.ok(proof.ticker.length >= 3);
    assert.ok(proof.ticker.some((t) => /Grants Pass|Cave Junction/i.test(t.line)));
  });

  it("keeps the same seed figures for the same city", () => {
    assert.equal(geoSeed("Medford", "Jackson County"), geoSeed("Medford", "Jackson County"));
    const a = localizeGeoSocialProof(DEFAULT_GEO_SOCIAL_PROOF, { city: "Ashland", county: "Jackson County" });
    const b = localizeGeoSocialProof(DEFAULT_GEO_SOCIAL_PROOF, { city: "Ashland", county: "Jackson County" });
    assert.deepEqual(
      a.stats.map((s) => s.value),
      b.stats.map((s) => s.value),
    );
  });

  it("parses admin overrides and respects disable toggles", () => {
    const parsed = parseGeoSocialProof({
      proofEnabled: false,
      tickerEnabled: true,
      jobsThisWeek: 22,
      tickerMessages: [{ id: "x", template: "{name} locked in {place}" }],
      names: ["Ada Q."],
    });
    assert.equal(parsed.proofEnabled, false);
    assert.equal(parsed.jobsThisWeek, 22);
    assert.equal(parsed.tickerMessages[0]?.template, "{name} locked in {place}");
    const localized = localizeGeoSocialProof(parsed, { city: "Roseburg", county: "Douglas County" });
    assert.equal(localized.proofEnabled, false);
    assert.equal(localized.tickerEnabled, true);
    assert.match(localized.ticker[0]!.line, /Ada Q\./);
  });
});
