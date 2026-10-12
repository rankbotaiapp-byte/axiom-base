import type { ShopNiche } from "./types.ts";

export const JOB_LANES = ["residential", "commercial", "emergency"] as const;
export type JobLane = (typeof JOB_LANES)[number];

export type OfferModel = "service" | "product";

export type QuoteLane = { id: string; label: string; multiplier: number };

export type QuoteProfile = {
  model: OfferModel;
  kicker: string;
  heading: string;
  helper: string;
  photo: "required" | "off";
  photoNote: string;
  emptyLane: string;
  /** Keyword lanes hide lines that don't match. Menu lanes price the whole book. */
  filter: "keyword" | "menu";
  lanes: QuoteLane[];
};

const SITE_LANES: QuoteLane[] = [
  { id: "residential", label: "Residential", multiplier: 1 },
  { id: "commercial", label: "Commercial", multiplier: 1.15 },
  { id: "emergency", label: "Emergency", multiplier: 1.35 },
];

const CLEAN_LANES: QuoteLane[] = [
  { id: "standard", label: "Standard", multiplier: 1 },
  { id: "deep", label: "Deep clean", multiplier: 1.4 },
  { id: "moveout", label: "Move-out", multiplier: 1.65 },
];

const CHAIR_LANES: QuoteLane[] = [
  { id: "cut", label: "Cut", multiplier: 1 },
  { id: "color", label: "Color", multiplier: 1.45 },
  { id: "correction", label: "Correction", multiplier: 1.8 },
];

const VISIT_LANES: QuoteLane[] = [
  { id: "single", label: "One visit", multiplier: 1 },
  { id: "series", label: "A series", multiplier: 0.9 },
  { id: "group", label: "A group", multiplier: 1.2 },
];

export type ShelfItem = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  attribute: string;
  imageUrl: string;
};

const RETAIL_CATALOG: ShelfItem[] = [
  {
    id: "cap",
    name: "House cap",
    description: "Embroidered mark. One size.",
    priceCents: 3200,
    stock: 24,
    attribute: "One size",
    imageUrl: "/media/heroes/retail.svg",
  },
  {
    id: "print",
    name: "Shop print",
    description: "18×24 poster of the mark.",
    priceCents: 2400,
    stock: 12,
    attribute: "18×24",
    imageUrl: "/media/heroes/retail.svg",
  },
  {
    id: "bundle",
    name: "Counter bundle",
    description: "The cap and the print together.",
    priceCents: 4800,
    stock: 6,
    attribute: "Cap + print",
    imageUrl: "/media/heroes/retail.svg",
  },
];

export function offerModel(niche: ShopNiche): OfferModel {
  return niche === "retail" ? "product" : "service";
}

