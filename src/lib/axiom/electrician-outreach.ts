/**
 * Electrician outreach landing (`/t/{slug}?niche=electrical`).
 * Mirrors plumber-outreach: pure config, no DOM, no database.
 */

import { checkDispatchMobile, emptyOutreachTenant, formatPhone, type OutreachTenant } from "./plumber-outreach.ts";

export { checkDispatchMobile, emptyOutreachTenant, formatPhone };
export type { OutreachTenant };

export const ELECTRICIAN_OUTREACH_SLUG = "electricians-outreach";
export const ELECTRICIAN_GENERIC_NAME = "YOUR ELECTRIC CO.";

export const ELECTRICIAN_HERO_LOOP = "/media/electrician-hero-loop.mp4";
export const ELECTRICIAN_HERO_POSTER = "/media/electrician-hero-poster.jpg";
export const ELECTRICIAN_HERO_LOOP_FALLBACK = "/media/hero-loop.mp4";
export const ELECTRICIAN_HERO_POSTER_FALLBACK = "/media/hero-poster.jpg";

export function isElectricalCampaign(value?: string | null): boolean {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return false;
  if (v.includes("electronic") && !v.includes("electric")) return false;
  return (
    v === "electrical" ||
    v === "electrician" ||
    v.includes("electrician") ||
    v.includes("electrical") ||
    v.includes("ev charger") ||
    v.includes("ev-charger") ||
    v.includes("panel upgrade") ||
    v.includes("breaker panel") ||
    (v.includes("electric") && !v.includes("electronic"))
  );
}

export function electricianCampaignPath(slug: string, opts?: { greet?: boolean; studio?: boolean }): string {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || "cascade-electric";
  const params = new URLSearchParams({ niche: "electrical" });
  if (opts?.greet !== false) params.set("greet", "1");
  if (opts?.studio) params.set("studio", "1");
  return `/t/${safe}?${params.toString()}`;
}

