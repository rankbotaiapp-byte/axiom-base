/**
 * Geo-targeted proof-of-work + local social proof rotation.
 *
 * Pure module: no DOM / DB. Demo storefronts and the Master Admin Studio
 * pass city + county through `localizeGeoSocialProof` so the same config
 * renders Medford numbers for a Medford lead and Grants Pass numbers for
 * a Josephine County lead.
 */

import { HOME_REGION_CITIES, HOME_REGION_COUNTIES, type HomeCounty } from "./regional-roster.ts";

export type GeoProofStat = {
  id: string;
  /** Short label under the figure, e.g. "booked in {city} this week". */
  label: string;
  /** Display value — may include {jobs}, {minutes}, {activations}, {city}, {county}. */
  value: string;
};

export type GeoTickerMessage = {
  id: string;
  /** Tokens: {name} {place} {job} {ago} {city} {county} {trade}. */
  template: string;
};

export type GeoSocialProofConfig = {
  proofEnabled: boolean;
  tickerEnabled: boolean;
  headline: string;
  subhead: string;
  sampleLabel: string;
  /** Seed figures — localization nudges these per city/county so they stay plausible. */
  jobsThisWeek: number;
  responseMinutes: number;
  activationsThisMonth: number;
  stats: GeoProofStat[];
  tickerIntervalMs: number;
  tickerMessages: GeoTickerMessage[];
  /** Fallback first names when rotating ticker lines. */
  names: string[];
  /** Fallback job verbs when a message uses {job}. */
  jobs: string[];
};

export type GeoLocale = {
  city?: string;
  county?: string;
  niche?: string;
  trade?: string;
};

export type LocalizedGeoSocialProof = {
  city: string;
  county: string;
  places: string[];
  headline: string;
  subhead: string;
  sampleLabel: string;
  proofEnabled: boolean;
  tickerEnabled: boolean;
  tickerIntervalMs: number;
  stats: { id: string; value: string; label: string }[];
  ticker: { id: string; line: string; place: string; ago: string }[];
};

const NICHE_JOBS: Record<string, string[]> = {
  plumbing: ["booked a burst-pipe repair", "got a text back after hours", "scheduled a water heater swap", "booked a drain clear"],
  electrical: ["booked a panel upgrade", "scheduled an outage call", "locked in a service visit"],
  auto: ["booked a bay slot", "scheduled a mobile wrench visit", "claimed their after-hours line"],
  hvac: ["booked an AC rescue", "scheduled a furnace check", "claimed a same-day slot"],
  contractor: ["booked a site walk", "claimed their territory page", "scheduled an estimate"],
  roofing: ["booked a roof inspection", "scheduled a leak repair"],
  default: ["activated their Axiom page", "booked a visit", "claimed the local listing"],
};

