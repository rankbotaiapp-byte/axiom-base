/**
 * Competitor replacement comparison + regional land-grab urgency.
 *
 * Pure module: demo storefronts and Master Admin Studio pass city / county /
 * trade through `localizeCompetitorLandGrab` so Medford plumbers see Jackson
 * County territory pressure and Grants Pass electricians see Josephine slots.
 */

import { countyForCity, resolveHomeCounty } from "./geo-social-proof.ts";

export type CompetitorCompareRow = {
  id: string;
  legacy: string;
  axiom: string;
};

export type CompetitorLandGrabConfig = {
  comparisonEnabled: boolean;
  bannerEnabled: boolean;
  /** Only force the comparison into view on ?greet=1 visits when true. */
  requireGreet: boolean;
  headline: string;
  subhead: string;
  legacyColumn: string;
  axiomColumn: string;
  rows: CompetitorCompareRow[];
  ctaLabel: string;
  ctaHref: string;
  /** Tokens: {slots} {capacity} {city} {county} {trade} {business} {minutes}. */
  bannerTemplate: string;
  slotsRemaining: number;
  capacity: number;
  /** Soft countdown copy — "locks out neighbors in ~{minutes} min after trial start". */
  lockMinutes: number;
  sampleLabel: string;
};

export type CompetitorLocale = {
  city?: string;
  county?: string;
  niche?: string;
  trade?: string;
  business?: string;
  /** True when the visit carried greet=1 (avatar intro / custom storefront). */
  greet?: boolean;
};

export type LocalizedCompetitorLandGrab = {
  city: string;
  county: string;
  trade: string;
  business: string;
  showComparison: boolean;
  showBanner: boolean;
  headline: string;
  subhead: string;
  legacyColumn: string;
  axiomColumn: string;
  rows: CompetitorCompareRow[];
  ctaLabel: string;
  ctaHref: string;
  bannerLine: string;
  slotsRemaining: number;
  capacity: number;
  lockMinutes: number;
  sampleLabel: string;
  pressurePct: number;
};

export const DEFAULT_COMPETITOR_LAND_GRAB: CompetitorLandGrabConfig = {
  comparisonEnabled: true,
  bannerEnabled: true,
  requireGreet: false,
  headline: "Replace the stack that loses jobs after hours",
  subhead:
    "Axiom swaps legacy web forms and clunky answering services for instant text-back and a 24/7 AI booking assistant — built for {trade} crews in {city}.",
  legacyColumn: "Legacy stack",
  axiomColumn: "Axiom",
  rows: [
    {
      id: "forms",
      legacy: "Outdated contact forms that sit unread overnight",
      axiom: "Instant text-back the second a call is missed",
    },
    {
      id: "answering",
      legacy: "Answering services that take messages, not bookings",
      axiom: "24/7 AI assistant that books the next open slot",
    },
    {
      id: "followup",
      legacy: "Manual follow-ups while the next plumber gets the job",
      axiom: "Caller confirmed and on the calendar before they hang up",
    },
  ],
  ctaLabel: "$1 Choose Your Price Trial",
  ctaHref: "/onboard",
  bannerTemplate:
    "Land grab · {slots} of {capacity} {trade} territories still open in {county}. Starting a trial locks competing shops out of {city}.",
  slotsRemaining: 3,
  capacity: 8,
  lockMinutes: 12,
  sampleLabel: "Territory sample",
};

function tidy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function text(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  const clean = tidy(value);
  return clean ? clean.slice(0, max) : fallback;
}

function optionalText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return tidy(value).slice(0, max);
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function listRows(value: unknown, fallback: CompetitorCompareRow[]): CompetitorCompareRow[] {
  if (!Array.isArray(value)) return fallback;
  const out: CompetitorCompareRow[] = [];
  for (const [i, raw] of value.entries()) {
    if (out.length >= 6) break;
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const legacy = optionalText(row.legacy, 120);
    const axiom = optionalText(row.axiom, 120);
    if (!legacy || !axiom) continue;
    const id =
      typeof row.id === "string" && row.id ? row.id.replace(/[^a-z0-9_-]/gi, "").slice(0, 24) : `row${i + 1}`;
    out.push({ id, legacy, axiom });
  }
  return out.length ? out : fallback;
}