export function compactDefined<T extends Record<string, unknown>>(input?: Partial<T> | null): Partial<T> {
  if (!input) return {};
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export type ElectricianHeroConfig = {
  videoSrc: string;
  poster: string;
  businessName: string;
  phone: string;
  tagline: string;
  headline: string;
  subhead: string;
  strip: string;
  urgency: string;
  urgencyAccent: string;
  primaryCta: { label: string; href?: string };
  secondaryCta: { label: string; href: string };
  bg: string;
  cyan: string;
  amber: string;
};

export const electricianHeroDefaults: ElectricianHeroConfig = {
  videoSrc: ELECTRICIAN_HERO_LOOP,
  poster: ELECTRICIAN_HERO_POSTER,
  businessName: ELECTRICIAN_GENERIC_NAME,
  phone: "",
  tagline: "24/7 EMERGENCY · ON CALL NOW",
  headline: ELECTRICIAN_GENERIC_NAME,
  subhead: "Panel upgrades, troubleshooting, EV chargers and new circuits. Book online in 60 seconds or call for a live dispatcher.",
  strip: "RESIDENTIAL · COMMERCIAL · INDUSTRIAL",
  urgency: "Power out?",
  urgencyAccent: "We're wired in.",
  primaryCta: { label: "CALL" },
  secondaryCta: { label: "BOOK", href: "#book" },
  bg: "#050507",
  cyan: "#00ffcc",
  amber: "#FFE500",
};

export function resolveElectricianMedia(flags?: { loopAvailable?: boolean; posterAvailable?: boolean }): {
  videoSrc: string;
  poster: string;
} {
  return {
    videoSrc: flags?.loopAvailable === false ? ELECTRICIAN_HERO_LOOP_FALLBACK : ELECTRICIAN_HERO_LOOP,
    poster: flags?.posterAvailable === false ? ELECTRICIAN_HERO_POSTER_FALLBACK : ELECTRICIAN_HERO_POSTER,
  };
}

export function mergeElectricianHero(
  tenantHero?: Partial<ElectricianHeroConfig> | null,
  overrides?: Partial<ElectricianHeroConfig> | null,
): ElectricianHeroConfig {
  const merged = {
    ...electricianHeroDefaults,
    ...compactDefined(tenantHero),
    ...compactDefined(overrides),
  };
  const businessName = (merged.businessName || ELECTRICIAN_GENERIC_NAME).trim() || ELECTRICIAN_GENERIC_NAME;
  const phone = (merged.phone || "").trim();
  return { ...merged, businessName, phone };
}

export type ElectricianService = {
  id: string;
  title: string;
  detail: string;
  tag: string;
};

export type ElectricianBadge = { id: string; label: string };
export type ElectricianFaq = { id: string; q: string; a: string };
export type ElectricianHoursRow = { day: string; hours: string };
export type ElectricianJobChip = { id: string; label: string };
export type ElectricianUrgencyChip = { id: string; label: string };

export type ElectricianOutreachConfig = {
  hero: ElectricianHeroConfig;
  badges: ElectricianBadge[];
  services: ElectricianService[];
  jobs: ElectricianJobChip[];
  urgency: ElectricianUrgencyChip[];
  faq: ElectricianFaq[];
  hours: ElectricianHoursRow[];
  smsBody: string;
};

export const DEFAULT_ELECTRICIAN_OUTREACH: ElectricianOutreachConfig = {
  hero: electricianHeroDefaults,
  badges: [
    { id: "licensed", label: "Licensed & insured" },
    { id: "bonded", label: "Bonded crews" },
    { id: "same-day", label: "Same-day dispatch" },
    { id: "panel", label: "Panel & EV certified" },
  ],
  services: [
    {
      id: "panel",
      title: "Panel upgrades",
      detail: "200A service, breaker replacements, and load calculations for older homes.",
      tag: "Core",
    },
    {
      id: "ev",
      title: "EV chargers",
      detail: "Level 2 installs, dedicated circuits, and permit-ready wall connectors.",
      tag: "Install",
    },
    {
      id: "generator",
      title: "Generators",
      detail: "Standby generators, transfer switches, and whole-home backup power.",
      tag: "Backup",
    },
    {
      id: "commercial",
      title: "Commercial & industrial",
      detail: "Tenant build-outs, 3-phase service, lighting, and shop power.",
      tag: "C&I",
    },
    {
      id: "diagnostics",
      title: "Troubleshooting & rewiring",
      detail: "Tripping breakers, hot outlets, aluminum branch, and circuit tracing.",
      tag: "Diagnose",
    },
    {
      id: "emergency",
      title: "Emergency outage response",
      detail: "Storm damage, no-power calls, and 24/7 live dispatch.",
      tag: "24/7",
    },
  ],
  jobs: [
    { id: "outage", label: "Power outage" },
    { id: "panel", label: "Panel / breaker" },
    { id: "ev", label: "EV charger" },
    { id: "generator", label: "Generator" },
    { id: "other", label: "Other" },
  ],
  urgency: [
    { id: "emergency", label: "Emergency now" },
    { id: "today", label: "Today" },
    { id: "week", label: "This week" },
  ],
  faq: [
    {
      id: "hours",
      q: "Are you really on call 24/7?",
      a: "Yes. After-hours outages and sparking panels go to a live dispatcher, not a voicemail box.",
    },
    {
      id: "area",
      q: "What cities do you cover?",
      a: "Residential, commercial, and industrial work across the local service area on the booking form.",
    },
    {
      id: "ev",
      q: "Can you install an EV charger?",
      a: "Level 2 wall connectors, dedicated 40–60A circuits, and panel upgrades when the service is short.",
    },
  ],
  hours: [
    { day: "Mon–Fri", hours: "7:00a – 6:00p" },
    { day: "Saturday", hours: "8:00a – 4:00p" },
    { day: "Sunday / nights", hours: "Emergency dispatch" },
  ],
  smsBody: "Power outage / electrical request. Name, address, and what is out:",
};

export function liveCallHref(phone: string): string | undefined {
  const check = checkDispatchMobile(phone);
  if (!check.ok) return undefined;
  return `tel:${check.e164}`;
}

export function smsBookingHref(phone: string, body: string): string | undefined {
  const check = checkDispatchMobile(phone);
  if (!check.ok) return undefined;
  return `sms:${check.e164}?&body=${encodeURIComponent(body)}`;
}

export function outreachIsSimulated(): boolean {
  const mode = String(process.env.NEXT_PUBLIC_OUTREACH_MODE || process.env.OUTREACH_MODE || "simulation").toLowerCase();
  return mode !== "live";
}
