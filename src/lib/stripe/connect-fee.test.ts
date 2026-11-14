import assert from "node:assert/strict";
import test from "node:test";
import { APPLICATION_FEE_PERCENT, resolveApplicationFeeCents, stampCheckoutSessionShare } from "./connect-fee.ts";
import { preferLiveStripe, resolveStripeKeys } from "./keys.ts";
import { GEAR_GUARDIAN_BPS, GEAR_GUARDIAN_FEE_PERCENT } from "../axiom/merchant-pricing.ts";

test("Gear Guardian application_fee_percent is 1.5 (150 bps)", () => {
  assert.equal(APPLICATION_FEE_PERCENT, 1.5);
  assert.equal(GEAR_GUARDIAN_FEE_PERCENT, 1.5);
  assert.equal(GEAR_GUARDIAN_BPS, 150);
  assert.equal(resolveApplicationFeeCents(10_000), 150);
});

test("checkout sessions stamp destination transfer + 1.5% fee onto the platform", () => {
  const params = new URLSearchParams({ mode: "payment" });
  const { feeCents, percent } = stampCheckoutSessionShare(params, {
    destination: "acct_shop_express",
    amountCents: 10_000,
  });
  assert.equal(percent, 1.5);
  assert.equal(feeCents, 150);
  assert.equal(params.get("payment_intent_data[transfer_data][destination]"), "acct_shop_express");
  assert.equal(params.get("payment_intent_data[on_behalf_of]"), "acct_shop_express");
  assert.equal(params.get("payment_intent_data[application_fee_amount]"), "150");
  assert.equal(params.get("payment_intent_data[metadata][application_fee_percent]"), "1.5");
  assert.equal(params.get("metadata[application_fee_percent]"), "1.5");
  assert.equal(params.get("metadata[gear_guardian_llc]"), "platform");
});

test("live vs test Stripe secrets must match publishable keys", () => {
  assert.equal(preferLiveStripe({ NODE_ENV: "production", VERCEL_ENV: "production" }), true);
  assert.equal(preferLiveStripe({ NODE_ENV: "development", VERCEL_ENV: "preview" }), false);
  const testKeys = resolveStripeKeys({
    NODE_ENV: "development",
    STRIPE_SECRET_KEY: "sk_test_abc",
    STRIPE_PUBLISHABLE_KEY: "pk_test_xyz",
  });
  assert.equal(testKeys.mode, "test");
  const liveKeys = resolveStripeKeys({
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    STRIPE_SECRET_KEY_LIVE: "sk_live_abc",
    STRIPE_PUBLISHABLE_KEY_LIVE: "pk_live_xyz",
  });
  assert.equal(liveKeys.mode, "live");
  assert.throws(
    () =>
      resolveStripeKeys({
        NODE_ENV: "development",
        STRIPE_SECRET_KEY: "sk_test_abc",
        STRIPE_PUBLISHABLE_KEY: "pk_live_xyz",
      }),
    /mismatch/,
  );
});
