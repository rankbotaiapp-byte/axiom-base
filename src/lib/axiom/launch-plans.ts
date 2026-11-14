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
    tagline: "$1 trial · then $150/mo",
    dueTodayCents: 100,
    monthlyCents: 15_000,
    trialDays: 30,
    mode: "subscription",
    priceLabel: "$1",
    priceNote: "today · 30 days live · then $150/mo",
    features: [
      "Live booking storefront in minutes",
      "AI receptionist + instant text-back",
      "Stripe deposits on every booking",
      "Cancel any time in the first 30 days",
    ],
    cta: "Start for $1",
    hue: "cyan",
  },
  {
    id: "lifetime",
    name: "Founder's Lifetime",
    tagline: "Own the territory",
    dueTodayCents: 100_000,
    monthlyCents: null,
    trialDays: 0,
    mode: "payment",
    priceLabel: "$1000",
    priceNote: "once · yours forever",
    features: [
      "Everything in Starter, forever",
      "Locked trade + county territory",
      "Cinematic hero film + content engine",
      "Priority support line",
    ],
    cta: "Get Founder's Lifetime — $1000",
    hue: "signal",
  },
] as const;

export const LAUNCH_PLAN_STORAGE_KEY = "axiom.launchPlan";

export function launchPlan(id: string): LaunchPlan | null {
  const key = id === "custom" ? "lifetime" : id;
  return LAUNCH_PLANS.find((plan) => plan.id === key) ?? null;
}

export function isLaunchPlanId(id: string): id is LaunchPlanId {
  return id === "starter" || id === "lifetime" || id === "custom" || launchPlan(id) !== null;
}

/** Settled buyers (and unpaid funnel CTAs) enter tenant provisioning at `/start`. */
export function provisioningPath(planId: LaunchPlanId): string {
  return `/start?plan=${encodeURIComponent(planId)}`;
}

/** A completed embedded Checkout session counts as settled only when Stripe says so. */
export function launchSessionSettled(status: string | undefined, paymentStatus: string | undefined): boolean {
  if (status !== "complete") return false;
  return paymentStatus === "paid" || paymentStatus === "no_payment_required";
}
