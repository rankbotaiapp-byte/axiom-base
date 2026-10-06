/** Territory plans the preview and the pitch screen sell. Amounts are cents. */

export const TERRITORY_PLANS = [
  {
    id: "trial",
    name: "30-Day Free Trial",
    amountCents: 0,
    cadence: "trial",
    summary: "$0 today. $497 a month starting day 31.",
    renewalCents: 49700,
  },
  {
    id: "growth",
    name: "Managed Territory Growth Engine",
    amountCents: 49700,
    cadence: "month",
    summary: "$497 every month.",
    renewalCents: 49700,
  },
  {
    id: "lifetime",
    name: "Lifetime Territory Monopoly",
    amountCents: 249700,
    cadence: "once",
    summary: "$2,497 once. The territory stays yours.",
    renewalCents: null,
  },
] as const;

export type TerritoryPlanId = (typeof TERRITORY_PLANS)[number]["id"];
export type TerritoryPlan = (typeof TERRITORY_PLANS)[number];
export type AccountMode = "simulation" | "live";

const DAY_MS = 86_400_000;

export function territoryPlan(id: string): TerritoryPlan | null {
  return TERRITORY_PLANS.find((plan) => plan.id === id) ?? null;
}

/** Day 31 of a trial is thirty days after the day they start. Growth bills again in thirty days. */
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
 * A paid session is settled. A 30-day trial settles only when Stripe completes
 * checkout with nothing due today. Anything else stays in simulation.
 */
export function territorySessionSettled(plan: TerritoryPlan, paymentStatus: string | undefined): boolean {
  if (paymentStatus === "paid") return true;
  return plan.cadence === "trial" && plan.amountCents === 0 && paymentStatus === "no_payment_required";
}

export function pitchHref(lead: { leadSlug: string; county: string }): string {
  const params = new URLSearchParams({ b: lead.leadSlug, pitch: "1" });
  if (lead.county) params.set("county", lead.county);
  return `/?${params.toString()}`;
}
