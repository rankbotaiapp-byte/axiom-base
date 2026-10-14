/**
 * Template for a new state in preloaded_leads.
 *
 * Copy this file, fill STATE / HUBS / MORE, and leave the niche map intact.
 * Existing states live in two places:
 *   hubs   src/lib/axiom/registry-sweep.ts          six counties, objects
 *   rest   src/lib/axiom/state-counties.ts          Name|City;City|area code
 * The loader streams 1,000-row upserts (scripts/seed-registry.mjs).
 * Each county keeps a 2,000-filing window. Hubs stay first.
 *
 * A county name already stored for another state is saved as "Name, ST"
 * (Orange County, CA). Do not reuse a bare name that is already on file.
 *
 * This file does not write to the database and does not change the desk,
 * the lead table, or the Autopilot route.
 */
import { classifyFiling } from "../../src/lib/axiom/directory.ts";
import { SHOP_NICHES } from "../../src/lib/axiom/types.ts";

export const STATE = {
  code: "XX",
  key: "example",
  label: "Example",
};

/** Six hubs, same shape as the Texas and Florida hub lists. */
export const HUBS = [
  { county: "Example County", cities: ["Seat", "Second City"], areaCode: "000" },
];

/**
 * Remaining counties. Blank lines and # comments are ignored.
 * County|City;City|area code
 * " County" is added when the name does not already end with it.
 */
export const MORE = `
# Adams|Adamsville;Adams Heights|555
`;

/**
 * One phrase per platform niche. classifyFiling maps each phrase onto the
 * niche key stored in preloaded_leads.trade_type.
 */
export const NICHE_FILINGS = [
  { niche: "guide", phrase: "Guide services" },
  { niche: "fitness", phrase: "Fitness coaching / Personal training" },
  { niche: "combat", phrase: "Combat sports" },
  { niche: "wellness", phrase: "Massage and bodywork" },
  { niche: "lessons", phrase: "Lessons and tutoring" },
  { niche: "salon", phrase: "Hair salon" },
  { niche: "beauty", phrase: "Nails, lashes, makeup" },
  { niche: "tattoo", phrase: "Tattoo shop" },
  { niche: "photo", phrase: "Photography" },
  { niche: "pets", phrase: "Pet grooming" },
  { niche: "music", phrase: "Music artist / Rapper" },
  { niche: "creator", phrase: "Content creator" },
  { niche: "prompt", phrase: "AI prompt engineering and creation" },
  { niche: "entertainer", phrase: "Entertainer" },
  { niche: "events", phrase: "Events" },
  { niche: "landscaper", phrase: "Landscaper" },
  { niche: "foodtruck", phrase: "Mobile food truck" },
  { niche: "dogwalk", phrase: "Dog walking" },
  { niche: "detailer", phrase: "Mobile detailer" },
  { niche: "hunting", phrase: "Private hunting guide" },
  { niche: "therapy", phrase: "Physical therapy" },
  { niche: "bowtech", phrase: "Custom bow technician" },
  { niche: "contractor", phrase: "General contractor / Home services" },
  { niche: "clean", phrase: "Home cleaning" },
  { niche: "field", phrase: "Field service" },
  { niche: "locksmith", phrase: "Mobile locksmith" },
  { niche: "firewood", phrase: "Firewood cutting" },
  { niche: "security", phrase: "Private security" },
  { niche: "practice", phrase: "Practice" },
  { niche: "counsel", phrase: "Advisor" },
  { niche: "location", phrase: "Barber" },
  { niche: "studio", phrase: "Studio" },
  { niche: "retail", phrase: "Retail / Merchandise" },
  { niche: "trade", phrase: "Sole proprietor" },
];

const covered = new Set(NICHE_FILINGS.map((row) => row.niche));
const missing = SHOP_NICHES.filter((niche) => !covered.has(niche));
if (missing.length > 0) {
  throw new Error(`Niche map is missing ${missing.join(", ")}`);
}

for (const row of NICHE_FILINGS) {
  const hit = classifyFiling("Example Filing", row.phrase);
  if (hit.tradeType !== row.niche) {
    throw new Error(`${row.phrase} mapped to ${hit.tradeType}, expected ${row.niche}`);
  }
}

console.log(
  `[template] ${STATE.label} · ${NICHE_FILINGS.length} niches mapped · hubs ${HUBS.length} · county lines ready to fill`,
);
