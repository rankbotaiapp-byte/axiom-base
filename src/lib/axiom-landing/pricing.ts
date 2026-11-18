/**
 * Commercial pricing copy for the public landing.
 * Amounts must stay aligned with `src/lib/stripe/commercial.ts`.
 */

import {
  FOUNDER_LIFETIME_CENTS,
  NAME_YOUR_PRICE_MIN_CENTS,
  STANDARD_MONTHLY_CENTS,
} from "@/lib/stripe/commercial";

export const PRICING = {
  trial: {
    id: "trial" as const,
    name: "14-Day Trial",
    floorDollars: NAME_YOUR_PRICE_MIN_CENTS / 100,
    renewalDollars: STANDARD_MONTHLY_CENTS / 100,
    blurb:
      "$1 today for 14 days, then $150/month. Cancel in one click from Admin Billing before the trial ends and it does not renew.",
    features: [
      "3-minute niche setup with regional leads and a cinematic 3D hero",
      "Mobile Field Payment Logger — cash, checks, tap-to-pay, SMS pay links",
      "1.5% Stripe Connect split on online bookings",
      "0% platform fee on cash and checks logged in the field",
      "One-click cancel in Axiom Admin Billing",
    ],
  },
  lifetime: {
    id: "lifetime" as const,
    name: "Founder's Lifetime",
    price: FOUNDER_LIFETIME_CENTS / 100,
    blurb: "One payment. Permanent storefront access. Zero monthly SaaS fees.",
    features: [
      "Everything in the 14-day trial",
      "Lifetime platform access — no $150/mo renewal",
      "Priority template updates as trades expand",
      "Founder desk support for go-live",
      "Stripe Connect included",
    ],
  },
  monthly: {
    name: "14-day trial, then monthly",
    price: STANDARD_MONTHLY_CENTS / 100,
    blurb: `After 14 days, the subscription is $${STANDARD_MONTHLY_CENTS / 100}/mo until you cancel.`,
    features: [
      "Cinematic trade storefront + 24/7 booking engine",
      "SMS routing and after-hours lead capture",
      "Customer admin dashboard — edit services, hours, branding",
      "Stripe Connect for deposits and invoices",
    ],
  },
  cinematic: {
    name: "Cinematic Build",
    price: FOUNDER_LIFETIME_CENTS / 100,
    blurb:
      "The exact demo you played, stamped with your name, phone, and logo — Founder's Lifetime included.",
    includes: [
      "This exact site, rebranded to you",
      "Founder's Lifetime included",
      "Book, call, and quote already wired",
      "Yours forever — no monthly software fees",
    ],
  },
  roi: {
    typicalMonthlyStack: 199,
    agencySiteLow: 6000,
    agencySiteHigh: 15000,
    oneMissedJob: 400,
  },
  FOUNDING_SPOTS: null as number | null,
  guarantee:
    "Cancel in one click from Admin Billing before the 14 days end and the $150/month renewal does not start.",
  trust: [
    { id: "guarantee", label: "One-click cancel before day 14" },
    { id: "own", label: "0% on cash and checks" },
    { id: "stripe", label: "1.5% Stripe Connect on card bookings" },
    { id: "live", label: "3-minute niche setup" },
  ],
};

export const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export const buildPrice = (override?: number) => override ?? PRICING.cinematic.price;

export function monthsOfStack(price = PRICING.lifetime.price) {
  return Math.max(1, Math.round(price / PRICING.roi.typicalMonthlyStack));
}
