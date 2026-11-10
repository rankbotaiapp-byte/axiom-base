/**
 * Emergency Plumbing storefront — the config every piece of the page reads.
 *
 * Pure module: no DOM, no database. The storefront, the admin studio and the
 * server functions all pass raw input through `parsePlumbingStorefront`, so a
 * bad save or a hand-edited row can never break the page.
 */

import {
  DEFAULT_COMPETITOR_LAND_GRAB,
  parseCompetitorLandGrab,
  type CompetitorLandGrabConfig,
} from "./competitor-land-grab.ts";
import {
  DEFAULT_GEO_SOCIAL_PROOF,
  parseGeoSocialProof,
  type GeoSocialProofConfig,
} from "./geo-social-proof.ts";

export type { CompetitorLandGrabConfig, GeoSocialProofConfig };

export const PLUMBING_STOREFRONT_SLUG = "demo-plumbing";

/** Same-origin channel the admin studio uses to push drafts into the preview frame. */
export const PLUMBING_DRAFT_CHANNEL = "axiom-plumbing-storefront";
export const PLUMBING_DRAFT_MESSAGE = "axiom:plumbing-draft";

export const PLUMBING_HERO_VIDEO = "/media/axiom-plumber-hero.mp4";
export const PLUMBING_HERO_VIDEO_MOBILE = "/media/axiom-plumber-hero-mobile.mp4";
export const PLUMBING_HERO_POSTER = "/media/axiom-plumber-hero.jpg";

export type TrustBadge = { id: string; icon: TrustIcon; label: string };
export type TrustIcon = "shield" | "clock" | "badge" | "dollar" | "star" | "truck";
export const TRUST_ICONS: readonly TrustIcon[] = ["shield", "clock", "badge", "dollar", "star", "truck"];

export type ProofItem = { id: string; name: string; place: string; job: string; ago: string };

export type ServiceCard = { id: string; title: string; detail: string; price: string };

export type PlumbingStorefront = {
  company: string;
  city: string;
  /** Shown on the page, e.g. "(541) 555-0142". */
  phoneDisplay: string;
  /** Optional override for tel:/sms: links. Blank = dial what phoneDisplay shows (see `dialNumber`). */
  phoneDial: string;
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    videoUrl: string;
    mobileVideoUrl: string;
    posterUrl: string;
    /** 0–100. How dark the ambient grade sits over the film. */
    grade: number;
  };
  badges: TrustBadge[];
  ctas: {
    trialLabel: string;
    trialHref: string;
    missedCallLabel: string;
    callLabel: string;
  };
  services: ServiceCard[];
  proof: {
    enabled: boolean;
    /** Shown on each card while the feed is sample data, so nobody mistakes it for real bookings. */
    sampleLabel: string;
    items: ProofItem[];
  };
  missedCall: {
    callerName: string;
    issue: string;
    /** {company}, {caller} and {issue} are filled in. */
    textBack: string;
    bookedSlot: string;
  };
  /** Interactive ROI calculator — defaults are editable in Master Admin Studio. */
  roi: {
    enabled: boolean;
    headline: string;
    subhead: string;
    /** Starting slider: average missed calls per week. */
    missedCallsDefault: number;
    missedCallsMin: number;
    missedCallsMax: number;
    /** Starting slider: average job value in whole dollars. */
    jobValueDefault: number;
    jobValueMin: number;
    jobValueMax: number;
    jobValueStep: number;
    /** Weeks used to annualize weekly misses into a monthly figure. */
    weeksPerMonth: number;
    /** Line under the loss figure, right above the trial CTA. */
    ctaHint: string;
  };
  /** Geo-targeted proof-of-work + local activity ticker (city/county bound). */
  geo: GeoSocialProofConfig;
  /** Competitor replacement comparison + regional land-grab urgency. */
  landGrab: CompetitorLandGrabConfig;
};

