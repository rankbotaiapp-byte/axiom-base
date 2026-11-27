import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  hoursJsonFromServiceWindow,
  isQuoteNudgeSendWindow,
  matchOmwAppointment,
  omwCustomerSms,
  omwOwnerSms,
  parseDay1Onboarding,
  parseOmwCommand,
  quoteIsNudgeEligible,
  quoteNudgeSms,
  welcomeCheatSheetSms,
} from "./sprint2-dispatch.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("Day-1 onboarding validates owner phone and optional Google review", () => {
  const ok = parseDay1Onboarding({
    ownerPhone: "541-555-0100",
    googleReviewUrl: "https://g.page/r/cascade/review",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.ownerPhone, "+15415550100");
    assert.match(ok.googleReviewUrl, /g\.page/);
    assert.equal(ok.hoursStart, "07:00");
  }
  const skip = parseDay1Onboarding({ ownerPhone: "+15415550100", skipReview: true, googleReviewUrl: "https://evil.example" });
  assert.equal(skip.ok, true);
  if (skip.ok) assert.equal(skip.googleReviewUrl, "");
  const bad = parseDay1Onboarding({ ownerPhone: "nope" });
  assert.equal(bad.ok, false);
  const hours = hoursJsonFromServiceWindow("07:00", "19:00");
  assert.match(hours, /07:00-19:00/);
  assert.match(welcomeCheatSheetSms("Cascade Electric"), /OMW 8126/);
  assert.match(welcomeCheatSheetSms("Cascade Electric"), /QUOTE 350 8126/);
});

test("OMW 8126 defaults to 25m; OMW 8126 20 uses 20m; ambiguous last4 does not guess", () => {
  assert.deepEqual(parseOmwCommand("OMW 8126"), { last4: "8126", etaMinutes: 25 });
  assert.deepEqual(parseOmwCommand("omw 8126 20"), { last4: "8126", etaMinutes: 20 });
  const today = new Date("2026-11-27T18:00:00.000Z");
  const lock = matchOmwAppointment(
    [
      {
        id: "a1",
        customerName: "Sam",
        customerPhone: "+15415558126",
        startsAt: "2026-11-27T20:00:00.000Z",
        status: "confirmed",
      },
    ],
    "8126",
    today,
  );
  assert.equal(lock.action, "lock");
  if (lock.action === "lock") assert.equal(lock.job.id, "a1");
  const clarify = matchOmwAppointment(
    [
      {
        id: "a1",
        customerName: "Sam",
        customerPhone: "+15415558126",
        startsAt: "2026-11-27T20:00:00.000Z",
        status: "confirmed",
      },
      {
        id: "a2",
        customerName: "Alex",
        customerPhone: "+15035558126",
        startsAt: "2026-11-27T21:00:00.000Z",
        status: "pending",
      },
    ],
    "8126",
    today,
  );
  assert.equal(clarify.action, "clarify");
  assert.match(omwCustomerSms({ shopName: "Cascade", etaMinutes: 20, origin: "https://x", shopSlug: "cascade" }), /~20 mins/);
  assert.match(omwOwnerSms({ customerName: "Sam", last4: "8126", etaMinutes: 20 }), /En Route/);
});

test("24h unpaid quote nudge is quiet-hours gated and never resurrects ancient quotes", () => {
  const now = new Date("2026-11-27T20:00:00.000Z");
  const created36h = new Date(now.getTime() - 36 * 3600_000).toISOString();
  const created10h = new Date(now.getTime() - 10 * 3600_000).toISOString();
  const created80h = new Date(now.getTime() - 80 * 3600_000).toISOString();
  assert.equal(quoteIsNudgeEligible({ status: "pending", nudgeSentAt: null, createdAt: created36h, now }), true);
  assert.equal(quoteIsNudgeEligible({ status: "sent", nudgeSentAt: null, createdAt: created36h, now }), true);
  assert.equal(quoteIsNudgeEligible({ status: "pending", nudgeSentAt: null, createdAt: created10h, now }), false);
  assert.equal(quoteIsNudgeEligible({ status: "pending", nudgeSentAt: null, createdAt: created80h, now }), false);
  assert.equal(quoteIsNudgeEligible({ status: "paid", nudgeSentAt: null, createdAt: created36h, now }), false);
  assert.equal(quoteIsNudgeEligible({ status: "pending", nudgeSentAt: now.toISOString(), createdAt: created36h, now }), false);
  const noonPt = new Date("2026-11-27T20:00:00.000Z");
  const midnightPt = new Date("2026-11-27T08:00:00.000Z");
  assert.equal(isQuoteNudgeSendWindow(noonPt, "America/Los_Angeles"), true);
  assert.equal(isQuoteNudgeSendWindow(midnightPt, "America/Los_Angeles"), false);
  assert.match(
    quoteNudgeSms({
      customerFirstName: "Sam Lee",
      shopName: "Cascade Electric",
      amountCents: 35000,
      description: "Water heater flush",
      origin: "https://rankbotapp.com",
      quoteId: "qte_1",
    }),
    /\/q\/qte_1/,
  );
});

test("Sprint 2 wiring: OMW handler, welcome SMS once, quote nudge claim, 0113 migration", () => {
  const inbound = readFileSync(join(root, "lib/axiom/twilio-booking.server.ts"), "utf8");
  const server = readFileSync(join(root, "lib/axiom/sprint2-dispatch.server.ts"), "utf8");
  const cron = readFileSync(join(root, "lib/axiom/outreach-cron.server.ts"), "utf8");
  const smsRoute = readFileSync(join(root, "app/api/webhooks/twilio/sms/route.ts"), "utf8");
  const inboundAlias = readFileSync(join(root, "app/api/twilio/inbound/route.ts"), "utf8");
  const migration = readFileSync(join(root, "../migrations/0113_sprint2_dispatch_and_quote_nudges.sql"), "utf8");
  const day1 = readFileSync(join(root, "app/api/onboarding/day1/route.ts"), "utf8");
  assert.match(inbound, /handleOwnerOmwSms/);
  assert.match(smsRoute, /verifyTwilioSignature/);
  assert.match(day1, /DAY1_UNAVAILABLE/);
  assert.match(day1, /NextResponse.json/);
  assert.match(inboundAlias, /webhooks\/twilio\/sms/);
  assert.match(server, /welcome_sms_sent_at/);
  assert.match(server, /nudge_sent_at is null/);
  assert.match(server, /is_simulated/);
  assert.match(cron, /sweepUnpaidQuoteNudges/);
  assert.match(cron, /requireCronSecret/);
  assert.match(cron, /axiom-verify-/);
  assert.match(migration, /dispatched_at/);
  assert.match(migration, /nudge_sent_at/);
  assert.match(migration, /onboarding_completed_at/);
  assert.match(migration, /quotes_pending_nudge_idx/);
});
