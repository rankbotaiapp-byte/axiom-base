import { MASTER_HERO_DEFAULTS, type MasterCategoryId } from "./MasterHeroDefaults.ts";

/**
 * Every provisionable niche slug maps to one master category.
 * Default video comes from MasterHeroDefaults — never a per-niche MP4.
 */
export const NICHE_REGISTRY = {
  plumbing: "urgent-response",
  electrical: "urgent-response",
  hvac: "urgent-response",
  "water-systems": "urgent-response",
  contractor: "residential-outdoor",
  landscaping: "residential-outdoor",
  forestry: "residential-outdoor",
  roofing: "residential-outdoor",
  "stone-masonry": "residential-outdoor",
  "power-sports": "residential-outdoor",
  canine: "residential-outdoor",
  auto: "automotive-mobile",
  "tool-repair": "automotive-mobile",
  barber: "personal-lifestyle",
  "beauty-salon": "personal-lifestyle",
  "personal-trainer": "personal-lifestyle",
  glasswork: "personal-lifestyle",
  taxidermy: "specialty-local",
  "bow-tech": "specialty-local",
  woodworking: "specialty-local",
  security: "specialty-local",
  machining: "specialty-local",
  fabrication: "specialty-local",
} as const satisfies Record<string, MasterCategoryId>;

export type RegisteredNiche = keyof typeof NICHE_REGISTRY;

export const REGISTERED_NICHES = Object.keys(NICHE_REGISTRY) as RegisteredNiche[];

const FILING_ALIASES: Record<string, RegisteredNiche> = {
  plumber: "plumbing",
  plumbers: "plumbing",
  electrician: "electrical",
  locksmith: "electrical",
  "junk-removal": "contractor",
  junk: "contractor",
  construction: "contractor",
  landscaper: "landscaping",
  firewood: "forestry",
  "outdoor-sports-lessons": "power-sports",
  lessons: "power-sports",
  boarding: "power-sports",
  salon: "beauty-salon",
  beauty: "beauty-salon",
  fitness: "personal-trainer",
  trainer: "personal-trainer",
  gym: "personal-trainer",
  abyssal: "water-systems",
  "abyssal-systems": "water-systems",
  "abyssal-hero": "water-systems",
  shark: "water-systems",
};

export function masterCategoryFor(niche: string | null | undefined): MasterCategoryId {
  const key = (niche ?? "").trim().toLowerCase();
  if (key in NICHE_REGISTRY) return NICHE_REGISTRY[key as RegisteredNiche];
  const aliased = FILING_ALIASES[key];
  if (aliased) return NICHE_REGISTRY[aliased];
  return "specialty-local";
}

export function defaultHeroSrcForNiche(niche: string | null | undefined): string {
  return MASTER_HERO_DEFAULTS[masterCategoryFor(niche)].src;
}

export function nichesInCategory(category: MasterCategoryId): RegisteredNiche[] {
  return REGISTERED_NICHES.filter((id) => NICHE_REGISTRY[id] === category);
}
