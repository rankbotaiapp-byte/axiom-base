import assert from "node:assert/strict";
import test from "node:test";
import {
  PRIME_CANDIDATE_THRESHOLD,
  PRIME_REASON,
  evaluatePrimeCandidate,
  isPrimeCandidate,
  parsePrimeBatchLimit,
  planPrimeBatch,
  selectTopPrimeCandidates,
} from "./prime-conversion.ts";

const base = {
  id: "a",
  businessName: "Rogue River Plumbing",
  tradeType: "plumbing",
  tradeLabel: "Emergency Plumbing",
  contactName: "Desk",
  contactPhone: "5415550100",
  contactEmail: "desk@rogue.example",
  streetAddress: "12 Main",
  city: "Grants Pass",
  website: "https://rogueplumbing.example",
  datasetImages: ["https://cdn.example/truck.jpg"],
  heroImageUrl: "",
  lineType: "mobile",
  reviewCount: 42,
  reviewScore: 4.8,
  qaNotes: "",
};

test("prime conversion scores image, mobile, emergency, reviews, and no-booking gap", () => {
  const scored = evaluatePrimeCandidate(base);
  assert.equal(scored.hasSourceImage, true);
  assert.equal(scored.hasDirectLine, true);
  assert.equal(scored.hasEmergencyDemand, true);
  assert.equal(scored.hasReviewBase, true);
  assert.equal(scored.hasBookingSignal, false);
  assert.ok(scored.reasons.includes(PRIME_REASON.webImage));
  assert.ok(scored.reasons.includes(PRIME_REASON.mobileLine));
  assert.ok(scored.reasons.includes(PRIME_REASON.emergency));
  assert.ok(scored.reasons.includes(PRIME_REASON.noBooking));
  assert.ok(scored.reasons.includes(PRIME_REASON.reviews));
  assert.ok(scored.score >= PRIME_CANDIDATE_THRESHOLD);
  assert.equal(isPrimeCandidate(base), true);
});

test("no source image tags fallback hero instead of recreate", () => {
  const scored = evaluatePrimeCandidate({ ...base, datasetImages: [], heroImageUrl: "" });
  assert.equal(scored.hasSourceImage, false);
  assert.ok(scored.reasons.includes(PRIME_REASON.fallbackHero));
  assert.ok(!scored.reasons.includes(PRIME_REASON.webImage));
});

test("online booking signal drops the no-booking conversion tag", () => {
  const scored = evaluatePrimeCandidate({ ...base, website: "https://shop.example/book-online" });
  assert.equal(scored.hasBookingSignal, true);
  assert.ok(!scored.reasons.includes(PRIME_REASON.noBooking));
});

test("selectTopPrimeCandidates respects niche and score sort", () => {
  const picked = selectTopPrimeCandidates(
    [
      { ...base, id: "hvac", businessName: "Zulu HVAC", tradeType: "hvac", tradeLabel: "HVAC", reviewCount: 90 },
      { ...base, id: "weak", businessName: "AAA Weak", tradeType: "plumbing", contactPhone: "", lineType: "unknown", datasetImages: [], reviewCount: 0, website: "" },
      { ...base, id: "prime", businessName: "Stedfast Plumbing", tradeType: "plumbing", reviewCount: 80 },
    ],
    { niche: "plumbing", limit: 5 },
  );
  assert.equal(picked[0]?.id, "prime");
  assert.ok(picked.every((lead) => lead.tradeType === "plumbing"));
  assert.ok(!picked.some((lead) => lead.id === "hvac"));
});

test("planPrimeBatch splits hero recreate vs fallback and honors daily caps", () => {
  const withPhoto = { ...base, id: "photo" };
  const noPhoto = { ...base, id: "loop", datasetImages: [], heroImageUrl: "", contactEmail: "" };
  const landline = {
    ...base,
    id: "office",
    contactPhone: "5415550199",
    lineType: "landline",
    datasetImages: [],
    contactEmail: "office@shop.example",
  };
  const plan = planPrimeBatch([withPhoto, noPhoto, landline], {
    selectedIds: ["photo", "loop", "office"],
    smsRemaining: 1,
    emailRemaining: 1,
    heroCompileMax: 6,
  });
  assert.deepEqual(plan.heroRecreateIds, ["photo"]);
  assert.ok(plan.fallbackHeroIds.includes("loop"));
  assert.equal(plan.outreach.length, 2);
  assert.equal(plan.skippedOutreach.length, 1);
  assert.match(plan.skippedOutreach[0]?.reason ?? "", /cap|destination/i);
});

test("parsePrimeBatchLimit clamps pull size", () => {
  assert.equal(parsePrimeBatchLimit(3), 3);
  assert.equal(parsePrimeBatchLimit(99), 25);
  assert.equal(parsePrimeBatchLimit("nope"), 12);
});
