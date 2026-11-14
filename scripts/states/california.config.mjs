/**
 * California registry config for preloaded_leads.
 *
 * Copied from scripts/templates/new-state.config.mjs.
 * Hubs match CALIFORNIA_HUB_COUNTIES in src/lib/axiom/registry-sweep.ts.
 * Remaining lines match CALIFORNIA_MORE in src/lib/axiom/state-counties.ts.
 * Orange County is stored as "Orange County, CA" because Florida already
 * uses the bare name. The 2,000-filing county windows stay in this order.
 *
 * This file does not write to the database.
 */
import { pathToFileURL } from "node:url";
import { classifyFiling } from "../../src/lib/axiom/directory.ts";
import { SHOP_NICHES } from "../../src/lib/axiom/types.ts";

export const STATE = {
  code: "CA",
  key: "california",
  label: "California",
};

/** Six hubs, same objects and order as the California hub list. */
export const HUBS = [
  { county: "Los Angeles County", cities: ["Los Angeles", "Long Beach", "Glendale"], areaCode: "213" },
  { county: "San Diego County", cities: ["San Diego", "Chula Vista", "Oceanside"], areaCode: "619" },
  { county: "Orange County, CA", cities: ["Anaheim", "Santa Ana", "Irvine"], areaCode: "714" },
  { county: "Santa Clara County", cities: ["San Jose", "Sunnyvale", "Mountain View"], areaCode: "408" },
  { county: "Alameda County", cities: ["Oakland", "Fremont", "Berkeley"], areaCode: "510" },
  { county: "Sacramento County", cities: ["Sacramento", "Elk Grove", "Citrus Heights"], areaCode: "916" },
];

/**
 * Remaining counties. Blank lines and # comments are ignored.
 * County|City;City|area code
 * " County" is added when the name does not already end with it.
 */
export const MORE = `
Alpine|Markleeville|530
Amador|Jackson|209
Butte|Oroville|530
Calaveras|San Andreas|209
Colusa|Colusa|530
Contra Costa|Martinez|925
Del Norte|Crescent City|707
El Dorado|Placerville|530
Fresno|Fresno|559
Glenn|Willows|530
Humboldt|Eureka|707
Imperial|El Centro|760
Inyo|Independence|760
Kern|Bakersfield|661
Kings|Hanford|559
Lake|Lakeport|707
Lassen|Susanville|530
Madera|Madera|559
Marin|San Rafael|415
Mariposa|Mariposa|209
Mendocino|Ukiah|707
Merced|Merced|209
Modoc|Alturas|530
Mono|Bridgeport|760
Monterey|Salinas|831
Napa|Napa|707
Nevada|Nevada City|530
Placer|Auburn|530
Plumas|Quincy|530
Riverside|Riverside|951
San Benito|Hollister|831
San Bernardino|San Bernardino|909
San Francisco|San Francisco|415
San Joaquin|Stockton|209
San Luis Obispo|San Luis Obispo|805
San Mateo|Redwood City|650
Santa Barbara|Santa Barbara|805
Santa Cruz|Santa Cruz|831
Shasta|Redding|530
Sierra|Downieville|530
Siskiyou|Yreka|530
Solano|Fairfield|707
Sonoma|Santa Rosa|707
Stanislaus|Modesto|209
Sutter|Yuba City|530
Tehama|Red Bluff|530
Trinity|Weaverville|530
Tulare|Visalia|559
Tuolumne|Sonora|209
Ventura|Ventura|805
Yolo|Woodland|530
Yuba|Marysville|530
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

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  console.log(
    `[california] ${STATE.label} · ${NICHE_FILINGS.length} niches mapped · hubs ${HUBS.length} · county lines ready`,
  );
}
