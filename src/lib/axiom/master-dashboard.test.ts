import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  channelFromLog,
  firstLeadBillingAlert,
  logLevelFromStatus,
  parseSubscriptionStatus,
} from "./master-dashboard.ts";

describe("master dashboard contracts", () => {
  it("normalizes billing statuses onto the dashboard union", () => {
    assert.equal(parseSubscriptionStatus("active"), "active");
    assert.equal(parseSubscriptionStatus("trial"), "trialing");
    assert.equal(parseSubscriptionStatus("past-due"), "past_due");
    assert.equal(parseSubscriptionStatus("cancelled"), "canceled");
    assert.equal(parseSubscriptionStatus("mystery"), "incomplete");
  });

  it("maps engine log rows onto channel and level", () => {
    assert.equal(logLevelFromStatus("failed"), "error");
    assert.equal(logLevelFromStatus("sent"), "success");
    assert.equal(channelFromLog("sms"), "sms");
    assert.equal(channelFromLog("voice"), "system");
  });

  it("flags first-lead Stripe holds for the master billing desk", () => {
    assert.equal(firstLeadBillingAlert("stripe_create_failed:card declined"), true);
    assert.equal(firstLeadBillingAlert("missing_saved_payment_method"), true);
    assert.equal(firstLeadBillingAlert("charge_axiom_pro_monthly"), false);
  });
});