export const DEFAULT_PLUMBING_STOREFRONT: PlumbingStorefront = {
  company: "Rogue Rapid Plumbing",
  city: "Medford, OR",
  phoneDisplay: "(541) 555-0142",
  phoneDial: "",
  hero: {
    eyebrow: "24/7 Emergency Response",
    headline: "Burst pipe at 2 a.m.? We're already rolling.",
    subhead:
      "Licensed local plumbers on call around the clock. Every missed call gets an instant text back, so your emergency never waits in voicemail.",
    videoUrl: PLUMBING_HERO_VIDEO,
    mobileVideoUrl: PLUMBING_HERO_VIDEO_MOBILE,
    posterUrl: PLUMBING_HERO_POSTER,
    grade: 55,
  },
  badges: [
    { id: "b1", icon: "shield", label: "Licensed & insured" },
    { id: "b2", icon: "clock", label: "60-min response" },
    { id: "b3", icon: "dollar", label: "Upfront pricing" },
    { id: "b4", icon: "star", label: "Local, family-run" },
  ],
  ctas: {
    trialLabel: "$1 Choose Your Price Trial",
    trialHref: "/onboard?niche=plumbing",
    missedCallLabel: "Test Missed Call Recovery",
    callLabel: "Call now",
  },
  services: [
    { id: "s1", title: "Burst & leaking pipes", detail: "Shut-off, locate, repair, and a dry test before we leave.", price: "From $149" },
    { id: "s2", title: "Drain & sewer clears", detail: "The stoppage cleared and a camera check of the line.", price: "From $189" },
    { id: "s3", title: "Water heater rescue", detail: "No hot water tonight? Repair or same-day swap.", price: "From $229" },
  ],
  proof: {
    enabled: true,
    sampleLabel: "Sample activity",
    items: [
      { id: "p1", name: "Jenna R.", place: "Medford", job: "booked a burst-pipe repair", ago: "2 min ago" },
      { id: "p2", name: "Marcus T.", place: "Grants Pass", job: "got a text back after hours", ago: "9 min ago" },
      { id: "p3", name: "Alicia P.", place: "Ashland", job: "scheduled a water heater swap", ago: "21 min ago" },
      { id: "p4", name: "Dev K.", place: "Central Point", job: "booked a drain clear", ago: "34 min ago" },
    ],
  },
  missedCall: {
    callerName: "Sarah",
    issue: "Water pouring from under the kitchen sink",
    textBack:
      "Hi {caller}, this is {company} — sorry we missed your call! Is this an emergency? Reply with what's going on and we'll get a tech headed your way.",
    bookedSlot: "Tonight, 7:40 PM",
  },
  roi: {
    enabled: true,
    headline: "How much are missed calls costing you?",
    subhead: "Slide your real numbers. Every unanswered emergency is a job walking to the next plumber on the list.",
    missedCallsDefault: 8,
    missedCallsMin: 1,
    missedCallsMax: 40,
    jobValueDefault: 450,
    jobValueMin: 100,
    jobValueMax: 2500,
    jobValueStep: 25,
    weeksPerMonth: 4.33,
    ctaHint: "Stop leaving that on the table — start your Choose Your Price trial for $1.",
  },
  geo: {
    ...DEFAULT_GEO_SOCIAL_PROOF,
    headline: "Local proof in {city}",
    subhead: "Recent emergency completions across {county} — the same missed-call recovery your page runs.",
    jobs: [
      "booked a burst-pipe repair",
      "got a text back after hours",
      "scheduled a water heater swap",
      "booked a drain clear",
    ],
  },
  landGrab: {
    ...DEFAULT_COMPETITOR_LAND_GRAB,
    ctaHref: "/onboard?niche=plumbing",
    subhead:
      "Axiom swaps legacy web forms and clunky answering services for instant text-back and a 24/7 AI booking assistant — built for emergency plumbing crews in {city}.",
    bannerTemplate:
      "Land grab · {slots} of {capacity} plumbing territories still open in {county}. Starting a trial locks competing shops out of {city}.",
  },
};

/* ---------------------------------------------------------------- sanitizers */

/** Control characters out, whitespace collapsed. */
function tidy(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    out += code < 32 || code === 127 ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

function text(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  const clean = tidy(value);
  return clean ? clean.slice(0, max) : fallback;
}

/** Allows blank, unlike `text`, for fields where empty is a real choice. */
function optionalText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return tidy(value).slice(0, max);
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function clampFloat(value: unknown, min: number, max: number, fallback: number, decimals = 2): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  const factor = 10 ** decimals;
  return Math.min(max, Math.max(min, Math.round(n * factor) / factor));
}

/**
 * Monthly revenue left on the table from unanswered calls.
 * `missedCallsPerWeek × weeksPerMonth × averageJobValue`, rounded to whole dollars.
 */
