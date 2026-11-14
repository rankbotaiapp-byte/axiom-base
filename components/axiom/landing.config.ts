/**
 * Everything a non-developer needs to change lives here: copy, links, media paths.
 * Media files go in public/media/axiom/.
 */

export const AXIOM_COLORS = {
  obsidian: "#050507",
  cyan: "#00ffcc",
  amber: "#ffb020",
} as const;

export const landingConfig = {
  hero: {
    eyebrow: "AXIOM",
    headline: "Your whole business, running from your pocket.",
    subhead:
      "Booking, dispatch and follow-up in one app you can launch to your phone in minutes.",
    /** Drop cee8a042.jpeg over this file (keep the name) to use the final brand still. */
    image: "/media/axiom/brand-hero.jpg",
    imageAlt: "AXIOM wordmark in dark metal inside rotating cyan and amber neon rings",
    /** Animated loop shown when the visitor presses Play. */
    loop: "/media/axiom/brand-hero-loop.mp4",
    primaryCta: { label: "Launch my app", href: "#book" },
    secondaryCta: { label: "Book a 2-week build", href: "#book" },
  },
  /** Full-bleed autoplaying loop directly under the brand showcase. */
  pitch: {
    src: "/media/axiom/axioms-heart.mp4",
    poster: "/media/axiom/axioms-heart.jpg",
    title: "Open 24/7, even when you are not.",
    body: "Axiom answers, books and follows up while you are on the job.",
    chips: ["Lead capture", "Booking", "Storefront"],
  },
  /** Feature section built around the trades reel. */
  features: {
    eyebrow: "Made for your trade",
    title: "One engine, re-skinned for every local business",
    src: "/media/axiom/trades-reel.mp4",
    poster: "/media/axiom/trades-reel.jpg",
    points: [
      { title: "Start from your trade", body: "Templates for plumbing, HVAC, electrical, detailing and more." },
      { title: "Make it yours in minutes", body: "Your name, colors, services and prices, edited from your dashboard." },
      { title: "Each business stays separate", body: "Every storefront has its own bookings, customers and settings." },
    ],
  },
  /** Logo sting, used as the transition band before the studio. */
  sting: { src: "/media/axiom/obsidian-burst.mp4", poster: "/media/axiom/obsidian-burst.jpg" },
  studio: {
    eyebrow: "Axiom Studio",
    title: "Build yours right here",
    body: "Four steps. Nothing is charged or sent while you try it.",
    niches: [
      { id: "plumbing", label: "Plumbing", tagline: "Emergency plumbing, day or night", jobs: ["Burst pipe", "Blocked drain", "No hot water"] },
      { id: "hvac", label: "HVAC", tagline: "Heating and cooling, same day", jobs: ["No heat", "AC not cooling", "Strange noise"] },
      { id: "electrical", label: "Electrical", tagline: "Licensed electricians on call", jobs: ["Power out", "Tripping breaker", "Sparking outlet"] },
      { id: "detailing", label: "Detailing", tagline: "Showroom finish at your door", jobs: ["Full detail", "Interior only", "Ceramic coat"] },
    ],
    accents: [
      { id: "cyan", label: "Cyan", value: "#00ffcc" },
      { id: "amber", label: "Amber", value: "#ffb020" },
      { id: "ice", label: "Ice blue", value: "#7dd3fc" },
      { id: "lime", label: "Lime", value: "#a3e635" },
    ],
    slots: ["8:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "6:00 PM", "9:00 PM"],
    previewVideo: "/media/axiom/axioms-heart.mp4",
    previewPoster: "/media/axiom/axioms-heart.jpg",
    plans: [
      { id: "trial", name: "Choose Your Price trial", price: "$1", cadence: "first month", after: "Then $150/mo. Cancel any time.", cta: "Start for $1" },
      { id: "lifetime", name: "Founder's Lifetime", price: "$1,500", cadence: "one time", after: "Pay once. No monthly fee.", cta: "Get lifetime access" },
    ],
  },
};

export type LandingConfig = typeof landingConfig;
