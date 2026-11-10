// Single source of truth for pricing copy. Change numbers here — every section updates.
// Keep claims honest: only set FOUNDING_SPOTS if it's a real cap you'll enforce.

export const PRICING = {
  lifetime: {
    name: "Lifetime Back Office",
    price: 997,
    compareAt: 2388, // 12 months of a typical ~$199/mo booking + CRM stack
    blurb: "Stop renting Jobber-class software. One payment owns booking, dispatch, and your admin for life.",
    features: [
      "Your trade template, live the same day",
      "Online booking + after-hours capture",
      "Job routing and a live dispatch board",
      "You edit everything — no developer on retainer",
      "Phone app for you and the crew (installs to the home screen)",
      "Reminders and review asks after the job",
      "Lifetime template updates — still $0/mo",
    ],
  },
  monthly: {
    name: "Starter Monthly",
    price: 79,
    blurb: "Test the desk for a month. Cancel any time — or buy lifetime when the first Saturday books itself.",
    features: ["Your trade template", "Online booking", "Admin dashboard", "Email support"],
  },
  /** Cinematic builds from the showcase — rebranded to the buyer's business. */
  cinematic: {
    name: "Cinematic Build",
    price: 1997,
    blurb: "The exact demo you just played, stamped with your name, phone, and logo — plus Lifetime Back Office. No monthly rent. No agency rebuild.",
    includes: [
      "This exact site, rebranded to you",
      "Lifetime Back Office included",
      "Book, call, directions, and quote already wired",
      "Yours forever — no monthly software fees",
    ],
  },
  roi: {
    typicalMonthlyStack: 199,
    agencySiteLow: 6000,
    agencySiteHigh: 15000,
    oneMissedJob: 400,
  },
  /** Set to a number to show "X founding spots left" — only if the cap is real. null hides it. */
  FOUNDING_SPOTS: null as number | null,
  guarantee: "14-day money-back. If it does not save you an evening in the office, every dollar comes back. No call-center runaround.",
  trust: [
    { id: "guarantee", label: "14-day money-back" },
    { id: "own", label: "You own the site and the data" },
    { id: "stripe", label: "Checkout on Stripe" },
    { id: "live", label: "Live the same day you pay" },
  ],
};

export const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export const buildPrice = (override?: number) => override ?? PRICING.cinematic.price;

export function monthsOfStack(price = PRICING.cinematic.price) {
  return Math.max(1, Math.round(price / PRICING.roi.typicalMonthlyStack));
}
