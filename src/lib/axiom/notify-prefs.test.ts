import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveShopLeadAlerts } from "./notify-prefs.ts";

test("lead alerts default on and fall back to legacy notify_*", () => {
  const route = resolveShopLeadAlerts({
    notify_email: "shop@example.com",
    notify_phone: "5415550100",
  });
  assert.equal(route.smsEnabled, true);
  assert.equal(route.emailEnabled, true);
  assert.equal(route.phone, "5415550100");
  assert.equal(route.email, "shop@example.com");
  assert.equal(route.skipSms, false);
  assert.equal(route.skipEmail, false);
});

test("dedicated notification_* destinations win over storefront contacts", () => {
  const route = resolveShopLeadAlerts({
    notify_email: "shop@example.com",
    notify_phone: "5415550100",
    notification_email: "owner@example.com",
    notification_phone: "+15415550199",
    notify_sms_enabled: true,
    notify_email_enabled: true,
  });
  assert.equal(route.phone, "+15415550199");
  assert.equal(route.email, "owner@example.com");
});

test("toggles skip Twilio and Resend even when destinations exist", () => {
  const route = resolveShopLeadAlerts({
    notification_email: "owner@example.com",
    notification_phone: "+15415550199",
    notify_sms_enabled: false,
    notify_email_enabled: false,
  });
  assert.equal(route.skipSms, true);
  assert.equal(route.skipEmail, true);
  assert.match(route.smsSkipDetail, /SMS alerts are off/);
  assert.match(route.emailSkipDetail, /Email alerts are off/);
});

test("Twilio and Resend shop dispatch reads tenant preference columns", () => {
  const src = readFileSync(new URL("./notify.server.ts", import.meta.url), "utf8");
  assert.match(src, /resolveShopLeadAlerts/);
  assert.match(src, /notify_sms_enabled/);
  assert.match(src, /notification_phone/);
  assert.match(src, /notify_email_enabled/);
  assert.match(src, /notification_email/);
  assert.match(src, /skipSms: alerts\.skipSms/);
  assert.match(src, /skipEmail: alerts\.skipEmail/);
});

test("enabled channel with a blank destination is skipped", () => {
  const route = resolveShopLeadAlerts({
    notify_sms_enabled: true,
    notify_email_enabled: true,
    notification_phone: "",
    notification_email: "  ",
  });
  assert.equal(route.skipSms, true);
  assert.equal(route.skipEmail, true);
  assert.match(route.smsSkipDetail, /No notification phone/);
  assert.match(route.emailSkipDetail, /No notification email/);
});
