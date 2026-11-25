import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AXIOM_PRO_MONTHLY_CENTS,
  AXIOM_PRO_PLAN,
  billingFromInvoiceFailure,
  decideFirstLeadActivation,
  emailFirstChannel,
  mapStripeBillingStatus,
  parseApprovalCadence,
  parseThemeKey,
  simulatedTestAlert,
  themeKeyFromSearch,
  trustWindowOpen,
  unsignedUnsubscribePath,
} from "./lifecycle.ts";

test("Stripe billing maps cancel and failed renewals off active", () => {
  assert.equal(mapStripeBillingStatus("active"), "active");
  assert.equal(mapStripeBillingStatus("trialing"), "trialing");
  assert.equal(mapStripeBillingStatus("past_due"), "past_due");
  assert.equal(mapStripeBillingStatus("unpaid"), "canceled");
  assert.equal(mapStripeBillingStatus("active", true), "canceled");
  assert.equal(mapStripeBillingStatus("bogus"), "canceled");
  assert.equal(billingFromInvoiceFailure(), "past_due");
  assert.equal(mapStripeBillingStatus("incomplete", false), "past_due");
});

test("themeKey, cadence, email-first, and 24h trust window helpers", () => {
  assert.equal(parseThemeKey("pure_cyan"), "pure_cyan");
  assert.equal(parseThemeKey("nope"), "solar_gold");
  assert.equal(themeKeyFromSearch({ themeKey: "pure_cyan" }), "pure_cyan");
  assert.equal(themeKeyFromSearch({ theme: "nope" }), "");
  assert.equal(parseApprovalCadence("weekly_queue"), "weekly_queue");
  assert.equal(parseApprovalCadence(""), "every_item");
  assert.equal(emailFirstChannel({ canSms: true, canEmail: true, smsRemaining: 40, emailRemaining: 1 }), "email");
  assert.equal(emailFirstChannel({ canSms: true, canEmail: false, smsRemaining: 1, emailRemaining: 80 }), "sms");
  const now = new Date("2026-11-24T12:00:00Z");
  assert.equal(trustWindowOpen(new Date("2026-11-23T13:00:00Z"), now), true);
  assert.equal(trustWindowOpen(new Date("2026-11-22T11:00:00Z"), now), false);
});

test("simulated test alert is labeled and isolated from real jobs", () => {
  const copy = simulatedTestAlert("Rogue Valley Heating & Air");
  assert.match(copy.subject, /TEST ALERT/);
  assert.match(copy.subject, /locked & loaded/);
  assert.match(copy.body, /\[SIMULATED TEST\]/);
  assert.match(copy.body, /is_simulated=true/);
  assert.doesNotMatch(copy.body, /is_simulated=false/);
  assert.match(unsignedUnsubscribePath("desk@example.com", "abc"), /\/api\/unsubscribe/);
});

const awaitingShop = {
  awaitingFirstRealLead: true,
  plan: "unlock",
  planStatus: "unlocked",
  billingStatus: "unlocked",
  stripeCustomerId: "cus_1",
  stripePaymentMethodId: "pm_1",
  stripeSubscriptionId: "",
  stripePriceId: "price_axiom_pro",
};

test("simulated leads never start $150/mo even when a card is on file", () => {
  const decision = decideFirstLeadActivation({ ...awaitingShop, isSimulated: true });
  assert.equal(decision.action, "skip");
  assert.equal(decision.reason, "simulated_lead");
  assert.equal(decision.clearAwaiting, false);
  assert.notEqual(decision.plan, AXIOM_PRO_PLAN);
});

test("first verified real lead charges axiom_pro once and preserves lifetime", () => {
  const charge = decideFirstLeadActivation({ ...awaitingShop, isSimulated: false });
  assert.equal(charge.action, "subscribe");
  assert.equal(charge.plan, AXIOM_PRO_PLAN);
  assert.equal(charge.priceCents, AXIOM_PRO_MONTHLY_CENTS);
  assert.equal(charge.billingStatus, "active");

  const duplicate = decideFirstLeadActivation({
    ...awaitingShop,
    isSimulated: false,
    stripeSubscriptionId: "sub_live",
    plan: AXIOM_PRO_PLAN,
    billingStatus: "active",
  });
  assert.equal(duplicate.action, "skip");
  assert.equal(duplicate.reason, "subscription_already_on_file");

  const lifetime = decideFirstLeadActivation({
    ...awaitingShop,
    isSimulated: false,
    plan: "lifetime",
    planStatus: "lifetime",
    billingStatus: "active",
  });
  assert.equal(lifetime.action, "skip");
  assert.equal(lifetime.reason, "lifetime_preserved");
  assert.equal(lifetime.preserveLifetime, true);
  assert.equal(lifetime.plan, "lifetime");

  const noCard = decideFirstLeadActivation({
    ...awaitingShop,
    isSimulated: false,
    stripeCustomerId: "",
    stripePaymentMethodId: "",
    stripePriceId: "",
  });
  assert.equal(noCard.action, "record_pro");
  assert.equal(noCard.reason, "missing_saved_payment_method");
  assert.equal(noCard.plan, AXIOM_PRO_PLAN);

  const noPrice = decideFirstLeadActivation({
    ...awaitingShop,
    isSimulated: false,
    stripePriceId: "",
  });
  assert.equal(noPrice.action, "record_pro");
  assert.equal(noPrice.reason, "missing_stripe_price_id");
});

test("trust-window sweep never activates billing and ignores simulated jobs", () => {
  const server = readFileSync(new URL("./lifecycle.server.ts", import.meta.url), "utf8");
  const start = server.indexOf("export async function sweepExpiredTrustWindows");
  const end = server.indexOf("export async function bumpDailyCounter");
  const sweep = server.slice(start, end);
  assert.match(sweep, /is_simulated = false/);
  assert.doesNotMatch(sweep, /activateAfterFirstRealLead/);
  assert.doesNotMatch(sweep, /decideFirstLeadActivation/);
  const intake = readFileSync(new URL("../../app/api/leads/intake/route.ts", import.meta.url), "utf8");
  assert.match(intake, /if \(shop && !isSimulated\)/);
  assert.match(intake, /activateAfterFirstRealLead\(shop\.id, \{ isSimulated: false \}\)/);
  assert.match(server, /Idempotency-Key/);
  assert.match(server, /first-lead-sub-\$\{input\.shopId\}/);
  assert.match(server, /default_payment_method/);
  const payments = readFileSync(new URL("./payments.server.ts", import.meta.url), "utf8");
  assert.match(payments, /payment_intent_data\[setup_future_usage\]": "off_session"/);
  assert.match(payments, /invoice_settings\[default_payment_method\]/);
  assert.match(payments, /customer_creation: "always"/);
});
