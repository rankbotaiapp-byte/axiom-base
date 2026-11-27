/** Sprint 2 pure helpers: OMW, Day-1 onboarding, quote-nudge copy, quiet hours. */

import { nationalDigits } from "./axiom-business-number.ts";
import { toE164 } from "./notify-target.ts";
import { sanitizeGoogleReviewUrl } from "./google-review-request.ts";

export const OMW_DEFAULT_ETA_MINUTES = 25;
export const QUOTE_NUDGE_WINDOW_START_MIN = 8 * 60;
export const QUOTE_NUDGE_WINDOW_END_MIN = 20 * 60;
export const DEFAULT_SERVICE_HOURS_START = "07:00";
export const DEFAULT_SERVICE_HOURS_END = "19:00";
export const DEFAULT_SHOP_TIMEZONE = "America/Los_Angeles";

export type OmwCommand = {
  last4: string;
  etaMinutes: number;
};

export function parseOmwCommand(body: string): OmwCommand | null {
  const match = body.trim().match(/^OMW\s+(\+?\d{4,15})(?:\s+(\d{1,3}))?\s*$/i);
  if (!match) return null;
  const digits = nationalDigits(match[1]);
  const last4 = digits.slice(-4);
  if (last4.length !== 4) return null;
  const etaRaw = match[2] ? Number(match[2]) : OMW_DEFAULT_ETA_MINUTES;
  if (!Number.isFinite(etaRaw) || etaRaw <= 0) return null;
  return { last4, etaMinutes: Math.min(180, Math.max(5, Math.round(etaRaw))) };
}

export type OmwCandidate = {
  id: string;
  customerName: string;
  customerPhone: string;
  startsAt: string;
  status: string;
};

export type OmwMatch =
  | { action: "lock"; job: OmwCandidate }
  | { action: "clarify"; jobs: OmwCandidate[] }
  | { action: "none" };

function pacificYmd(iso: string, timeZone = DEFAULT_SHOP_TIMEZONE): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
}

export function matchOmwAppointment(
  candidates: OmwCandidate[],
  last4: string,
  now = new Date(),
  timeZone = DEFAULT_SHOP_TIMEZONE,
): OmwMatch {
  const needle = last4.replace(/\D/g, "").slice(-4);
  const active = candidates.filter((row) => {
    if (row.status === "cancelled" || row.status === "completed") return false;
    return nationalDigits(row.customerPhone).endsWith(needle);
  });
  if (active.length === 0) return { action: "none" };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  const ranked = [...active].sort((a, b) => {
    const aToday = pacificYmd(a.startsAt, timeZone) === today ? 0 : 1;
    const bToday = pacificYmd(b.startsAt, timeZone) === today ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;
    return Math.abs(Date.parse(a.startsAt) - now.getTime()) - Math.abs(Date.parse(b.startsAt) - now.getTime());
  });
  const phones = new Set(ranked.map((row) => nationalDigits(row.customerPhone)));
  if (phones.size > 1) {
    return { action: "clarify", jobs: ranked.slice(0, 2) };
  }
  return { action: "lock", job: ranked[0] };
}

export function omwClarifySms(jobs: OmwCandidate[]): string {
  const lines = jobs.slice(0, 2).map((job) => {
    const phone = toE164(job.customerPhone) || job.customerPhone;
    return `${job.customerName || "Customer"} ${phone}`;
  });
  return `Two jobs match that last 4. Reply OMW with the full number, e.g. OMW ${nationalDigits(jobs[0]?.customerPhone || "5555550100")}:\n${lines.join("\n")}`;
}

export function omwCustomerSms(input: {
  shopName: string;
  etaMinutes: number;
  origin: string;
  shopSlug: string;
}): string {
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "the shop";
  const origin = input.origin.replace(/\/$/, "");
  return `${shop}: Our tech is on the way! Estimated arrival: ~${input.etaMinutes} mins. View your booking details: ${origin}/t/${input.shopSlug}#book`;
}

export function omwOwnerSms(input: { customerName: string; last4: string; etaMinutes: number }): string {
  const name = input.customerName.replace(/\s+/g, " ").trim() || "Customer";
  return `OMW sent to ${name} (${input.last4}) — ETA ${input.etaMinutes}m. Job marked En Route.`;
}

