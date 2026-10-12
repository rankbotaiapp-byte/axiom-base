import assert from "node:assert/strict";
import test from "node:test";
import { classifyFiling } from "./directory.ts";
import {
  OREGON_COUNTIES,
  SWEEP_PER_COUNTY,
  FLORIDA_HUB_COUNTIES,
  TEXAS_HUB_COUNTIES,
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
});
