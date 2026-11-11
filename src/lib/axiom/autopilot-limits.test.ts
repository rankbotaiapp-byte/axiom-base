import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTOPILOT_EMAIL_DAILY_CAP,
  AUTOPILOT_SMS_DAILY_CAP,
  TRICKLE_DELAY_MAX_MS,
  TRICKLE_DELAY_MIN_MS,
  canDispatchNow,
  evaluateDispatchGate,
  getNextTrickleDelayMs,
  isInsideAutopilotHours,
  isWeekendLocal,
  nextAutopilotOpen,
} from "./autopilot-limits.ts";

test("daily caps lock at 40 SMS per number and 80 emails per inbox", () => {
  assert.equal(AUTOPILOT_SMS_DAILY_CAP, 40);
  assert.equal(AUTOPILOT_EMAIL_DAILY_CAP, 80);
  const mondayNoon = new Date("2026-10-05T19:00:00.000Z");
  assert.equal(canDispatchNow({ now: mondayNoon, channel: "sms", smsSentToday: 39 }), true);
  assert.equal(canDispatchNow({ now: mondayNoon, channel: "sms", smsSentToday: 40 }), false);
  assert.equal(evaluateDispatchGate({ now: mondayNoon, channel: "sms", smsSentToday: 40 }).reason, "sms_cap");
  assert.equal(canDispatchNow({ now: mondayNoon, channel: "email", emailSentToday: 79 }), true);
  assert.equal(canDispatchNow({ now: mondayNoon, channel: "email", emailSentToday: 80 }), false);
  assert.equal(evaluateDispatchGate({ now: mondayNoon, channel: "email", emailSentToday: 80 }).reason, "email_cap");
});

test("operating window is weekdays 9:00 AM–4:00 PM local and weekends are blocked", () => {
  const mondayEight = new Date("2026-10-05T15:00:00.000Z");
  const mondayNine = new Date("2026-10-05T16:00:00.000Z");
  const mondayFour = new Date("2026-10-05T23:00:00.000Z");
  const mondayFourOhOne = new Date("2026-10-05T23:01:00.000Z");
  const fridayThree = new Date("2026-10-09T22:00:00.000Z");
  const saturdayNoon = new Date("2026-10-10T19:00:00.000Z");
  const sundayMorning = new Date("2026-10-11T17:00:00.000Z");

  assert.equal(isInsideAutopilotHours(mondayEight), false);
  assert.equal(canDispatchNow({ now: mondayEight }), false);
  assert.equal(evaluateDispatchGate({ now: mondayEight }).reason, "outside_window");
  assert.equal(canDispatchNow({ now: mondayNine }), true);
  assert.equal(canDispatchNow({ now: mondayFour }), true);
  assert.equal(canDispatchNow({ now: mondayFourOhOne }), false);
  assert.equal(canDispatchNow({ now: fridayThree }), true);
  assert.equal(isWeekendLocal(saturdayNoon), true);
  assert.equal(evaluateDispatchGate({ now: saturdayNoon }).reason, "weekend");
  assert.equal(evaluateDispatchGate({ now: sundayMorning }).reason, "weekend");
  assert.equal(canDispatchNow({ now: saturdayNoon }), false);
  assert.equal(nextAutopilotOpen(mondayEight).toISOString(), "2026-10-05T16:00:00.000Z");
  assert.equal(nextAutopilotOpen(saturdayNoon).toISOString(), "2026-10-12T16:00:00.000Z");
});

test("trickle delay is a randomized 45–90 second gap between consecutive messages", () => {
  assert.equal(getNextTrickleDelayMs(() => 0), TRICKLE_DELAY_MIN_MS);
  assert.equal(getNextTrickleDelayMs(() => 1), TRICKLE_DELAY_MAX_MS);
  const mid = getNextTrickleDelayMs(() => 0.5);
  assert.ok(mid >= TRICKLE_DELAY_MIN_MS && mid <= TRICKLE_DELAY_MAX_MS);
  for (let i = 0; i < 40; i += 1) {
    const ms = getNextTrickleDelayMs();
    assert.ok(ms >= 45_000 && ms <= 90_000);
  }

  const mondayNoon = new Date("2026-10-05T19:00:00.000Z");
  const tooSoon = new Date(mondayNoon.getTime() - 20_000).toISOString();
  const ready = new Date(mondayNoon.getTime() - 45_000).toISOString();
  assert.equal(evaluateDispatchGate({ now: mondayNoon, lastSentAt: tooSoon }).reason, "trickle_gap");
  assert.equal(canDispatchNow({ now: mondayNoon, lastSentAt: tooSoon }), false);
  assert.equal(canDispatchNow({ now: mondayNoon, lastSentAt: ready }), true);
});
