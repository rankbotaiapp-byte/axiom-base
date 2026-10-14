import { slugify } from "../utils.ts";
import { isShopNiche, SHOP_NICHES, type ShopNiche } from "./types.ts";

/** Display names for the built-in niches. Directory labels match these first. */
const NICHE_LABELS: Record<ShopNiche, string> = {
  guide: "Guide services",
  fitness: "Fitness coaching / Personal training",
  combat: "Combat sports",
  wellness: "Massage and bodywork",
  lessons: "Lessons and tutoring",
  salon: "Hair salon",
  beauty: "Nails, lashes, makeup",
  tattoo: "Tattoo shop",
  photo: "Photography",
  pets: "Pet grooming",
  music: "Music artist / Rapper",
  creator: "Content creator",
  prompt: "AI prompt engineering and creation",
  entertainer: "Entertainer",
  events: "Events",
  landscaper: "Landscaper",
  foodtruck: "Mobile food truck",
  dogwalk: "Dog walking",
  detailer: "Mobile detailer",
  hunting: "Private hunting guide",
  therapy: "Physical therapy",
  bowtech: "Custom bow technician",
  contractor: "General contractor / Home services",
  clean: "Home cleaning",
  field: "Field service",
  locksmith: "Mobile locksmith",
  firewood: "Firewood cutting",
  security: "Private security",
  practice: "Clinic",
  counsel: "Advisor",
  location: "Barber",
  studio: "App studio",
  retail: "Retail / Merchandise",
  trade: "Your trade",
};

/** Directory phrases that mean one of the built-in niches. */
const ALIASES: Record<string, ShopNiche> = {
  clinic: "practice",
  practice: "practice",
  "field service": "field",
  events: "events",
  "app studio": "studio",
  barber: "location",
  barbershop: "location",
  "hair salon": "salon",
  salon: "salon",
  advisor: "counsel",
  counsel: "counsel",
  consulting: "counsel",
  "private security": "security",
  security: "security",
  "mobile locksmith": "locksmith",
  "mobile locksmiths": "locksmith",
  "combat sports": "combat",
  mma: "combat",
  firewood: "firewood",
  "firewood cutting": "firewood",
  cordwood: "firewood",
  landscaper: "landscaper",
  landscaping: "landscaper",
  "lawn care": "landscaper",
  "food truck": "foodtruck",
  foodtruck: "foodtruck",
  "mobile food truck": "foodtruck",
  "dog walking": "dogwalk",
  dogwalking: "dogwalk",
  "dog walker": "dogwalk",
  "mobile detailer": "detailer",
  "auto detailing": "detailer",
  "car detailing": "detailer",
  detailer: "detailer",
  "private hunting guide": "hunting",
  "hunting guide": "hunting",
  hunting: "hunting",
  "physical therapy": "therapy",
  "physical therapist": "therapy",
  physiotherapy: "therapy",
  "custom bow technician": "bowtech",
  "bow technician": "bowtech",
  "bow tech": "bowtech",
  bowtech: "bowtech",
  "content creator": "creator",
  "video editor": "creator",
  "content creator / video editor": "creator",
  "ai prompt engineering and creation": "prompt",
  "prompt engineering": "prompt",
  "ai prompt": "prompt",
  entertainer: "entertainer",
  performer: "entertainer",
  "entertainer / performer": "entertainer",
  retail: "retail",
  merchandise: "retail",
  gear: "retail",
  ecommerce: "retail",
  "e-commerce": "retail",
};

const TRADE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Filing titles and registry phrases. First match wins, so a specific craft
 * beats a trailing "Services". Exact niche labels and aliases are checked first.
 */
