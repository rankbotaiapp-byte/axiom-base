import assert from "node:assert/strict";
import test from "node:test";
import { applyThrottleBump } from "./autopilot-limits.ts";
import {
  THROTTLE_BUMP_SECONDS,
  detectTelemetrySource,
  evaluateOutreachHealth,
  hourlyHealthSlot,
  parseResendWebhook,
  parseTwilioStatusCallback,
  pickBackupNumber,
  type SendIdentity,
  type TelemetryEvent,
} from "./self-correction.ts";

function sms(partial: Partial<TelemetryEvent> & { eventType: string }): TelemetryEvent {
  return {
    provider: "twilio",
    channel: "sms",
    errorCode: "",
    identity: "+15555550100",
    destination: "+15555550999",
    messageSid: "SM1",
    ...partial,
  };
}

function email(partial: Partial<TelemetryEvent> & { eventType: string }): TelemetryEvent {
  return {
    provider: "resend",
    channel: "email",
    errorCode: "",
    identity: "Axiom <desk@axiom.example>",
    destination: "lead@example.com",
    messageSid: "em_1",
    ...partial,
  };
}

test("parses Twilio undelivered / 30007 and Resend bounce / complaint payloads", () => {
  const twilio = parseTwilioStatusCallback({
    MessageStatus: "undelivered",
    ErrorCode: "30007",
    From: "+15555550100",
    To: "+15555550999",
    MessageSid: "SMabc",
  });
  assert.equal(twilio?.eventType, "undelivered");
  assert.equal(twilio?.errorCode, "30007");
  assert.equal(twilio?.identity, "+15555550100");

  const bounced = parseResendWebhook({
    type: "email.bounced",
    data: { email_id: "em_9", to: ["lead@example.com"], from: "Axiom <desk@axiom.example>" },
  });
  assert.equal(bounced?.eventType, "bounced");
  const complained = parseResendWebhook({ type: "email.complained", data: { email_id: "em_8", to: "x@y.z" } });
  assert.equal(complained?.eventType, "complained");
  assert.equal(detectTelemetrySource("application/x-www-form-urlencoded", "MessageStatus=failed&ErrorCode=30007"), "twilio");
  assert.equal(detectTelemetrySource("application/json", '{"type":"email.bounced","data":{}}'), "resend");
});

test("Rule A pauses a sending number above 5% Twilio 30007 and routes to backup", () => {
  const events: TelemetryEvent[] = [];
  for (let i = 0; i < 20; i += 1) {
    events.push(
      sms({
        eventType: i < 2 ? "undelivered" : "delivered",
        errorCode: i < 2 ? "30007" : "",
        messageSid: `SM${i}`,
      }),
    );
  }
  const pool: SendIdentity[] = [
    { identity: "+15555550100", channel: "sms", role: "primary", status: "active" },
    { identity: "+15555550199", channel: "sms", role: "backup", status: "active" },
  ];
  const health = evaluateOutreachHealth({ events, identities: pool });
  const burn = health.actions.find((action) => action.rule === "sms_burn");
  assert.ok(burn && burn.rule === "sms_burn");
  assert.equal(burn.pauseIdentity, "+15555550100");
  assert.equal(burn.routeTo, "+15555550199");
  assert.equal(pickBackupNumber("+15555550100", pool), "+15555550199");
});

test("Rule B pauses the dataset chunk when email bounce rate exceeds 2%", () => {
  const events: TelemetryEvent[] = [];
  for (let i = 0; i < 50; i += 1) {
    events.push(email({ eventType: i < 2 ? "bounced" : "delivered", messageSid: `em_${i}` }));
  }
  const health = evaluateOutreachHealth({ events });
  const bounce = health.actions.find((action) => action.rule === "email_bounce");
  assert.ok(bounce && bounce.rule === "email_bounce");
  assert.equal(bounce.pauseChunk, true);
  assert.ok(health.emailBounceRate > 0.02);
});

test("Rule C bumps AXIOM delay window by 30 seconds when error rate ticks up", () => {
  const bumped = applyThrottleBump({ minDelaySeconds: 45, maxDelaySeconds: 90 }, THROTTLE_BUMP_SECONDS);
  assert.equal(bumped.minDelaySeconds, 75);
  assert.equal(bumped.maxDelaySeconds, 120);
  const events: TelemetryEvent[] = [];
  for (let i = 0; i < 40; i += 1) {
    events.push(sms({ eventType: i < 4 ? "failed" : "delivered", messageSid: `SM${i}` }));
  }
  const health = evaluateOutreachHealth({
    events,
    limits: { minDelaySeconds: 45, maxDelaySeconds: 90 },
    previousErrorRate: 0,
    previousConversionVelocity: 0.4,
    conversionVelocity: 0.2,
  });
  const throttle = health.actions.find((action) => action.rule === "throttle");
  assert.ok(throttle && throttle.rule === "throttle");
  assert.equal(throttle.limits.minDelaySeconds, 75);
  assert.equal(throttle.limits.maxDelaySeconds, 120);
});

test("hourly health slot fires at the end of weekday dispatch hours only", () => {
  const nineFifty = new Date("2026-10-05T16:50:00.000Z"); // 9:50 AM PDT
  const mondayNoon = new Date("2026-10-05T19:10:00.000Z");
  const saturday = new Date("2026-10-10T16:50:00.000Z");
  assert.equal(hourlyHealthSlot(nineFifty), "2026-10-05-H9");
  assert.equal(hourlyHealthSlot(mondayNoon), null);
  assert.equal(hourlyHealthSlot(saturday), null);
});