export const DEFAULT_GEO_SOCIAL_PROOF: GeoSocialProofConfig = {
  proofEnabled: true,
  tickerEnabled: true,
  headline: "Local proof in {city}",
  subhead: "Recent completions and activations across {county} — the same playbook your storefront uses.",
  sampleLabel: "Local sample",
  jobsThisWeek: 14,
  responseMinutes: 18,
  activationsThisMonth: 9,
  stats: [
    { id: "jobs", value: "{jobs}", label: "jobs booked in {city} this week" },
    { id: "response", value: "{minutes}m", label: "avg text-back in {county}" },
    { id: "activations", value: "{activations}", label: "shops activated nearby" },
  ],
  tickerIntervalMs: 5200,
  tickerMessages: [
    { id: "t1", template: "{name} in {place} {job}" },
    { id: "t2", template: "{name} just activated Axiom in {place}" },
    { id: "t3", template: "New booking · {place} · {ago}" },
    { id: "t4", template: "{name} in {city} claimed their missed-call line" },
  ],
  names: ["Jenna R.", "Marcus T.", "Alicia P.", "Dev K.", "Nina H.", "Omar S.", "Claire M.", "Luis O."],
  jobs: NICHE_JOBS.default,
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

function list<T>(
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
  return out.length ? out : fallback;
}

export function parseGeoSocialProof(input: unknown): GeoSocialProofConfig {
  const d = DEFAULT_GEO_SOCIAL_PROOF;
  const raw = obj(input);
  const names = Array.isArray(raw.names)
    ? raw.names
        .map((n) => (typeof n === "string" ? tidy(n).slice(0, 40) : ""))
        .filter(Boolean)
        .slice(0, 16)
    : [...d.names];
  const jobs = Array.isArray(raw.jobs)
    ? raw.jobs
        .map((j) => (typeof j === "string" ? tidy(j).slice(0, 80) : ""))
        .filter(Boolean)
        .slice(0, 12)
    : [...d.jobs];
  return {
    proofEnabled: typeof raw.proofEnabled === "boolean" ? raw.proofEnabled : d.proofEnabled,
    tickerEnabled: typeof raw.tickerEnabled === "boolean" ? raw.tickerEnabled : d.tickerEnabled,
    headline: text(raw.headline, d.headline, 100),
    subhead: optionalText(raw.subhead ?? d.subhead, 240),
    sampleLabel: optionalText(raw.sampleLabel ?? d.sampleLabel, 30),
    jobsThisWeek: clamp(raw.jobsThisWeek, 1, 500, d.jobsThisWeek),
    responseMinutes: clamp(raw.responseMinutes, 1, 180, d.responseMinutes),
    activationsThisMonth: clamp(raw.activationsThisMonth, 1, 500, d.activationsThisMonth),
    stats: list(
      raw.stats,
      4,
      (s, i) => {
        const label = optionalText(s.label, 80);
        const value = optionalText(s.value, 40);
        if (!label || !value) return null;
        const id = typeof s.id === "string" && s.id ? s.id.slice(0, 24) : `stat${i + 1}`;
        return { id, label, value };
      },
      d.stats,
    ),
    tickerIntervalMs: clamp(raw.tickerIntervalMs, 2500, 20000, d.tickerIntervalMs),
    tickerMessages: list(
      raw.tickerMessages,
      12,
      (m, i) => {
        const template = optionalText(m.template, 140);
        if (!template) return null;
        const id = typeof m.id === "string" && m.id ? m.id.slice(0, 24) : `t${i + 1}`;
        return { id, template };
      },
      d.tickerMessages,
    ),
    names: names.length ? names : [...d.names],
    jobs: jobs.length ? jobs : [...d.jobs],
  };
}

/** Alias kept for call sites that prefer the Config suffix. */
export const parseGeoSocialProofConfig = parseGeoSocialProof;

export function resolveHomeCounty(county: string): HomeCounty | null {
  const key = tidy(county).toLowerCase();
  if (!key) return null;
  for (const name of HOME_REGION_COUNTIES) {
    if (name.toLowerCase() === key) return name;
    if (key.includes(name.toLowerCase().replace(/ county$/, ""))) return name;
  }
  return null;
}

/** Infer Southern Oregon county from a city label when the lead only has city. */
export function countyForCity(city: string): HomeCounty | null {
  const bare = tidy(city).replace(/,\s*[A-Z]{2}$/i, "").trim().toLowerCase();
  if (!bare) return null;
  for (const name of HOME_REGION_COUNTIES) {
    if (HOME_REGION_CITIES[name].some((c) => c.toLowerCase() === bare)) return name;
  }
  return null;
}

export function placesForLocale(locale: GeoLocale): string[] {
  const county = resolveHomeCounty(locale.county ?? "") ?? countyForCity(locale.city ?? "");
  const fromRoster = county ? [...HOME_REGION_CITIES[county]] : [];
  const city = tidy(locale.city ?? "");
  const cityOnly = city.replace(/,\s*[A-Z]{2}$/i, "").trim();
  const places = [...fromRoster];
  if (cityOnly && !places.some((p) => p.toLowerCase() === cityOnly.toLowerCase())) {
    places.unshift(cityOnly);
  }
  if (places.length === 0) places.push(cityOnly || "your area");
  return places;
}

/** Stable hash so the same city always shows the same local figures. */
export function geoSeed(city: string, county: string): number {
  const raw = `${tidy(city).toLowerCase()}|${tidy(county).toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function fill(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in tokens ? tokens[key] : match));
}

function nicheJobs(niche: string, fallback: string[]): string[] {
  const key = tidy(niche).toLowerCase();
  if (key && NICHE_JOBS[key]) return NICHE_JOBS[key]!;
  for (const [id, jobs] of Object.entries(NICHE_JOBS)) {
    if (id !== "default" && key.includes(id)) return jobs;
  }
  return fallback.length ? fallback : NICHE_JOBS.default!;
}

const AGO = ["just now", "2 min ago", "6 min ago", "11 min ago", "19 min ago", "27 min ago", "41 min ago"];

/**
 * Bind config + lead locale into display-ready proof stats and ticker lines.
 */
export function localizeGeoSocialProof(
  config: GeoSocialProofConfig,
  locale: GeoLocale,
): LocalizedGeoSocialProof {
  const places = placesForLocale(locale);
  const city = tidy(locale.city ?? "").replace(/,\s*[A-Z]{2}$/i, "").trim() || places[0] || "your area";
  const county =
    resolveHomeCounty(locale.county ?? "") ??
    countyForCity(city) ??
    (tidy(locale.county ?? "") || "your county");
  const seed = geoSeed(city, String(county));
  const jobs = Math.max(1, config.jobsThisWeek + (seed % 7) - 2);
  const minutes = Math.max(5, config.responseMinutes + (seed % 5) - 2);
  const activations = Math.max(1, config.activationsThisMonth + (seed % 4));
  const trade = tidy(locale.trade ?? locale.niche ?? "trade") || "trade";
  const tokens = {
    city,
    county: String(county),
    jobs: String(jobs),
    minutes: String(minutes),
    activations: String(activations),
    trade,
  };

  const jobPool = nicheJobs(locale.niche ?? "", config.jobs);
  const ticker = config.tickerMessages.map((msg, i) => {
    const place = places[(seed + i * 3) % places.length] ?? city;
    const name = config.names[(seed + i * 5) % config.names.length] ?? "A neighbor";
    const job = jobPool[(seed + i * 7) % jobPool.length] ?? "activated their page";
    const ago = AGO[(seed + i) % AGO.length] ?? "just now";
    return {
      id: msg.id,
      place,
      ago,
      line: fill(msg.template, { ...tokens, name, place, job, ago }),
    };
  });

  return {
    city,
    county: String(county),
    places,
    headline: fill(config.headline, tokens),
    subhead: fill(config.subhead, tokens),
    sampleLabel: config.sampleLabel,
    proofEnabled: config.proofEnabled,
    tickerEnabled: config.tickerEnabled,
    tickerIntervalMs: config.tickerIntervalMs,
    stats: config.stats.map((stat) => ({
      id: stat.id,
      value: fill(stat.value, tokens),
      label: fill(stat.label, tokens),
    })),
    ticker,
  };
}
