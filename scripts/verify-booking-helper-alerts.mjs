/**
 * Booking + helper + designated SMS/email alert verification.
 *
 *   npx tsx scripts/verify-booking-helper-alerts.mjs
 *   npx tsx --test src/lib/axiom/storefront-helper.test.ts
 *
 * Live canary (does not send unless providers are configured):
 *   E2E_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-booking-helper-alerts.mjs --live
 */
import assert from "node:assert/strict";
import { formatNotifyDispatchDetail, persistThenNotify } from "../src/lib/axiom/notify-dispatch.ts";
import { resolveShopLeadAlerts } from "../src/lib/axiom/notify-prefs.ts";
import { handleStorefrontHelperTurn } from "../src/lib/axiom/storefront-helper.ts";
import { parseResendWebhook, parseTwilioStatusCallback } from "../src/lib/axiom/self-correction.ts";

const rows = [];

async function check(name, fn) {
  try {
    await fn();
    rows.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    rows.push({ name, ok: false, detail: err instanceof Error ? err.message : String(err) });
    console.log(`FAIL  ${name}`);
    console.log(`      ${err instanceof Error ? err.message : err}`);
  }
}

await check("helper FAQ then booking with name + mobile", () => {
  const shop = { shopName: "Cascade Electric", phone: "(541) 555-0148", cities: ["Medford"] };
  const faq = handleStorefrontHelperTurn({ ...shop, message: "Are you licensed?" });
  assert.equal(faq.intent, "answer");
  const book = handleStorefrontHelperTurn({ ...shop, message: "Book Ada 5415550148 panel" });
  assert.equal(book.intent, "book");
  assert.equal(book.guestPhone, "+15415550148");
});

await check("designated notification_phone and notification_email win", () => {
  const route = resolveShopLeadAlerts({
    notify_email: "legacy@shop.example",
    notify_phone: "5415550100",
    notification_email: "owner@shop.example",
    notification_phone: "+15415550999",
  });
  assert.equal(route.email, "owner@shop.example");
  assert.equal(route.phone, "+15415550999");
});

await check("appointment persist is independent of notify failure", async () => {
  const result = await persistThenNotify(
    async () => ({ id: "lead_1" }),
    async () => {
      throw new Error("Twilio timeout");
    },
  );
  assert.equal(result.stored.id, "lead_1");
  assert.equal(result.notifyOk, false);
});

await check("Twilio + Resend delivery webhooks parse delivered/failed/bounced", () => {
  const sms = parseTwilioStatusCallback({
    MessageStatus: "delivered",
    MessageSid: "SM1",
    To: "+15415550999",
    From: "+15415550100",
  });
  assert.equal(sms?.eventType, "delivered");
  const failed = parseTwilioStatusCallback({ MessageStatus: "failed", MessageSid: "SM2", ErrorCode: "30003" });
  assert.equal(failed?.eventType, "failed");
  const bounced = parseResendWebhook({
    type: "email.bounced",
    data: { email_id: "em_1", to: ["owner@shop.example"] },
  });
  assert.equal(bounced?.eventType, "bounced");
  const delivered = parseResendWebhook({
    type: "email.delivered",
    data: { email_id: "em_2", to: ["owner@shop.example"] },
  });
  assert.equal(delivered?.eventType, "delivered");
  assert.match(
    formatNotifyDispatchDetail({
      channel: "email",
      to: "owner@shop.example",
      status: "sent",
      provider: "resend",
      providerId: "em_2",
      error: "",
    }),
    /to=owner@shop.example/,
  );
});

if (process.argv.includes("--live")) {
  const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  await check(`live helper POST ${base}/api/storefront/helper`, async () => {
    const res = await fetch(`${base}/api/storefront/helper`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug: "cascade-electric",
        message: "What are your hours?",
      }),
    });
    const json = await res.json();
    assert.equal(res.ok, true);
    assert.equal(json.intent, "answer");
    assert.match(String(json.reply), /clock|dispatch|book/i);
  });
}

const failed = rows.filter((row) => !row.ok);
console.log("");
console.log(`${rows.length - failed.length}/${rows.length} checks passed`);
console.log("");
console.log("Live phone + email canary:");
console.log("  1. Set shops.notification_phone and shops.notification_email for the shop.");
console.log("  2. Confirm RESEND_API_KEY, RESEND_FROM, TWILIO_* and TWILIO_A2P_LIVE + OUTREACH_MODE=live.");
console.log("  3. Point Twilio status callback and Resend webhooks at /api/webhooks/telemetry.");
console.log("  4. On /t/{slug} open HELP, send: Book Ada 5415550148 panel");
console.log("  5. Confirm shop_notifications rows for sms + email and outreach_telemetry_logs delivery events.");
process.exit(failed.length ? 1 : 0);
