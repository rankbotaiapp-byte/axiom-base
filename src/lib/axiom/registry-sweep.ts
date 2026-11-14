import type { BulkLeadInput } from "./bulk-import.ts";
import { HERO_LOOP_FILINGS } from "./hero-loop-catalog.ts";
import {
  CALIFORNIA_MORE,
  FLORIDA_MORE,
  NEW_YORK_MORE,
  PENNSYLVANIA_MORE,
  TEXAS_MORE,
  type RegistryCounty,
} from "./state-counties.ts";

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

/** Illinois economic hubs. Lake County is labeled for Illinois because Oregon already uses Lake County. */
export const ILLINOIS_HUB_COUNTIES: readonly SweepCounty[] = [
  { county: "Cook County", cities: ["Chicago"], areaCode: "312" },
  { county: "DuPage County", cities: ["Wheaton"], areaCode: "630" },
  { county: "Lake County, IL", cities: ["Waukegan"], areaCode: "847" },
  { county: "Will County", cities: ["Joliet"], areaCode: "815" },
  { county: "Kane County", cities: ["Aurora", "Elgin"], areaCode: "630" },
  { county: "Winnebago County", cities: ["Rockford"], areaCode: "815" },
];

/** New York economic hubs. Borough counties keep their own names and cities. */
export const NEW_YORK_HUB_COUNTIES: readonly SweepCounty[] = [
  { county: "Kings County", cities: ["Brooklyn"], areaCode: "718" },
  { county: "Queens County", cities: ["Queens"], areaCode: "718" },
  { county: "New York County", cities: ["Manhattan"], areaCode: "212" },
  { county: "Suffolk County", cities: ["Huntington", "Islip", "Riverhead"], areaCode: "631" },
  { county: "Nassau County", cities: ["Mineola", "Hempstead", "Garden City"], areaCode: "516" },
  { county: "Westchester County", cities: ["White Plains"], areaCode: "914" },
];

/** Pennsylvania economic hubs. Seeded on their own so the other states stay put. */
export const PENNSYLVANIA_HUB_COUNTIES: readonly SweepCounty[] = [
  { county: "Philadelphia County", cities: ["Philadelphia"], areaCode: "215" },
  { county: "Allegheny County", cities: ["Pittsburgh"], areaCode: "412" },
  { county: "Montgomery County", cities: ["Norristown", "King of Prussia"], areaCode: "610" },
  { county: "Bucks County", cities: ["Doylestown"], areaCode: "215" },
  { county: "Delaware County", cities: ["Media"], areaCode: "610" },
  { county: "Lancaster County", cities: ["Lancaster"], areaCode: "717" },
];