const KEYWORD_RULES: { test: RegExp; niche: ShopNiche }[] = [
  { test: /\b(firewood|cordwood|fire wood)\b/i, niche: "firewood" },
  { test: /\b(landscap\w*|lawn(?:\s*care)?)\b/i, niche: "landscaper" },
  { test: /\b(food trucks?|foodtrucks?|mobile food|mobile kitchen)\b/i, niche: "foodtruck" },
  { test: /\b(dog walk\w*|dogwalk\w*|dog walkers?)\b/i, niche: "dogwalk" },
  { test: /\b((?:auto|mobile|car|vehicle)\s+detail\w*|detailers?)\b/i, niche: "detailer" },
  { test: /\b(locksmiths?|rekey|lockouts?|locks?)\b/i, niche: "locksmith" },
  {
    test: /\b(hvac|furnace|heat pumps?|air condition\w*|plumb\w*|electric\w*|wiring|roof\w*|drywall|fram(?:e|er|ing)|concrete|flooring|paint(?:er|ing|s)?|solar|septic|irrigat\w*|gutters?|shingles?|construction|home services|remodel\w*|carpent(?:er|ry)|contractors?)\b/i,
    niche: "contractor",
  },
  {
    test: /\b(handymen|handyman|handy man|mobile mechanics?|mobile services?|appliance|garage doors?|towing|pressure wash\w*|window clean\w*|junk removal|tree service|pest control|pool service|chimney|hauling|movers?|moving company)\b/i,
    niche: "field",
  },
  { test: /\b(pet groom\w*|pet sitt?\w*|dog train\w*)\b/i, niche: "pets" },
  { test: /\b(cater(?:ing|er)|event planners?)\b/i, niche: "events" },
  { test: /\b(massages?|bodywork)\b/i, niche: "wellness" },
  { test: /\b(tutors?|tutoring)\b/i, niche: "lessons" },
  { test: /\b(mma|martial arts|jiu-?jitsu|kickboxing|boxing)\b/i, niche: "combat" },
  { test: /\b(photographers?|photography|photo booth)\b/i, niche: "photo" },
  { test: /\btattoos?\b/i, niche: "tattoo" },
  { test: /\b(rappers?|recording artists?|music artists?)\b/i, niche: "music" },
  { test: /\b(prompt engineers?|prompt engineering|ai prompts?)\b/i, niche: "prompt" },
  { test: /\b(content creators?|video editors?|videographers?|video editing)\b/i, niche: "creator" },
  { test: /\b(entertainers?|performers?|magicians?|comedians?)\b/i, niche: "entertainer" },
  { test: /\b(house clean\w*|housekeeping|maid service|home cleaning|cleaners?)\b/i, niche: "clean" },
  { test: /\b(private security|security guards?|armed guards?)\b/i, niche: "security" },
  { test: /\b(custom bows?|bow techs?|bow technicians?|bowtech)\b/i, niche: "bowtech" },
  { test: /\bhunting\b/i, niche: "hunting" },
  { test: /\b(physical therap\w*|physiotherap\w*|physio)\b/i, niche: "therapy" },
  { test: /\b(outfitters?|fishing guides?|guides?)\b/i, niche: "guide" },
  { test: /\b(bookkeep\w*|notary|advisors?|consult\w*)\b/i, niche: "counsel" },
  { test: /\b(lashes|lash tech|makeup|esthetician)\b/i, niche: "beauty" },
  { test: /\b(personal train\w*|fitness)\b/i, niche: "fitness" },
  { test: /\b(hair salons?|hairstylists?|hair stylists?)\b/i, niche: "salon" },
  { test: /\b(barbers?|barbershop)\b/i, niche: "location" },
  { test: /\b(boutiques?|merchandise|retail)\b/i, niche: "retail" },
  { test: /\bstudios?\b/i, niche: "studio" },
  { test: /\b(clinics?|medical practices?)\b/i, niche: "practice" },
  { test: /\bfield services?\b/i, niche: "field" },
  { test: /\bevents?\b/i, niche: "events" },
  { test: /\b(self[-\s]?employed|sole prop\w*|proprietors?)\b/i, niche: "trade" },
  { test: /\bservices?\b/i, niche: "field" },
];