export function quoteProfile(niche: ShopNiche): QuoteProfile {
  if (offerModel(niche) === "product") {
    return {
      model: "product",
      kicker: "The shelf",
      heading: "In stock",
      helper: "Each item has a price and a count. Add it to the cart, or order it now.",
      photo: "off",
      photoNote: "",
      emptyLane: "",
      filter: "menu",
      lanes: [],
    };
  }
  if (niche === "clean") {
    return {
      model: "service",
      kicker: "Scope quote",
      heading: "Cleaning estimate",
      helper: "A photo of the room sets the bracket: a standard clean, a deep clean, or a move-out. The range is this crew's own prices. The photo stays on this device.",
      photo: "required",
      photoNote: "Use a photo of the room.",
      emptyLane: "This book doesn't split that way yet. The range uses the full menu.",
      filter: "menu",
      lanes: CLEAN_LANES,
    };
  }
  if (niche === "salon" || niche === "beauty" || niche === "location" || niche === "tattoo") {
    const heading = niche === "location" ? "Chair estimate" : niche === "tattoo" ? "Session estimate" : "Style estimate";
    return {
      model: "service",
      kicker: "Scope quote",
      heading,
      helper: "A photo sets the bracket — a cut, color, or a correction. The range is this shop's own prices. The photo stays on this device.",
      photo: "required",
      photoNote: "Use a photo of the work.",
      emptyLane: "This book doesn't split that way yet. The range uses the full menu.",
      filter: "menu",
      lanes: CHAIR_LANES,
    };
  }
  if (niche === "contractor" || niche === "field" || niche === "locksmith" || niche === "firewood" || niche === "landscaper" || niche === "foodtruck" || niche === "dogwalk" || niche === "detailer" || niche === "trade") {
    return {
      model: "service",
      kicker: "Snap-to-Fix",
      heading: "Instant estimate",
      helper: "Residential, commercial, or an emergency call. The photo stays on this device. The range comes from this shop's own prices.",
      photo: "required",
      photoNote: "Use a photo of the job.",
      emptyLane: "This book doesn't split that way yet. The range uses the full menu.",
      filter: "keyword",
      lanes: SITE_LANES,
    };
  }
  if (niche === "security") {
    return {
      model: "service",
      kicker: "The post",
      heading: "Coverage range",
      helper: "A consult, a standing post, or the night of an event. The range is this crew's own rates.",
      photo: "off",
      photoNote: "",
      emptyLane: "",
      filter: "menu",
      lanes: [
        { id: "consult", label: "Consult", multiplier: 1 },
        { id: "post", label: "Standing post", multiplier: 1 },
        { id: "event", label: "Event night", multiplier: 1.25 },
      ],
    };
  }
  if (niche === "guide") {
    return {
      model: "service",
      kicker: "The trip",
      heading: "Trip range",
      helper: "A shared seat, a private boat, or a charter. The range is this outfit's own rates.",
      photo: "off",
      photoNote: "",
      emptyLane: "",
      filter: "menu",
      lanes: [
        { id: "shared", label: "Shared", multiplier: 1 },
        { id: "private", label: "Private", multiplier: 1.4 },
        { id: "charter", label: "Charter", multiplier: 1.8 },
      ],
    };
  }
  if (niche === "photo") {
    return {
      model: "service",
      kicker: "The book",
      heading: "Session range",
      helper: "A portrait, an event, or a commercial day. The range is this studio's own rates.",
      photo: "off",
      photoNote: "",
      emptyLane: "",
      filter: "menu",
      lanes: [
        { id: "portrait", label: "Portrait", multiplier: 1 },
        { id: "event", label: "Event", multiplier: 1.35 },
        { id: "commercial", label: "Commercial", multiplier: 1.6 },
      ],
    };
  }
  return {
    model: "service",
    kicker: "The book",
    heading: "Visit range",
    helper: "One visit, a series, or a group. The range is this shop's own menu.",
    photo: "off",
    photoNote: "",
    emptyLane: "",
    filter: "menu",
    lanes: VISIT_LANES,
  };
}

/** Bracket score from the lane and the shop's own spread. Not a reading of the photo. */
export function impactScore(multiplier: number, low: number, high: number): number {
  const factor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  const spread = Math.max(0, high - low);
  const score = 38 + factor * 24 + Math.min(18, spread / 4000);
  return Math.max(12, Math.min(96, Math.round(score)));
}

export function formatAuditReport(input: {
  name: string;
  channel: "text" | "email";
  contact: string;
  lane: string;
  lowCents: number;
  highCents: number;
  impact: number;
}): string {
  const reach = input.channel === "text" ? "Text" : "Email";
  return [
    `Lane ${input.lane}`,
    `Impact ${input.impact}`,
    `Range ${input.lowCents}–${input.highCents} cents`,
    `${reach} the report to ${input.contact}`,
    "The photo stayed on their device.",
  ].join("\n");
}

