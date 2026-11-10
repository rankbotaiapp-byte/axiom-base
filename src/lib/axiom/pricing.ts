import {
  FOUNDER_LIFETIME_CENTS,
  NAME_YOUR_PRICE_MIN_CENTS,
  STANDARD_MONTHLY_CENTS,
} from "../stripe/commercial.ts";

/** Territory plans the preview and the pitch screen sell. Amounts are cents. */

export const TERRITORY_PLANS = [
  {
    id: "trial",
    name: "Name Your Price · Month 1",
    /** Display / floor — actual first charge is the named price (≥ $1). */
    amountCents: NAME_YOUR_PRICE_MIN_CENTS,
    minAmountCents: NAME_YOUR_PRICE_MIN_CENTS,
    cadence: "trial",
    summary: `Name your Month 1 price ($1 minimum). Automatically becomes $${STANDARD_MONTHLY_CENTS / 100}/mo on day 31.`,
    renewalCents: STANDARD_MONTHLY_CENTS,
  },
  {
    id: "lifetime",
    name: "Founder's Lifetime Access",
    amountCents: FOUNDER_LIFETIME_CENTS,
    minAmountCents: FOUNDER_LIFETIME_CENTS,
    cadence: "once",
    summary: `$${FOUNDER_LIFETIME_CENTS / 100} once. Permanent storefront access. Zero monthly fees.`,
    renewalCents: null,
  },
] as const;

/** Legacy id still resolved for existing activations / open checkouts. */
const LEGACY_GROWTH = {
  id: "growth",
  name: "Standard Monthly",
  amountCents: STANDARD_MONTHLY_CENTS,
  minAmountCents: STANDARD_MONTHLY_CENTS,
  cadence: "month",
  summary: `$${STANDARD_MONTHLY_CENTS / 100} every month.`,
  renewalCents: STANDARD_MONTHLY_CENTS,
} as const;

export type TerritoryPlanId = (typeof TERRITORY_PLANS)[number]["id"];
export type TerritoryPlan =
  | (typeof TERRITORY_PLANS)[number]
  | typeof LEGACY_GROWTH;
export type AccountMode = "simulation" | "live";

const DAY_MS = 86_400_000;

export function territoryPlan(id: string): TerritoryPlan | null {
  if (id === "growth") return LEGACY_GROWTH;
  return TERRITORY_PLANS.find((plan) => plan.id === id) ?? null;
}

/** Day 31 of Name Your Price is thirty days after they start. Lifetime does not renew. */
export function renewalFor(
  planId: string,
  from: Date,
): { renewsAt: string | null; renewalCents: number | null } {
  const plan = territoryPlan(planId);
  if (!plan || plan.cadence === "once") return { renewsAt: null, renewalCents: null };
  return {
    renewsAt: new Date(from.getTime() + 30 * DAY_MS).toISOString(),
    renewalCents: plan.renewalCents,
  };
}

/** Checkout always leaves simulation and lands in live production. */
export function modeAfterCheckout(): AccountMode {
  return "live";
}

/**
 * Settled when Stripe reports paid.
 * Legacy $0 trials (no longer sold) still accept `no_payment_required`.
 */
export function territorySessionSettled(plan: TerritoryPlan, paymentStatus: string | undefined): boolean {
  if (paymentStatus === "paid") return true;
  // Historical free trials settled with nothing due; current Name Your Price always charges ≥ $1.
  const floor = Number(plan.amountCents);
  return plan.cadence === "trial" && floor === 0 && paymentStatus === "no_payment_required";
}

export function pitchHref(lead: { leadSlug: string; county: string }): string {
  const params = new URLSearchParams({ b: lead.leadSlug, pitch: "1" });
  if (lead.county) params.set("county", lead.county);
  return `/?${params.toString()}`;
}