/** California economic hubs. Seeded on their own so the Florida sweep stays put. */
export const CALIFORNIA_HUB_COUNTIES: readonly SweepCounty[] = [
  { county: "Los Angeles County", cities: ["Los Angeles", "Long Beach", "Glendale"], areaCode: "213" },
  { county: "San Diego County", cities: ["San Diego", "Chula Vista", "Oceanside"], areaCode: "619" },
  { county: "Orange County, CA", cities: ["Anaheim", "Santa Ana", "Irvine"], areaCode: "714" },
  { county: "Santa Clara County", cities: ["San Jose", "Sunnyvale", "Mountain View"], areaCode: "408" },
  { county: "Alameda County", cities: ["Oakland", "Fremont", "Berkeley"], areaCode: "510" },
  { county: "Sacramento County", cities: ["Sacramento", "Elk Grove", "Citrus Heights"], areaCode: "916" },
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

const TAKEN_COUNTIES = new Set<string>();

function legalCounty(label: string): string {
  return label.replace(/, [A-Z]{2}$/, "");
}

function reserveCounties(labels: readonly string[]) {
  for (const label of labels) {
    TAKEN_COUNTIES.add(label);
    TAKEN_COUNTIES.add(legalCounty(label));
  }
}

/** Hubs stay in their saved order and names. Later counties pick up a state tag when the name is already stored. */
function appendCounties(state: string, hubs: readonly SweepCounty[], rest: readonly RegistryCounty[]): SweepCounty[] {
  const seen = new Set(hubs.map((hub) => legalCounty(hub.county)));
  const out: SweepCounty[] = hubs.map((hub) => ({
    county: hub.county,
    cities: [...hub.cities],
    areaCode: hub.areaCode,
  }));
  for (const row of rest) {
    if (seen.has(row.county)) continue;
    seen.add(row.county);
    const county = TAKEN_COUNTIES.has(row.county) ? `${row.county}, ${state}` : row.county;
    TAKEN_COUNTIES.add(row.county);
    TAKEN_COUNTIES.add(county);
    out.push({ county, cities: [...row.cities], areaCode: row.areaCode });
  }
  return out;
}

reserveCounties(OREGON_COUNTIES.map((row) => row.county));
reserveCounties(ILLINOIS_HUB_COUNTIES.map((row) => row.county));
reserveCounties(TEXAS_HUB_COUNTIES.map((row) => row.county));
reserveCounties(FLORIDA_HUB_COUNTIES.map((row) => row.county));
reserveCounties(CALIFORNIA_HUB_COUNTIES.map((row) => row.county));
reserveCounties(PENNSYLVANIA_HUB_COUNTIES.map((row) => row.county));
reserveCounties(NEW_YORK_HUB_COUNTIES.map((row) => row.county));

export const TEXAS_COUNTIES = appendCounties("TX", TEXAS_HUB_COUNTIES, TEXAS_MORE);
export const FLORIDA_COUNTIES = appendCounties("FL", FLORIDA_HUB_COUNTIES, FLORIDA_MORE);
export const CALIFORNIA_COUNTIES = appendCounties("CA", CALIFORNIA_HUB_COUNTIES, CALIFORNIA_MORE);
export const PENNSYLVANIA_COUNTIES = appendCounties("PA", PENNSYLVANIA_HUB_COUNTIES, PENNSYLVANIA_MORE);
export const NEW_YORK_COUNTIES = appendCounties("NY", NEW_YORK_HUB_COUNTIES, NEW_YORK_MORE);

/** Craft word + filing phrase — locked to the 21 verified hero loops. */
const SWEEP_FILINGS: readonly { craft: string; phrase: string }[] = HERO_LOOP_FILINGS.map((row) => ({
  craft: row.craft,
  phrase: row.phrase,
}));

const FIRST = ["Maren", "Cole", "Dana", "Jonah", "Elena", "Priya", "Noah", "Leah", "Nina", "Luis", "Amira", "Claire"];
const LAST = ["Holt", "Brennan", "Okonkwo", "Hale", "Voss", "Shah", "Feldman", "Ortiz", "Brooks", "Navarro", "Nguyen", "Greene"];

export function registrySweepTotal(): number {
  return sweepTotal(ACTIVE_COUNTIES);
}

export function californiaSweepTotal(): number {
  return sweepTotal(CALIFORNIA_COUNTIES);
}

export function pennsylvaniaSweepTotal(): number {
  return sweepTotal(PENNSYLVANIA_COUNTIES);
}

export function newYorkSweepTotal(): number {
  return sweepTotal(NEW_YORK_COUNTIES);
}

export function texasSweepTotal(): number {
  return sweepTotal(TEXAS_COUNTIES);
}

export function floridaSweepTotal(): number {
  return sweepTotal(FLORIDA_COUNTIES);
}

export function illinoisSweepTotal(): number {
  return sweepTotal(ILLINOIS_HUB_COUNTIES);
}

export function registryCountyAt(offset: number): string {
  return countyAt(ACTIVE_COUNTIES, offset);
}

export function californiaCountyAt(offset: number): string {
  return countyAt(CALIFORNIA_COUNTIES, offset);
}

export function pennsylvaniaCountyAt(offset: number): string {
  return countyAt(PENNSYLVANIA_COUNTIES, offset);
}

export function newYorkCountyAt(offset: number): string {
  return countyAt(NEW_YORK_COUNTIES, offset);
}

export function texasCountyAt(offset: number): string {
  return countyAt(TEXAS_COUNTIES, offset);
}

export function floridaCountyAt(offset: number): string {
  return countyAt(FLORIDA_COUNTIES, offset);
}

export function illinoisCountyAt(offset: number): string {
  return countyAt(ILLINOIS_HUB_COUNTIES, offset);
}

/** One slice of the statewide filing list. Earlier rows are not built. */
export function registrySweepSlice(offset: number, limit: number): BulkLeadInput[] {
  return sweepSlice(ACTIVE_STATE, ACTIVE_COUNTIES, offset, limit);
}

/** One window of a full state registry. Only this slice is built. */
export function californiaSweepSlice(offset: number, limit: number): BulkLeadInput[] {
  return sweepSlice("CA", CALIFORNIA_COUNTIES, offset, limit, true);
}

export function pennsylvaniaSweepSlice(offset: number, limit: number): BulkLeadInput[] {
  return sweepSlice("PA", PENNSYLVANIA_COUNTIES, offset, limit, true);
}

export function newYorkSweepSlice(offset: number, limit: number): BulkLeadInput[] {
  return sweepSlice("NY", NEW_YORK_COUNTIES, offset, limit, true);
}

export function texasSweepSlice(offset: number, limit: number): BulkLeadInput[] {
  return sweepSlice("TX", TEXAS_COUNTIES, offset, limit, true);
}

export function floridaSweepSlice(offset: number, limit: number): BulkLeadInput[] {
  return sweepSlice("FL", FLORIDA_COUNTIES, offset, limit, true);
}

/** One slice of the Illinois hub filings. The other state sweeps are unchanged. */
export function illinoisSweepSlice(offset: number, limit: number): BulkLeadInput[] {
  return sweepSlice("IL", ILLINOIS_HUB_COUNTIES, offset, limit, true);
}

/**
 * Supplement pass reuses the verified hero-loop filings so late windows
 * never invent crafts outside the 21-loop catalog.
 */
const LATE_FILINGS = SWEEP_FILINGS;

/** Same density as one craft in the 2,000-row county window. */
const SUPPLEMENT_COPIES = Math.floor(SWEEP_PER_COUNTY / SWEEP_FILINGS.length);

type SupplementPlace = SweepCounty & { state: string };

const SUPPLEMENT_PLACES: readonly SupplementPlace[] = [
  ...OREGON_COUNTIES.map((row) => ({ county: row.county, cities: row.cities, areaCode: "541", state: "OR" })),
  ...TEXAS_HUB_COUNTIES.map((row) => ({ ...row, state: "TX" })),
  ...FLORIDA_HUB_COUNTIES.map((row) => ({ ...row, state: "FL" })),
];

const SUPPLEMENT_PER_COUNTY = LATE_FILINGS.length * SUPPLEMENT_COPIES;

export function supplementSweepTotal(): number {
  return SUPPLEMENT_PLACES.length * SUPPLEMENT_PER_COUNTY;
}

export function supplementCountyAt(offset: number): string {
  const total = supplementSweepTotal();
  if (total === 0) return "";
  const index = Math.min(Math.max(0, Math.floor(offset)), total - 1);
  return SUPPLEMENT_PLACES[Math.floor(index / SUPPLEMENT_PER_COUNTY)]?.county ?? "";
}

/** Late niches for the counties filed before those crafts existed. */
export function supplementSweepSlice(offset: number, limit: number): BulkLeadInput[] {
  const total = supplementSweepTotal();
  const start = Math.max(0, Math.floor(offset));
  const end = Math.min(total, start + Math.max(0, Math.floor(limit)));
  const rows: BulkLeadInput[] = [];
  for (let index = start; index < end; index += 1) rows.push(supplementAt(index));
  return rows;
}

function supplementAt(index: number): BulkLeadInput {
  const place = SUPPLEMENT_PLACES[Math.floor(index / SUPPLEMENT_PER_COUNTY)];
  const within = index % SUPPLEMENT_PER_COUNTY;
  const filing = LATE_FILINGS[within % LATE_FILINGS.length];
  const copy = Math.floor(within / LATE_FILINGS.length) + 1;
  const first = FIRST[index % FIRST.length];
  const last = LAST[index % LAST.length];
  return {
    line: index + 2,
    name: `${first} ${last} ${filing.craft} ${place.state} niche ${copy}`,
    city: place.cities[within % place.cities.length],
    county: place.county,
    trade: filing.phrase,
    email: `sup${index}@sweep.example`,
    phone: `${place.areaCode}-555-${String(20000 + within).padStart(5, "0")}`,
    website: index % 3 === 0 ? "sweep.example" : "",
    phoneLine: index % 2 === 0 ? "mobile" : "landline",
  };
}

function sweepTotal(counties: readonly SweepCounty[]): number {
  return counties.length * SWEEP_PER_COUNTY;
}

function countyAt(counties: readonly SweepCounty[], offset: number): string {
  const total = sweepTotal(counties);
  if (total === 0) return "";
  const index = Math.min(Math.max(0, Math.floor(offset)), total - 1);
  return counties[Math.floor(index / SWEEP_PER_COUNTY)]?.county ?? "";
}

function sweepSlice(
  state: string,
  counties: readonly SweepCounty[],
  offset: number,
  limit: number,
  fillEmail = false,
): BulkLeadInput[] {
  const total = sweepTotal(counties);
  const start = Math.max(0, Math.floor(offset));
  const end = Math.min(total, start + Math.max(0, Math.floor(limit)));
  const rows: BulkLeadInput[] = [];
  for (let index = start; index < end; index += 1) rows.push(recordAt(state, counties, index, fillEmail));
  return rows;
}

function recordAt(state: string, counties: readonly SweepCounty[], index: number, fillEmail = false): BulkLeadInput {
  const countyIndex = Math.floor(index / SWEEP_PER_COUNTY);
  const within = index % SWEEP_PER_COUNTY;
  const place = counties[countyIndex];
  const filing = SWEEP_FILINGS[within % SWEEP_FILINGS.length];
  const copy = Math.floor(within / SWEEP_FILINGS.length) + 1;
  const first = FIRST[index % FIRST.length];
  const last = LAST[index % LAST.length];
  const sole = within % 7 === 0;
  return {
    line: index + 2,
    name: `${first} ${last} ${filing.craft} ${state} ${copy}`,
    city: place.cities[within % place.cities.length],
    county: place.county,
    trade: sole ? "Sole proprietor" : filing.phrase,
    email: fillEmail || index % 2 === 0 ? `${state.toLowerCase()}${index}@sweep.example` : "",
    phone: `${place.areaCode}-555-${String(within).padStart(5, "0")}`,
    website: index % 3 === 0 ? "sweep.example" : "",
    phoneLine: index % 2 === 0 ? "mobile" : "landline",
  };
}
