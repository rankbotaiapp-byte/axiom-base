import {
  CATALOG,
  CATALOG_NICHES,
  catalogFilmUrl,
  isCatalogNiche,
  type CatalogNiche,
} from "@/config/catalog";
import type { IntroPreset } from "./intro";
import { unitsForTemplate } from "./menu";
import { NICHE_MEDIA, SHARED_STAFF } from "./media";
import { SHOP_NICHES, type PriceUnit, type ShopNiche } from "./types";
import { formatMoney } from "@/lib/utils";

export type NicheTemplate = {
  niche: ShopNiche;
  label: string;
  kicker: string;
  blurb: string;
  defaultName: string;
  tagline: string;
  description: string;
  address: string;
  ringColor: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  heroBlendPercent: number;
  introPreset?: IntroPreset;
  introSpeed?: number;
  introIntensity?: number;
  hours?: Record<string, string>;
  primaryServiceIndex?: number;
  soloTitle?: string;
  priceUnits?: PriceUnit[];
  services: {
    name: string;
    description: string;
    durationMin: number;
    priceCents: number;
    group?: string;
    priceUnit?: PriceUnit;
  }[];
  employees: {
    displayName: string;
    title: string;
    bio: string;
    avatarUrl: string;
    phone?: string;
    serviceIndexes: number[];
  }[];
  portfolio: { employeeIndex: number; imageUrl: string; caption: string }[];
};

export const RING_PRESETS = [
  { name: "Teal", value: "#2EE6D6" },
  { name: "Copper", value: "#E7B48A" },
  { name: "Steel", value: "#7EC8E3" },
  { name: "Ember", value: "#E07A73" },
  { name: "Gold", value: "#C9A227" },
  { name: "Violet", value: "#B388FF" },
] as const;

/** Verified 21-loop catalog — sole public and master-hub order. */
export const PUBLIC_NICHE_ORDER: ShopNiche[] = [...CATALOG_NICHES];
export const NICHE_ORDER: ShopNiche[] = [...CATALOG_NICHES];
export type PublicNiche = CatalogNiche;
export const isPublicNiche = isCatalogNiche;

/** @deprecated Use PUBLIC_NICHE_ORDER / CATALOG — kept for import compatibility. */
export const HERO_LOOP_CATALOG = CATALOG.map((row) => ({
  id: row.id,
  file: row.file,
  url: catalogFilmUrl(row.id),
  niche: row.id,
  label: row.label,
  blurb: row.blurb,
}));

export const DEFAULT_HOURS: Record<string, string> = {
  mon: "09:00-18:00",
  tue: "09:00-18:00",
  wed: "09:00-18:00",
  thu: "09:00-18:00",
  fri: "09:00-18:00",
  sat: "09:00-16:00",
  sun: "closed",
};

export const WEEKDAYS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
] as const;

const RING_CYCLE = RING_PRESETS.map((row) => row.value);

function defaultServices(label: string): NicheTemplate["services"] {
  return [
    {
      name: "Site visit",
      description: `Walk the job for ${label.toLowerCase()}. Scope, quote, and next steps.`,
      durationMin: 60,
      priceCents: 8900,
    },
    {
      name: "Standard service",
      description: `The usual ${label.toLowerCase()} ticket. Labor and the book stay clear.`,
      durationMin: 120,
      priceCents: 18900,
    },
    {
      name: "Full day",
      description: `A full crew day for ${label.toLowerCase()}.`,
      durationMin: 480,
      priceCents: 68000,
    },
  ];
}

function buildTemplate(niche: ShopNiche, index: number): NicheTemplate {
  const entry = CATALOG.find((row) => row.id === niche)!;
  const media = NICHE_MEDIA[niche];
  return {
    niche,
    label: entry.label,
    kicker: entry.kicker,
    blurb: entry.blurb,
    defaultName: entry.defaultName,
    tagline: entry.tagline,
    description: `${entry.blurb} Book the time. The shop confirms.`,
    address: "Southern Oregon · on the book",
    ringColor: RING_CYCLE[index % RING_CYCLE.length]!,
    heroImageUrl: "",
    heroVideoUrl: catalogFilmUrl(niche),
    heroBlendPercent: media.heroBlendPercent,
    introPreset: media.introPreset,
    introSpeed: media.introSpeed,
    introIntensity: media.introIntensity,
    primaryServiceIndex: 1,
    soloTitle: "Owner",
    hours: { ...DEFAULT_HOURS },
    services: defaultServices(entry.label),
    employees: [
      {
        displayName: "Alex Morgan",
        title: "Lead",
        bio: "Owns the book and the first visit.",
        avatarUrl: SHARED_STAFF[0],
        serviceIndexes: [0, 1, 2],
      },
      {
        displayName: "Willa Grant",
        title: "Crew",
        bio: "On the ticket when the day needs a second hand.",
        avatarUrl: SHARED_STAFF[1],
        serviceIndexes: [0, 1, 2],
      },
    ],
    portfolio: [],
  };
}

export const NICHES: Record<ShopNiche, NicheTemplate> = Object.fromEntries(
  SHOP_NICHES.map((niche, index) => [niche, buildTemplate(niche, index)]),
) as Record<ShopNiche, NicheTemplate>;

export type NicheVoice = {
  bench: string;
  heading: string;
  menuKicker: string;
  menuHeading: string;
  bookLabel: string;
  inquiry: string;
  offerStep: string;
  staffStep: string;
  timeStep: string;
  timeHint: string;
  requestLabel: string;
  gallery: string;
};

const DEFAULT_VOICE: NicheVoice = {
  bench: "The crew",
  heading: "Who takes the ticket.",
  menuKicker: "Offers",
  menuHeading: "Services",
  bookLabel: "Book a visit",
  inquiry: "Ask the shop",
  offerStep: "Service",
  staffStep: "Who",
  timeStep: "When",
  timeHint: "Pick a time",
  requestLabel: "Request this time",
  gallery: "On the job",
};

export function nicheVoice(niche: ShopNiche): NicheVoice {
  const label = NICHES[niche]?.label ?? "Shop";
  return {
    ...DEFAULT_VOICE,
    bench: `The ${label.toLowerCase()} crew`,
    bookLabel: `Book ${label.toLowerCase()}`,
  };
}

export function nicheCopy(niche: ShopNiche) {
  return nicheVoice(niche);
}

export function shopTradeLabel(shop: { niche: ShopNiche; customNiche?: string }): string {
  const custom = (shop.customNiche ?? "").trim();
  if (custom) return custom;
  return NICHES[shop.niche]?.label ?? shop.niche;
}

export function formatOffer(service: {
  name: string;
  priceCents: number;
  durationMin: number;
  priceUnit?: PriceUnit;
}): string {
  const money = formatMoney(service.priceCents);
  const unit =
    service.priceUnit === "person" ? " / person" : service.priceUnit === "boat" ? " / boat" : "";
  return `${service.name} · ${money}${unit} · ${service.durationMin}m`;
}

export function priceUnitsForNiche(niche: ShopNiche): PriceUnit[] {
  return unitsForTemplate(NICHES[niche]?.priceUnits);
}

/** @deprecated Prefer priceUnitsForNiche. */
export function priceUnitsFor(niche: ShopNiche): PriceUnit[] {
  return priceUnitsForNiche(niche);
}

export const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  flat: "Flat",
  person: "Per person",
  boat: "Per boat",
};

export function defaultPriceUnit(niche: ShopNiche): PriceUnit {
  return priceUnitsForNiche(niche)[0] ?? "flat";
}
