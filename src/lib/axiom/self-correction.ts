/**
 * Autonomous outreach health: Twilio / Resend telemetry → pause, reroute, cool down.
 * Pure rules — persistence lives in self-correction.server.ts.
 */

import {
  AXIOM_AUTOPILOT_LIMITS,
  AUTOPILOT_TIME_ZONE,
  applyThrottleBump,
  type AutopilotLimitState,
} from "./autopilot-limits.ts";

export const TELEMETRY_SAMPLE_SIZE = 100;
export const SMS_VIOLATION_RATE_LIMIT = 0.05;
export const EMAIL_BOUNCE_RATE_LIMIT = 0.02;
export const SMS_VIOLATION_MIN_SAMPLE = 10;
export const EMAIL_BOUNCE_MIN_SAMPLE = 10;
export const ERROR_TICK_UP = 0.005;
export const CONVERSION_DROP_RATIO = 0.85;
export const TWILIO_CARRIER_FILTER_CODE = "30007";
export const THROTTLE_BUMP_SECONDS = 30;

export type TelemetryProvider = "twilio" | "resend";
export type TelemetryChannel = "sms" | "email";

export type TelemetryEvent = {
  provider: TelemetryProvider;
  channel: TelemetryChannel;
  eventType: string;
  errorCode: string;
  identity: string;
  destination: string;
  messageSid: string;
};

export type SendIdentity = {
  identity: string;
  channel: TelemetryChannel;
  role: "primary" | "backup";
  status: "active" | "paused";
};

export type HealthAction =
  | {
      rule: "sms_burn";
      pauseIdentity: string;
      routeTo: string | null;
      summary: string;
      detail: string;
    }
  | {
      rule: "email_bounce";
      pauseChunk: boolean;
      summary: string;
      detail: string;
    }
  | {
      rule: "throttle";
      limits: AutopilotLimitState;
      summary: string;
      detail: string;
    };

export type HealthAssessment = {
  sampleSize: number;
  smsCount: number;
  emailCount: number;
  errorRate: number;
  smsViolationRate: number;
  emailBounceRate: number;
  conversionVelocity: number;
  actions: HealthAction[];
};

const SMS_FAIL = new Set(["undelivered", "failed"]);
const EMAIL_FAIL = new Set(["bounced", "complained", "bounce", "complaint"]);

export function normalizeErrorCode(value: unknown): string {
  return String(value ?? "").trim();
}

export function isTwilioCarrierViolation(event: Pick<TelemetryEvent, "eventType" | "errorCode">): boolean {
  const code = normalizeErrorCode(event.errorCode);
  if (code === TWILIO_CARRIER_FILTER_CODE) return true;
  const status = event.eventType.trim().toLowerCase();
  return SMS_FAIL.has(status) && code === TWILIO_CARRIER_FILTER_CODE;
}

export function isEmailReputationHit(event: Pick<TelemetryEvent, "eventType">): boolean {
  const type = event.eventType.trim().toLowerCase().replace(/^email\./, "");
  return EMAIL_FAIL.has(type);
}

export function isSmsError(event: TelemetryEvent): boolean {
  if (event.channel !== "sms") return false;
  const type = event.eventType.trim().toLowerCase();
  return SMS_FAIL.has(type) || isTwilioCarrierViolation(event);
}

export function isEmailError(event: TelemetryEvent): boolean {
  if (event.channel !== "email") return false;
  return isEmailReputationHit(event);
}

/** Twilio statusCallback: form fields MessageStatus, ErrorCode, From, To, MessageSid. */
export function parseTwilioStatusCallback(body: Record<string, string>): TelemetryEvent | null {
  const status = (body.MessageStatus || body.SmsStatus || body.messageStatus || "").trim().toLowerCase();
  if (!status) return null;
  const errorCode = normalizeErrorCode(body.ErrorCode || body.error_code || body.ErrorCode);
  return {
    provider: "twilio",
    channel: "sms",
    eventType: status,
    errorCode,
    identity: (body.From || body.from || "").trim(),
    destination: (body.To || body.to || "").trim().slice(0, 40),
    messageSid: (body.MessageSid || body.SmsSid || body.messageSid || "").trim(),
  };
}

/** Resend: email.bounced / email.complained (and delivered/sent for the 100-message window). */
export function parseResendWebhook(payload: unknown): TelemetryEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const type = String(root.type ?? root.event ?? "").trim().toLowerCase();
  if (!type.startsWith("email.")) return null;
  const data =
    root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const toRaw = data.to;
  const dest = Array.isArray(toRaw) ? String(toRaw[0] ?? "") : String(toRaw ?? data.email ?? "");
  const eventType = type.replace(/^email\./, "");
  return {
    provider: "resend",
    channel: "email",
    eventType,
    errorCode: eventType === "bounced" || eventType === "bounce" ? "bounce" : eventType === "complained" ? "complaint" : "",
    identity: String(data.from ?? "").trim(),
    destination: dest.trim().slice(0, 160),
    messageSid: String(data.email_id ?? data.id ?? "").trim(),
  };
}

export function takeLastMessages(events: readonly TelemetryEvent[], size = TELEMETRY_SAMPLE_SIZE): TelemetryEvent[] {
  if (events.length <= size) return [...events];
  return events.slice(events.length - size);
}

function rate(hits: number, total: number): number {
  if (total <= 0) return 0;
  return hits / total;
}

export function pickBackupNumber(pausedIdentity: string, pool: readonly SendIdentity[]): string | null {
  const backups = pool.filter(
    (row) =>
      row.channel === "sms" &&
      row.status === "active" &&
      row.identity !== pausedIdentity &&
      (row.role === "backup" || row.role === "primary"),
  );
  const backup = backups.find((row) => row.role === "backup") ?? backups[0];
  return backup?.identity ?? null;
}