export function parseCompetitorLandGrab(input: unknown): CompetitorLandGrabConfig {
  const d = DEFAULT_COMPETITOR_LAND_GRAB;
  const raw = obj(input);
  const capacity = Math.max(2, clamp(raw.capacity, 2, 40, d.capacity));
  const slotsRemaining = clamp(raw.slotsRemaining, 1, capacity - 1, Math.min(d.slotsRemaining, capacity - 1));
  return {
    comparisonEnabled: typeof raw.comparisonEnabled === "boolean" ? raw.comparisonEnabled : d.comparisonEnabled,
    bannerEnabled: typeof raw.bannerEnabled === "boolean" ? raw.bannerEnabled : d.bannerEnabled,
    requireGreet: typeof raw.requireGreet === "boolean" ? raw.requireGreet : d.requireGreet,
    headline: text(raw.headline, d.headline, 120),
    subhead: optionalText(raw.subhead ?? d.subhead, 280),
    legacyColumn: text(raw.legacyColumn, d.legacyColumn, 40),
    axiomColumn: text(raw.axiomColumn, d.axiomColumn, 40),
    rows: listRows(raw.rows, d.rows),
    ctaLabel: text(raw.ctaLabel, d.ctaLabel, 48),
    ctaHref: safeHref(raw.ctaHref, d.ctaHref),
    bannerTemplate: text(raw.bannerTemplate, d.bannerTemplate, 220),
    slotsRemaining,
    capacity,
    lockMinutes: clamp(raw.lockMinutes, 1, 120, d.lockMinutes),
    sampleLabel: optionalText(raw.sampleLabel ?? d.sampleLabel, 30),
  };
}

function safeHref(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (!v) return fallback;
  if (v.startsWith("/") && !v.startsWith("//")) return v.slice(0, 300);
  if (/^https:\/\//i.test(v)) return v.slice(0, 300);
  return fallback;
}

function withNicheParam(href: string, niche: string): string {
  if (!niche || href.includes("niche=")) return href;
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}niche=${encodeURIComponent(niche)}`;
}

function fill(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in tokens ? tokens[key] : match));
}

/** Stable nudge so the same market keeps the same remaining-slot count. */
export function landGrabSeed(city: string, county: string, trade: string): number {
  const raw = `${tidy(city).toLowerCase()}|${tidy(county).toLowerCase()}|${tidy(trade).toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function localizeCompetitorLandGrab(
  config: CompetitorLandGrabConfig,
  locale: CompetitorLocale,
): LocalizedCompetitorLandGrab {
  const city =
    tidy(locale.city ?? "").replace(/,\s*[A-Z]{2}$/i, "").trim() || "your city";
  const county =
    resolveHomeCounty(locale.county ?? "") ??
    countyForCity(city) ??
    (tidy(locale.county ?? "") || "your county");
  const trade = tidy(locale.trade ?? locale.niche ?? "trade") || "trade";
  const business = tidy(locale.business ?? "") || "your shop";
  const seed = landGrabSeed(city, String(county), trade);
  const slots = Math.max(1, Math.min(config.capacity - 1, config.slotsRemaining - (seed % 2)));
  const tokens = {
    slots: String(slots),
    capacity: String(config.capacity),
    city,
    county: String(county),
    trade,
    business,
    minutes: String(config.lockMinutes),
  };
  const greetOk = !config.requireGreet || Boolean(locale.greet);
  const showComparison = config.comparisonEnabled && greetOk;
  const showBanner = config.bannerEnabled && greetOk;
  const pressurePct = Math.round(((config.capacity - slots) / config.capacity) * 100);

  return {
    city,
    county: String(county),
    trade,
    business,
    showComparison,
    showBanner,
    headline: fill(config.headline, tokens),
    subhead: fill(config.subhead, tokens),
    legacyColumn: config.legacyColumn,
    axiomColumn: config.axiomColumn,
    rows: config.rows,
    ctaLabel: config.ctaLabel,
    ctaHref: withNicheParam(config.ctaHref, tidy(locale.niche ?? "").toLowerCase() || "contractor"),
    bannerLine: fill(config.bannerTemplate, tokens),
    slotsRemaining: slots,
    capacity: config.capacity,
    lockMinutes: config.lockMinutes,
    sampleLabel: config.sampleLabel,
    pressurePct,
  };
}
