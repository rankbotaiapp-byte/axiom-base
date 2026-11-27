import assert from "node:assert/strict";
import test from "node:test";
import {
  LANDING_NEUTRAL_BADGE,
  landingPreviewPath,
  landingPreviewUrl,
  parseLandingLeadQuery,
  plumbingHeroBadge,
  plumbingTrustLabels,
  shouldUseLandingPreview,
} from "./landing-preview.ts";

test("plumber outreach urls land on the production carousel with name, phone, city, and trade", () => {
  const path = landingPreviewPath({
    leadId: "lead_miller01",
    leadSlug: "miller-plumbing-medford",
    businessName: "Miller Plumbing",
    phone: "541-555-0192",
    city: "Medford",
  });
  const url = new URL(path, "https://axiom.example/");
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("lead_id"), "lead_miller01");
  assert.equal(url.searchParams.get("b"), "Miller Plumbing");
  assert.equal(url.searchParams.get("phone"), "541-555-0192");
  assert.equal(url.searchParams.get("city"), "Medford");
  assert.equal(url.searchParams.get("trade"), "plumbing");
  const named = new URL(landingPreviewUrl("https://axiom.example/", { businessName: "Miller Plumbing", city: "Medford" }));
  assert.equal(named.origin, "https://axiom.example");
  assert.equal(named.searchParams.get("b"), "Miller Plumbing");
  assert.equal(named.searchParams.get("city"), "Medford");
  assert.equal(named.searchParams.get("trade"), "plumbing");
});

test("unverified plumber records never advertise licensed or 24/7 badges", () => {
  assert.equal(shouldUseLandingPreview("Emergency Plumbing"), true);
  assert.equal(shouldUseLandingPreview("barber"), false);
  assert.equal(plumbingHeroBadge(false), LANDING_NEUTRAL_BADGE);
  assert.deepEqual([...plumbingTrustLabels(false)], ["Fast Local Dispatch", "Upfront Pricing"]);
  assert.equal(plumbingHeroBadge(true), "24/7 Emergency · Instant dispatch");
  assert.ok(!plumbingTrustLabels(false).some((label) => /licensed|24\/7/i.test(label)));
});

test("landing lead lookup accepts lead_id or slug", () => {
  assert.deepEqual(parseLandingLeadQuery({ lead_id: "lead_abc123" }), { leadId: "lead_abc123", slug: "" });
  assert.deepEqual(parseLandingLeadQuery({ slug: "miller-plumbing" }), { leadId: "", slug: "miller-plumbing" });
  assert.deepEqual(parseLandingLeadQuery({ slug: "Miller Plumbing" }), { leadId: "", slug: "" });
});
