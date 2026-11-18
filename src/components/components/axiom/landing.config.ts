/**
 * Everything a non-developer needs to change lives here: copy, links, media paths.
 * Media files go in public/media/axiom/.
 * Production prices are locked: $1 for 14 days, then $150/month.
 */

export const AXIOM_COLORS = {
  obsidian: "#050507",
  cyan: "#00f2fe",
  amber: "#ff2a3d",
} as const;

export const landingConfig = {
  hero: {
    eyebrow: "AXIOM",
    headline: "A live trade desk in three minutes for plumbers, HVAC, electricians & outfitters.",
    subhead:
      "Regional leads, a cinematic 3D hero, and a desk that logs cash and checks in the field. $1 for 14 days, then $150/month, with one-click cancellation in Admin Billing.",
    feeLine:
      "Secure online bookings are a 1.5% Stripe Connect split. Cash and checks logged in the field with the Mobile Field Payment Logger are 0% platform fees.",
    image: "/media/axiom/axiom-logo-poster.jpg",
    imageAlt: "Obsidian stone A and AXIOM wordmark with a crimson core",
    loop: "/media/axiom/axiom-logo-loop.mp4",
    primaryCta: { label: "Start the $1 · 14-day trial", href: "#book" },
    secondaryCta: { label: "Preview templates", href: "#proof" },
  },
  /** Full-bleed autoplaying loop directly under the brand showcase. */
  pitch: {
    src: "/media/axiom/axioms-heart.mp4",
    poster: "/media/axiom/axioms-heart.jpg",
    title: "Open 24/7, even when you are not.",
    body: "Axiom answers, books, and follows up while you are on the job. Card bookings settle at 1.5%. Field cash and checks stay at 0%.",
    chips: ["Regional leads", "Cinematic hero", "Field cash & checks"],
  },
  /** Feature section built around the trades reel. */
  features: {
    eyebrow: "Made for your trade",
    title: "One engine, re-skinned for every local business",
    src: "/media/axiom/trades-reel.mp4",
    poster: "/media/axiom/trades-reel.jpg",
    points: [
      { title: "Start from your trade", body: "Templates for plumbing, HVAC, electrical, and outfitters, live in about three minutes." },
      { title: "Mobile Field Payment Logger", body: "Log cash and checks on the truck at 0% platform fees. Card bookings stay on Stripe Connect at 1.5%." },
      { title: "Each business stays separate", body: "Every storefront has its own bookings, customers, and settings. Cancel the $150/mo plan in one click from Admin Billing." },
    ],
  },
  /** Logo sting, used as the transition band before the studio. */
  sting: { src: "/media/axiom/obsidian-burst.mp4", poster: "/media/axiom/obsidian-burst.jpg" },
  studio: {
    eyebrow: "Axiom Studio",
    title: "Build yours right here",
    body: "$1 for 14 days, then $150/month. Cancel in one click from Admin Billing. Nothing is charged while you try the preview.",
    niches: [
      { id: "plumbing", label: "Plumbing", tagline: "Emergency plumbing, day or night", jobs: ["Burst pipe", "Blocked drain", "No hot water"] },
      { id: "hvac", label: "HVAC", tagline: "Heating and cooling, same day", jobs: ["No heat", "AC not cooling", "Strange noise"] },
      { id: "electrical", label: "Electrical", tagline: "Licensed electricians on call", jobs: ["Power out", "Tripping breaker", "Sparking outlet"] },
      { id: "outfitters", label: "Outfitters", tagline: "Gear, fittings, and range days", jobs: ["Rifle fitting", "Range day", "Gear reserve"] },
    ],
    accents: [
      { id: "cyan", label: "Cyan", value: "#00f2fe" },
      { id: "crimson", label: "Crimson", value: "#ff2a3d" },
      { id: "ice", label: "Ice blue", value: "#7dd3fc" },
      { id: "lime", label: "Lime", value: "#a3e635" },
    ],
    slots: ["8:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "6:00 PM", "9:00 PM"],
    previewVideo: "/media/axiom/axioms-heart.mp4",
    previewPoster: "/media/axiom/axioms-heart.jpg",
    plans: [
      {
        id: "trial",
        name: "14-Day Trial",
        price: "$1",
        cadence: "for 14 days",
        after: "Then $150/mo. Cancel in one click from Admin Billing.",
        cta: "Start the $1 · 14-day trial",
      },
      {
        id: "lifetime",
        name: "Founder's Lifetime",
        price: "$1,500",
        cadence: "one time",
        after: "Pay once. No monthly fee. 1.5% online · 0% cash and checks.",
        cta: "Get lifetime access",
      },
    ],
  },
};

export type LandingConfig = typeof landingConfig;
