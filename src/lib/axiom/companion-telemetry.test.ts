import assert from "node:assert/strict";
import { test } from "node:test";
import {
  companionStatusFromStripeEvent,
  companionStatusFromTwilioEvent,
  scoreCompanionStatus,
  stripeCompanionEventType,
  twilioCompanionEventType,
} from "./companion-telemetry.ts";

test("stripe trials and payment failures map to companion hues", () => {
  assert.equal(companionStatusFromStripeEvent("checkout.session.completed"), "good");
  assert.equal(companionStatusFromStripeEvent("invoice.payment_succeeded"), "good");
  assert.equal(companionStatusFromStripeEvent("invoice.payment_failed"), "alert");
  assert.equal(companionStatusFromStripeEvent("payment_intent.payment_failed"), "alert");
  assert.equal(companionStatusFromStripeEvent("customer.subscription.deleted"), "warning");
  assert.equal(companionStatusFromStripeEvent("customer.subscription.updated"), null);
  assert.equal(stripeCompanionEventType("checkout.session.completed"), "stripe.trial.created");
  assert.equal(stripeCompanionEventType("invoice.payment_failed"), "stripe.invoice.failed");
});

test("twilio delivery outcomes map to companion hues", () => {
  assert.equal(companionStatusFromTwilioEvent("delivered"), "good");
  assert.equal(companionStatusFromTwilioEvent("queued"), "warning");
  assert.equal(companionStatusFromTwilioEvent("failed"), "alert");
  assert.equal(companionStatusFromTwilioEvent("undelivered", "30007"), "alert");
  assert.equal(twilioCompanionEventType("failed"), "twilio.sms.failed");
});

test("alert outranks good inside the five-minute window", () => {
  const now = Date.now();
  const snap = scoreCompanionStatus(
    [
      {
        status: "good",
        source: "stripe",
        detail: "trial",
        eventType: "stripe.trial.created",
        shopId: null,
        createdAt: new Date(now - 60_000).toISOString(),
      },
      {
        status: "alert",
        source: "twilio",
        detail: "failed",
        eventType: "twilio.sms.failed",
        shopId: null,
        createdAt: new Date(now - 10_000).toISOString(),
      },
    ],
    now,
  );
  assert.equal(snap.status, "alert");
  assert.equal(snap.source, "twilio");
  assert.equal(snap.eventType, "twilio.sms.failed");
});
