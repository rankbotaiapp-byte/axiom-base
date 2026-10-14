import assert from "node:assert/strict";
import test from "node:test";
import { balanceChannels, formulateProposal, hasListedPhone } from "./autopilot.ts";

test("a listed phone needs ten digits", () => {
  assert.equal(hasListedPhone("541-555-0100"), true);
  assert.equal(hasListedPhone("555"), false);
});

test("both-channel leads fill the smaller side", () => {
  const split = balanceChannels([
    { email: "a@sweep.example", phone: "" },
    { email: "b@sweep.example", phone: "5415550100" },
    { email: "", phone: "5415550101" },
    { email: "not-an-email", phone: "12" },
  ]);
  assert.equal(split.email.length, 2);
  assert.equal(split.sms.length, 1);
  assert.equal(split.email.some((lead) => lead.email.startsWith("b@")), true);
});

test("simulation copy says the batch will not send", () => {
  const summary = formulateProposal({
    mode: "simulation",
    totalLeads: 10,
    dailySent: 0,
    remainingQueue: 10,
    county: "Jackson County",
    tradeLabel: "contractor",
    emailCount: 2,
    smsCount: 2,
  });
  assert.match(summary, /does not send email or SMS/);
  assert.match(summary, /Jackson County/);
});