export function monthlyRevenueLoss(
  missedCallsPerWeek: number,
  averageJobValue: number,
  weeksPerMonth = DEFAULT_PLUMBING_STOREFRONT.roi.weeksPerMonth,
): number {
  const calls = Math.max(0, missedCallsPerWeek);
  const value = Math.max(0, averageJobValue);
  const weeks = Math.max(0, weeksPerMonth);
  return Math.round(calls * weeks * value);
}

/** USD for the live loss figure — compact, no cents. */
export function formatRevenueLoss(amount: number): string {
  const n = Math.max(0, Math.round(amount));
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Same-origin paths and https only — no javascript:, data:, or protocol-relative tricks. */
export function safeHref(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (!v) return fallback;
  if (v.startsWith("/") && !v.startsWith("//")) return v.slice(0, 300);
  if (/^(https:\/\/|tel:|sms:|mailto:)/i.test(v)) return v.slice(0, 300);
  return fallback;
}

/** Videos and posters: our own /media files or an https URL. */
export function safeMediaUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (v.startsWith("/") && !v.startsWith("//") && !v.includes("..")) return v.slice(0, 300);
  if (/^https:\/\//i.test(v)) return v.slice(0, 500);
  return fallback;
}

export function dialDigits(display: string): string {
  const plus = display.trim().startsWith("+");
  const digits = display.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";
  if (plus) return `+${digits}`;
  return digits.length === 10 ? `+1${digits}` : digits;
}

/** The number tel: links actually dial. */
export function dialNumber(cfg: Pick<PlumbingStorefront, "phoneDial" | "phoneDisplay">): string {
  return cfg.phoneDial || dialDigits(cfg.phoneDisplay);
}

function list<T>(value: unknown, max: number, each: (raw: Record<string, unknown>, i: number) => T | null, fallback: T[]): T[] {
  if (!Array.isArray(value)) return fallback;
  const out: T[] = [];
  for (const [i, raw] of value.entries()) {
    if (out.length >= max) break;
    if (!raw || typeof raw !== "object") continue;
    const item = each(raw as Record<string, unknown>, i);
    if (item) out.push(item);
  }
  return out;
}

function id(raw: Record<string, unknown>, prefix: string, i: number): string {
  const v = typeof raw.id === "string" ? raw.id.replace(/[^a-z0-9_-]/gi, "").slice(0, 24) : "";
  return v || `${prefix}${i + 1}`;
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function parsePlumbingStorefront(input: unknown): PlumbingStorefront {
  const d = DEFAULT_PLUMBING_STOREFRONT;
  const raw = obj(typeof input === "string" ? safeJson(input) : input);
  const hero = obj(raw.hero);
  const ctas = obj(raw.ctas);
  const proof = obj(raw.proof);
  const mc = obj(raw.missedCall);
  const roi = obj(raw.roi);
  const geo = parseGeoSocialProof(raw.geo ?? d.geo);
  const landGrab = parseCompetitorLandGrab(raw.landGrab ?? d.landGrab);
  const phoneDisplay = text(raw.phoneDisplay, d.phoneDisplay, 32);

  const missedCallsMin = clamp(roi.missedCallsMin, 0, 100, d.roi.missedCallsMin);
  const missedCallsMax = Math.max(missedCallsMin + 1, clamp(roi.missedCallsMax, 1, 200, d.roi.missedCallsMax));
  const jobValueMin = clamp(roi.jobValueMin, 25, 50_000, d.roi.jobValueMin);
  const jobValueMax = Math.max(jobValueMin + 25, clamp(roi.jobValueMax, 50, 100_000, d.roi.jobValueMax));
  const jobValueStep = Math.max(1, clamp(roi.jobValueStep, 1, 500, d.roi.jobValueStep));

  return {
    company: text(raw.company, d.company, 60),
    city: optionalText(raw.city ?? d.city, 60),
    phoneDisplay,
    phoneDial: dialDigits(optionalText(raw.phoneDial, 32)),
    hero: {
      eyebrow: optionalText(hero.eyebrow ?? d.hero.eyebrow, 60),
      headline: text(hero.headline, d.hero.headline, 120),
      subhead: optionalText(hero.subhead ?? d.hero.subhead, 280),
      videoUrl: safeMediaUrl(hero.videoUrl, d.hero.videoUrl),
      mobileVideoUrl: safeMediaUrl(hero.mobileVideoUrl, d.hero.mobileVideoUrl),
      posterUrl: safeMediaUrl(hero.posterUrl, d.hero.posterUrl),
      grade: clamp(hero.grade, 0, 100, d.hero.grade),
    },
    badges: list(
      raw.badges,
      6,
      (b, i) => {
        const label = optionalText(b.label, 40);
        if (!label) return null;
        const icon = TRUST_ICONS.includes(b.icon as TrustIcon) ? (b.icon as TrustIcon) : "shield";
        return { id: id(b, "b", i), icon, label };
      },
      d.badges,
    ),
    ctas: {
      trialLabel: text(ctas.trialLabel, d.ctas.trialLabel, 40),
      trialHref: safeHref(ctas.trialHref, d.ctas.trialHref),
      missedCallLabel: text(ctas.missedCallLabel, d.ctas.missedCallLabel, 40),
      callLabel: text(ctas.callLabel, d.ctas.callLabel, 24),
    },
    services: list(
      raw.services,
      6,
      (s, i) => {
        const title = optionalText(s.title, 50);
        if (!title) return null;
        return { id: id(s, "s", i), title, detail: optionalText(s.detail, 140), price: optionalText(s.price, 24) };
      },
      d.services,
    ),
    proof: {
      enabled: typeof proof.enabled === "boolean" ? proof.enabled : d.proof.enabled,
      sampleLabel: optionalText(proof.sampleLabel ?? d.proof.sampleLabel, 30),
      items: list(
        proof.items,
        8,
        (p, i) => {
          const name = optionalText(p.name, 30);
          const job = optionalText(p.job, 60);
          if (!name || !job) return null;
          return { id: id(p, "p", i), name, place: optionalText(p.place, 30), job, ago: optionalText(p.ago, 20) };
        },
        d.proof.items,
      ),
    },
    missedCall: {
      callerName: text(mc.callerName, d.missedCall.callerName, 24),
      issue: text(mc.issue, d.missedCall.issue, 90),
      textBack: text(mc.textBack, d.missedCall.textBack, 320),
      bookedSlot: text(mc.bookedSlot, d.missedCall.bookedSlot, 40),
    },
    roi: {
      enabled: typeof roi.enabled === "boolean" ? roi.enabled : d.roi.enabled,
      headline: text(roi.headline, d.roi.headline, 100),
      subhead: optionalText(roi.subhead ?? d.roi.subhead, 280),
      missedCallsDefault: clamp(roi.missedCallsDefault, missedCallsMin, missedCallsMax, d.roi.missedCallsDefault),
      missedCallsMin,
      missedCallsMax,
      jobValueDefault: clamp(roi.jobValueDefault, jobValueMin, jobValueMax, d.roi.jobValueDefault),
      jobValueMin,
      jobValueMax,
      jobValueStep,
      weeksPerMonth: clampFloat(roi.weeksPerMonth, 1, 8, d.roi.weeksPerMonth, 2),
      ctaHint: optionalText(roi.ctaHint ?? d.roi.ctaHint, 160),
    },
    geo,
    landGrab,
  };
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/* ---------------------------------------------------- missed-call simulation */

export type MissedCallStep =
  | { kind: "ring"; at: number; label: string }
  | { kind: "missed"; at: number; label: string }
  | { kind: "sms-out"; at: number; body: string }
  | { kind: "sms-in"; at: number; body: string }
  | { kind: "booked"; at: number; slot: string; label: string };

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? vars[key] : match));
}

/**
 * The scripted run the widget plays. `at` is ms from start. Kept pure so the
 * timing and copy are testable and identical in the admin preview and live page.
 */
export function missedCallScript(cfg: PlumbingStorefront): MissedCallStep[] {
  const { callerName, issue, textBack, bookedSlot } = cfg.missedCall;
  const company = cfg.company;
  return [
    { kind: "ring", at: 0, label: `Incoming call · ${callerName}` },
    { kind: "missed", at: 2200, label: "Missed — crew is on another job" },
    { kind: "sms-out", at: 3400, body: fillTemplate(textBack, { caller: callerName, company, issue }) },
    { kind: "sms-in", at: 5600, body: issue },
    {
      kind: "sms-out",
      at: 7200,
      body: `Got it — that's urgent. If you can, close the shut-off valve. First open slot: ${bookedSlot}. Reply YES to lock it in.`,
    },
    { kind: "sms-in", at: 9000, body: "YES please!!" },
    { kind: "booked", at: 10200, slot: bookedSlot, label: "Job booked automatically" },
  ];
}
