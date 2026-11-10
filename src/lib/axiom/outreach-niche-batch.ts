/**
 * Master Autopilot niche-by-niche outreach batching.
 * One trade niche completes (queued under daily caps) before the next starts.
 */
import { nicheForLead, nicheLabel } from "./directory.ts";
import { verifiedPrimaryLoop } from "./niche-dataset-pairing.ts";
import { previewNicheSlug } from "./preview-link.ts";
import { plumberCampaignPath } from "./plumber-outreach.ts";
import type { ShopNiche } from "./types.ts";

/** Live campaign is plumbing-only (20,330 preloaded plumbing records). */
export const OUTREACH_ACTIVE_VERTICAL = "plumbing" as const satisfies ShopNiche;
export const PLUMBING_LEAD_DATASET_SIZE = 20_330;
export const PLUMBING_CAMPAIGN_HERO = "/media/axio-plumber-hero.mp4";
export const PLUMBING_CAMPAIGN_GREETING = "/media/axiom-greeting.mp4";
export const PLUMBING_CAMPAIGN_TEMPLATE = "/t/{slug}?niche=plumbing&greet=1";

/**
 * Active Automate slate. Frozen on Emergency Plumbing until that dataset is exhausted.
 */
export const OUTREACH_DAILY_NICHE_SCHEDULE = [OUTREACH_ACTIVE_VERTICAL] as const satisfies readonly ShopNiche[];

/** Catalog of known niches (inactive verticals stay addressable, not queued). */
export const OUTREACH_NICHE_SEQUENCE = [
  "plumbing",
  "electrical",
  "auto",
  "contractor",
  "hvac",
  "water-systems",
  "roofing",
  "landscaping",
  "security",
  "fabrication",
  "taxidermy",
  "forestry",
  "tool-repair",
  "woodworking",
  "machining",
  "stone-masonry",
  "glasswork",
  "barber",
  "beauty-salon",
  "canine",
  "personal-trainer",
  "power-sports",
  "bow-tech",
] as const satisfies readonly ShopNiche[];

export type OutreachNicheId = (typeof OUTREACH_NICHE_SEQUENCE)[number];

/**
 * Explicit cinematic heroes for `/demo/[niche]` inlays.
 * Plumbing is the industrial axio loop only. Water systems keep otter.
 */
export const OUTREACH_NICHE_HERO_OVERRIDES: Partial<Record<OutreachNicheId, string>> = {
  plumbing: PLUMBING_CAMPAIGN_HERO,
  "water-systems": "/media/otter-hero-animation.mp4",
  electrical: "/media/electrician-hero-animation.mp4",
  auto: "/media/auto-hero-animation.mp4",
  contractor: "/media/infrastructure-hero-animation.mp4",
  fabrication: "/media/polar-bear-hero-animation.mp4",
  taxidermy: "/media/leopard-hero-animation.mp4",
};

/** Pacific day index → niche for the staged daily queue (0 = Day 1 Plumbing). */
export function nicheForScheduleDay(dayIndex: number): (typeof OUTREACH_DAILY_NICHE_SCHEDULE)[number] {
  const i = Math.max(0, Math.floor(dayIndex));
  const capped = Math.min(i, OUTREACH_DAILY_NICHE_SCHEDULE.length - 1);
  return OUTREACH_DAILY_NICHE_SCHEDULE[capped]!;
}

/** Day number (1-based) for a niche on the lead slate, or 0 if not on it. */
export function scheduleDayForNiche(niche: string): number {
  const id = nicheForLead(niche);
  const index = (OUTREACH_DAILY_NICHE_SCHEDULE as readonly string[]).indexOf(id);
  return index >= 0 ? index + 1 : 0;
}

export function nextScheduledNiche(_current?: string | null): OutreachNicheId {
  return OUTREACH_ACTIVE_VERTICAL;
}

export function isOutreachNicheId(value: string): value is OutreachNicheId {
  return (OUTREACH_NICHE_SEQUENCE as readonly string[]).includes(value);
}

export function outreachNicheHero(niche: string, tradeLabel = ""): string {
  const id = nicheForLead(niche, tradeLabel);
  if (isOutreachNicheId(id) && OUTREACH_NICHE_HERO_OVERRIDES[id]) {
    return OUTREACH_NICHE_HERO_OVERRIDES[id]!;
  }
  return verifiedPrimaryLoop(id, tradeLabel);
}

export function outreachNicheLabel(niche: string): string {
  const id = nicheForLead(niche);
  if (id === "plumbing" || id === "water-systems") return "Emergency Plumbing & Water Systems";
  if (id === "electrical") return "Electrical";
  if (id === "auto") return "Automotive / Mobile Mechanics";
  if (id === "contractor") return "General Contractors";
  return nicheLabel(niche);
}

