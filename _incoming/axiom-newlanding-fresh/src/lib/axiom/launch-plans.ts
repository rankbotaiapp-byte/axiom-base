/**
 * Landing-page launch tiers sold from the 3D pricing stack.
 * Amounts are cents. Change prices here only — the cards, drawer and Stripe session all read this list.
 */

export type LaunchPlanId = "starter" | "lifetime" | "custom";

export type LaunchPlan = {
  id: LaunchPlanId;
  name: string;
  tagline: string;
  /** Charged today. */
  dueTodayCents: number;
  /** Recurring monthly amount after the trial, or null for one-time plans. */
  monthlyCents: number | null;
  trialDays: number;
  /** How Stripe bills it. */
  mode: "subscription" | "payment";
  priceLabel: string;
  priceNote: string;
  features: string[];
  cta: string;
  /** Visual accent for the card + shader tint. */
  hue: "cyan" | "signal" | "amber";
};

export const LAUNCH_PLANS: readonly LaunchPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Choose-your-price trial",
    dueTodayCents: 100,
    monthlyCents: 49700,
    trialDays: 30,
    mode: "subscription",
    priceLabel: "$1",
    priceNote: "today · 30 days live · then $497/mo",
    features: [
      "Live booking storefront in minutes",
      "AI receptionist + instant text-back",
      "Stripe deposits on every booking",
      "Cancel any time in the first 30 days",
    ],
    cta: "Provision Starter",
    hue: "cyan",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    tagline: "Own the territory",
    dueTodayCents: 249700,
    monthlyCents: null,
    trialDays: 0,
    mode: "payment",
    priceLabel: "$2,497",
    priceNote: "once · no monthly bill",
    features: [
      "Everything in Starter, forever",
      "Locked trade + county territory",
      "Cinematic hero film + content engine",
      "Priority support line",
    ],
    cta: "Provision Lifetime",
    hue: "signal",
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "2-week founder build",
    dueTodayCents: 75000,
    monthlyCents: null,
    trialDays: 0,
    mode: "payment",
    priceLabel: "$750",
    priceNote: "deposit · reserves your 2-week build slot",
    features: [
      "Built personally by Eric",
      "Custom flows, integrations and data",
      "Launch-ready on your phone in 14 days",
      "Deposit applies to the final quote",
    ],
    cta: "Reserve my build",
    hue: "amber",
  },
] as const;

export const LAUNCH_PLAN_STORAGE_KEY = "axiom.launchPlan";

export function launchPlan(id: string): LaunchPlan | null {
  return LAUNCH_PLANS.find((plan) => plan.id === id) ?? null;
}

export function isLaunchPlanId(id: string): id is LaunchPlanId {
  return launchPlan(id) !== null;
}

/** Where a settled buyer goes next: tenant provisioning. */
export function provisioningPath(planId: LaunchPlanId): string {
  const params = new URLSearchParams({ niche: "contractor", plan: planId });
  return `/onboard?${params.toString()}`;
}

/** A completed embedded Checkout session counts as settled only when Stripe says so. */
export function launchSessionSettled(status: string | undefined, paymentStatus: string | undefined): boolean {
  if (status !== "complete") return false;
  return paymentStatus === "paid" || paymentStatus === "no_payment_required";
}
