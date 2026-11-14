/**
 * Strict carrier-safe autopilot guardrails.
 * Caps are per sending identity (Twilio line / Resend inbox).
 * Wall clock is shop-local Pacific — Vercel is UTC.
 */

export const AUTOPILOT_TIME_ZONE = "America/Los_Angeles";
export const AUTOPILOT_SMS_DAILY_CAP = 40;
export const AUTOPILOT_EMAIL_DAILY_CAP = 80;
/** Inclusive 9:00 AM. */
export const AUTOPILOT_WINDOW_START_MINUTES = 9 * 60;
/** Inclusive 4:00 PM (the 16:00 trickle slot may still fire). */
export const AUTOPILOT_WINDOW_END_MINUTES = 16 * 60;
export const TRICKLE_DELAY_MIN_SECONDS = 45;
export const TRICKLE_DELAY_MAX_SECONDS = 90;
export const TRICKLE_DELAY_MIN_MS = TRICKLE_DELAY_MIN_SECONDS * 1000;
export const TRICKLE_DELAY_MAX_MS = TRICKLE_DELAY_MAX_SECONDS * 1000;
export const TRICKLE_DELAY_MIN_CAP_SECONDS = 180;
export const TRICKLE_DELAY_MAX_CAP_SECONDS = 240;

/** Live delay window. Self-correction may bump both sides by 30s. */
export type AutopilotLimitState = {
  minDelaySeconds: number;
  maxDelaySeconds: number;
};

export const AXIOM_AUTOPILOT_LIMITS: AutopilotLimitState = {
  minDelaySeconds: TRICKLE_DELAY_MIN_SECONDS,
  maxDelaySeconds: TRICKLE_DELAY_MAX_SECONDS,
};

export function hydrateAutopilotLimits(next: Partial<AutopilotLimitState>): AutopilotLimitState {
  if (typeof next.minDelaySeconds === "number" && Number.isFinite(next.minDelaySeconds)) {
    AXIOM_AUTOPILOT_LIMITS.minDelaySeconds = Math.max(TRICKLE_DELAY_MIN_SECONDS, Math.round(next.minDelaySeconds));
  }
  if (typeof next.maxDelaySeconds === "number" && Number.isFinite(next.maxDelaySeconds)) {
    AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds = Math.max(
      AXIOM_AUTOPILOT_LIMITS.minDelaySeconds,
      Math.round(next.maxDelaySeconds),
    );
  }
  return { ...AXIOM_AUTOPILOT_LIMITS };
}

export function applyThrottleBump(
  limits: AutopilotLimitState,
  bumpSeconds = 30,
): AutopilotLimitState {
  const minDelaySeconds = Math.min(TRICKLE_DELAY_MIN_CAP_SECONDS, Math.max(TRICKLE_DELAY_MIN_SECONDS, limits.minDelaySeconds + bumpSeconds));
  const maxDelaySeconds = Math.min(
    TRICKLE_DELAY_MAX_CAP_SECONDS,
    Math.max(minDelaySeconds, limits.maxDelaySeconds + bumpSeconds),
  );
  return { minDelaySeconds, maxDelaySeconds };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type AutopilotChannel = "sms" | "email";

export type DispatchGateInput = {
  now?: Date;
  timeZone?: string;
  channel?: AutopilotChannel | null;
  /** SMS already sent today from this Twilio number. */
  smsSentToday?: number;
  /** Emails already sent today from this inbox. */
  emailSentToday?: number;
  lastSentAt?: Date | string | null;
};

export type DispatchHoldReason = "ok" | "weekend" | "outside_window" | "sms_cap" | "email_cap" | "trickle_gap";

export type DispatchGate = {
  allowed: boolean;
  reason: DispatchHoldReason;
  retryAt: Date | null;
  delayMs: number;
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutes: number;
};

function zonedParts(date: Date, timeZone: string): ZonedParts {
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
  for (const part of fmt.formatToParts(date)) bag[part.type] = part.value;
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  const weekday = WEEKDAYS.indexOf(bag.weekday as (typeof WEEKDAYS)[number]);
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    weekday: weekday < 0 ? 0 : weekday,
    minutes: hour * 60 + Number(bag.minute),
  };
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    Math.floor(parts.minutes / 60),
    parts.minutes % 60,
    0,
  );
  return asUtc - instant.getTime();
}

function zonedDateTime(year: number, month: number, day: number, minutes: number, timeZone: string): Date {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone);
  const adjusted = utcGuess - timeZoneOffsetMs(new Date(utc), timeZone);
  if (adjusted !== utc) utc = adjusted;
  return new Date(utc);
}

function addCalendarDays(year: number, month: number, day: number, add: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + add));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    weekday: utc.getUTCDay(),
  };
}

