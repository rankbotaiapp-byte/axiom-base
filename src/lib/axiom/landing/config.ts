/**
 * Axiom landing config — single source of truth for everything the
 * Master Admin Dashboard and /axiom-studio can edit.
 *
 * Persisted as JSON in Supabase `app_settings` (setting_key / setting_value)
 * under the key `axiom_landing:<slug>`. Anything missing from the stored JSON
 * falls back to DEFAULT_AXIOM_CONFIG, so old saves never break new fields.
 */

export type AxiomExpression =
  | "neutral"
  | "happy"
  | "curious"
  | "sleepy"
  | "focused"
  | "surprised";

export const AXIOM_EXPRESSIONS: AxiomExpression[] = [
  "neutral",
  "happy",
  "curious",
  "sleepy",
  "focused",
  "surprised",
];

export type Accent = "cyan" | "crimson" | "amber";
export type SlideFrom = "top" | "left" | "right" | "bottom";

export interface CtaLink {
  label: string;
  href: string;
}

export interface CroLayer {
  id: string;
  enabled: boolean;
  /** Direction the headline block slides in from. */
  from: SlideFrom;
  /** Which side of Axiom the copy column sits on. */
  align: "left" | "right";
  accent: Accent;
  kicker: string;
  headline: string;
  body: string;
  bullets: string[];
  /** Giant word rendered BEHIND Axiom on this layer. Empty = none. */
  backdropWord: string;
  /** Axiom's face while this layer is on stage. */
  axiomExpression: AxiomExpression;
  cta?: CtaLink;
}

export interface PricingPlan {
  id: string;
  enabled: boolean;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: CtaLink;
  highlight: boolean;
  accent: Accent;
}

export interface AxiomConfig {
  version: 1;
  theme: {
    bg: string;
    cyan: string;
    crimson: string;
    amber: string;
    text: string;
    muted: string;
  };
  companion: {
    imageUrl: string;
    /** Character width in world units (height follows image aspect). */
    scale: number;
    /** Max tilt in radians toward the cursor. */
    tiltStrength: number;
    springStiffness: number;
    springDamping: number;
    floatAmplitude: number;
    floatSpeed: number;
    /** 0 = flat card, 1 = strong pseudo-3D bulge. */
    depth: number;
    /** Soft edge fade so the JPG frame dissolves into the particles. 0 for a transparent PNG cut-out. */
    edgeFeather: number;
    eyeTracking: boolean;
    eyeColor: string;
    blinkMinMs: number;
    blinkMaxMs: number;
    /** 0–1 chance an idle blink becomes a wink. */
    winkChance: number;
    idleExpression: AxiomExpression;
    hoverExpression: AxiomExpression;
    clickExpression: AxiomExpression;
    /** Expressions Axiom drifts through when idle. Empty = stay on idleExpression. */
    moodCycle: AxiomExpression[];
    moodCycleMs: number;
    armorShift: number;
    armorShiftSpeed: number;
    armorSheenColor: string;
  };
  boosters: {
    enabled: boolean;
    intensity: number;
    pulseSpeed: number;
    coreColor: string;
    glowColor: string;
    flareColor: string;
    /** Nozzle positions in image UV space (0–1, origin bottom-left). */
    leftNozzle: [number, number];
    rightNozzle: [number, number];
    plumeLength: number;
  };
  particles: {
    enabled: boolean;
    count: number;
    speed: number;
    turbulence: number;
    size: number;
    opacity: number;
    mouseRadius: number;
    mouseForce: number;
    /** How much scroll progress/velocity amplifies the stream. */
    scrollBoost: number;
    colors: string[];
  };
  hero: {
    eyebrow: string;
    headline: string;
    highlight: string;
    subhead: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
    statusChips: string[];
  };
  cro: {
    brandName: string;
    scrollSnap: boolean;
    /** Viewport heights of scroll per layer. */
    layerScrollVh: number;
    hudTicker: string[];
    layers: CroLayer[];
    pricingHeadline: string;
    pricingSubhead: string;
    plans: PricingPlan[];
    finePrint: string;
  };
}

