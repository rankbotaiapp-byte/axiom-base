/** Anti-spam caps and staggered send times for the outreach_queue worker. */

export const OUTREACH_SMS_DAILY_CAP = 40;
export const OUTREACH_EMAIL_DAILY_CAP = 80;
export const OUTREACH_JITTER_MIN_SECONDS = 8;
export const OUTREACH_JITTER_MAX_SECONDS = 42;

export type OutreachQueueChannel = "sms" | "email";
export type OutreachQueueStatus = "pending" | "sent" | "failed" | "rate_limited";

export type OutreachQueueRow = {
  id: string;
  businessName: string;
  phone: string;
  email: string;
  niche: string;
  channel: OutreachQueueChannel;
  status: OutreachQueueStatus;
  scheduledFor: string;
  sentAt: string | null;
};

export function dailyCapFor(channel: OutreachQueueChannel): number {
  return channel === "sms" ? OUTREACH_SMS_DAILY_CAP : OUTREACH_EMAIL_DAILY_CAP;
}

export function remainingDailyCap(sentToday: number, channel: OutreachQueueChannel): number {
  return Math.max(0, dailyCapFor(channel) - Math.max(0, sentToday));
}

/** True when another send on this channel would exceed the hard daily ceiling. */
export function isRateLimited(sentToday: number, channel: OutreachQueueChannel): boolean {
  return remainingDailyCap(sentToday, channel) <= 0;
}

export function jitterSeconds(
  rng: () => number = Math.random,
  min = OUTREACH_JITTER_MIN_SECONDS,
  max = OUTREACH_JITTER_MAX_SECONDS,
): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.round(lo + rng() * (hi - lo));
}

/** Spread `count` sends so consecutive dispatches never leave in the same second. */
export function staggerSchedule(count: number, start: Date, rng: () => number = Math.random): Date[] {
  const out: Date[] = [];
  let cursor = start.getTime();
  for (let i = 0; i < count; i += 1) {
    cursor += jitterSeconds(rng) * 1000;
    out.push(new Date(cursor));
  }
  return out;
}

export function decideDispatch(
  channel: OutreachQueueChannel,
  sentToday: number,
): { status: "ok" | "rate_limited"; remaining: number } {
  const remaining = remainingDailyCap(sentToday, channel);
  if (remaining <= 0) return { status: "rate_limited", remaining: 0 };
  return { status: "ok", remaining };
}

/** Hold until the next Pacific morning plus a little jitter so retries do not burst. */
export function nextDayHold(now: Date, rng: () => number = Math.random): Date {
  const next = new Date(now.getTime() + 18 * 3600_000);
  next.setUTCHours(17, 0, 0, 0); // ~9:00 AM Pacific year-round approximation
  return new Date(next.getTime() + jitterSeconds(rng, 30, 180) * 1000);
}
