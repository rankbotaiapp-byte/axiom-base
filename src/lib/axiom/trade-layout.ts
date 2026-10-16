import { applyDepthStudio, cloneHeroLayout, DEFAULT_HUD, parseHud, type StorefrontHud } from "./hud.ts";
import { sanitizeLogoUrl } from "./prospect-brand.ts";
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
  /** Closed storefront HUD. Stored in the existing trade_profile JSON. */
  hud: StorefrontHud;
};

export type NicheLayout = {
  modules: readonly TradeModule[];
  fields: readonly TradeField[];
  kicker: string;
  heading: string;
};

const LAYOUTS: Record<ShopNiche, NicheLayout> = {
  firewood: {
    modules: ["workflow", "bulk", "species", "dropzone"],
    fields: ["cords", "species", "cuts", "deliveryNote", "dropZones", "radiusMiles"],
    kicker: "The cord",
    heading: "Cut, deliver, stack.",
  },
  locksmith: {
    modules: ["dispatch", "callout", "kinds", "radius"],
    fields: ["dispatchOn", "responseMin", "emergencyCents", "radiusMiles", "kinds"],
    kicker: "The van",
    heading: "Lockout, rekey, or the car.",
  },
  landscaper: {
    modules: ["kinds", "radius"],
    fields: ["kinds", "radiusMiles", "note"],
    kicker: "The yard",
    heading: "What the visit covers.",
  },
  foodtruck: {
    modules: ["kinds", "radius"],
    fields: ["kinds", "radiusMiles", "note"],
    kicker: "The window",
    heading: "What the truck is booked for.",
  },
  dogwalk: {
    modules: ["kinds", "radius"],
    fields: ["kinds", "radiusMiles", "note"],
    kicker: "The leash",
    heading: "What the walk covers.",
  },
  detailer: {
    modules: ["kinds", "radius"],
    fields: ["kinds", "radiusMiles", "note"],
    kicker: "The driveway",
    heading: "What the van is booked for.",
  },
  hunting: {
    modules: ["party", "workflow"],
    fields: ["partyMax", "note"],
    kicker: "The hunt",
    heading: "How the day goes out.",
  },
  therapy: {
    modules: ["session"],
    fields: ["note"],
    kicker: "The plan of care",
    heading: "How a therapy visit is booked.",
  },
  bowtech: {
    modules: ["kinds"],
    fields: ["kinds", "note"],
    kicker: "The bench",
    heading: "What the bow needs.",
  },
  guide: {
    modules: ["party", "workflow"],
    fields: ["partyMax", "note"],
    kicker: "The launch",
    heading: "How the boat goes out.",
  },
  fitness: {
    modules: ["session", "party"],
    fields: ["partyMax", "note"],
    kicker: "The floor",
    heading: "How the hour is sold.",
  },
  combat: {
    modules: ["rounds", "workflow"],
    fields: ["note"],
    kicker: "The gym",
    heading: "How a round is booked.",
  },
  wellness: {
    modules: ["session"],
    fields: ["note"],
    kicker: "The table",
    heading: "How the hour is held.",
  },
  lessons: {
    modules: ["session", "party"],
    fields: ["partyMax", "note"],
    kicker: "The lesson",
    heading: "Who the hour is for.",
  },
  salon: {
    modules: ["chair"],
    fields: ["note"],
    kicker: "The chair",
    heading: "What the chair is booked for.",
  },
  beauty: {
    modules: ["chair", "kinds"],
    fields: ["kinds", "note"],
    kicker: "The set",
    heading: "What the set includes.",
  },
  tattoo: {
    modules: ["chair", "workflow"],
    fields: ["note"],
    kicker: "The sitting",
    heading: "How a piece is booked.",
  },
  photo: {
    modules: ["session"],
    fields: ["note"],
    kicker: "The shoot",
    heading: "How the hour is shot.",
  },
  pets: {
    modules: ["kinds"],
    fields: ["kinds", "note"],
    kicker: "The coat",
    heading: "What the groom covers.",
  },
  creator: {
    modules: ["session", "workflow"],
    fields: ["note"],
    kicker: "The edit",
    heading: "Shoot, cut, or both.",
  },
  prompt: {
    modules: ["session", "workflow"],
    fields: ["note"],
    kicker: "The prompt",
    heading: "Write it, build it, or both.",
  },
  entertainer: {
    modules: ["session", "coverage"],
    fields: ["note"],
    kicker: "The set",
    heading: "How the night is booked.",
  },
  music: {
    modules: ["session", "workflow"],
    fields: ["note"],
    kicker: "The room",
    heading: "Booth, mix, or the night.",
  },
  events: {
    modules: ["coverage", "workflow"],
    fields: ["note"],
    kicker: "The date",
    heading: "How a date is held.",
  },
  contractor: {
    modules: ["radius", "workflow"],
    fields: ["radiusMiles", "note"],
    kicker: "The job",
    heading: "Where the crew will go.",
  },
  clean: {
    modules: ["kinds", "radius"],
    fields: ["kinds", "radiusMiles", "note"],
    kicker: "The house",
    heading: "What the clean covers.",
  },
  field: {
    modules: ["callout", "radius"],
    fields: ["emergencyCents", "radiusMiles", "responseMin"],
    kicker: "The curb",
    heading: "How fast the van rolls.",
  },
  security: {
    modules: ["coverage", "radius"],
    fields: ["radiusMiles", "note"],
    kicker: "The post",
    heading: "How the door is covered.",
  },
  practice: {
    modules: ["session"],
    fields: ["note"],
    kicker: "The chart",
    heading: "How a new patient is booked.",
  },
  counsel: {
    modules: ["session"],
    fields: ["note"],
    kicker: "The hour",
    heading: "How a consult is booked.",
  },
  location: {
    modules: ["chair"],
    fields: ["note"],
    kicker: "The chair",
    heading: "What the chair is booked for.",
  },
  studio: {
    modules: ["session"],
    fields: ["note"],
    kicker: "The build",
    heading: "How an engagement starts.",
  },
  retail: {
    modules: ["kinds"],
    fields: ["kinds", "note"],
    kicker: "The shelf",
    heading: "What is counted.",
  },
  trade: {
    modules: ["workflow"],
    fields: ["note"],
    kicker: "The book",
    heading: "How a time is sold.",
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
  hud: { ...DEFAULT_HUD },
};

const DEFAULT_KINDS: Partial<Record<ShopNiche, string[]>> = {
  locksmith: ["Lockout", "Rekey", "Automotive"],
  landscaper: ["Mow", "Cleanup", "Planting"],
  foodtruck: ["Lunch stop", "Private event", "Catering tray"],
  dogwalk: ["Solo walk", "Pack walk", "Midday"],
  detailer: ["Exterior", "Full detail", "Interior"],
  hunting: ["Half day", "Full day", "Scout"],
  therapy: ["Evaluation", "Follow-up", "Return"],
  bowtech: ["Tune", "Setup", "Repair"],
  pets: ["Bath", "Full groom", "Nails"],
  clean: ["Standard", "Deep clean", "Move-out"],
  beauty: ["Nails", "Lashes", "Makeup"],
  retail: ["House cap", "Shop print", "Counter bundle"],
};

export function layoutFor(niche: ShopNiche): NicheLayout {
  return LAYOUTS[niche];
}

export function defaultTradeProfile(niche: ShopNiche): TradeProfile {
  return {
    ...EMPTY,
    cords: [...EMPTY.cords],
    species: [...EMPTY.species],
    cuts: [...EMPTY.cuts],
    kinds: [...(DEFAULT_KINDS[niche] ?? EMPTY.kinds)],
    hud: applyDepthStudio({ ...EMPTY.hud, layers: cloneHeroLayout(EMPTY.hud.layers) }, niche),
    partyMax: niche === "guide" ? 8 : niche === "fitness" || niche === "lessons" ? 4 : EMPTY.partyMax,
    radiusMiles: niche === "firewood" ? 25 : EMPTY.radiusMiles,
    deliveryNote: niche === "firewood" ? "The drop is the driveway. A tight lane needs a note." : "",
    dropZones: niche === "firewood" ? ["New Era", "Medford", "Ashland"] : [],
    responseMin: niche === "field" ? 45 : EMPTY.responseMin,
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