function keywordNiche(label: string): ShopNiche | null {
  for (const rule of KEYWORD_RULES) {
    if (rule.test.test(label)) return rule.niche;
  }
  return null;
}

/** A legal status or a bare "services" line, so the business title can still name the craft. */
function isGenericFiling(value: string): boolean {
  return /^(services?|sole proprietors?|self[-\s]?employed|independent contractors?|general services|business services)$/i.test(value);
}

export type ClassifiedTrade = {
  tradeType: string;
  tradeLabel: string;
  known: boolean;
};

export function nicheLabel(id: string): string {
  if (id === "all") return "All trades";
  if (isShopNiche(id)) return NICHE_LABELS[id];
  return id.replace(/-/g, " ");
}

/**
 * Turn a directory category into a stable trade key.
 * Known niches keep their id. Anything else becomes its own key.
 */
export function classifyTrade(raw: string): ClassifiedTrade {
  const label = raw.trim().replace(/\s+/g, " ").slice(0, 80);
  if (label.length < 2) throw new Error("Trade is required");
  const key = label.toLowerCase();
  if (key === "all" || key === "all trades") throw new Error("Name the trade");
  const byId = isShopNiche(key) ? key : null;
  const byLabel = SHOP_NICHES.find((id) => NICHE_LABELS[id].toLowerCase() === key) ?? null;
  const alias = ALIASES[key] ?? null;
  const niche = byId ?? byLabel ?? alias;
  if (niche) return { tradeType: niche, tradeLabel: NICHE_LABELS[niche], known: true };
  const fromKeyword = keywordNiche(label);
  if (fromKeyword) return { tradeType: fromKeyword, tradeLabel: label, known: true };
  const slug = slugify(label);
  if (!TRADE_KEY.test(slug) || slug === "shop") throw new Error("Trade is required");
  return { tradeType: slug, tradeLabel: label, known: false };
}

/**
 * Classify a registry row. A specific filing phrase wins. A sole-proprietor or
 * bare "services" line defers to the business title when that title names a craft.
 */
export function classifyFiling(name: string, trade: string): ClassifiedTrade {
  const tradeText = trade.trim().replace(/\s+/g, " ").slice(0, 80);
  const nameText = name.trim().replace(/\s+/g, " ").slice(0, 80);
  if (tradeText && !isGenericFiling(tradeText)) {
    const hit = classifyTrade(tradeText);
    if (hit.known) return hit;
  }
  if (nameText && !isGenericFiling(nameText)) {
    try {
      const hit = classifyTrade(nameText);
      if (hit.known) return hit;
    } catch {
      // The title was too short to be a trade. The filing line still counts.
    }
  }
  if (tradeText) return classifyTrade(tradeText);
  if (nameText) return classifyTrade(nameText);
  throw new Error("Trade is required");
}

export function isTradeKey(value: string): boolean {
  return value === "all" || (TRADE_KEY.test(value) && value.length <= 48);
}

/** The niche template a paid lead should be built from. Unknown trades use the open template. */
export function nicheForLead(tradeType: string, tradeLabel = ""): ShopNiche {
  if (isShopNiche(tradeType)) return tradeType;
  const label = tradeLabel.trim() || tradeType.replace(/-/g, " ");
  try {
    const classified = classifyTrade(label);
    if (classified.known && isShopNiche(classified.tradeType)) return classified.tradeType;
  } catch {
    // An empty or unnamed trade still gets a bookable shop.
  }
  return "trade";
}

export type LeadSort = "name" | "city" | "trade";

export function sortLeads<T extends { businessName: string; city: string; tradeLabel: string }>(
  leads: T[],
  sort: LeadSort,
): T[] {
  const key = sort === "city" ? "city" : sort === "trade" ? "tradeLabel" : "businessName";
  return [...leads].sort((a, b) => a[key].localeCompare(b[key], undefined, { sensitivity: "base" }));
}
