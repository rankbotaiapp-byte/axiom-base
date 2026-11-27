import assert from "node:assert/strict";
import test from "node:test";
import { persistThenNotify, formatNotifyDispatchDetail } from "./notify-dispatch.ts";
import { resolveShopLeadAlerts } from "./notify-prefs.ts";
import {
  answerStorefrontQuestion,
  extractGuestName,
  extractGuestPhone,
  handleStorefrontHelperTurn,
  wantsBooking,
} from "./storefront-helper.ts";

const shop = {
  shopName: "Cascade Electric",
  phone: "(541) 555-0148",
  cities: ["Medford", "Ashland"],
  niche: "electrical",
};

test("helper answers hours and area without booking", () => {
  const hours = answerStorefrontQuestion(shop, "What are your hours?");
  assert.match(hours ?? "", /around the clock/i);
  const area = handleStorefrontHelperTurn({ ...shop, message: "What cities do you cover?" });
  assert.equal(area.intent, "answer");
  assert.match(area.reply, /Medford/);
  assert.equal(wantsBooking("how much for a panel"), false);
});

test("helper collects contact then books with designated-alert payload", () => {
  assert.equal(extractGuestPhone("Call me at 541-555-0199"), "+15415550199");
  assert.equal(extractGuestName("I'm Ada Lane"), "Ada Lane");
  const need = handleStorefrontHelperTurn({ ...shop, message: "Book me for a panel upgrade" });
  assert.equal(need.intent, "need_contact");
  const book = handleStorefrontHelperTurn({
    ...shop,
    message: "Book Ada 541-555-0148 for a panel outage",
  });
  assert.equal(book.intent, "book");
  assert.equal(book.guestName, "Ada");
  assert.equal(book.guestPhone, "+15415550148");
  assert.match(book.service, /Electrical|Emergency/i);
});

test("designated notify prefs target notification_* phone and email", () => {
  const route = resolveShopLeadAlerts({
    notify_email: "desk@shop.example",
    notify_phone: "5415550100",
    notification_email: "owner@shop.example",
    notification_phone: "+15415550199",
  });
  assert.equal(route.email, "owner@shop.example");
  assert.equal(route.phone, "+15415550199");
  assert.equal(route.skipSms, false);
  assert.equal(route.skipEmail, false);
});

test("persist survives notify timeout/500 and logs provider ids", async () => {
  const happy = await persistThenNotify(
    async () => ({ id: "lead_ok" }),
    async () => undefined,
  );
  assert.equal(happy.stored.id, "lead_ok");
  assert.equal(happy.notifyOk, true);

  const failed = await persistThenNotify(
    async () => ({ id: "lead_kept" }),
    async () => {
      throw new Error("Resend 500");
    },
  );
  assert.equal(failed.stored.id, "lead_kept");
  assert.equal(failed.notifyOk, false);
  assert.match(failed.notifyError, /Resend 500/);

  const line = formatNotifyDispatchDetail({
    channel: "sms",
    to: "+15415550199",
    status: "sent",
    provider: "twilio",
    providerId: "SMabc",
    error: "",
  });
  assert.match(line, /to=\+15415550199/);
  assert.match(line, /id=SMabc/);
  assert.match(line, /status=sent/);
});
