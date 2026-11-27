/** Closed-job loop copy, quote parsing, ROI, and paid-atom decisions (pure). */

import { AXIOM_PRO_MONTHLY_CENTS } from "./lifecycle.ts";
import { dueNowCents, type MerchantPrice } from "./merchant-pricing.ts";
import { nationalDigits } from "./axiom-business-number.ts";
import { toE164 } from "./notify-target.ts";
import { isInsideAutopilotHours, AUTOPILOT_TIME_ZONE } from "./autopilot-limits.ts";
import type { ArrivalWindow } from "./slot-windows.ts";

export const EMPTY_BOOK_MESSAGE = "$0 booked so far — ready for your first call";
export const CLOSED_JOB_REVIEW_DELAY_MS = 30 * 60 * 1000;

export type BillingForRoi = {
  plan?: string | null;
  status?: string | null;
  priceCents?: number | null;
  awaitingFirstRealLead?: boolean | null;
};

export function axiomSubscriptionCostCents(billing: BillingForRoi | null | undefined): number {
  if (!billing) return AXIOM_PRO_MONTHLY_CENTS;
  const plan = String(billing.plan ?? "").toLowerCase();
  const status = String(billing.status ?? "").toLowerCase();
  if (plan.includes("lifetime") || status === "lifetime") return 0;
  if (billing.awaitingFirstRealLead) return 0;
  const price = Number(billing.priceCents ?? 0);
  if (price > 0 && price <= 100) return 0;
  if (status === "trialing") return 0;
  if (status === "canceled" || status === "unpaid") return 0;
  return AXIOM_PRO_MONTHLY_CENTS;
}

export function netRoiCents(verifiedRevenueCents: number, billing: BillingForRoi | null | undefined): number {
  return Math.round(verifiedRevenueCents) - axiomSubscriptionCostCents(billing);
}

export function emptyChaChingCopy(): string {
  return EMPTY_BOOK_MESSAGE;
}