export function isWeekendLocal(now: Date, timeZone = AUTOPILOT_TIME_ZONE): boolean {
  const weekday = zonedParts(now, timeZone).weekday;
  return weekday === 0 || weekday === 6;
}

export function isAutopilotWeekday(weekday: number): boolean {
  return weekday >= 1 && weekday <= 5;
}

/** True at 9:00 AM through 4:00 PM local, weekdays only. */
export function isInsideAutopilotHours(now: Date, timeZone = AUTOPILOT_TIME_ZONE): boolean {
  const parts = zonedParts(now, timeZone);
  if (!isAutopilotWeekday(parts.weekday)) return false;
  return parts.minutes >= AUTOPILOT_WINDOW_START_MINUTES && parts.minutes <= AUTOPILOT_WINDOW_END_MINUTES;
}

/** Next 9:00 AM weekday instant at or after `now`. */
export function nextAutopilotOpen(now: Date, timeZone = AUTOPILOT_TIME_ZONE): Date {
  if (isInsideAutopilotHours(now, timeZone)) return now;
  const parts = zonedParts(now, timeZone);
  for (let add = 0; add < 10; add += 1) {
    const day = addCalendarDays(parts.year, parts.month, parts.day, add);
    if (!isAutopilotWeekday(day.weekday)) continue;
    if (add === 0 && parts.minutes > AUTOPILOT_WINDOW_END_MINUTES) continue;
    const start = zonedDateTime(day.year, day.month, day.day, AUTOPILOT_WINDOW_START_MINUTES, timeZone);
    if (start.getTime() >= now.getTime() - 1_000) return start;
  }
  return now;
}

function parseSentAt(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function dailyCapForChannel(channel: AutopilotChannel): number {
  return channel === "sms" ? AUTOPILOT_SMS_DAILY_CAP : AUTOPILOT_EMAIL_DAILY_CAP;
}

/**
 * Randomized human-like gap between consecutive outbound messages.
 * Always lands in 45–90 seconds (inclusive).
 */
export function getNextTrickleDelayMs(
  rng: () => number = Math.random,
  limits: AutopilotLimitState = AXIOM_AUTOPILOT_LIMITS,
): number {
  const lo = Math.max(TRICKLE_DELAY_MIN_SECONDS, limits.minDelaySeconds) * 1000;
  const hi = Math.max(lo, limits.maxDelaySeconds * 1000);
  const t = Math.min(1, Math.max(0, rng()));
  return Math.round(lo + t * (hi - lo));
}

export function evaluateDispatchGate(input: DispatchGateInput = {}): DispatchGate {
  const now = input.now ?? new Date();
  const timeZone = input.timeZone ?? AUTOPILOT_TIME_ZONE;
  const retryOpen = () => nextAutopilotOpen(now, timeZone);

  if (isWeekendLocal(now, timeZone)) {
    return { allowed: false, reason: "weekend", retryAt: retryOpen(), delayMs: 0 };
  }
  if (!isInsideAutopilotHours(now, timeZone)) {
    return { allowed: false, reason: "outside_window", retryAt: retryOpen(), delayMs: 0 };
  }

  const smsSent = Math.max(0, Math.floor(input.smsSentToday ?? 0));
  const emailSent = Math.max(0, Math.floor(input.emailSentToday ?? 0));
  const channel = input.channel ?? null;
  if ((channel === "sms" || channel == null) && smsSent >= AUTOPILOT_SMS_DAILY_CAP) {
    const tomorrow = new Date(now.getTime() + 18 * 3600_000);
    return { allowed: false, reason: "sms_cap", retryAt: nextAutopilotOpen(tomorrow, timeZone), delayMs: 0 };
  }
  if ((channel === "email" || channel == null) && emailSent >= AUTOPILOT_EMAIL_DAILY_CAP) {
    const tomorrow = new Date(now.getTime() + 18 * 3600_000);
    return { allowed: false, reason: "email_cap", retryAt: nextAutopilotOpen(tomorrow, timeZone), delayMs: 0 };
  }

  const last = parseSentAt(input.lastSentAt);
  if (last != null) {
    const elapsed = now.getTime() - last;
    const minGap = Math.max(TRICKLE_DELAY_MIN_SECONDS, AXIOM_AUTOPILOT_LIMITS.minDelaySeconds) * 1000;
    if (elapsed < minGap) {
      const wait = minGap - elapsed;
      return {
        allowed: false,
        reason: "trickle_gap",
        retryAt: new Date(now.getTime() + wait),
        delayMs: wait,
      };
    }
  }

  return { allowed: true, reason: "ok", retryAt: null, delayMs: 0 };
}

/** Hard gate before any Twilio SMS or Resend email leaves the worker. */
export function canDispatchNow(input: DispatchGateInput = {}): boolean {
  return evaluateDispatchGate(input).allowed;
}
