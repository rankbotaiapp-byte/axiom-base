/**
 * Plumber outreach landing (`/t/{slug}?niche=plumbing`) — the config every
 * section of the page reads, plus the phone rule for the post-checkout lock.
 *
 * Pure module: no DOM, no database. The page, the admin studio and the server
 * functions all pass raw input through `parsePlumberOutreach`, so a bad save
 * or a hand-edited row can never break the page.
 */

import { dialDigits, fillTemplate, safeHref, safeMediaUrl } from "./plumbing-storefront.ts";

export { fillTemplate };

/** Row key in `storefront_configs`. */
export const PLUMBER_OUTREACH_SLUG = "plumbers-outreach";

/** Same-origin channel the admin studio uses to push drafts into the preview frame. */
export const PLUMBER_OUTREACH_DRAFT_CHANNEL = "axiom-plumber-outreach";
export const PLUMBER_OUTREACH_DRAFT_MESSAGE = "axiom:plumber-outreach-draft";

export const PLUMBER_OUTREACH_HERO_VIDEO = "/media/axio-plumber-hero.mp4";

/** Industrial pipe-diagnostic campaign — never otter, bubbles, or generic FilmStage. */
export function isPlumbingCampaign(value?: string | null): boolean {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return false;
  return (
    v === "plumbing" ||
    v.includes("plumb") ||
    v.includes("axio-plumber") ||
    v.includes("axiom-plumber") ||
    v.includes("pipe-diagnostic") ||
    v.includes("plumbers-outreach")
  );
}

export function plumberCampaignPath(slug: string, opts?: { greet?: boolean; studio?: boolean }): string {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || "accurate-plumbing";
  const params = new URLSearchParams({ niche: "plumbing" });
  if (opts?.greet !== false) params.set("greet", "1");
  if (opts?.studio) params.set("studio", "1");
  return `/t/${safe}?${params.toString()}`;
}
export const PLUMBER_OUTREACH_HERO_VIDEO_MOBILE = "/media/axio-plumber-hero-mobile.mp4";
export const PLUMBER_OUTREACH_HERO_POSTER = "/media/axio-plumber-hero.jpg";
export const PLUMBER_OUTREACH_GREETING_VIDEO = "/media/axiom-greeting.mp4";
export const PLUMBER_OUTREACH_GREETING_POSTER = "/media/axiom-greeting-poster.jpg";
export const PLUMBER_OUTREACH_FEATURE_VIDEO = "/media/plumbing-drain-ride.mp4";
export const PLUMBER_OUTREACH_FEATURE_POSTER = "/media/plumbing-drain-ride-poster.jpg";
export const PLUMBER_OUTREACH_REEL_VIDEO = "/media/drain-clog.mp4";
export const PLUMBER_OUTREACH_TELEMETRY_VIDEO = "/media/plumbing-diagnostic-telemetry.mp4";
export const PLUMBER_OUTREACH_TELEMETRY_POSTER = "/media/plumbing-diagnostic-telemetry-poster.jpg";

export type OutreachStat = { id: string; value: string; label: string };
export type OutreachService = { id: string; title: string; detail: string; price: string; eta: string };
export type OutreachQuote = { id: string; quote: string; name: string; role: string };
export type OutreachBadge = { id: string; label: string };
export type OutreachFeaturePoint = { id: string; title: string; detail: string };

