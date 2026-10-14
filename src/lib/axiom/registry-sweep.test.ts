import assert from "node:assert/strict";
import test from "node:test";
import { classifyFiling } from "./directory.ts";
import {
  OREGON_COUNTIES,
  SWEEP_PER_COUNTY,
  CALIFORNIA_HUB_COUNTIES,
  CALIFORNIA_COUNTIES,
  PENNSYLVANIA_HUB_COUNTIES,
  PENNSYLVANIA_COUNTIES,
  NEW_YORK_HUB_COUNTIES,
  NEW_YORK_COUNTIES,
  TEXAS_HUB_COUNTIES,
  TEXAS_COUNTIES,
  FLORIDA_HUB_COUNTIES,
  FLORIDA_COUNTIES,
  ILLINOIS_HUB_COUNTIES,
  californiaSweepSlice,
  californiaSweepTotal,
  pennsylvaniaSweepSlice,
  pennsylvaniaSweepTotal,
  newYorkSweepSlice,
  newYorkSweepTotal,
  illinoisSweepSlice,
  illinoisSweepTotal,
  texasSweepSlice,
  texasSweepTotal,
  floridaSweepSlice,
  floridaSweepTotal,
  registryCountyAt,
  registrySweepSlice,
  registrySweepTotal,
} from "./registry-sweep.ts";
import { SHOP_NICHES } from "./types.ts";