export function quoteNudgeSms(input: {
  customerFirstName: string;
  shopName: string;
  amountCents: number;
  description: string;
  origin: string;
  quoteId: string;
}): string {
  const first = (input.customerFirstName || "there").replace(/\s+/g, " ").trim().split(" ")[0] || "there";
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "the shop";
  const amount = (input.amountCents / 100).toFixed(0);
  const desc = input.description.replace(/\s+/g, " ").trim().slice(0, 80) || "your visit";
  const origin = input.origin.replace(/\/$/, "");
  return `Hi ${first}, quick reminder from ${shop} — your quote ($${amount} for ${desc}) is ready if you'd like to lock in your spot: ${origin}/q/${input.quoteId}`;
}

export function customerFirstName(full: string): string {
  return (full || "").replace(/\s+/g, " ").trim().split(" ")[0] || "there";
}

export function welcomeCheatSheetSms(shopName: string): string {
  const name = shopName.replace(/\s+/g, " ").trim() || "your shop";
  return `Axiom is live for ${name}. Text commands anytime: QUOTE 350 8126 Water heater flush | OMW 8126 | PAID 8126 | Reply 1 to publish job photos.`;
}

export function hoursJsonFromServiceWindow(
  start = DEFAULT_SERVICE_HOURS_START,
  end = DEFAULT_SERVICE_HOURS_END,
): string {
  const span = `${normalizeClock(start)}-${normalizeClock(end)}`;
  return JSON.stringify({
    mon: span,
    tue: span,
    wed: span,
    thu: span,
    fri: span,
    sat: span,
    sun: "closed",
  });
}

export function normalizeClock(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return DEFAULT_SERVICE_HOURS_START;
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2] || 0)));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseDay1Onboarding(input: {
  ownerPhone: string;
  googleReviewUrl?: string | null;
  hoursStart?: string | null;
  hoursEnd?: string | null;
  skipReview?: boolean;
}): { ok: true; ownerPhone: string; googleReviewUrl: string; hoursStart: string; hoursEnd: string } | { ok: false; error: string } {
  const ownerPhone = toE164(input.ownerPhone);
  if (!ownerPhone) return { ok: false, error: "Enter a valid mobile in E.164 / US 10-digit format." };
  const rawReview = (input.googleReviewUrl || "").trim();
  const googleReviewUrl = input.skipReview || !rawReview ? "" : sanitizeGoogleReviewUrl(rawReview);
  if (rawReview && !input.skipReview && !googleReviewUrl) {
    return { ok: false, error: "Use an https Google review or Maps link, or skip for now." };
  }
  return {
    ok: true,
    ownerPhone,
    googleReviewUrl,
    hoursStart: normalizeClock(input.hoursStart || DEFAULT_SERVICE_HOURS_START),
    hoursEnd: normalizeClock(input.hoursEnd || DEFAULT_SERVICE_HOURS_END),
  };
}

function zonedMinutes(now: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) bag[part.type] = part.value;
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return hour * 60 + Number(bag.minute);
}

/** Quote nudges: 08:00–20:00 shop-local. Outside that window, leave nudge_sent_at null. */
export function isQuoteNudgeSendWindow(now = new Date(), timeZone = DEFAULT_SHOP_TIMEZONE): boolean {
  const minutes = zonedMinutes(now, timeZone);
  return minutes >= QUOTE_NUDGE_WINDOW_START_MIN && minutes <= QUOTE_NUDGE_WINDOW_END_MIN;
}

export function quoteIsNudgeEligible(input: {
  status: string;
  nudgeSentAt: string | null;
  createdAt: string;
  now?: Date;
}): boolean {
  const status = input.status.trim().toLowerCase();
  if (status !== "pending" && status !== "sent") return false;
  if (input.nudgeSentAt) return false;
  const created = Date.parse(input.createdAt);
  const now = (input.now ?? new Date()).getTime();
  if (!Number.isFinite(created)) return false;
  const age = now - created;
  return age >= 24 * 3600_000 && age <= 72 * 3600_000;
}