export type PlumberOutreachConfig = {
  hero: {
    eyebrow: string;
    /** {business}, {city} and {county} are filled in everywhere copy is shown. */
    headline: string;
    subhead: string;
    videoUrl: string;
    /** Blank = every screen plays `videoUrl`. */
    mobileVideoUrl: string;
    posterUrl: string;
    /** 0–100. How dark the scrim sits over the film so the overlay stays readable. */
    scrim: number;
  };
  metric: {
    enabled: boolean;
    /** The big number. */
    count: number;
    /** {count} is filled in. */
    line: string;
    /** Shown beside the number while it is sample data. Blank only once the figure is real. */
    sampleLabel: string;
    stats: OutreachStat[];
  };
  badges: OutreachBadge[];
  ctas: {
    trialLabel: string;
    trialNote: string;
    callLabel: string;
    /** Used when the link has no tenant phone on file. Blank = the button opens the dispatch request instead. */
    fallbackPhone: string;
    dispatchLabel: string;
  };
  checkout: {
    title: string;
    blurb: string;
    /** Whole dollars offered as one-tap amounts. The $1 floor is enforced on the server. */
    presets: number[];
    defaultDollars: number;
    /** Where the buyer goes if card checkout cannot open for this link. */
    fallbackHref: string;
  };
  mobileLock: {
    title: string;
    blurb: string;
    testLabel: string;
    /** {business} is filled in. Sent to the locked number by "Test Live SMS Dispatch". */
    smsBody: string;
    doneTitle: string;
    doneBody: string;
  };
  /** Cinematic feature section directly under the hero (the pipe-rafting film). */
  feature: {
    enabled: boolean;
    kicker: string;
    title: string;
    blurb: string;
    videoUrl: string;
    posterUrl: string;
    /** Small caption on the video card. */
    caption: string;
    points: OutreachFeaturePoint[];
    /** Blank hides the button under the copy. */
    ctaLabel: string;
  };
  /** Overlay player inside the diagnostic feature grid — never reflows hero, copy, or booking. */
  reel: {
    enabled: boolean;
    title: string;
    videoUrl: string;
  };
  services: {
    kicker: string;
    headline: string;
    items: OutreachService[];
  };
  booking: {
    enabled: boolean;
    kicker: string;
    headline: string;
    blurb: string;
    slots: string[];
    submitLabel: string;
    confirmTitle: string;
    /** {slot} and {service} are filled in. */
    confirmBody: string;
    /** Shown on the confirmation so nobody mistakes the preview for a real dispatch. */
    previewLabel: string;
  };
  telemetry: {
    enabled: boolean;
    videoUrl: string;
    posterUrl: string;
    kicker: string;
    headline: string;
    blurb: string;
    points: string[];
  };
  proof: {
    enabled: boolean;
    kicker: string;
    headline: string;
    sampleLabel: string;
    items: OutreachQuote[];
  };
  closing: {
    headline: string;
    blurb: string;
  };
};

