/** Shared lifecycle helpers for claim → first lead → billing → outreach. No SQL. */

import { parseShowcaseThemeId, type ShowcaseThemeId } from "./outreach-desk";

export const TRUST_WINDOW_HOURS = 24;
export const TRUST_WINDOW_MS = TRUST_WINDOW_HOURS * 60 * 60 * 1000;

export const APPROVAL_CADENCES = ["every_item", "daily_batch", "weekly_queue"] as const;
export type ApprovalCadence = (typeof APPROVAL_CADENCES)[number];

export const BILLING_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
export type LifecycleBillingStatus = (typeof BILLING_STATUSES)[number];

export function parseApprovalCadence(value: unknown): ApprovalCadence {
  const raw = String(value ?? "").trim();
  return (APPROVAL_CADENCES as readonly string[]).includes(raw) ? (raw as ApprovalCadence) : "every_item";
}

export function parseThemeKey(value: unknown): ShowcaseThemeId {
  return parseShowcaseThemeId(value);
}

export function themeKeyFromSearch(search: Record<string, string | string[] | undefined>): ShowcaseThemeId | "" {
  const raw = search.themeKey ?? search.theme ?? search.skin;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  const key = String(value).trim();
  return parseThemeKey(key) === key ? (key as ShowcaseThemeId) : "";
}

/** Fail closed: unknown Stripe statuses must not look active. */
export function mapStripeBillingStatus(raw: string, deleted = false): LifecycleBillingStatus {
  if (deleted) return "canceled";
  const status = String(raw ?? "").trim().toLowerCase();
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due" || status === "incomplete") return "past_due";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "canceled";
  return "canceled";
}

export function billingFromInvoiceFailure(): LifecycleBillingStatus {
  return "past_due";
}

export function simulatedTestAlert(shopName: string): { subject: string; body: string } {
  const name = shopName.replace(/\s+/g, " ").trim().slice(0, 80) || "Your shop";
  return {
    subject: `TEST ALERT — ${name} locked & loaded`,
    body: "[SIMULATED TEST] Dispatch channel check. Real emergency jobs will use this same alert. is_simulated=true",
  };
}

export function trustWindowOpen(createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() <= TRUST_WINDOW_MS;
}

export function emailFirstChannel(input: {
  canSms: boolean;
  canEmail: boolean;
  smsRemaining: number;
  emailRemaining: number;
}): "sms" | "email" | null {
  const email = input.canEmail && input.emailRemaining > 0;
  const sms = input.canSms && input.smsRemaining > 0;
  if (email) return "email";
  if (sms) return "sms";
  return null;
}

export function unsignedUnsubscribePath(email: string, token: string): string {
  const params = new URLSearchParams({ email: email.trim().toLowerCase(), token });
  return `/api/unsubscribe?${params.toString()}`;
}

export const AXIOM_PRO_PLAN = "axiom_pro";
export const AXIOM_PRO_MONTHLY_CENTS = 15_000;

export type FirstLeadBillingSnapshot = {
  awaitingFirstRealLead: boolean;
  plan: string;
  planStatus: string;
  billingStatus: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
};

export type FirstLeadActivationAction = "skip" | "record_pro" | "subscribe";

export type FirstLeadActivationDecision = {
  action: FirstLeadActivationAction;
  reason: string;
  preserveLifetime: boolean;
  plan: string;
  priceCents: number;
  billingStatus: string;
  clearAwaiting: boolean;
};

function isLifetimePlan(plan: string, planStatus: string, billingStatus: string): boolean {
  return (
    plan.trim().toLowerCase() === "lifetime" ||
    planStatus.trim().toLowerCase() === "lifetime" ||
    billingStatus.trim().toLowerCase() === "lifetime"
  );
}

/**
 * First verified real lead → $150/mo axiom_pro.
 * Simulated jobs never activate. Lifetime stays lifetime. An existing Stripe
 * subscription is never created twice.
 */
export function decideFirstLeadActivation(
  input: FirstLeadBillingSnapshot & { isSimulated: boolean },
): FirstLeadActivationDecision {
  const plan = input.plan.trim();
  const billingStatus = input.billingStatus.trim() || "trialing";
  if (input.isSimulated) {
    return {
      action: "skip",
      reason: "simulated_lead",
      preserveLifetime: false,
      plan,
      priceCents: 0,
      billingStatus,
      clearAwaiting: false,
    };
  }
  if (!input.awaitingFirstRealLead) {
    return {
      action: "skip",
      reason: "not_awaiting_first_real_lead",
      preserveLifetime: false,
      plan,
      priceCents: 0,
      billingStatus,
      clearAwaiting: false,
    };
  }
  if (isLifetimePlan(plan, input.planStatus, billingStatus)) {
    return {
      action: "skip",
      reason: "lifetime_preserved",
      preserveLifetime: true,
      plan: "lifetime",
      priceCents: 0,
      billingStatus: billingStatus === "lifetime" ? "active" : billingStatus,
      clearAwaiting: true,
    };
  }
  if (input.stripeSubscriptionId.trim()) {
    return {
      action: "skip",
      reason: "subscription_already_on_file",
      preserveLifetime: false,
      plan: plan && plan !== "unlock" ? plan : AXIOM_PRO_PLAN,
      priceCents: Math.max(input.plan === AXIOM_PRO_PLAN ? AXIOM_PRO_MONTHLY_CENTS : 0, AXIOM_PRO_MONTHLY_CENTS),
      billingStatus: billingStatus === "canceled" || billingStatus === "past_due" ? billingStatus : "active",
      clearAwaiting: true,
    };
  }
  if (!input.stripeCustomerId.trim() || !input.stripePaymentMethodId.trim()) {
    return {
      action: "record_pro",
      reason: "missing_saved_payment_method",
      preserveLifetime: false,
      plan: AXIOM_PRO_PLAN,
      priceCents: AXIOM_PRO_MONTHLY_CENTS,
      billingStatus: "trialing",
      clearAwaiting: true,
    };
  }
  if (!input.stripePriceId.trim()) {
    return {
      action: "record_pro",
      reason: "missing_stripe_price_id",
      preserveLifetime: false,
      plan: AXIOM_PRO_PLAN,
      priceCents: AXIOM_PRO_MONTHLY_CENTS,
      billingStatus: "trialing",
      clearAwaiting: true,
    };
  }
  return {
    action: "subscribe",
    reason: "charge_axiom_pro_monthly",
    preserveLifetime: false,
    plan: AXIOM_PRO_PLAN,
    priceCents: AXIOM_PRO_MONTHLY_CENTS,
    billingStatus: "active",
    clearAwaiting: true,
  };
}

export function axiomProPriceIdFromEnv(
  env: Record<string, string | undefined> = process.env,
): string {
  return (env.STRIPE_PRICE_AXIOM_PRO || env.STRIPE_PRICE_ID || "").trim();
}
