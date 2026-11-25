/** Default Master Dashboard config for the freeze-particle landing. */

export const STUDIO_HREF = "/axiom-studio";

export type LandingButton = {
  label: string;
  url: string;
  glow: boolean;
  visible: boolean;
};

export type LandingConfig = {
  meta: {
    status: string;
    status2: string;
    build: string;
    version: string;
  };
  theme: {
    bg: string;
    accent: string;
    panelAlpha: number;
    borderAlpha: number;
    glow: number;
  };
  motion: {
    particles: number;
    tilt: number;
    freezeSharpness: number;
    reduceMotion: boolean;
  };
  content: Record<string, string>;
  buttons: {
    navCta: LandingButton;
    heroPrimary: LandingButton;
    heroSecondary: LandingButton;
    studioCta: LandingButton;
  };
  media: {
    characterSrc: string;
    heartSrc: string;
    heartAutoplay: boolean;
    heartLoop: boolean;
    studioSrc: string;
    characterPoster?: string;
    heartPoster?: string;
    studioPoster?: string;
  };
};

export const DEFAULT_CONFIG: LandingConfig = {
  meta: {
    status: "ONLINE",
    status2: "ALL SYSTEMS NOMINAL",
    build: "BUILD AXM-2026.11",
    version: "v1.0.0",
  },
  theme: {
    bg: "#030305",
    accent: "#00F0FF",
    panelAlpha: 0.65,
    borderAlpha: 0.08,
    glow: 1,
  },
  motion: {
    particles: 2400,
    tilt: 1,
    freezeSharpness: 1,
    reduceMotion: false,
  },
  content: {
    navBrand: "AXIOM",
    navLink1: "What you get",
    navLink2: "Live demos",
    navLink3: "Pipeline",
    navLink4: "Founder",
    heroBadge: "LOCAL TRADES // BACK OFFICE ONLINE",
    heroTitle: "Stop losing after-hours jobs.",
    heroSub:
      "$1 trial puts 24/7 AI booking, instant quote, and SMS follow-up on your shop page. Autopilot works the pipeline — then $150/mo.",
    heroHint: "SCROLL — SEE HOW IT BOOKS",
    charKicker: "PROOF GRID // FOUR PILLARS",
    charTitle: "What trades get on day one",
    charTeleL: "STOREFRONT // LIVE",
    charTeleBL: "RESPONSE: < 60s",
    charTeleBR: "BOOKING: 24/7",
    co1Tag: "01",
    co1Title: "24/7 intake",
    co1Body:
      "Calls, forms, and chat turn into booked jobs while your crew is on a roof or under a sink.",
    co2Tag: "02",
    co2Title: "Instant quote",
    co2Body:
      "Homeowners pick service + urgency, see a real range, and book video or dispatch without calling the office.",
    co3Tag: "03",
    co3Title: "Owner Studio",
    co3Body:
      "Change prices, photos, and service areas from your phone. No dev ticket, no agency markup.",
    co4Tag: "04",
    co4Title: "Autopilot SMS",
    co4Body:
      "Missed estimates and old leads get texted automatically until they book or opt out.",
    heartKicker: "CORE SYSTEM // THE HEART MACHINE",
    heartTitle: "Inside the Heart Machine",
    heartSub:
      "The engine at the center of Axiom — watch the core cycle that powers every booking, dispatch, and dollar.",
    studioKicker: "AXIOM STUDIO // OPEN GATEWAY",
    studioTitle: "Try Axiom Studio. Right now.",
    studioSub:
      "No signup wall. No demo call. Open the Studio, type what you want, and watch your business app assemble itself.",
    studioBar: "AXIOM_STUDIO // WORKSPACE_PREVIEW",
    studioNote: "ZERO FRICTION // NO CARD REQUIRED // LIVE IN MINUTES",
    studioAside:
      "Every app ships with the Owner Studio built in — your pricing, your photos, your words, changeable from your phone, forever.",
    navBrand2: "AXIOM",
    footTag: "Built for local trades in Southern Oregon. Your shop page books while you run jobs.",
    footL1: "What you get",
    footL2: "Live demos",
    footL3: "Founder",
    footL4: "Legal",
  },
  buttons: {
    navCta: { label: "Start $1 trial", url: STUDIO_HREF, glow: true, visible: true },
    heroPrimary: { label: "Start $1 trial", url: STUDIO_HREF, glow: true, visible: true },
    heroSecondary: {
      label: "See live demos",
      url: "#proof",
      glow: false,
      visible: true,
    },
    studioCta: { label: "Launch Axiom Studio →", url: STUDIO_HREF, glow: true, visible: true },
  },
  media: {
    characterSrc: "/media/studio-preview.mp4",
    heartSrc: "/media/studio-preview.mp4",
    heartAutoplay: true,
    heartLoop: true,
    studioSrc: "/media/studio-preview.mp4",
    characterPoster: "/media/hero-poster.jpg",
    heartPoster: "/media/hero-poster.jpg",
    studioPoster: "/media/hero-poster.jpg",
  },
};

export const STORE_KEY = "axiom_master_config_v1";

export function deepMerge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over)) return (over as T) ?? base;
  const out = (Array.isArray(base) ? [...(base as unknown[])] : { ...(base as object) }) as T;
  for (const k of Object.keys(over as object)) {
    const key = k as keyof T;
    const ov = (over as Record<string, unknown>)[k];
    const bv = (base as Record<string, unknown>)[k as string];
    if (
      ov &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      (out as Record<string, unknown>)[k] = deepMerge(bv, ov);
    } else {
      (out as Record<string, unknown>)[k] = ov;
    }
  }
  return out;
}

export function cloneConfig(o: LandingConfig): LandingConfig {
  return JSON.parse(JSON.stringify(o)) as LandingConfig;
}

export function getPath(o: unknown, p: string): unknown {
  return p.split(".").reduce<unknown>((a, k) => {
    if (a && typeof a === "object") return (a as Record<string, unknown>)[k];
    return undefined;
  }, o);
}

export function setPath(o: Record<string, unknown>, p: string, v: unknown): void {
  const ks = p.split(".");
  let c: Record<string, unknown> = o;
  for (let i = 0; i < ks.length - 1; i++) {
    const next = c[ks[i]];
    if (!next || typeof next !== "object") {
      c[ks[i]] = {};
    }
    c = c[ks[i]] as Record<string, unknown>;
  }
  c[ks[ks.length - 1]] = v;
}
