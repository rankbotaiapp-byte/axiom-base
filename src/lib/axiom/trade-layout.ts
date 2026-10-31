import { applyDepthStudio, cloneHeroLayout, DEFAULT_HUD, parseHud, type StorefrontHud } from "./hud.ts";
import { parseServiceThumbs } from "./gallery.ts";
import { sanitizeLogoUrl } from "./prospect-brand.ts";
import { EMPTY_BRAND_STUDIO, parseBrandStudio, type BrandStudioState } from "./brand-studio.ts";
import { emptyStudioIdentity, parseStudioIdentity, type StudioIdentity } from "./studio-identity.ts";
import type { ShopNiche } from "./types.ts";

/** Blocks a niche may place on the public page. Order is the layout. */
export const TRADE_MODULES = [
  "workflow",
  "bulk",
  "species",
  "dropzone",
  "dispatch",
  "callout",
  "kinds",
  "radius",
  "party",
  "rounds",
  "session",
  "chair",
  "coverage",
] as const;

export type TradeModule = (typeof TRADE_MODULES)[number];

/** Owner-editable fields. A niche only exposes the ones in its layout. */
export const TRADE_FIELDS = [
  "cords",
  "species",
  "cuts",
  "deliveryNote",
  "dropZones",
  "dispatchOn",
  "responseMin",
  "emergencyCents",
  "radiusMiles",
  "kinds",
  "partyMax",
  "note",
] as const;

export type TradeField = (typeof TRADE_FIELDS)[number];

export const CORD_SIZES = ["full", "half", "third", "face"] as const;
export type CordSize = (typeof CORD_SIZES)[number];

export const CORD_LABEL: Record<CordSize, string> = {
  full: "Full cord",
  half: "Half cord",
  third: "Third",
  face: "Face cord",
};

/** Share of a full-cord price. A face cord is the short stack, not a full rick. */
export const CORD_FACTOR: Record<CordSize, number> = {
  full: 1,
  half: 0.55,
  third: 0.4,
  face: 0.35,
};

export type TradeProfile = {
  cords: CordSize[];
  species: string[];
  cuts: string[];
  deliveryNote: string;
  dropZones: string[];
  dispatchOn: boolean;
  responseMin: number;
  emergencyCents: number;
  radiusMiles: number;
  kinds: string[];
  partyMax: number;
  note: string;
  /** Public logo URL. Empty keeps the monogram. */
  logoUrl: string;
  /** Custom service-card stills. Empty slots render the default preview plate. */
  serviceThumbs: string[];
  /** Generated mark, ripple theme, and presentation choice. */
  studio: BrandStudioState;
  /** Locked Axiom Studio identity: name, trade, color, and sponsor marks. */
  studioIdentity: StudioIdentity;
  /** Closed storefront HUD. Stored in the existing trade_profile JSON. */
  hud: StorefrontHud;
};

export type NicheLayout = {
  modules: readonly TradeModule[];
  fields: readonly TradeField[];
  kicker: string;
  heading: string;
};

const DEFAULT_LAYOUT: NicheLayout = {
  modules: ["workflow", "radius"],
  fields: ["radiusMiles", "note"],
  kicker: "The book",
  heading: "How a time is sold.",
};