test("a statewide sweep is addressed by county and does not build the whole state at once", () => {
  assert.equal(OREGON_COUNTIES.length, 36);
  assert.equal(TEXAS_HUB_COUNTIES.length, 6);
  assert.equal(FLORIDA_HUB_COUNTIES.length, 6);
  assert.equal(registrySweepTotal(), FLORIDA_HUB_COUNTIES.length * SWEEP_PER_COUNTY);
  assert.equal(SWEEP_PER_COUNTY >= 1000, true);
  const first = registrySweepSlice(0, 1000);
  assert.equal(first.length, 1000);
  assert.equal(first[0]?.county, "Miami-Dade County");
  assert.equal(first[0]?.city, "Miami");
  assert.match(first[0]?.name ?? "", /\bFL\b/);
  assert.match(first[0]?.phone ?? "", /^305-555-/);
  assert.equal(registrySweepSlice(SWEEP_PER_COUNTY, 1)[0]?.county, "Broward County");
  assert.equal(registryCountyAt(2 * SWEEP_PER_COUNTY), "Palm Beach County");
  assert.equal(registryCountyAt(3 * SWEEP_PER_COUNTY), "Hillsborough County");
  assert.equal(registryCountyAt(4 * SWEEP_PER_COUNTY), "Orange County");
  assert.equal(registryCountyAt(registrySweepTotal() - 1), "Duval County");
  assert.equal(registrySweepSlice(registrySweepTotal(), 10).length, 0);

  const county = registrySweepSlice(0, SWEEP_PER_COUNTY);
  const keys = county.map((row) => `${row.name}|${row.city}`);
  assert.equal(new Set(keys).size, keys.length);
  const phones = county.map((row) => row.phone);
  assert.equal(new Set(phones).size, phones.length);

  const niches = new Set(county.map((row) => classifyFiling(row.name ?? "", row.trade ?? "").tradeType));
  for (const niche of SHOP_NICHES) assert.ok(niches.has(niche), niche);
  assert.ok(niches.has("contractor"));
  assert.ok(niches.has("locksmith"));
  assert.ok(niches.has("firewood"));
  assert.ok(niches.has("field"));

  assert.equal(CALIFORNIA_COUNTIES.length, 58);
  assert.equal(californiaSweepTotal(), CALIFORNIA_COUNTIES.length * SWEEP_PER_COUNTY);
  assert.equal(CALIFORNIA_COUNTIES[0]?.county, "Los Angeles County");
  const california = californiaSweepSlice(0, 1000);
  assert.equal(california.length, 1000);
  assert.equal(california[0]?.county, "Los Angeles County");
  assert.equal(california[0]?.city, "Los Angeles");
  assert.match(california[0]?.name ?? "", /\bCA\b/);
  assert.match(california[0]?.phone ?? "", /^213-555-/);
  const californiaNiches = new Set(california.map((row) => classifyFiling(row.name ?? "", row.trade ?? "").tradeType));
  for (const niche of SHOP_NICHES) assert.ok(californiaNiches.has(niche), niche);
  assert.equal(californiaSweepSlice(californiaSweepTotal(), 10).length, 0);

  assert.equal(PENNSYLVANIA_COUNTIES.length, 67);
  assert.equal(pennsylvaniaSweepTotal(), PENNSYLVANIA_COUNTIES.length * SWEEP_PER_COUNTY);
  const pennsylvania = pennsylvaniaSweepSlice(0, 1000);
  assert.equal(pennsylvania[0]?.county, "Philadelphia County");
  assert.equal(pennsylvania[0]?.city, "Philadelphia");
  assert.match(pennsylvania[0]?.name ?? "", /\bPA\b/);
  assert.match(pennsylvania[0]?.phone ?? "", /^215-555-/);
  assert.ok(pennsylvania.every((row) => row.email && row.phone && row.city && row.county && row.name && row.trade));
  assert.equal(pennsylvaniaSweepSlice(2 * SWEEP_PER_COUNTY, 1)[0]?.county, "Montgomery County");
  assert.equal(pennsylvaniaSweepSlice(2 * SWEEP_PER_COUNTY, 1)[0]?.city, "Norristown");
  const pennsylvaniaNiches = new Set(pennsylvania.map((row) => classifyFiling(row.name ?? "", row.trade ?? "").tradeType));
  for (const niche of SHOP_NICHES) assert.ok(pennsylvaniaNiches.has(niche), niche);
  assert.equal(pennsylvaniaSweepSlice(pennsylvaniaSweepTotal(), 10).length, 0);

  assert.equal(NEW_YORK_COUNTIES.length, 62);
  assert.equal(newYorkSweepTotal(), NEW_YORK_COUNTIES.length * SWEEP_PER_COUNTY);
  const newYork = newYorkSweepSlice(0, 1000);
  assert.equal(newYork[0]?.county, "Kings County");
  assert.equal(newYork[0]?.city, "Brooklyn");
  assert.match(newYork[0]?.name ?? "", /\bNY\b/);
  assert.match(newYork[0]?.phone ?? "", /^718-555-/);
  assert.ok(newYork.every((row) => row.email && row.phone && row.city && row.county && row.name && row.trade));
  assert.equal(newYorkSweepSlice(SWEEP_PER_COUNTY, 1)[0]?.county, "Queens County");
  assert.equal(newYorkSweepSlice(SWEEP_PER_COUNTY, 1)[0]?.city, "Queens");
  assert.equal(newYorkSweepSlice(2 * SWEEP_PER_COUNTY, 1)[0]?.county, "New York County");
  assert.equal(newYorkSweepSlice(2 * SWEEP_PER_COUNTY, 1)[0]?.city, "Manhattan");
  assert.equal(newYorkSweepSlice(5 * SWEEP_PER_COUNTY, 1)[0]?.county, "Westchester County");
  assert.equal(newYorkSweepSlice(5 * SWEEP_PER_COUNTY, 1)[0]?.city, "White Plains");
  const newYorkNiches = new Set(newYork.map((row) => classifyFiling(row.name ?? "", row.trade ?? "").tradeType));
  for (const niche of SHOP_NICHES) assert.ok(newYorkNiches.has(niche), niche);
  assert.equal(newYorkSweepSlice(newYorkSweepTotal(), 10).length, 0);

  assert.equal(TEXAS_COUNTIES.length, 254);
  assert.equal(TEXAS_HUB_COUNTIES.length, 6);
  assert.equal(texasSweepTotal(), TEXAS_COUNTIES.length * SWEEP_PER_COUNTY);
  assert.equal(TEXAS_COUNTIES[0]?.county, "Harris County");
  assert.equal(texasSweepSlice(0, 1)[0]?.city, "Houston");
  assert.equal(texasSweepSlice(0, 1)[0]?.county, "Harris County");
  assert.ok(TEXAS_COUNTIES.some((row) => row.county === "Jefferson County, TX"));
  assert.equal(FLORIDA_COUNTIES.length, 67);
  assert.equal(floridaSweepTotal(), FLORIDA_COUNTIES.length * SWEEP_PER_COUNTY);
  assert.equal(FLORIDA_COUNTIES[4]?.county, "Orange County");
  assert.ok(FLORIDA_COUNTIES.some((row) => row.county === "Lake County, FL"));
  assert.ok(FLORIDA_COUNTIES.some((row) => row.county === "Nassau County, FL"));
  assert.ok(CALIFORNIA_COUNTIES.some((row) => row.county === "Kings County, CA"));
  assert.ok(NEW_YORK_COUNTIES.some((row) => row.county === "Orange County, NY"));
  assert.ok(NEW_YORK_COUNTIES.some((row) => row.county === "Bronx County"));
  assert.ok(NEW_YORK_COUNTIES.some((row) => row.county === "Richmond County" && row.cities[0] === "Staten Island"));
  assert.equal(texasSweepSlice(texasSweepTotal(), 10).length, 0);
  assert.equal(floridaSweepSlice(0, 1000).length, 1000);

  assert.equal(ILLINOIS_HUB_COUNTIES.length, 6);
  assert.equal(illinoisSweepTotal(), ILLINOIS_HUB_COUNTIES.length * SWEEP_PER_COUNTY);
  const illinois = illinoisSweepSlice(0, SWEEP_PER_COUNTY);
  assert.equal(illinois[0]?.county, "Cook County");
  assert.equal(illinois[0]?.city, "Chicago");
  assert.match(illinois[0]?.name ?? "", /\bIL\b/);
  assert.match(illinois[0]?.phone ?? "", /^312-555-/);
  assert.ok(illinois.every((row) => row.email && row.phone && row.city && row.county && row.name && row.trade));
  assert.equal(illinoisSweepSlice(2 * SWEEP_PER_COUNTY, 1)[0]?.county, "Lake County, IL");
  assert.equal(illinoisSweepSlice(2 * SWEEP_PER_COUNTY, 1)[0]?.city, "Waukegan");
  assert.equal(illinoisSweepSlice(4 * SWEEP_PER_COUNTY, 1)[0]?.county, "Kane County");
  assert.equal(illinoisSweepSlice(4 * SWEEP_PER_COUNTY, 1)[0]?.city, "Aurora");
  const illinoisNiches = new Set(illinois.map((row) => classifyFiling(row.name ?? "", row.trade ?? "").tradeType));
  for (const niche of SHOP_NICHES) assert.ok(illinoisNiches.has(niche), niche);
  assert.equal(illinoisSweepSlice(illinoisSweepTotal(), 10).length, 0);
});
