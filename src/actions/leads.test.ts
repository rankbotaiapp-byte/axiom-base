import assert from "node:assert/strict";
import test from "node:test";
import { isLeadReader, leadSearchSql, leadWithinRadius, milesBetween, planLeadSearch } from "./leads-query.ts";

const GRANTS_PASS = { lat: 42.439, lng: -123.3289 };
const PORTLAND = { lat: 45.5152, lng: -122.6784 };

test("a field search in Josephine County uses both indexes and a mile radius", () => {
  const plan = planLeadSearch({
    niche: "field",
    state: "or",
    county: "Josephine County",
    zipCode: "97537",
    radiusMiles: 25,
    lat: GRANTS_PASS.lat,
    lng: GRANTS_PASS.lng,
  });
  assert.equal(plan.reach, "local");
  assert.equal(plan.mode, "county-zip");
  assert.equal(plan.state, "OR");
  assert.deepEqual(plan.counties, ["Josephine", "Josephine County"]);
  assert.equal(plan.zipCode, "97537");
  assert.equal(plan.segment, "Active field leads within 25 miles of Josephine County, OR 97537");
  const { text, values } = leadSearchSql(plan);
  assert.match(text, /state = \$2/);
  assert.match(text, /lower\(county\) in \(lower\(\$3\), lower\(\$4\)\)/);
  assert.match(text, /zip_code = \$5/);
  assert.match(text, /3958\.7613/);
  const filter = text.slice(text.lastIndexOf("where"));
  assert.match(filter, /m\.lat is not null/);
  assert.match(filter, /m\.lng is not null/);
  assert.match(filter, /<= \$8::float8/);
  assert.doesNotMatch(filter, /o\.lat is null/);
  assert.deepEqual(values.slice(0, 5), ["field", "OR", "Josephine", "Josephine County", "97537"]);
});

test("a ZIP-only local search does not constrain state or county", () => {
  const plan = planLeadSearch({ niche: "locksmith", zipCode: "97537" });
  assert.equal(plan.mode, "zip");
  assert.equal(plan.radiusMiles, 25);
  const { text } = leadSearchSql(plan);
  assert.match(text, /zip_code = \$2/);
  assert.doesNotMatch(text, /state = /);
  assert.doesNotMatch(text, /lower\(county\)/);
});

test("a nationwide digital niche ignores geography", () => {
  const plan = planLeadSearch({
    niche: "prompt",
    state: "OR",
    county: "Josephine",
    zipCode: "97537",
    lat: GRANTS_PASS.lat,
    lng: GRANTS_PASS.lng,
    radiusMiles: 10,
  });
  assert.equal(plan.reach, "national");
  assert.equal(plan.mode, "national");
  assert.equal(plan.segment, "Active prompt leads nationwide");
  const { text, values } = leadSearchSql(plan);
  const filter = text.slice(text.toLowerCase().indexOf("where"));
  assert.match(filter, /niche = \$1/);
  assert.doesNotMatch(filter, /zip_code|state = |3958\.7613|lower\(county\)/);
  assert.deepEqual(values, ["prompt", 50]);
});

test("an explicit national reach skips the map for a local trade", () => {
  const plan = planLeadSearch({ niche: "field", reach: "national", county: "Josephine" });
  assert.equal(plan.reach, "national");
  assert.equal(leadSearchSql(plan).values[0], "field");
});

test("a local niche without a place is rejected", () => {
  assert.throws(() => planLeadSearch({ niche: "field" }), /state and county, or a ZIP code/);
  assert.throws(() => planLeadSearch({ niche: "field", county: "Josephine" }), /county search needs a state/);
  assert.throws(() => planLeadSearch({ niche: "creator", reach: "local" }), /state and county, or a ZIP code/);
});

test("a search payload cannot supply a user id or a role", () => {
  assert.throws(
    () => planLeadSearch({ niche: "prompt", role: "platform_admin" }),
    /session/,
  );
  assert.throws(
    () => planLeadSearch({ niche: "field", state: "OR", county: "Josephine", userId: "attacker" }),
    /session/,
  );
  assert.throws(
    () => planLeadSearch({ niche: "studio", user_id: "attacker", profileRole: "admin" }),
    /session/,
  );
});

test("only owner, employee, admin, or platform_admin profiles can read leads", () => {
  assert.equal(isLeadReader("owner"), true);
  assert.equal(isLeadReader("employee"), true);
  assert.equal(isLeadReader("admin"), true);
  assert.equal(isLeadReader("platform_admin"), true);
  assert.equal(isLeadReader("customer"), false);
  assert.equal(isLeadReader(null), false);
  assert.equal(isLeadReader(""), false);
});

test("a local lead outside the radius or without a point is dropped", () => {
  assert.equal(leadWithinRadius(24.9, 25), true);
  assert.equal(leadWithinRadius(25, 25), true);
  assert.equal(leadWithinRadius(25.1, 25), false);
  assert.equal(leadWithinRadius(null, 25), false);
});

test("Grants Pass to itself is zero and Portland is outside a county radius", () => {
  assert.equal(milesBetween(GRANTS_PASS.lat, GRANTS_PASS.lng, GRANTS_PASS.lat, GRANTS_PASS.lng), 0);
  const nearby = milesBetween(GRANTS_PASS.lat, GRANTS_PASS.lng, GRANTS_PASS.lat + 0.145, GRANTS_PASS.lng);
  assert.ok(nearby > 9 && nearby < 11, `expected about 10 miles, got ${nearby}`);
  const portland = milesBetween(GRANTS_PASS.lat, GRANTS_PASS.lng, PORTLAND.lat, PORTLAND.lng);
  assert.ok(portland > 150, `expected Portland well outside 25 miles, got ${portland}`);
});