const LAYOUTS: Partial<Record<ShopNiche, NicheLayout>> = {
  auto: {
    modules: ["callout", "radius"],
    fields: ["emergencyCents", "radiusMiles", "responseMin"],
    kicker: "The bay",
    heading: "How fast the van rolls.",
  },
  barber: {
    modules: ["chair"],
    fields: ["note"],
    kicker: "The chair",
    heading: "What the chair is booked for.",
  },
  "bow-tech": {
    modules: ["kinds"],
    fields: ["kinds", "note"],
    kicker: "The bench",
    heading: "What the bow needs.",
  },
  canine: {
    modules: ["kinds"],
    fields: ["kinds", "note"],
    kicker: "The run",
    heading: "What the visit covers.",
  },
  contractor: {
    modules: ["radius", "workflow"],
    fields: ["radiusMiles", "note"],
    kicker: "The job",
    heading: "Where the crew will go.",
  },
  electrical: {
    modules: ["dispatch", "callout", "radius"],
    fields: ["dispatchOn", "responseMin", "emergencyCents", "radiusMiles"],
    kicker: "The panel",
    heading: "How the call is covered.",
  },
  fabrication: {
    modules: ["workflow"],
    fields: ["note"],
    kicker: "The shop",
    heading: "Cut, fit, finish.",
  },
  forestry: {
    modules: ["workflow", "bulk", "species", "dropzone"],
    fields: ["cords", "species", "cuts", "deliveryNote", "dropZones", "radiusMiles"],
    kicker: "The stand",
    heading: "Cut, deliver, stack.",
  },
  glasswork: {
    modules: ["session"],
    fields: ["note"],
    kicker: "The pane",
    heading: "How the install is booked.",
  },
  hvac: {
    modules: ["kinds", "radius"],
    fields: ["kinds", "radiusMiles", "note"],
    kicker: "The system",
    heading: "What the visit covers.",
  },
  landscaping: {
    modules: ["kinds", "radius"],
    fields: ["kinds", "radiusMiles", "note"],
    kicker: "The yard",
    heading: "What the visit covers.",
  },
  machining: {
    modules: ["workflow"],
    fields: ["note"],
    kicker: "The spindle",
    heading: "How the ticket is sold.",
  },
  plumbing: {
    modules: ["dispatch", "callout", "radius"],
    fields: ["dispatchOn", "responseMin", "emergencyCents", "radiusMiles"],
    kicker: "The line",
    heading: "How the call is covered.",
  },
  "power-sports": {
    modules: ["session", "party"],
    fields: ["partyMax", "note"],
    kicker: "The block",
    heading: "Who the hour is for.",
  },
  roofing: {
    modules: ["radius", "workflow"],
    fields: ["radiusMiles", "note"],
    kicker: "The pitch",
    heading: "Where the crew will go.",
  },
  security: {
    modules: ["coverage", "radius"],
    fields: ["radiusMiles", "note"],
    kicker: "The post",
    heading: "How the door is covered.",
  },
  "stone-masonry": {
    modules: ["workflow"],
    fields: ["note"],
    kicker: "The wall",
    heading: "How the course is booked.",
  },
  taxidermy: {
    modules: ["workflow"],
    fields: ["note"],
    kicker: "The mount",
    heading: "How a piece is booked.",
  },
  "tool-repair": {
    modules: ["kinds"],
    fields: ["kinds", "note"],
    kicker: "The bench",
    heading: "What the tool needs.",
  },
  "water-systems": {
    modules: ["dispatch", "radius"],
    fields: ["radiusMiles", "note"],
    kicker: "The system",
    heading: "How the service is booked.",
  },
  woodworking: {
    modules: ["workflow"],
    fields: ["note"],
    kicker: "The mill",
    heading: "How the build is booked.",
  },
};

const EMPTY: TradeProfile = {
  cords: ["full", "half", "third", "face"],
  species: ["Fir", "Oak", "Mixed"],
  cuts: ["16 inch", "18 inch"],
    deliveryNote: "",
    dropZones: [],
  dispatchOn: true,
  responseMin: 30,
  emergencyCents: 12500,
  radiusMiles: 20,
  kinds: [],
  partyMax: 6,
  note: "",
  logoUrl: "",
  serviceThumbs: ["", "", ""],
  studio: { ...EMPTY_BRAND_STUDIO },
  studioIdentity: emptyStudioIdentity(),
  hud: { ...DEFAULT_HUD },
};

const DEFAULT_KINDS: Partial<Record<ShopNiche, string[]>> = {
  electrical: ["Lockout", "Rekey", "Panel"],
  landscaping: ["Mow", "Cleanup", "Planting"],
  "water-systems": ["Service", "Filter", "Well"],
  canine: ["Bath", "Board", "Walk"],
  auto: ["Exterior", "Full detail", "Interior"],
  forestry: ["Half day", "Full day", "Scout"],
  "tool-repair": ["Tune", "Setup", "Repair"],
  "bow-tech": ["Tune", "Setup", "Repair"],
  hvac: ["Standard", "Deep clean", "Move-out"],
  barber: ["Cut", "Fade", "Beard"],
  retail: ["House cap", "Shop print", "Counter bundle"],
};

export function layoutFor(niche: ShopNiche): NicheLayout {
  return LAYOUTS[niche] ?? DEFAULT_LAYOUT;
}

export function defaultTradeProfile(niche: ShopNiche): TradeProfile {
  return {
    ...EMPTY,
    cords: [...EMPTY.cords],
    species: [...EMPTY.species],
    cuts: [...EMPTY.cuts],
    kinds: [...(DEFAULT_KINDS[niche] ?? EMPTY.kinds)],
    hud: applyDepthStudio({ ...EMPTY.hud, layers: cloneHeroLayout(EMPTY.hud.layers) }, niche),
    studio: { ...EMPTY.studio },
    studioIdentity: emptyStudioIdentity(),
    serviceThumbs: ["", "", ""],
    partyMax: niche === "landscaping" || niche === "power-sports" ? 8 : EMPTY.partyMax,
    radiusMiles: niche === "forestry" ? 25 : EMPTY.radiusMiles,
    deliveryNote: niche === "forestry" ? "The drop is the driveway. A tight lane needs a note." : "",
    dropZones: niche === "forestry" ? ["New Era", "Medford", "Ashland"] : [],
    responseMin: niche === "auto" ? 45 : EMPTY.responseMin,
  };
}