export const DEFAULT_AXIOM_CONFIG: AxiomConfig = {
  version: 1,
  theme: {
    bg: "#050507",
    cyan: "#00ffcc",
    crimson: "#ff2a3d",
    amber: "#FFE500",
    text: "#f4f4f5",
    muted: "#a1a1aa",
  },
  companion: {
    imageUrl: "/media/axiom-noir-hero-panel.svg",
    scale: 3.4,
    tiltStrength: 0.32,
    springStiffness: 90,
    springDamping: 14,
    floatAmplitude: 0.08,
    floatSpeed: 1.1,
    depth: 0.55,
    edgeFeather: 0.38,
    eyeTracking: false,
    eyeColor: "#5ef2f2",
    blinkMinMs: 2200,
    blinkMaxMs: 5200,
    winkChance: 0.18,
    idleExpression: "neutral",
    hoverExpression: "happy",
    clickExpression: "surprised",
    moodCycle: ["neutral", "curious", "sleepy", "neutral", "happy"],
    moodCycleMs: 6500,
    armorShift: 0.6,
    armorShiftSpeed: 0.6,
    armorSheenColor: "#ffd6a0",
  },
  boosters: {
    enabled: false,
    intensity: 1,
    pulseSpeed: 1.4,
    coreColor: "#ffffff",
    glowColor: "#00ffcc",
    flareColor: "#FFE500",
    leftNozzle: [0.297, 0.35],
    rightNozzle: [0.708, 0.35],
    plumeLength: 1,
  },
  particles: {
    enabled: true,
    count: 2600,
    speed: 0.55,
    turbulence: 0.6,
    size: 1,
    opacity: 0.9,
    mouseRadius: 0.22,
    mouseForce: 0.9,
    scrollBoost: 1.6,
    colors: ["#00ffcc", "#00f0ff", "#FFE500"],
  },
  hero: {
    eyebrow: "AXIOM • AUTOPILOT BACK OFFICE",
    headline: "Your business, answering",
    highlight: "every call. 24/7.",
    subhead:
      "Axiom books jobs, dispatches leads, and texts customers back in seconds — while you're on the roof, under the sink, or asleep.",
    primaryCta: { label: "Start for $1", href: "/checkout?plan=trial" },
    secondaryCta: { label: "Watch Axiom work", href: "#demo" },
    statusChips: ["● Live dispatch", "Avg reply 9s", "0 missed calls"],
  },
  cro: {
    brandName: "AXIOM",
    scrollSnap: true,
    layerScrollVh: 100,
    hudTicker: [
      "NEW LEAD • Water heater leak • Medford • booked 2:14 AM",
      "DISPATCHED • Roof tarp request • Grants Pass • tech en route",
      "BOOKED • AC no-cool • Central Point • tomorrow 8 AM",
      "TEXT-BACK • Panel upgrade quote • Ashland • replied in 7s",
    ],
    layers: [
      {
        id: "missed-calls",
        enabled: true,
        from: "top",
        align: "left",
        accent: "crimson",
        kicker: "THE LEAK IN YOUR PIPELINE",
        headline: "Every missed call is a job your competitor just booked.",
        body: "Homeowners with a flooded basement or a dead AC call the next number in 90 seconds. If you're on a job, that call is gone.",
        bullets: ["62% of calls to trades go unanswered", "Most callers never leave a voicemail"],
        backdropWord: "",
        axiomExpression: "focused",
      },
      {
        id: "answers",
        enabled: true,
        from: "right",
        align: "right",
        accent: "cyan",
        kicker: "AXIOM PICKS UP",
        headline: "Answers, qualifies, and books — in seconds, at 2 AM.",
        body: "Axiom texts back every missed call, asks the right questions for your trade, and drops the job straight onto your calendar.",
        bullets: ["Instant missed-call text-back", "Trade-specific intake questions", "Books into open slots only"],
        backdropWord: "24/7",
        axiomExpression: "happy",
      },
      {
        id: "dispatch",
        enabled: true,
        from: "left",
        align: "left",
        accent: "cyan",
        kicker: "LEAD DISPATCH ON AUTOPILOT",
        headline: "Plumbing. Roofing. HVAC. Electrical. Routed to the right tech.",
        body: "Emergency leak? Axiom flags it red and pings your on-call tech. Routine quote? It lands in the morning queue with photos and address.",
        bullets: ["Emergency vs. routine triage", "SMS dispatch to your crew", "Photos + address attached"],
        backdropWord: "DISPATCH",
        axiomExpression: "curious",
      },
      {
        id: "revenue",
        enabled: true,
        from: "bottom",
        align: "right",
        accent: "amber",
        kicker: "THE MATH",
        headline: "One saved job pays for a year of Axiom.",
        body: "An average emergency call is worth $350–$1,200. Axiom costs $150 a month. Catch one extra job and it's paid for itself.",
        bullets: ["No contracts", "Live in under 10 minutes", "Your number, your brand"],
        backdropWord: "ROI",
        axiomExpression: "happy",
        cta: { label: "Start my $1 trial", href: "/checkout?plan=trial" },
      },
    ],
    pricingHeadline: "Put your pipeline on autopilot.",
    pricingSubhead: "Start for a dollar. Keep it running for less than one service call a month.",
    plans: [
      {
        id: "trial",
        enabled: true,
        name: "Test Drive",
        price: "$1",
        cadence: "first month",
        blurb: "Full Axiom, live on your number, for one dollar.",
        features: ["Missed-call text-back", "AI booking + intake", "Live SMS dispatch test"],
        cta: { label: "Start for $1", href: "/checkout?plan=trial" },
        highlight: false,
        accent: "cyan",
      },
      {
        id: "autopilot",
        enabled: true,
        name: "Autopilot Pipeline",
        price: "$150",
        cadence: "/mo",
        blurb: "24/7 booking and lead dispatch that never clocks out.",
        features: ["Unlimited leads + bookings", "Emergency triage + crew dispatch", "Owner dashboard + weekly report"],
        cta: { label: "Turn on Autopilot", href: "/checkout?plan=autopilot" },
        highlight: true,
        accent: "crimson",
      },
      {
        id: "lifetime",
        enabled: false,
        name: "Founder's Lifetime",
        price: "$1,500",
        cadence: "once",
        blurb: "Pay once. Axiom runs your front desk forever.",
        features: ["Everything in Autopilot", "Founder pricing locked", "Priority setup call"],
        cta: { label: "Claim lifetime", href: "/checkout?plan=lifetime" },
        highlight: false,
        accent: "amber",
      },
    ],
    finePrint: "$1 trial converts to $150/mo after 30 days. Cancel anytime from your dashboard.",
  },
};

/* ------------------------------------------------------------------ */

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Deep-merge stored JSON over defaults. Arrays from storage replace defaults wholesale. */
export function mergeConfig<T>(base: T, patch: unknown): T {
  if (!isPlain(base) || !isPlain(patch)) return (patch === undefined ? base : (patch as T)) ?? base;
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const b = (base as Plain)[k];
    out[k] = isPlain(b) && isPlain(v) ? mergeConfig(b, v) : v;
  }
  return out as T;
}

export function normalizeConfig(raw: unknown): AxiomConfig {
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }
  return mergeConfig(DEFAULT_AXIOM_CONFIG, isPlain(parsed) ? parsed : {});
}

export const axiomSettingKey = (slug: string) => `axiom_landing:${slug || "default"}`;

export const accentColor = (cfg: AxiomConfig, a: Accent) =>
  a === "crimson" ? cfg.theme.crimson : a === "amber" ? cfg.theme.amber : cfg.theme.cyan;
