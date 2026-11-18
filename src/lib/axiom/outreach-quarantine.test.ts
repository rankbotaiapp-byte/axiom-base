import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeQuarantineDestination,
  quarantineReasonFromTelemetry,
  shouldQuarantineTelemetry,
} from "./outreach-quarantine.ts";

test("normalizes phone and email destinations for quarantine keys", () => {
  assert.equal(normalizeQuarantineDestination("sms", "+1 (555) 867-5309"), "5558675309");
  assert.equal(normalizeQuarantineDestination("email", " Owner@Shop.COM "), "owner@shop.com");
});

test("maps Resend bounce/complaint and Twilio undelivered to quarantine reasons", () => {
  assert.equal(quarantineReasonFromTelemetry("bounced"), "bounce");
  assert.equal(quarantineReasonFromTelemetry("email.complained"), "complaint");
  assert.equal(quarantineReasonFromTelemetry("undelivered"), "undelivered");
  assert.equal(quarantineReasonFromTelemetry("failed", "30007"), "failed");
  assert.equal(quarantineReasonFromTelemetry("delivered"), null);
  assert.equal(shouldQuarantineTelemetry("complained"), true);
  assert.equal(shouldQuarantineTelemetry("sent"), false);
});
