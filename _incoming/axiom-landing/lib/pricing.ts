// Single source of truth for pricing copy. Change numbers here — every section updates.
// Keep claims honest: only set FOUNDING_SPOTS if it's a real cap you'll enforce.

export const PRICING = {
  lifetime: {
    name: "Lifetime Back Office",
    price: 997,
    compareAt: 2400, // what 12 months of a typical booking + CRM + dispatch stack can run
    blurb: "Pay once. Own your automated back office forever. No monthly fees, ever.",
    features: [
      "Your niche template, live in minutes",
      "Online booking + AI receptionist",
      "Job routing & dispatch board",
      "Customer admin dashboard (edit everything yourself)",
      "Installable phone app (PWA) for you + your crew",
      "Text & email reminders, review requests",
      "Lifetime updates to your template",
    ],
  },
  monthly: {
    name: "Starter Monthly",
    price: 79,
    blurb: "Prefer to start small? Same template, cancel any time.",
    features: ["Your niche template", "Online booking", "Admin dashboard", "Email support"],
  },
  /** Cinematic builds from the showcase — rebranded to the buyer's business. */
  cinematic: {
    name: "Cinematic Build",
    price: 1997,
    blurb: "This exact build, rebranded with your name, colors, phone and services — plus Lifetime Back Office.",
    includes: ["Rebranded to your business", "Lifetime Back Office included", "Booking, call, directions & quote wired up", "Yours forever — no monthly fees"],
  },
  /** Set to a number to show "X founding spots left" — only if the cap is real. null hides it. */
  FOUNDING_SPOTS: null as number | null,
  guarantee: "14-day money-back guarantee — if it doesn't save you time, you get every dollar back.",
};

export const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export const buildPrice = (override?: number) => override ?? PRICING.cinematic.price;
