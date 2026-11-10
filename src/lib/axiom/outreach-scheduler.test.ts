import assert from "node:assert/strict";
import test from "node:test";
import {
  OUTREACH_EMAIL_DAILY_CAP,
  OUTREACH_SMS_DAILY_CAP,
  dailyCapFor,
  decideDispatch,
  isRateLimited,
  jitterSeconds,
  remainingDailyCap,
  staggerSchedule,
} from "./outreach-scheduler.ts";

test("anti-spam caps are 40 SMS and 80 email", () => {
  assert.equal(OUTREACH_SMS_DAILY_CAP, 40);
  assert.equal(OUTREACH_EMAIL_DAILY_CAP, 80);
  assert.equal(dailyCapFor("sms"), 40);
  assert.equal(dailyCapFor("email"), 80);
});

test("rate limit trips exactly at the daily ceiling", () => {
  assert.equal(isRateLimited(39, "sms"), false);
  assert.equal(isRateLimited(40, "sms"), true);
  assert.equal(isRateLimited(80, "email"), true);
  assert.equal(remainingDailyCap(12, "sms"), 28);
  assert.equal(decideDispatch("sms", 40).status, "rate_limited");
  assert.equal(decideDispatch("email", 10).status, "ok");
});

test("staggered schedule applies jitter so sends are not simultaneous", () => {
  let i = 0;
  const rng = () => {
    i += 1;
    return (i % 10) / 10;
  };
  const times = staggerSchedule(5, new Date("2026-11-09T17:00:00.000Z"), rng);
  assert.equal(times.length, 5);
  for (let n = 1; n < times.length; n += 1) {
    assert.ok(times[n]!.getTime() > times[n - 1]!.getTime());
  }
  const j = jitterSeconds(() => 0.5);
  assert.ok(j >= 8 && j <= 42);
});