export function shelfFor(
  niche: ShopNiche,
  lines?: { id?: string; name: string; description: string; priceCents: number }[],
): ShelfItem[] {
  if (offerModel(niche) !== "product") return [];
  if (!lines?.length) return RETAIL_CATALOG.map((item) => ({ ...item }));
  return lines.map((line, index) => {
    const known = RETAIL_CATALOG.find((item) => item.name === line.name);
    return {
      id: line.id || known?.id || `item-${index}`,
      name: line.name,
      description: line.description,
      priceCents: line.priceCents,
      stock: known?.stock ?? 8,
      attribute: known?.attribute ?? "In stock",
      imageUrl: known?.imageUrl || "/media/heroes/retail.svg",
    };
  });
}

export const THEME_PROFILES = ["site", "chair", "desk"] as const;
export type ThemeProfile = (typeof THEME_PROFILES)[number];

export const LAYOUT_BLOCKS = ["staff", "estimate", "menu"] as const;
export type LayoutBlock = (typeof LAYOUT_BLOCKS)[number];

export const NEON_PRESETS = [
  { name: "Cyan", value: "#2EE6D6" },
  { name: "Emerald", value: "#3DDC97" },
  { name: "Steel", value: "#7EC8E3" },
] as const;

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekKey = (typeof WEEK)[number];

export function themeForNiche(niche: ShopNiche): ThemeProfile {
  if (niche === "field" || niche === "contractor" || niche === "locksmith" || niche === "firewood" || niche === "landscaper" || niche === "foodtruck" || niche === "dogwalk" || niche === "detailer" || niche === "trade" || niche === "clean" || niche === "security") {
    return "site";
  }
  if (niche === "salon" || niche === "beauty" || niche === "location" || niche === "tattoo") return "chair";
  return "desk";
}

export function parseThemeProfile(raw: unknown, niche: ShopNiche): ThemeProfile {
  const value = typeof raw === "string" ? raw : "";
  if (THEME_PROFILES.includes(value as ThemeProfile)) return value as ThemeProfile;
  return themeForNiche(niche);
}

export function parseNeonAccent(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return /^#[0-9A-F]{6}$/.test(value) ? value : "";
}

export function parseGlowEnabled(raw: unknown): boolean {
  if (raw === false || raw === 0 || raw === "f" || raw === "false") return false;
  return true;
}

export function parseLayout(raw: unknown): LayoutBlock[] {
  let parsed: unknown = raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      parsed = null;
    }
  }
  if (!Array.isArray(parsed)) return [...LAYOUT_BLOCKS];
  const next: LayoutBlock[] = [];
  for (const item of parsed) {
    if (typeof item === "string" && LAYOUT_BLOCKS.includes(item as LayoutBlock) && !next.includes(item as LayoutBlock)) {
      next.push(item as LayoutBlock);
    }
  }
  for (const block of LAYOUT_BLOCKS) {
    if (!next.includes(block)) next.push(block);
  }
  return next;
}

export function serviceLane(name: string, description: string): JobLane {
  const text = `${name} ${description}`.toLowerCase();
  if (/emergenc|after-hours|urgent|same day/.test(text)) return "emergency";
  if (/commercial|business|crew|site wide|event/.test(text)) return "commercial";
  return "residential";
}

/** Range from the shop's own prices. The photo is a reference, not a diagnosis. */
export function estimateRange(prices: number[], multiplier: number): { low: number; high: number } | null {
  const amounts = prices.filter((price) => Number.isFinite(price) && price > 0);
  if (amounts.length === 0) return null;
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const factor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  return { low: Math.round(low * factor), high: Math.round(Math.max(high, low) * factor) };
}

export function estimateJob(prices: number[], lane: JobLane): { low: number; high: number } | null {
  const multiplier = lane === "emergency" ? 1.35 : lane === "commercial" ? 1.15 : 1;
  return estimateRange(prices, multiplier);
}

export function defaultWeek(): Record<WeekKey, boolean> {
  return { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false };
}

export function parseWeek(raw: unknown): Record<WeekKey, boolean> {
  const week = defaultWeek();
  let parsed: unknown = raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return week;
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return week;
  for (const key of WEEK) {
    const value = (parsed as Record<string, unknown>)[key];
    if (typeof value === "boolean") week[key] = value;
  }
  return week;
}
