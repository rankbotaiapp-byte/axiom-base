import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { channelFromLog, logLevelFromStatus, parseSubscriptionStatus } from "./master-dashboard.ts";

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
});
