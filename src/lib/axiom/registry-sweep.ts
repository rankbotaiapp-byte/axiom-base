import type { BulkLeadInput } from "./bulk-import.ts";

/** Invented filings per county. The desk stages them in batches of 1,000. */
export const SWEEP_PER_COUNTY = 2000;

export type SweepCounty = {
  county: string;
  cities: readonly string[];
  areaCode: string;
};

/** Texas economic hubs. Already loaded; kept so a later sweep can target them again. */
export const TEXAS_HUB_COUNTIES: readonly SweepCounty[] = [
  { county: "Harris County", cities: ["Houston", "Pasadena", "Baytown"], areaCode: "713" },
  { county: "Dallas County", cities: ["Dallas", "Irving", "Garland"], areaCode: "214" },
  { county: "Travis County", cities: ["Austin", "Pflugerville"], areaCode: "512" },
  { county: "Bexar County", cities: ["San Antonio", "Leon Valley"], areaCode: "210" },
  { county: "Tarrant County", cities: ["Fort Worth", "Arlington"], areaCode: "817" },
  { county: "Collin County", cities: ["Plano", "McKinney", "Frisco"], areaCode: "972" },
];

/** Florida economic hubs. The active sweep writes 2,000 filings in each. */
export const FLORIDA_HUB_COUNTIES: readonly SweepCounty[] = [
  { county: "Miami-Dade County", cities: ["Miami", "Hialeah", "Miami Beach"], areaCode: "305" },
  { county: "Broward County", cities: ["Fort Lauderdale", "Hollywood", "Pembroke Pines"], areaCode: "954" },
  { county: "Palm Beach County", cities: ["West Palm Beach", "Boca Raton", "Delray Beach"], areaCode: "561" },
  { county: "Hillsborough County", cities: ["Tampa", "Brandon", "Plant City"], areaCode: "813" },
  { county: "Orange County", cities: ["Orlando", "Winter Park", "Apopka"], areaCode: "407" },
  { county: "Duval County", cities: ["Jacksonville", "Jacksonville Beach"], areaCode: "904" },
];

const ACTIVE_COUNTIES = FLORIDA_HUB_COUNTIES;
const ACTIVE_STATE = "FL";

export const OREGON_COUNTIES: readonly { county: string; cities: readonly string[] }[] = [
  { county: "Baker County", cities: ["Baker City"] },
  { county: "Benton County", cities: ["Corvallis", "Philomath"] },
  { county: "Clackamas County", cities: ["Oregon City", "Lake Oswego"] },
  { county: "Clatsop County", cities: ["Astoria", "Seaside"] },
  { county: "Columbia County", cities: ["St. Helens", "Scappoose"] },
  { county: "Coos County", cities: ["Coos Bay", "North Bend"] },
  { county: "Crook County", cities: ["Prineville"] },
  { county: "Curry County", cities: ["Brookings", "Gold Beach"] },
  { county: "Deschutes County", cities: ["Bend", "Redmond"] },
  { county: "Douglas County", cities: ["Roseburg", "Winston"] },
  { county: "Gilliam County", cities: ["Condon"] },
  { county: "Grant County", cities: ["John Day"] },
  { county: "Harney County", cities: ["Burns"] },
  { county: "Hood River County", cities: ["Hood River"] },
  { county: "Jackson County", cities: ["Medford", "Ashland", "Central Point"] },
  { county: "Jefferson County", cities: ["Madras"] },
  { county: "Josephine County", cities: ["Grants Pass", "Cave Junction"] },
  { county: "Klamath County", cities: ["Klamath Falls"] },
  { county: "Lake County", cities: ["Lakeview"] },
  { county: "Lane County", cities: ["Eugene", "Springfield"] },
  { county: "Lincoln County", cities: ["Newport", "Lincoln City"] },
  { county: "Linn County", cities: ["Albany", "Lebanon"] },
  { county: "Malheur County", cities: ["Ontario", "Vale"] },
  { county: "Marion County", cities: ["Salem", "Keizer"] },
  { county: "Morrow County", cities: ["Heppner", "Boardman"] },
  { county: "Multnomah County", cities: ["Portland", "Gresham"] },
  { county: "Polk County", cities: ["Dallas", "Independence"] },
  { county: "Sherman County", cities: ["Moro"] },
  { county: "Tillamook County", cities: ["Tillamook"] },
  { county: "Umatilla County", cities: ["Pendleton", "Hermiston"] },
  { county: "Union County", cities: ["La Grande"] },
  { county: "Wallowa County", cities: ["Enterprise"] },
  { county: "Wasco County", cities: ["The Dalles"] },
  { county: "Washington County", cities: ["Hillsboro", "Beaverton"] },
  { county: "Wheeler County", cities: ["Fossil"] },
  { county: "Yamhill County", cities: ["McMinnville", "Newberg"] },
];