export const DEFAULT_PLUMBER_OUTREACH: PlumberOutreachConfig = {
  hero: {
    eyebrow: "Built for {business} · {city}",
    headline: "Never miss another emergency call in {city}.",
    subhead:
      "Missed calls become booked jobs in 9 seconds. Instant SMS dispatch for {business} — your crew stays on the truck.",
    videoUrl: PLUMBER_OUTREACH_HERO_VIDEO,
    // Blank on purpose: every screen plays the master file directly via <video src>.
    mobileVideoUrl: "",
    posterUrl: PLUMBER_OUTREACH_HERO_POSTER,
    scrim: 70,
  },
  metric: {
    enabled: true,
    count: 14,
    line: "missed emergency calls captured this month for shops like {business} in {city}",
    sampleLabel: "Modeled capture",
    stats: [
      { id: "m1", value: "9 sec", label: "SMS dispatch speed" },
      { id: "m2", value: "24/7", label: "missed-call capture" },
      { id: "m3", value: "$0", label: "extra dispatcher cost" },
    ],
  },
  badges: [
    { id: "b1", label: "Live in minutes" },
    { id: "b2", label: "No contract" },
    { id: "b3", label: "Stripe $1 trial" },
  ],
  ctas: {
    trialLabel: "Go live for $1",
    trialNote: "$1 today · $150/mo after 30 days · cancel anytime",
    callLabel: "Call Now",
    fallbackPhone: "",
    dispatchLabel: "Emergency Dispatch",
  },
  checkout: {
    title: "Start dispatch for $1",
    blurb: "Pay $1 now. {business} locks {city} the moment Stripe clears — desk, SMS routing, and this page go live together.",
    presets: [1, 5, 25],
    defaultDollars: 1,
    fallbackHref: "/onboard?niche=plumbing",
  },
  mobileLock: {
    title: "Where should emergency leads ring?",
    blurb: "Enter the cell that's in your pocket on a job. Every captured call texts this number the second it comes in.",
    testLabel: "Test Live SMS Dispatch",
    smsBody:
      "{business}: Axiom dispatch is LIVE. This is your test alert — emergency leads will text this number 24/7. Reply STOP to opt out.",
    doneTitle: "Dispatch is armed.",
    doneBody: "That text came from the same line that will alert you on every captured emergency call.",
  },
  feature: {
    enabled: true,
    kicker: "Automated dispatch",
    title: "Inside Your Lines: Real-Time Emergency Diagnostics & Obstruction Clearing",
    blurb:
      "When a line backs up, the homeowner calls whoever answers first. Axiom answers every time — it texts back in seconds, asks what's happening, flags the emergency, and puts {business} on the job before the water reaches the floor.",
    videoUrl: PLUMBER_OUTREACH_FEATURE_VIDEO,
    posterUrl: PLUMBER_OUTREACH_FEATURE_POSTER,
    caption: "Line ride · main sewer run",
    points: [
      { id: "f1", title: "Root intrusions", detail: "Slow drains and gurgling get triaged as a mainline job and booked for a camera and cutter — not left on voicemail." },
      { id: "f2", title: "Grease clogs", detail: "Kitchen backups are tagged, quoted from your menu, and slotted into the next open window automatically." },
      { id: "f3", title: "Emergency backups", detail: "Sewage or standing water jumps the queue and texts your cell instantly, day or night." },
    ],
    ctaLabel: "Turn on {city} capture for $1",
  },
  reel: {
    enabled: true,
    title: "Live Pipe Diagnostic Reel",
    videoUrl: PLUMBER_OUTREACH_REEL_VIDEO,
  },
  services: {
    kicker: "Live service menu",
    headline: "What your customers can book tonight",
    items: [
      { id: "s1", title: "Burst & leaking pipes", detail: "Shut-off, locate, repair, and a dry test before the truck leaves.", price: "From $149", eta: "60-min response" },
      { id: "s2", title: "Drain & sewer clears", detail: "Stoppage cleared plus a camera check of the line.", price: "From $189", eta: "Same day" },
      { id: "s3", title: "Water heater rescue", detail: "No hot water tonight? Repair or same-day swap.", price: "From $229", eta: "Same day" },
      { id: "s4", title: "Sump & flood response", detail: "Pump-out, pump replacement, and a moisture check.", price: "From $199", eta: "24/7" },
    ],
  },
  booking: {
    enabled: true,
    kicker: "Instant booking",
    headline: "Your customer books in three taps",
    blurb: "This is the widget on your page. Pick a job and a window — the request lands on your phone, not in voicemail.",
    slots: ["ASAP · next 60 min", "Tonight · 6–9 PM", "Tomorrow · 7–10 AM", "Tomorrow · 1–4 PM"],
    submitLabel: "Request dispatch",
    confirmTitle: "Dispatch request captured",
    confirmBody: "{service} · {slot}. On a live page this texts your cell instantly and holds the slot.",
    previewLabel: "Preview — no job was created",
  },
  telemetry: {
    enabled: true,
    videoUrl: PLUMBER_OUTREACH_TELEMETRY_VIDEO,
    posterUrl: PLUMBER_OUTREACH_TELEMETRY_POSTER,
    kicker: "Proof of work",
    headline: "Every call logged. Every lead accounted for.",
    blurb: "Your dashboard shows what came in, what got a text back, and what booked — so you can see the system paying for itself.",
    points: [
      "Missed call → text-back in seconds",
      "Triage answers saved with the lead",
      "Booked jobs pushed to your phone",
    ],
  },
  proof: {
    enabled: true,
    kicker: "From the field",
    headline: "What changes when no call goes unanswered",
    sampleLabel: "Sample feedback",
    items: [
      { id: "q1", quote: "We were under a house when three calls came in. All three had a text back before we crawled out.", name: "Owner-operator", role: "2-truck shop" },
      { id: "q2", quote: "After-hours used to be voicemail roulette. Now I wake up to booked jobs.", name: "Service manager", role: "Residential plumbing" },
      { id: "q3", quote: "The $1 month paid for itself on the first water heater.", name: "Master plumber", role: "Family-run crew" },
    ],
  },
  closing: {
    headline: "Lock {city} before the next plumber does.",
    blurb: "One plumbing territory per market. $1 today opens {business}'s desk, SMS dispatch, and this page.",
  },
};