export type EvaluateHealthInput = {
  events: TelemetryEvent[];
  identities?: SendIdentity[];
  limits?: AutopilotLimitState;
  previousErrorRate?: number;
  previousConversionVelocity?: number;
  conversionVelocity?: number;
};

/**
 * Score the last 100 messages and emit Rule A / B / C actions.
 */
export function evaluateOutreachHealth(input: EvaluateHealthInput): HealthAssessment {
  const sample = takeLastMessages(input.events);
  const sms = sample.filter((row) => row.channel === "sms");
  const email = sample.filter((row) => row.channel === "email");
  const smsViolations = sms.filter((row) => isTwilioCarrierViolation(row)).length;
  const emailHits = email.filter((row) => isEmailReputationHit(row)).length;
  const errors = sample.filter((row) => isSmsError(row) || isEmailError(row)).length;
  const errorRate = rate(errors, sample.length);
  const smsViolationRate = rate(smsViolations, sms.length);
  const emailBounceRate = rate(emailHits, email.length);
  const conversionVelocity = Math.min(1, Math.max(0, input.conversionVelocity ?? 0));
  const actions: HealthAction[] = [];

  const byNumber = new Map<string, TelemetryEvent[]>();
  for (const row of sms) {
    const key = row.identity.trim() || "unknown";
    const list = byNumber.get(key) ?? [];
    list.push(row);
    byNumber.set(key, list);
  }
  const pool = input.identities ?? [];
  for (const [identity, rows] of byNumber) {
    if (identity === "unknown" || rows.length < SMS_VIOLATION_MIN_SAMPLE) continue;
    const viol = rows.filter((row) => isTwilioCarrierViolation(row)).length;
    const violRate = rate(viol, rows.length);
    if (violRate > SMS_VIOLATION_RATE_LIMIT) {
      const routeTo = pickBackupNumber(identity, pool);
      actions.push({
        rule: "sms_burn",
        pauseIdentity: identity,
        routeTo,
        summary: `Paused ${identity} after ${(violRate * 100).toFixed(1)}% carrier violations.`,
        detail: routeTo
          ? `Twilio 30007 rate ${viol}/${rows.length} exceeded 5%. Routing to ${routeTo}.`
          : `Twilio 30007 rate ${viol}/${rows.length} exceeded 5%. No backup number is active.`,
      });
    }
  }

  if (email.length >= EMAIL_BOUNCE_MIN_SAMPLE && emailBounceRate > EMAIL_BOUNCE_RATE_LIMIT) {
    actions.push({
      rule: "email_bounce",
      pauseChunk: true,
      summary: `Paused the current dataset chunk after ${(emailBounceRate * 100).toFixed(1)}% bounce/complaint rate.`,
      detail: `${emailHits} bounce or complaint events in ${email.length} emails (limit 2%). Flagged for manual re-verification.`,
    });
  }

  const prevError = input.previousErrorRate ?? 0;
  const prevConv = input.previousConversionVelocity ?? conversionVelocity;
  const errorTicked = sample.length >= 20 && errorRate >= prevError + ERROR_TICK_UP && errorRate > prevError;
  const conversionDropped =
    sample.length >= 20 && prevConv > 0 && conversionVelocity < prevConv * CONVERSION_DROP_RATIO;
  if (errorTicked || conversionDropped) {
    const current = input.limits ?? { ...AXIOM_AUTOPILOT_LIMITS };
    const next = applyThrottleBump(current, THROTTLE_BUMP_SECONDS);
    if (next.minDelaySeconds !== current.minDelaySeconds || next.maxDelaySeconds !== current.maxDelaySeconds) {
      actions.push({
        rule: "throttle",
        limits: next,
        summary: `Cooled sending: delay window is now ${next.minDelaySeconds}–${next.maxDelaySeconds}s.`,
        detail: errorTicked
          ? `Error rate moved from ${(prevError * 100).toFixed(1)}% to ${(errorRate * 100).toFixed(1)}%.`
          : `Conversion velocity dropped from ${prevConv.toFixed(3)} to ${conversionVelocity.toFixed(3)}.`,
      });
    }
  }

  return {
    sampleSize: sample.length,
    smsCount: sms.length,
    emailCount: email.length,
    errorRate,
    smsViolationRate,
    emailBounceRate,
    conversionVelocity,
    actions,
  };
}

/** End-of-hour slot during 9:00 AM–4:00 PM Pacific. Null outside the window. */
export function hourlyHealthSlot(now: Date, timeZone = AUTOPILOT_TIME_ZONE): string | null {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) bag[part.type] = part.value;
  const weekday = bag.weekday;
  if (weekday === "Sat" || weekday === "Sun") return null;
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  const minute = Number(bag.minute);
  if (hour < 9 || hour > 16) return null;
  if (hour === 16 && minute > 0) return null;
  if (minute < 50 && !(hour >= 10 && minute <= 8)) return null;
  const slotHour = minute < 50 ? hour - 1 : hour;
  if (slotHour < 9) return null;
  return `${bag.year}-${bag.month}-${bag.day}-H${slotHour}`;
}

export function formBodyToRecord(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const params = new URLSearchParams(text);
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}

export function detectTelemetrySource(contentType: string, bodyText: string): "twilio" | "resend" | null {
  const type = contentType.toLowerCase();
  const text = bodyText.trim();
  if (type.includes("json") || text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { type?: string };
      if (String(parsed.type ?? "").toLowerCase().startsWith("email.")) return "resend";
    } catch {
      return null;
    }
  }
  if (type.includes("form") || /MessageStatus=|SmsStatus=|ErrorCode=/.test(text)) return "twilio";
  return null;
}
