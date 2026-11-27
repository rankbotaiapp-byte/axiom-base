import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  customerQuoteSms,
  customerReceiptSms,
  missedCallSlotSms,
  missedCallStatuses,
  ownerPaidSms,
  parsePaidCommand,
  parseQuoteCommand,
  parseSlotReply,
  quoteDepositCents,
  autoReviewSms,
  ownerProofPromptSms,
} from "./closed-job.ts";
import { nextOpenArrivalWindows, parseShopHoursJson } from "./slot-windows.ts";
import { GEAR_GUARDIAN_BPS } from "./merchant-pricing.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("missed call no-answer SMS lists two real windows then 1 locks the first", () => {
  assert.equal(missedCallStatuses("no-answer"), true);
  assert.equal(missedCallStatuses("busy"), true);
  assert.equal(missedCallStatuses("completed"), false);
  const now = new Date("2026-11-26T18:00:00.000Z");
  const windows = nextOpenArrivalWindows({
    now,
    hours: parseShopHoursJson('{"thu":"09:00-18:00","fri":"09:00-18:00"}'),
    staff: [{ id: "emp_1", availability: { thu: true, fri: true } }],
    busy: [],
    count: 2,
  });
  assert.equal(windows.length, 2);
  const sms = missedCallSlotSms({
    shopName: "Cascade Electric",
    shopSlug: "cascade-electric",
    origin: "https://rankbotapp.com",
    windows,
  });
  assert.match(sms, /Sorry we missed you at Cascade Electric/);
  assert.match(sms, /1:/);
  assert.match(sms, /2:/);
  assert.match(sms, /\/t\/cascade-electric#book/);
  assert.equal(parseSlotReply("1"), 1);
  assert.equal(parseSlotReply("2"), 2);
  assert.equal(parseSlotReply("water heater leaking"), "issue");
});

test("QUOTE SMS + paid atom copy: receipt, review, proof prompt", () => {
  const quote = parseQuoteCommand("QUOTE 350 8126 Water heater flush + thermocouple");
  assert.ok(quote);
  assert.equal(quote.amountCents, 35000);
  assert.equal(quote.customerToken, "8126");
  assert.match(quote.description, /Water heater flush/);
  const deposit = quoteDepositCents(quote.amountCents);
  assert.ok(deposit > 0 && deposit <= quote.amountCents);
  assert.equal(GEAR_GUARDIAN_BPS, 150);
  assert.match(
    customerQuoteSms({
      shopName: "Cascade Electric",
      amountCents: 35000,
      description: quote.description,
      quoteUrl: "https://rankbotapp.com/q/qte_1",
    }),
    /\/q\/qte_1/,
  );
  assert.equal(parsePaidCommand("PAID 8126"), "8126");
  assert.match(ownerPaidSms({ paidAmountCents: 10500, customerName: "Sam", description: quote.description }), /PAID:/);
  assert.match(customerReceiptSms({ shopName: "Cascade Electric", receiptUrl: "https://x/r" }), /receipt/);
  assert.match(
    autoReviewSms({ shopName: "Cascade Electric", googleReviewUrl: "https://g.page/r/x" }),
    /10-second review/,
  );
  assert.match(ownerProofPromptSms({ amountCents: 35000 }), /Reply 1 to publish/);
});

test("wiring: missed-call DialCallStatus, QUOTE, stripe_events, is_simulated=false", () => {
  const voice = readFileSync(join(root, "lib/axiom/twilio-booking.server.ts"), "utf8");
  const closed = readFileSync(join(root, "lib/axiom/closed-job.server.ts"), "utf8");
  const payments = readFileSync(join(root, "lib/axiom/payments.server.ts"), "utf8");
  const cha = readFileSync(join(root, "lib/axiom/cha-ching.server.ts"), "utf8");
  assert.match(voice, /DialCallStatus/);
  assert.match(voice, /handleVoiceMissedOrPress1/);
  assert.doesNotMatch(voice, /Date\.now\(\)\s*\+\s*2\s*\*\s*3600/);
  assert.match(closed, /handleOwnerQuoteSms/);
  assert.match(closed, /fireClosedJobAtom/);
  assert.match(closed, /is_simulated/);
  assert.match(payments, /stripe_events/);
  assert.match(payments, /fireClosedJobAtom/);
  assert.match(cha, /is_simulated/);
  assert.doesNotMatch(cha, /simulatedChaChingMetrics/);
});
