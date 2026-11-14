/**
 * Hyper Moto — single source of truth for shop content.
 * Media paths are public URLs under /media (Vite-friendly; no next/image).
 */

export type MediaRef = { src: string; alt?: string };

export type BuildTier = {
  id: string;
  name: string;
  price: string;
  turnaround: string;
  headlineHp: number;
  features: readonly string[];
  featured?: boolean;
};

export type PortfolioBuild = {
  id: string;
  bike: string;
  spec: string;
  dynoHp: number;
  boostPsi: number;
};

export type DynoBaseline = {
  peakHp: number;
  peakBoostPsi: number;
  label: string;
};

export type ShopConfig = {
  brand: string;
  tagline: string;
  eyebrow: string;
  headline: readonly string[];
  subhead: string;
  statusLabel: string;
  heroCenterpiece: { image: string; alt: string };
  heroVideo: { src: string; poster: string };
  dyno: DynoBaseline;
  concierge: {
    name: string;
    role: string;
    avatarAlt: string;
    greetingVideo: { src: string; poster: string };
    launcher: { image: string; lines: readonly [string, string] };
    greeting: string;
    postGreeting: string;
    phoneDisplay: string;
    phoneHref: string;
  };
  tiers: readonly BuildTier[];
  portfolio: readonly PortfolioBuild[];
};

export const shopConfig: ShopConfig = {
  brand: "APEX MOTO LABS",
  tagline: "Custom turbo builds · Rogue Valley, OR",
  eyebrow: "AXIOM// AXIOM // AXIOM",
  headline: ["ENGINEERED", "FOR THE APEX", "CUSTOM TURBO", "BUILDS"],
  subhead:
    "Hand-built turbo V-twins and track-spec customs. Every build is dyno-proven before it leaves the bay.",
  statusLabel: "Live system status",
  heroCenterpiece: {
    image: "/media/hyper-moto-apex-engine.jpg",
    alt: "Custom turbocharged V-twin engine",
  },
  heroVideo: { src: "/media/garage-loop.mp4", poster: "/media/garage-poster.jpg" },
  dyno: { peakHp: 248, peakBoostPsi: 18.5, label: "Last dyno pull · Bay 2" },
  concierge: {
    name: "AXIOM",
    role: "Workshop Concierge",
    avatarAlt: "AXIOM, the Apex Moto Labs AI workshop concierge",
    greetingVideo: { src: "/media/axiom-greeting.mp4", poster: "/media/axiom-greeting-poster.jpg" },
    launcher: {
      image: "/media/hyper-moto-wireframe-head.jpg",
      lines: ["Speak with", "Chief Engineer"],
    },
    greeting:
      "Welcome to Apex Moto Labs. I'm AXIOM, the workshop concierge. I can book your custom build consultation. First, what's your name?",
    postGreeting: "Let's get your build consultation booked. First, what's your name?",
    phoneDisplay: "(541) 555-0142",
    phoneHref: "tel:+15415550142",
  },
  tiers: [
    {
      id: "stage-1",
      name: "Stage I · Street",
      price: "From $4,800",
      turnaround: "2–3 weeks",
      headlineHp: 140,
      features: ["Intake + exhaust package", "Custom ECU map", "Baseline + final dyno sheet"],
    },
    {
      id: "stage-2",
      name: "Stage II · Turbo",
      price: "From $12,500",
      turnaround: "4–6 weeks",
      headlineHp: 210,
      features: [
        "Bolt-on turbo kit, intercooled",
        "Fuel system upgrade",
        "Boost-by-gear tuning",
        "Clutch + driveline reinforcement",
      ],
      featured: true,
    },
    {
      id: "apex",
      name: "Apex · Full Custom",
      price: "By consultation",
      turnaround: "10–14 weeks",
      headlineHp: 248,
      features: [
        "Built bottom end, forged internals",
        "Bespoke turbo manifold fabrication",
        "Chassis + suspension setup",
        "One-off paint and finish",
      ],
    },
  ],
  portfolio: [
    { id: "p1", bike: "Road Glide 'Obsidian'", spec: "Turbo 131ci · forged", dynoHp: 248, boostPsi: 18.5 },
    { id: "p2", bike: "FXDR 'Red Line'", spec: "Turbo 117ci · intercooled", dynoHp: 212, boostPsi: 14.0 },
    { id: "p3", bike: "Sportster S 'Ghost'", spec: "Stage I · ECU flash", dynoHp: 138, boostPsi: 0 },
  ],
};