export function cordQuote(fullCents: number, size: CordSize): number {
  const base = Number.isFinite(fullCents) && fullCents > 0 ? fullCents : 0;
  return Math.round(base * CORD_FACTOR[size]);
}

/** The cord price is the delivery line when the book has one, otherwise the top price. */
export function cordBaseCents(services: { name: string; priceCents: number }[]): number {
  const named = services.find((service) => /cord/i.test(service.name) && service.priceCents > 0);
  if (named) return named.priceCents;
  const priced = services.map((service) => service.priceCents).filter((price) => price > 0);
  return priced.length ? Math.max(...priced) : 0;
}

export function checkDropZone(query: string, zones: string[]): "idle" | "in" | "out" {
  const needle = query.trim().toLowerCase();
  if (needle.length < 3) return "idle";
  const listed = zones.map((zone) => zone.trim().toLowerCase()).filter((zone) => zone.length > 1);
  if (listed.length === 0) return "idle";
  const hit = listed.some((zone) => zone === needle || zone.includes(needle) || needle.includes(zone));
  return hit ? "in" : "out";
}

export function matchOffering<T extends { name: string }>(kind: string, services: T[]): T | null {
  const needle = kind.trim().toLowerCase();
  if (!needle) return null;
  return (
    services.find((service) => {
      const name = service.name.trim().toLowerCase();
      return name === needle || name.includes(needle) || needle.includes(name);
    }) ?? null
  );
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return asRecord(JSON.parse(raw) as unknown);
    } catch {
      return {};
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function textList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const next: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const text = item.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!text || next.includes(text)) continue;
    next.push(text);
    if (next.length >= limit) break;
  }
  return next;
}

function textLine(value: unknown, limit: number): string | null {
  if (typeof value !== "string") return null;
  return value.trim().replace(/\s+/g, " ").slice(0, limit);
}

function whole(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function parseTradeProfile(niche: ShopNiche, raw: unknown): TradeProfile {
  const base = defaultTradeProfile(niche);
  const record = asRecord(raw);
  const savedCords = Array.isArray(record.cords) ? new Set(textList(record.cords, CORD_SIZES.length)) : null;
  const cords = savedCords ? CORD_SIZES.filter((size) => savedCords.has(size)) : base.cords;
  const species = Array.isArray(record.species) ? textList(record.species, 8) : base.species;
  const cuts = Array.isArray(record.cuts) ? textList(record.cuts, 8) : base.cuts;
  const dropZones = Array.isArray(record.dropZones) ? textList(record.dropZones, 12) : base.dropZones;
  const kinds = Array.isArray(record.kinds) ? textList(record.kinds, 8) : base.kinds;
  const deliveryNote = textLine(record.deliveryNote, 180);
  const note = textLine(record.note, 180);
  const responseMin = whole(record.responseMin, 5, 180);
  const emergencyCents = whole(record.emergencyCents, 0, 500000);
  const radiusMiles = whole(record.radiusMiles, 1, 150);
  const partyMax = whole(record.partyMax, 1, 40);
  return {
    cords: cords.length ? cords : base.cords,
    species,
    cuts,
    deliveryNote: deliveryNote ?? base.deliveryNote,
    dropZones,
    dispatchOn: typeof record.dispatchOn === "boolean" ? record.dispatchOn : base.dispatchOn,
    responseMin: responseMin ?? base.responseMin,
    emergencyCents: emergencyCents ?? base.emergencyCents,
    radiusMiles: radiusMiles ?? base.radiusMiles,
    kinds,
    partyMax: partyMax ?? base.partyMax,
    note: note ?? base.note,
    logoUrl: sanitizeLogoUrl(record.logoUrl),
    serviceThumbs: parseServiceThumbs(record.serviceThumbs).map((url) => sanitizeLogoUrl(url)),
    studio: parseBrandStudio(record.studio),
    studioIdentity: parseStudioIdentity(record.studioIdentity),
    hud: parseHud(record.hud ?? base.hud),
  };
}

export function linesToList(value: string): string[] {
  return textList(
    value
      .split(/\n|,/)
      .map((line) => line.trim())
      .filter(Boolean),
    12,
  );
}