export function demoStorefrontPath(input: {
  niche: string;
  businessName: string;
  leadSlug?: string;
  leadId?: string;
  city?: string;
  county?: string;
  tradeLabel?: string;
}): string {
  const niche = previewNicheSlug(input.niche, input.tradeLabel ?? "");
  const params = new URLSearchParams();
  params.set("preview", "true");
  // Force the HeyGen avatar intro pre-roll before the niche cinematic loop.
  params.set("greet", "1");
  params.set("business", input.businessName.trim().slice(0, 80));
  params.set("utm_source", "desk");
  const tenantSlug = tenantPreviewSlug(input.leadSlug, input.businessName);
  if (tenantSlug) params.set("b", tenantSlug);
  if (input.leadId) params.set("lead", input.leadId);
  if (input.city?.trim()) params.set("city", input.city.trim().slice(0, 80));
  if (input.county?.trim()) params.set("county", input.county.trim());
  if (input.tradeLabel?.trim()) params.set("trade", input.tradeLabel.trim().slice(0, 80));
  const hero = outreachNicheHero(niche, input.tradeLabel);
  params.set("hero", hero);
  if (niche === "plumbing" && tenantSlug) {
    const bound = plumberCampaignPath(tenantSlug, { greet: true });
    const url = new URL(bound, "https://axiom.local");
    for (const [key, value] of params.entries()) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    }
    url.searchParams.set("niche", "plumbing");
    url.searchParams.set("greet", "1");
    url.searchParams.set("hero", PLUMBING_CAMPAIGN_HERO);
    return `${url.pathname}?${url.searchParams.toString()}`;
  }
  return `/demo/${niche}?${params.toString()}`;
}

/** Canonical industrial plumbing storefront every dispatch and desk preview uses. */
export function plumbingStorefrontHref(slug: string): string {
  return plumberCampaignPath(slug, { greet: true });
}

/** Public tenant path segment for a plumbing campaign lead. */
export function tenantPreviewSlug(leadSlug?: string, businessName?: string): string {
  const fromLead = (leadSlug ?? "").trim().toLowerCase();
  if (fromLead) return fromLead.slice(0, 64);
  const fromName = (businessName ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
  return fromName || "plumbing";
}

export type NicheReadyCount = { niche: string; ready: number };

/**
 * Pick the active niche if it still has ready leads; otherwise the next niche
 * in the fixed sequence that still has unclaimed contactable leads.
 */
export function pickNextNicheBatch(
  readyByNiche: readonly NicheReadyCount[],
  activeNiche: string | null | undefined,
): { niche: OutreachNicheId; ready: number } | null {
  const counts = new Map<string, number>();
  for (const row of readyByNiche) {
    const niche = nicheForLead(row.niche);
    if (!isOutreachNicheId(niche)) continue;
    counts.set(niche, (counts.get(niche) ?? 0) + Math.max(0, row.ready));
  }

  const plumbingReady = counts.get(OUTREACH_ACTIVE_VERTICAL) ?? 0;
  if (plumbingReady > 0) return { niche: OUTREACH_ACTIVE_VERTICAL, ready: plumbingReady };
  void activeNiche;
  return null;
}

/** Trade_type strings that SQL-match a catalog niche (id + common aliases). */
export function tradeTypeMatchersForNiche(niche: OutreachNicheId): string[] {
  const aliases: Record<OutreachNicheId, string[]> = {
    plumbing: [
      "plumbing",
      "plumber",
      "plumbers",
      "emergency plumbing",
      "water-systems",
      "water systems",
      "well",
      "filtration",
    ],
    electrical: ["electrical", "electrician", "electric"],
    auto: ["auto", "auto repair", "mobile mechanic", "detailer", "auto detailing", "mechanic"],
    hvac: ["hvac", "air conditioning", "heating", "furnace"],
    contractor: ["contractor", "general contractor", "construction", "home services", "handyman"],
    roofing: ["roofing", "roofer"],
    landscaping: ["landscaping", "landscaper", "lawn care"],
    "water-systems": ["water-systems", "water systems", "well", "filtration"],
    security: ["security", "private security", "locksmith"],
    fabrication: ["fabrication", "welding", "welder"],
    taxidermy: ["taxidermy"],
    forestry: ["forestry", "firewood"],
    "tool-repair": ["tool-repair", "tool repair"],
    woodworking: ["woodworking", "millwork", "carpentry"],
    machining: ["machining", "gunsmith"],
    "stone-masonry": ["stone-masonry", "stone masonry", "masonry"],
    glasswork: ["glasswork", "glass", "photography"],
    barber: ["barber", "barbershop"],
    "beauty-salon": ["beauty-salon", "beauty salon", "salon"],
    canine: ["canine", "pet grooming", "dog walking"],
    "personal-trainer": ["personal-trainer", "personal trainer", "fitness", "trainer"],
    "power-sports": ["power-sports", "outdoor sports lessons", "boarding lessons"],
    "bow-tech": ["bow-tech", "bow tech", "bowtech"],
  };
  return [...new Set([niche, ...(aliases[niche] ?? [])].map((item) => item.toLowerCase()))];
}

/** Cap a planned niche batch so it never exceeds remaining daily SMS/email room. */
export function trimBatchToDailyCaps<T>(
  split: { email: T[]; sms: T[] },
  caps: { emailRemaining: number; smsRemaining: number },
): { email: T[]; sms: T[] } {
  return {
    email: split.email.slice(0, Math.max(0, caps.emailRemaining)),
    sms: split.sms.slice(0, Math.max(0, caps.smsRemaining)),
  };
}
