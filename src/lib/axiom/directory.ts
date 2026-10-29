import { CATALOG, CATALOG_BY_ID, resolveCatalogNiche, type CatalogNiche } from "@/config/catalog";
import { slugify } from "../utils.ts";
import { isShopNiche, type ShopNiche } from "./types.ts";

/** Display names for the verified catalog niches. */
const NICHE_LABELS: Record<ShopNiche, string> = Object.fromEntries(
  CATALOG.map((row) => [row.id, row.label]),
) as Record<ShopNiche, string>;

/** Directory phrases that mean one of the catalog niches. */
const ALIASES: Record<string, ShopNiche> = {
  auto: "auto",
  "auto repair": "auto",
  "mobile mechanic": "auto",
  detailer: "auto",
  "auto detailing": "auto",
  barber: "barber",
  barbershop: "barber",
  "hair salon": "barber",
  salon: "barber",
  "bow tech": "bow-tech",
  bowtech: "bow-tech",
  "custom bow technician": "bow-tech",
  canine: "canine",
  "pet grooming": "canine",
  "dog walking": "canine",
  dogwalk: "canine",
  contractor: "contractor",
  "general contractor": "contractor",
  construction: "contractor",
  electrical: "electrical",
  electrician: "electrical",
  fabrication: "fabrication",
  welding: "fabrication",
  forestry: "forestry",
  firewood: "forestry",
  glasswork: "glasswork",
  glass: "glasswork",
  photography: "glasswork",
  hvac: "hvac",
  "air conditioning": "hvac",
  cleaning: "hvac",
  landscaping: "landscaping",
  landscaper: "landscaping",
  "lawn care": "landscaping",
  machining: "machining",
  gunsmith: "machining",
  plumbing: "plumbing",
  plumber: "plumbing",
  "power sports": "power-sports",
  "boarding lessons": "power-sports",
  roofing: "roofing",
  security: "security",
  "private security": "security",
  "stone masonry": "stone-masonry",
  masonry: "stone-masonry",
  taxidermy: "taxidermy",
  "tool repair": "tool-repair",
  "water systems": "water-systems",
  well: "water-systems",
  woodworking: "woodworking",
  millwork: "woodworking",
};

const KEYWORD_RULES: { test: RegExp; niche: ShopNiche }[] = [
  { test: /\b(auto|mechanic|detail(?:er|ing)?)\b/i, niche: "auto" },
  { test: /\b(barbers?|barbershop|hair salon|salon)\b/i, niche: "barber" },
  { test: /\b(bow[\s-]?tech|custom bows?)\b/i, niche: "bow-tech" },
  { test: /\b(canine|pet groom|dog walk|kennel)\b/i, niche: "canine" },
  { test: /\b(electric(?:al|ian)?|wiring|panels?)\b/i, niche: "electrical" },
  { test: /\b(fabricat\w*|weld(?:ing|er)?)\b/i, niche: "fabrication" },
  { test: /\b(forestry|firewood|timber|logging)\b/i, niche: "forestry" },
  { test: /\b(glass(?:work)?|glazier|photography)\b/i, niche: "glasswork" },
  { test: /\b(hvac|furnace|heat pump|air condition|clean(?:ing|ers)?)\b/i, niche: "hvac" },
  { test: /\b(landscap\w*|lawn(?:\s*care)?|guide service)\b/i, niche: "landscaping" },
  { test: /\b(machin(?:e|ing)|gunsmith|cnc)\b/i, niche: "machining" },
  { test: /\b(plumb(?:ing|er|ers)?)\b/i, niche: "plumbing" },
  { test: /\b(power[\s-]?sports?|boarding|snowboard|sled)\b/i, niche: "power-sports" },
  { test: /\b(roof(?:ing|er)?|shingles?)\b/i, niche: "roofing" },
  { test: /\b(security|patrol|guard)\b/i, niche: "security" },
  { test: /\b(stone|mason(?:ry)?|hardscape)\b/i, niche: "stone-masonry" },
  { test: /\b(taxidermy|mounts?)\b/i, niche: "taxidermy" },
  { test: /\b(tool repair|sharpen|rebuild)\b/i, niche: "tool-repair" },
  { test: /\b(water systems?|well|filtration|trout)\b/i, niche: "water-systems" },
  { test: /\b(woodwork\w*|millwork|carpentry|cabinet)\b/i, niche: "woodworking" },
  { test: /\b(contractors?|construction|remodel|home services)\b/i, niche: "contractor" },
];

function keywordNiche(label: string): ShopNiche | null {
  for (const rule of KEYWORD_RULES) {
    if (rule.test.test(label)) return rule.niche;
  }
  return null;
}

function isGenericFiling(value: string): boolean {
  return /^(services?|sole proprietors?|self[-\s]?employed|independent contractors?|general services|business services)$/i.test(
    value,
  );
}

export type ClassifiedTrade = {
  tradeType: string;
  tradeLabel: string;
  known: boolean;
};

export function classifyTrade(raw: string): ClassifiedTrade {
  const label = raw.trim().replace(/\s+/g, " ");
  if (!label) return { tradeType: "contractor", tradeLabel: "Contractor", known: true };

  const lower = label.toLowerCase();
  if (isShopNiche(lower)) {
    return { tradeType: lower, tradeLabel: NICHE_LABELS[lower], known: true };
  }
  const alias = ALIASES[lower];
  if (alias) {
    return { tradeType: alias, tradeLabel: NICHE_LABELS[alias], known: true };
  }
  const fromKeyword = keywordNiche(label);
  if (fromKeyword) {
    return { tradeType: fromKeyword, tradeLabel: NICHE_LABELS[fromKeyword], known: true };
  }
  if (isGenericFiling(lower)) {
    return { tradeType: "contractor", tradeLabel: label, known: true };
  }
  return { tradeType: slugify(label) || "contractor", tradeLabel: label, known: false };
}

export function classifyFiling(craft: string, phrase: string): ClassifiedTrade {
  const fromPhrase = classifyTrade(phrase);
  if (fromPhrase.known) return fromPhrase;
  const fromCraft = classifyTrade(craft);
  if (fromCraft.known) return fromCraft;
  return { tradeType: "contractor", tradeLabel: phrase || craft || "Contractor", known: true };
}

/** Territory / lead claim → verified catalog niche. */
export function nicheForLead(tradeType: string, tradeLabel = ""): ShopNiche {
  if (isShopNiche(tradeType)) return tradeType;
  const classified = classifyTrade(tradeLabel || tradeType);
  if (classified.known && isShopNiche(classified.tradeType)) return classified.tradeType;
  return resolveCatalogNiche(tradeType);
}

export function nicheLabel(id: string): string {
  if (id === "all") return "All trades";
  if (isShopNiche(id)) return NICHE_LABELS[id];
  return CATALOG_BY_ID[resolveCatalogNiche(id)]?.label ?? id.replace(/-/g, " ");
}

const TRADE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isTradeKey(value: string): boolean {
  return value === "all" || (TRADE_KEY.test(value) && value.length <= 48);
}

export type LeadSort = "name" | "city" | "trade";

export function sortLeads<T extends { businessName: string; city: string; tradeLabel: string }>(
  leads: T[],
  sort: LeadSort,
): T[] {
  const key = sort === "city" ? "city" : sort === "trade" ? "tradeLabel" : "businessName";
  return [...leads].sort((a, b) => a[key].localeCompare(b[key], undefined, { sensitivity: "base" }));
}