/* ---------------------------------------------------------------- sanitizers */

function tidy(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    out += code < 32 || code === 127 ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Blank falls back — for fields the page cannot render without. */
function text(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  const clean = tidy(value);
  return clean ? clean.slice(0, max) : fallback;
}

/** Blank is a real choice — the section simply hides that line. */
function optional(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return tidy(value).slice(0, max);
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function rowId(raw: Record<string, unknown>, prefix: string, i: number): string {
  const v = typeof raw.id === "string" ? raw.id.replace(/[^a-z0-9_-]/gi, "").slice(0, 24) : "";
  return v || `${prefix}${i + 1}`;
}

function rows<T>(
  value: unknown,
  max: number,
  each: (raw: Record<string, unknown>, i: number) => T | null,
  fallback: T[],
): T[] {
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

function lines(value: unknown, max: number, each: number, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const out: string[] = [];
  for (const raw of value) {
    if (out.length >= max) break;
    if (typeof raw !== "string") continue;
    const clean = tidy(raw).slice(0, each);
    if (clean) out.push(clean);
  }
  return out;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parsePlumberOutreach(input: unknown): PlumberOutreachConfig {
  const d = DEFAULT_PLUMBER_OUTREACH;
  const raw = obj(typeof input === "string" ? safeJson(input) : input);
  const hero = obj(raw.hero);
  const metric = obj(raw.metric);
  const ctas = obj(raw.ctas);
  const checkout = obj(raw.checkout);
  const lock = obj(raw.mobileLock);
  const services = obj(raw.services);
  const feature = obj(raw.feature);
  const reel = obj(raw.reel);
  const booking = obj(raw.booking);
  const telemetry = obj(raw.telemetry);
  const proof = obj(raw.proof);
  const closing = obj(raw.closing);

  const presets = Array.isArray(checkout.presets)
    ? [...new Set(checkout.presets.map((p) => clamp(p, 1, 5000, NaN)).filter((p) => Number.isFinite(p)))].slice(0, 4)
    : d.checkout.presets;
  const slots = lines(booking.slots, 6, 40, d.booking.slots);

  return {
    hero: {
      eyebrow: optional(hero.eyebrow, d.hero.eyebrow, 60),
      headline: text(hero.headline, d.hero.headline, 120),
      subhead: optional(hero.subhead, d.hero.subhead, 280),
      videoUrl: safeMediaUrl(hero.videoUrl, d.hero.videoUrl),
      mobileVideoUrl: typeof hero.mobileVideoUrl === "string" && !hero.mobileVideoUrl.trim() ? "" : safeMediaUrl(hero.mobileVideoUrl, d.hero.mobileVideoUrl),
      posterUrl: safeMediaUrl(hero.posterUrl, d.hero.posterUrl),
      scrim: clamp(hero.scrim, 0, 100, d.hero.scrim),
    },
    metric: {
      enabled: flag(metric.enabled, d.metric.enabled),
      count: clamp(metric.count, 0, 99_999, d.metric.count),
      line: text(metric.line, d.metric.line, 160),
      sampleLabel: optional(metric.sampleLabel, d.metric.sampleLabel, 30),
      stats: rows(
        metric.stats,
        3,
        (s, i) => {
          const value = optional(s.value, "", 12);
          const label = optional(s.label, "", 40);
          if (!value || !label) return null;
          return { id: rowId(s, "m", i), value, label };
        },
        d.metric.stats,
      ),
    },
    badges: rows(
      raw.badges,
      4,
      (b, i) => {
        const label = optional(b.label, "", 32);
        return label ? { id: rowId(b, "b", i), label } : null;
      },
      d.badges,
    ),
    ctas: {
      trialLabel: text(ctas.trialLabel, d.ctas.trialLabel, 40),
      trialNote: optional(ctas.trialNote, d.ctas.trialNote, 120),
      callLabel: text(ctas.callLabel, d.ctas.callLabel, 24),
      fallbackPhone: optional(ctas.fallbackPhone, d.ctas.fallbackPhone, 32),
      dispatchLabel: text(ctas.dispatchLabel, d.ctas.dispatchLabel, 28),
    },
    checkout: {
      title: text(checkout.title, d.checkout.title, 60),
      blurb: optional(checkout.blurb, d.checkout.blurb, 220),
      presets: presets.length ? presets : d.checkout.presets,
      defaultDollars: clamp(checkout.defaultDollars, 1, 5000, d.checkout.defaultDollars),
      fallbackHref: safeHref(checkout.fallbackHref, d.checkout.fallbackHref),
    },
    mobileLock: {
      title: text(lock.title, d.mobileLock.title, 80),
      blurb: optional(lock.blurb, d.mobileLock.blurb, 220),
      testLabel: text(lock.testLabel, d.mobileLock.testLabel, 32),
      smsBody: text(lock.smsBody, d.mobileLock.smsBody, 300),
      doneTitle: text(lock.doneTitle, d.mobileLock.doneTitle, 60),
      doneBody: optional(lock.doneBody, d.mobileLock.doneBody, 220),
    },
    feature: {
      enabled: flag(feature.enabled, d.feature.enabled),
      kicker: optional(feature.kicker, d.feature.kicker, 40),
      title: text(feature.title, d.feature.title, 120),
      blurb: optional(feature.blurb, d.feature.blurb, 360),
      videoUrl: safeMediaUrl(feature.videoUrl, d.feature.videoUrl),
      posterUrl: safeMediaUrl(feature.posterUrl, d.feature.posterUrl),
      caption: optional(feature.caption, d.feature.caption, 50),
      points: rows(
        feature.points,
        4,
        (f, i) => {
          const title = optional(f.title, "", 40);
          if (!title) return null;
          return { id: rowId(f, "f", i), title, detail: optional(f.detail, "", 180) };
        },
        d.feature.points,
      ),
      ctaLabel: optional(feature.ctaLabel, d.feature.ctaLabel, 40),
    },
    reel: {
      enabled: flag(reel.enabled, d.reel.enabled),
      title: text(reel.title, d.reel.title, 48),
      videoUrl: safeMediaUrl(reel.videoUrl, d.reel.videoUrl),
    },
    services: {
      kicker: optional(services.kicker, d.services.kicker, 40),
      headline: text(services.headline, d.services.headline, 100),
      items: rows(
        services.items,
        8,
        (s, i) => {
          const title = optional(s.title, "", 50);
          if (!title) return null;
          return {
            id: rowId(s, "s", i),
            title,
            detail: optional(s.detail, "", 140),
            price: optional(s.price, "", 24),
            eta: optional(s.eta, "", 24),
          };
        },
        d.services.items,
      ),
    },
    booking: {
      enabled: flag(booking.enabled, d.booking.enabled),
      kicker: optional(booking.kicker, d.booking.kicker, 40),
      headline: text(booking.headline, d.booking.headline, 100),
      blurb: optional(booking.blurb, d.booking.blurb, 240),
      slots: slots.length ? slots : d.booking.slots,
      submitLabel: text(booking.submitLabel, d.booking.submitLabel, 32),
      confirmTitle: text(booking.confirmTitle, d.booking.confirmTitle, 60),
      confirmBody: optional(booking.confirmBody, d.booking.confirmBody, 220),
      previewLabel: optional(booking.previewLabel, d.booking.previewLabel, 60),
    },
    telemetry: {
      enabled: flag(telemetry.enabled, d.telemetry.enabled),
      videoUrl: safeMediaUrl(telemetry.videoUrl, d.telemetry.videoUrl),
      posterUrl: safeMediaUrl(telemetry.posterUrl, d.telemetry.posterUrl),
      kicker: optional(telemetry.kicker, d.telemetry.kicker, 40),
      headline: text(telemetry.headline, d.telemetry.headline, 100),
      blurb: optional(telemetry.blurb, d.telemetry.blurb, 260),
      points: lines(telemetry.points, 5, 80, d.telemetry.points),
    },
    proof: {
      enabled: flag(proof.enabled, d.proof.enabled),
      kicker: optional(proof.kicker, d.proof.kicker, 40),
      headline: text(proof.headline, d.proof.headline, 100),
      sampleLabel: optional(proof.sampleLabel, d.proof.sampleLabel, 30),
      items: rows(
        proof.items,
        6,
        (q, i) => {
          const quote = optional(q.quote, "", 240);
          if (!quote) return null;
          return { id: rowId(q, "q", i), quote, name: optional(q.name, "", 40), role: optional(q.role, "", 40) };
        },
        d.proof.items,
      ),
    },
    closing: {
      headline: text(closing.headline, d.closing.headline, 100),
      blurb: optional(closing.blurb, d.closing.blurb, 240),
    },
  };
}

/** Shop-desk override for the diagnostic reel; blank URL keeps the master clip. */
export function applyTenantReel(
  config: PlumberOutreachConfig,
  tenant?: { diagnosticReelUrl?: string; diagnosticReelEnabled?: boolean },
): PlumberOutreachConfig {
  if (!tenant) return config;
  const enabled = typeof tenant.diagnosticReelEnabled === "boolean" ? tenant.diagnosticReelEnabled : config.reel.enabled;
  const videoUrl = tenant.diagnosticReelUrl?.trim()
    ? safeMediaUrl(tenant.diagnosticReelUrl, config.reel.videoUrl)
    : config.reel.videoUrl;
  if (enabled === config.reel.enabled && videoUrl === config.reel.videoUrl) return config;
  return { ...config, reel: { ...config.reel, enabled, videoUrl } };
}

/* ------------------------------------------------------------ tenant context */

/** Who this link was built for. Everything is optional — a bare slug still renders. */
export type OutreachTenant = {
  slug: string;
  business: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  address: string;
  owner: string;
  email: string;
  /** Tenant phone exactly as stored; may be blank. */
  phone: string;
  reviewScore: number;
  reviewCount: number;
  /** True once this territory has a settled activation. */
  live: boolean;
  /** True when the slug maps to a territory that card checkout can be bound to. */
  known: boolean;
};

export function emptyOutreachTenant(slug: string): OutreachTenant {
  return {
    slug,
    business: "",
    city: "",
    county: "",
    state: "",
    zip: "",
    address: "",
    owner: "",
    email: "",
    phone: "",
    reviewScore: 0,
    reviewCount: 0,
    live: false,
    known: false,
  };
}

/** "rogue-rapid-plumbing-medford" → "Rogue Rapid Plumbing Medford" for links with no record behind them. */
export function businessFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 60);
}

export function outreachVars(tenant: OutreachTenant): Record<string, string> {
  const business = (tenant.business || businessFromSlug(tenant.slug) || "your shop").trim();
  const city = (tenant.city || tenant.county || "your area").trim();
  const county = (tenant.county || city).trim();
  const market = [city, tenant.state].filter(Boolean).join(", ") || county;
  const address =
    tenant.address ||
    [city, tenant.county, tenant.state, tenant.zip].filter(Boolean).join(", ") ||
    market;
  const phone = formatPhone(tenant.phone || "");
  const reviews =
    tenant.reviewCount > 0 && tenant.reviewScore > 0
      ? `${tenant.reviewScore.toFixed(1)}★ · ${tenant.reviewCount.toLocaleString("en-US")} reviews`
      : "";
  return {
    business,
    city,
    county,
    state: tenant.state || "",
    zip: tenant.zip || "",
    address,
    market,
    owner: tenant.owner || business,
    phone,
    email: tenant.email || "",
    reviews,
  };
}

/** True when filled copy has no leftover `{token}` holes for inlay keys. */
export function inlayIsClean(text: string): boolean {
  return !/\{(business|city|county|phone|address|market|owner|state|zip|email|reviews)\}/.test(text);
}

/** "(541) 890-1234" for 10-digit US numbers; anything else is shown as stored. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10) return raw.trim();
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/** The number the Call Now button dials: the tenant's own line first, then the studio fallback. */
export function callTarget(
  tenant: Pick<OutreachTenant, "phone">,
  config: Pick<PlumberOutreachConfig, "ctas">,
): { dial: string; display: string } | null {
  for (const candidate of [tenant.phone, config.ctas.fallbackPhone]) {
    const dial = dialDigits(candidate || "");
    if (dial.replace(/\D/g, "").length >= 10) return { dial, display: formatPhone(candidate) };
  }
  return null;
}

/* ------------------------------------------------------- dispatch cell rule */

export type DispatchMobileCheck =
  | { ok: true; e164: string; display: string }
  | { ok: false; reason: string };

const TOLL_FREE = new Set(["800", "833", "844", "855", "866", "877", "888"]);

/**
 * The post-checkout lock only accepts a real, textable US cell.
 * Rejected: 555 placeholder lines, impossible area codes/exchanges, toll-free
 * and premium numbers, and obvious filler like 1234567890 or 5035035033.
 */
export function checkDispatchMobile(raw: string): DispatchMobileCheck {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10) return { ok: false, reason: "Enter the full 10-digit cell number, area code first." };
  const area = ten.slice(0, 3);
  const exchange = ten.slice(3, 6);
  if (area === "555" || exchange === "555") {
    return { ok: false, reason: "555 numbers are placeholders — enter the real cell you carry on the job." };
  }
  if (/^[01]/.test(area) || /^[01]/.test(exchange) || area[1] === "9") {
    return { ok: false, reason: "That isn't a valid US area code or exchange. Check the number and try again." };
  }
  if (TOLL_FREE.has(area) || area === "900") {
    return { ok: false, reason: "Toll-free and premium lines can't receive dispatch texts — use a direct cell." };
  }
  if (/^(\d)\1{9}$/.test(ten) || ten === "1234567890" || ten === "0123456789" || /^(\d{3})\1\1/.test(ten)) {
    return { ok: false, reason: "That looks like a filler number — enter the real cell you carry on the job." };
  }
  if (/^(\d)\1{6}$/.test(ten.slice(3))) {
    return { ok: false, reason: "That looks like a filler number — enter the real cell you carry on the job." };
  }
  return { ok: true, e164: `+1${ten}`, display: formatPhone(ten) };
}

/** Whole dollars → cents for the Name Your Price bid, never below the $1 floor. */
export function bidCents(dollars: unknown): number {
  const n = typeof dollars === "number" ? dollars : Number(String(dollars ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 100;
  return Math.min(500_000, Math.max(100, Math.round(n * 100)));
}

/** Test-dispatch throttle: one text every 30 seconds, five per locked number. */
export const TEST_DISPATCH_GAP_MS = 30_000;
export const TEST_DISPATCH_MAX = 5;

export function testDispatchAllowed(
  state: { count: number; lastAt: number | null },
  now: number,
): { ok: true } | { ok: false; reason: string } {
  if (state.count >= TEST_DISPATCH_MAX) {
    return { ok: false, reason: "Test limit reached for this number — live alerts are unaffected." };
  }
  if (state.lastAt !== null && now - state.lastAt < TEST_DISPATCH_GAP_MS) {
    const wait = Math.ceil((TEST_DISPATCH_GAP_MS - (now - state.lastAt)) / 1000);
    return { ok: false, reason: `Give it ${wait}s — the last test is still on its way.` };
  }
  return { ok: true };
}
