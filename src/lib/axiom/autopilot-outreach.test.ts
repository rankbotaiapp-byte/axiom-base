import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTOPILOT_EMAIL_DAILY_CAP,
  AUTOPILOT_SMS_DAILY_CAP,
  normalizeCounty,
  normalizeTrade,
  planOutreachBatch,
  renderOutreachTemplate,
  rotateStockQuery,
  type OutreachLeadTarget,
} from "./autopilot-outreach.ts";

const lead: OutreachLeadTarget = {
  leadSlug: "vance-hvac-plumbing",
  businessName: "Vance HVAC & Plumbing",
  trade: "hvac",
  county: "josephine",
  city: "Grants Pass",
  email: "jim@vance.example",
  phone: "5415550100",
  contactName: "Jim Vance",
};

test("normalizes Rogue Valley counties and trades", () => {
  assert.equal(normalizeCounty("Grants Pass, OR"), "josephine");
  assert.equal(normalizeCounty("Jackson County"), "jackson");
  assert.equal(normalizeTrade("HVAC & Plumbing"), "hvac");
  assert.equal(normalizeTrade("Emergency Electrician"), "electrical");
});

test("daily caps stay at 40 SMS / 80 email", () => {
  assert.equal(AUTOPILOT_SMS_DAILY_CAP, 40);
  assert.equal(AUTOPILOT_EMAIL_DAILY_CAP, 80);
});

test("batch planner respects remaining caps and simulation mode", () => {
  const plan = planOutreachBatch({
    mode: "simulation",
    county: "josephine",
    trade: "hvac",
    leads: [lead],
    smsSentToday: 38,
    emailSentToday: 10,
    now: new Date("2026-11-16T18:00:00.000Z"), // Monday ~10am PT
  });
  assert.equal(plan.mode, "simulation");
  assert.equal(plan.smsRemaining, 2);
  assert.ok(plan.smsQueued <= 2);
  assert.match(plan.summary, /Simulation/);
  assert.ok(plan.stockQuery.length > 0);
});

test("templates speak trade voice and rotate stock queries", () => {
  const sms = renderOutreachTemplate("intro_sms", lead, {
    previewUrl: "https://axiom.shop/vance-hvac-plumbing",
  });
  assert.match(sms.body, /Vance HVAC/);
  assert.match(sms.body, /Grants Pass|booking/i);
  const a = rotateStockQuery("hvac", "vance", new Date("2026-11-16T00:00:00Z"));
  const b = rotateStockQuery("plumbing", "rogue", new Date("2026-11-16T00:00:00Z"));
  assert.ok(a.includes("hvac") || a.includes("furnace") || a.includes("air"));
  assert.notEqual(a, b);
});
