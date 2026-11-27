import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("vercel cron hits /api/outreach/cron not the missing autopilot cron", () => {
  const vercel = readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8");
  assert.match(vercel, /\/api\/outreach\/cron/);
  assert.doesNotMatch(vercel, /\/api\/autopilot\/cron/);
  assert.match(vercel, /\/api\/master\/autopilot/);
});

test("cron requires a secret and retries failed shop_notifications", () => {
  const cron = readFileSync(new URL("./outreach-cron.server.ts", import.meta.url), "utf8");
  assert.match(cron, /requireCronSecret/);
  assert.match(cron, /retryFailedShopNotifications/);
  assert.match(cron, /refreshExpiringSocialTokens/);
  assert.match(cron, /tickShopAutopilot/);
});

test("0109 adds stripe_events PK and booking uniqueness", () => {
  const sql = readFileSync(new URL("../../../migrations/0109_booking_job_guards.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists stripe_events/);
  assert.match(sql, /consumer_leads_twilio_message_sid_idx/);
  assert.match(sql, /consumer_leads_booking_fingerprint_idx/);
  assert.match(sql, /retry_count/);
});

test("first-lead activation locks shop_billing and is decoupled from notify", () => {
  const server = readFileSync(new URL("./lifecycle.server.ts", import.meta.url), "utf8");
  assert.match(server, /for update/i);
  assert.match(server, /withTransaction/);
  const intake = readFileSync(new URL("../../app/api/leads/intake/route.ts", import.meta.url), "utf8");
  assert.match(intake, /honorSimulatedBooking/);
  assert.match(intake, /activateAfterFirstRealLead\(shop\.id, \{ isSimulated: false \}\)/);
  assert.match(intake, /status: 502/);
  const helper = readFileSync(new URL("../../app/api/storefront/helper/route.ts", import.meta.url), "utf8");
  assert.match(helper, /status: 502/);
});

test("Stripe webhook claims stripe_events before settlement", () => {
  const payments = readFileSync(new URL("./payments.server.ts", import.meta.url), "utf8");
  assert.match(payments, /claimDurableStripeEvent/);
  assert.match(payments, /on conflict \(id\) do nothing/);
  assert.match(payments, /releaseDurableStripeEvent/);
});
