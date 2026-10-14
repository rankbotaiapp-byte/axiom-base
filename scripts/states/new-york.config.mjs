/**
 * New York registry config for preloaded_leads.
 *
 * Copied from scripts/templates/new-state.config.mjs.
 * Hubs match NEW_YORK_HUB_COUNTIES in src/lib/axiom/registry-sweep.ts.
 * Remaining lines match NEW_YORK_MORE in src/lib/axiom/state-counties.ts.
 * Borough counties stay Kings (Brooklyn), Queens, New York (Manhattan),
 * Bronx, and Richmond (Staten Island). A county name already stored for
 * another state is saved as "Name, NY". The 2,000-filing windows stay
 * in this order.
 *
 * This file does not write to the database.
 */
import { pathToFileURL } from "node:url";
import { classifyFiling } from "../../src/lib/axiom/directory.ts";
import { SHOP_NICHES } from "../../src/lib/axiom/types.ts";

export const STATE = {
  code: "NY",
  key: "newyork",
  label: "New York",
};

/** Six hubs, same objects and order as the New York hub list. */
export const HUBS = [
  { county: "Kings County", cities: ["Brooklyn"], areaCode: "718" },
  { county: "Queens County", cities: ["Queens"], areaCode: "718" },
  { county: "New York County", cities: ["Manhattan"], areaCode: "212" },
  { county: "Suffolk County", cities: ["Huntington", "Islip", "Riverhead"], areaCode: "631" },
  { county: "Nassau County", cities: ["Mineola", "Hempstead", "Garden City"], areaCode: "516" },
  { county: "Westchester County", cities: ["White Plains"], areaCode: "914" },
];

/**
 * Remaining counties. Blank lines and # comments are ignored.
 * County|City;City|area code
 * " County" is added when the name does not already end with it.
 */
export const MORE = `
Albany|Albany|518
Allegany|Belmont|585
Bronx|Bronx|718
Broome|Binghamton|607
Cattaraugus|Little Valley|716
Cayuga|Auburn|315
Chautauqua|Mayville|716
Chemung|Elmira|607
Chenango|Norwich|607
Clinton|Plattsburgh|518
Columbia|Hudson|518
Cortland|Cortland|607
Delaware|Delhi|607
Dutchess|Poughkeepsie|845
Erie|Buffalo|716
Essex|Elizabethtown|518
Franklin|Malone|518
Fulton|Johnstown|518
Genesee|Batavia|585
Greene|Catskill|518
Hamilton|Lake Pleasant|518
Herkimer|Herkimer|315
Jefferson|Watertown|315
Lewis|Lowville|315
Livingston|Geneseo|585
Madison|Wampsville|315
Monroe|Rochester|585
Montgomery|Fonda|518
Niagara|Lockport|716
Oneida|Utica|315
Onondaga|Syracuse|315
Ontario|Canandaigua|585
Orange|Goshen|845
Orleans|Albion|585
Oswego|Oswego|315
Otsego|Cooperstown|607
Putnam|Carmel|845
Rensselaer|Troy|518
Richmond|Staten Island|718
Rockland|New City|845
St. Lawrence|Canton|315
Saratoga|Ballston Spa|518
Schenectady|Schenectady|518
Schoharie|Schoharie|518
Schuyler|Watkins Glen|607
Seneca|Waterloo|315
Steuben|Bath|607
Sullivan|Monticello|845
Tioga|Owego|607
Tompkins|Ithaca|607
Ulster|Kingston|845
Warren|Queensbury|518
Washington|Fort Edward|518
Wayne|Lyons|315
Wyoming|Warsaw|585
Yates|Penn Yan|315
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
    `[newyork] ${STATE.label} · ${NICHE_FILINGS.length} niches mapped · hubs ${HUBS.length} · county lines ready`,
  );
}