export function formatNetRoiDigest(input: {
  shopName: string;
  verifiedRevenueCents: number;
  netRoiCents: number;
  subscriptionCostCents: number;
  emptyBook: boolean;
}): string {
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "Your shop";
  if (input.emptyBook) {
    return `${shop}: ${EMPTY_BOOK_MESSAGE}. Net ROI $0.`;
  }
  const roi = (input.netRoiCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const verified = (input.verifiedRevenueCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const sub = (input.subscriptionCostCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return `${shop}: Axiom paid for itself — Net ROI ${roi} (verified ${verified} − ${sub}).`;
}

export function missedCallSlotSms(input: {
  shopName: string;
  shopSlug: string;
  origin: string;
  windows: ArrivalWindow[];
}): string {
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "the shop";
  const origin = input.origin.replace(/\/$/, "");
  const bookUrl = `${origin}/t/${input.shopSlug}#book`;
  const lines = input.windows.map((window) => `${window.index}: ${window.label}`);
  const slots =
    lines.length > 0
      ? lines.join("\n")
      : "No staff windows are open in the next two weeks — reply with what's going on and we'll call you back.";
  return `Sorry we missed you at ${shop} — we're on a job right now. Reply with what's going on, or tap a real open arrival window below to lock your spot:\n${slots}\n${bookUrl}`;
}

export function parseSlotReply(body: string): 1 | 2 | "issue" | null {
  const token = body.trim().toUpperCase();
  if (token === "1") return 1;
  if (token === "2") return 2;
  if (!token || /^(STOP|START|HELP|YES|NO|CONFIRM|BOOK)$/i.test(token)) return null;
  if (/^(QUOTE|PAID|OMW|REVIEW|HERO|BEFORE|AFTER|PROOF|PUBLISH|UNDO)\b/i.test(token)) return null;
  return "issue";
}

export type QuoteCommand = {
  amountCents: number;
  customerToken: string;
  description: string;
};

export function parseQuoteCommand(body: string): QuoteCommand | null {
  const match = body.trim().match(/^QUOTE\s+(\d+(?:\.\d{1,2})?)\s+(\+?\d{4,15})\s*(.*)$/i);
  if (!match) return null;
  const dollars = Number(match[1]);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return {
    amountCents: Math.round(dollars * 100),
    customerToken: match[2],
    description: (match[3] || "Service visit").replace(/\s+/g, " ").trim().slice(0, 180),
  };
}

export function parsePaidCommand(body: string): string | null {
  const match = body.trim().match(/^PAID\s+(\+?\d{4,15})\s*$/i);
  return match?.[1] ?? null;
}

export function matchCustomerPhone(token: string, candidates: Array<string | null | undefined>): string | null {
  const needle = nationalDigits(token);
  if (needle.length === 4) {
    const hits = candidates
      .map((row) => toE164(row || "") || "")
      .filter((row) => nationalDigits(row).endsWith(needle));
    return hits.length === 1 ? hits[0] : hits[0] || null;
  }
  return toE164(token) || (needle.length === 10 ? toE164(token) : null);
}

export function quoteDepositCents(totalCents: number, merchant?: MerchantPrice | null): number {
  const total = Math.max(0, Math.round(totalCents));
  if (total <= 0) return 0;
  if (merchant) {
    const due = dueNowCents(merchant, total);
    if (due > 0) return Math.min(total, due);
  }
  if (total <= 5000) return total;
  return Math.min(total, Math.max(5000, Math.round(total * 0.3)));
}

export function customerQuoteSms(input: {
  shopName: string;
  amountCents: number;
  description: string;
  quoteUrl: string;
}): string {
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "Your shop";
  const amount = (input.amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const desc = input.description.replace(/\s+/g, " ").trim() || "the visit";
  return `${shop} sent your quote for ${amount} (${desc}). Approve & lock your spot in 1 tap here: ${input.quoteUrl}`;
}

export function ownerPaidSms(input: {
  paidAmountCents: number;
  customerName: string;
  description: string;
}): string {
  const amount = (input.paidAmountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const name = input.customerName.replace(/\s+/g, " ").trim() || "customer";
  const desc = input.description.replace(/\s+/g, " ").trim() || "the job";
  return `PAID: ${amount} from ${name} for ${desc}. Slot locked.`;
}

export function ownerSlotAlertSms(input: {
  customerName: string;
  customerPhone: string;
  issue: string;
  windowLabel: string;
}): string {
  const name = input.customerName.replace(/\s+/g, " ").trim() || "Caller";
  const issue = input.issue.replace(/\s+/g, " ").trim() || "callback / lock-in";
  return `SLOT LOCKED: ${name} ${input.customerPhone} — ${issue}. Window: ${input.windowLabel}.`;
}

export function customerReceiptSms(input: {
  shopName: string;
  receiptUrl: string;
  shopPhone?: string | null;
}): string {
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "the shop";
  const phone = (input.shopPhone || "").trim();
  const contact = phone ? ` Warranty/questions: ${phone}.` : "";
  return `${shop}: payment received. Your receipt: ${input.receiptUrl}.${contact}`;
}

export function autoReviewSms(input: { shopName: string; googleReviewUrl: string }): string {
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "the shop";
  return `Thanks for choosing ${shop}! Mind leaving a quick 10-second review? ${input.googleReviewUrl}`;
}

export function ownerProofPromptSms(input: { amountCents: number }): string {
  const amount = (input.amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return `Job marked PAID (${amount}). Reply 1 to publish your branded proof card to GBP & Socials.`;
}

export function shouldSendReviewNow(now = new Date(), timeZone = AUTOPILOT_TIME_ZONE): boolean {
  return isInsideAutopilotHours(now, timeZone);
}

export function reviewSendAt(paidAt = new Date(), timeZone = AUTOPILOT_TIME_ZONE): Date {
  const earliest = new Date(paidAt.getTime() + CLOSED_JOB_REVIEW_DELAY_MS);
  if (shouldSendReviewNow(earliest, timeZone)) return earliest;
  const walk = new Date(earliest.getTime());
  for (let i = 0; i < 72; i += 1) {
    walk.setUTCHours(walk.getUTCHours() + 1);
    if (shouldSendReviewNow(walk, timeZone)) return walk;
  }
  return earliest;
}

export function missedCallStatuses(status: string): boolean {
  const key = status.trim().toLowerCase().replace(/_/g, "-");
  return key === "no-answer" || key === "busy" || key === "failed" || key === "canceled" || key === "cancelled";
}

export function isOwnerPublishReply(body: string): boolean {
  const token = body.trim().toUpperCase();
  return token === "1" || token === "PUBLISH";
}