/** Craft word used in the business title, and the filing phrase stored as the trade. */
const SWEEP_FILINGS: readonly { craft: string; phrase: string }[] = [
  { craft: "Guide", phrase: "Guide services" },
  { craft: "Training", phrase: "Fitness coaching / Personal training" },
  { craft: "Combat", phrase: "Combat sports" },
  { craft: "Bodywork", phrase: "Massage and bodywork" },
  { craft: "Lessons", phrase: "Lessons and tutoring" },
  { craft: "Salon", phrase: "Hair salon" },
  { craft: "Lash", phrase: "Nails, lashes, makeup" },
  { craft: "Tattoo", phrase: "Tattoo shop" },
  { craft: "Photo", phrase: "Photography" },
  { craft: "Grooming", phrase: "Pet grooming" },
  { craft: "Sessions", phrase: "Music artist / Rapper" },
  { craft: "Creator", phrase: "Content creator" },
  { craft: "Landscaper", phrase: "Landscaper" },
  { craft: "Foodtruck", phrase: "Mobile food truck" },
  { craft: "Performer", phrase: "Entertainer" },
  { craft: "Events", phrase: "Events" },
  { craft: "Build", phrase: "General contractor / Home services" },
  { craft: "Cleaning", phrase: "Home cleaning" },
  { craft: "Field", phrase: "Field service" },
  { craft: "Keys", phrase: "Mobile locksmith" },
  { craft: "Firewood", phrase: "Firewood cutting" },
  { craft: "Watch", phrase: "Private security" },
  { craft: "Practice", phrase: "Practice" },
  { craft: "Advisor", phrase: "Advisor" },
  { craft: "Barber", phrase: "Barber" },
  { craft: "Studio", phrase: "Studio" },
  { craft: "Retail", phrase: "Retail / Merchandise" },
  { craft: "Independent", phrase: "Sole proprietor" },
  { craft: "Electrical", phrase: "Electrical" },
  { craft: "Plumbing", phrase: "Plumbing" },
  { craft: "HVAC", phrase: "HVAC" },
  { craft: "Roofing", phrase: "Roofing" },
  { craft: "Drywall", phrase: "Drywall" },
  { craft: "Framing", phrase: "Framing" },
  { craft: "Concrete", phrase: "Concrete" },
  { craft: "Handyman", phrase: "Handyman" },
  { craft: "Lock", phrase: "Lock Services" },
  { craft: "Cordwood", phrase: "Firewood Services" },
  { craft: "Construction", phrase: "Construction" },
  { craft: "Mechanic", phrase: "Mobile mechanic" },
];

const FIRST = ["Maren", "Cole", "Dana", "Jonah", "Elena", "Priya", "Noah", "Leah", "Nina", "Luis", "Amira", "Claire"];
const LAST = ["Holt", "Brennan", "Okonkwo", "Hale", "Voss", "Shah", "Feldman", "Ortiz", "Brooks", "Navarro", "Nguyen", "Greene"];

export function registrySweepTotal(): number {
  return ACTIVE_COUNTIES.length * SWEEP_PER_COUNTY;
}

export function registryCountyAt(offset: number): string {
  const total = registrySweepTotal();
  if (total === 0) return "";
  const index = Math.min(Math.max(0, Math.floor(offset)), total - 1);
  return ACTIVE_COUNTIES[Math.floor(index / SWEEP_PER_COUNTY)]?.county ?? "";
}

/** One slice of the statewide filing list. Earlier rows are not built. */
export function registrySweepSlice(offset: number, limit: number): BulkLeadInput[] {
  const total = registrySweepTotal();
  const start = Math.max(0, Math.floor(offset));
  const end = Math.min(total, start + Math.max(0, Math.floor(limit)));
  const rows: BulkLeadInput[] = [];
  for (let index = start; index < end; index += 1) rows.push(recordAt(index));
  return rows;
}

function recordAt(index: number): BulkLeadInput {
  const countyIndex = Math.floor(index / SWEEP_PER_COUNTY);
  const within = index % SWEEP_PER_COUNTY;
  const place = ACTIVE_COUNTIES[countyIndex];
  const filing = SWEEP_FILINGS[within % SWEEP_FILINGS.length];
  const copy = Math.floor(within / SWEEP_FILINGS.length) + 1;
  const first = FIRST[index % FIRST.length];
  const last = LAST[index % LAST.length];
  const sole = within % 7 === 0;
  return {
    line: index + 2,
    name: `${first} ${last} ${filing.craft} ${ACTIVE_STATE} ${copy}`,
    city: place.cities[within % place.cities.length],
    county: place.county,
    trade: sole ? "Sole proprietor" : filing.phrase,
    email: index % 2 === 0 ? `${ACTIVE_STATE.toLowerCase()}${index}@sweep.example` : "",
    phone: `${place.areaCode}-555-${String(within).padStart(5, "0")}`,
    website: index % 3 === 0 ? "sweep.example" : "",
    phoneLine: index % 2 === 0 ? "mobile" : "landline",
  };
}
