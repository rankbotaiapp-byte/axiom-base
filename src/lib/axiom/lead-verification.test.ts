import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  callerNameMatchesBusiness,
  computePrimeScore,
  featuredCommandRank,
  isPrimeAutopilotReady,
  isSmsCapableLineType,
  normalizeUsE164,
  parseLeadLineType,
  readImageWidthFromBytes,
  sortCommandLeads,
} from "./lead-verification.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("0106 adds verification columns and the prime Autopilot index", () => {
  const sql = readFileSync(join(root, "migrations/0106_master_lead_verification.sql"), "utf8");
  assert.match(sql, /add column if not exists phone_e164/);
  assert.match(sql, /add column if not exists line_type/);
  assert.match(sql, /add column if not exists prime_score/);
  assert.match(sql, /add column if not exists qa_approved/);
  assert.match(sql, /idx_preloaded_leads_prime_autopilot/);
  assert.match(sql, /prime_score desc/);
  assert.doesNotMatch(sql, /drop table/i);
});

test("E.164 normalizes US numbers and rejects stubs", () => {
  assert.equal(normalizeUsE164("541-890-8126"), "+15418908126");
  assert.equal(normalizeUsE164("+1 5418908126"), "+15418908126");
  assert.equal(normalizeUsE164("541"), null);
});

test("Twilio line types map SMS-capable mobile and nonFixedVoip", () => {
  assert.equal(parseLeadLineType("nonFixedVoip"), "nonFixedVoip");
  assert.equal(isSmsCapableLineType("mobile"), true);
  assert.equal(isSmsCapableLineType("nonFixedVoip"), true);
  assert.equal(isSmsCapableLineType("landline"), false);
  assert.equal(isSmsCapableLineType("fixedVoip"), false);
});

test("prime score weights SMS, caller name, hero, email, and web/reviews", () => {
  const full = computePrimeScore({
    lineType: "mobile",
    verifiedCallerName: "Stedfast Plumbing",
    businessName: "Stedfast Plumbing & Drains LLC",
    heroImageStatus: "valid",
    email: "desk@stedfast.example",
    website: "https://stedfast.example",
  });
  assert.equal(full.smsCapable, 35);
  assert.equal(full.callerName, 20);
  assert.equal(full.hero, 20);
  assert.equal(full.email, 15);
  assert.equal(full.webOrReviews, 10);
  assert.equal(full.total, 100);
  assert.equal(isPrimeAutopilotReady({ primeScore: 80, qaApproved: true }), true);
  assert.equal(isPrimeAutopilotReady({ primeScore: 80, qaApproved: false, heroImageStatus: "missing" }), false);
});

test("JPEG SOF width is read from a prefix without a decoder", () => {
  const jpeg = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x38, 0x07, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  ]);
  assert.equal(readImageWidthFromBytes(jpeg), 1920);
});

test("caller-name match ignores LLC noise", () => {
  assert.equal(callerNameMatchesBusiness("STEDFAST PLUMBING", "Stedfast Plumbing & Drains LLC"), true);
  assert.equal(callerNameMatchesBusiness("Grants Pass Electric", "Unrelated HVAC"), false);
});

test("command desk pins Stedfast and Grants Pass Electric, plumbing first", () => {
  assert.equal(featuredCommandRank("Stedfast Plumbing & Drain"), 0);
  assert.equal(featuredCommandRank("Grants Pass Electric"), 1);
  const sorted = sortCommandLeads(
    [
      { businessName: "Zulu HVAC", tradeType: "hvac", primeScore: 90 },
      { businessName: "Grants Pass Electric", tradeType: "electrical", primeScore: 10 },
      { businessName: "Stedfast Plumbing & Drain", tradeType: "plumbing", primeScore: 12 },
    ],
    "all",
    "",
  );
  assert.equal(sorted[0]?.businessName, "Stedfast Plumbing & Drain");
  assert.equal(sorted[1]?.businessName, "Grants Pass Electric");
});
