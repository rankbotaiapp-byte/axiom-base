import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_SHOP_BILLING,
  canSearchConsumerLeads,
  consumerLeadSearchSql,
  planConsumerLeadSearch,
  rejectConsumerSearchPayload,
} from "./consumer-leads-query.ts";
test("a nationwide consumer search is rejected before a query is planned", () => {
  assert.throws(
    () => rejectConsumerSearchPayload({ niche: "field", state: "OR", county: "Josephine", reach: "national" }),
    /radius/,
  );
  assert.throws(() => rejectConsumerSearchPayload({ niche: "creator", reach: "nationwide" }), /radius/);
  assert.throws(() => rejectConsumerSearchPayload({ niche: "field" }), /radius/);
  assert.throws(
    () =>
      rejectConsumerSearchPayload({
        niche: "field",
        state: "OR",
        county: "Josephine",
        zipCode: "97537",
        reach: "global",
      }),
    /radius/,
  );
  assert.throws(
    () => rejectConsumerSearchPayload({ niche: "field", state: "", county: "", zipCode: "", lat: 42.439, lng: -123.3289 }),
    /radius/,
  );
  assert.throws(() => rejectConsumerSearchPayload({ niche: "field", state: "OR" }), /radius/);
  assert.throws(() => rejectConsumerSearchPayload(null), /required/);
  assert.doesNotThrow(() => rejectConsumerSearchPayload({ niche: "field", zip_code: "97537" }));
  const zipPlan = planConsumerLeadSearch({ niche: "field", zip_code: "97537" });
  assert.equal(zipPlan.mode, "zip");
  assert.equal(zipPlan.zipCode, "97537");
  assert.equal(zipPlan.radiusMiles, 25);
  assert.throws(
    () => rejectConsumerSearchPayload({ niche: "field", zipCode: "97537", userId: "attacker", role: "admin" }),
    /session/,
  );
  assert.throws(
    () => rejectConsumerSearchPayload({ niche: "field", state: "OR", county: "Josephine", user_id: "attacker" }),
    /session/,
  );
  assert.doesNotThrow(() =>
    rejectConsumerSearchPayload({ niche: "field", state: "OR", county: "Josephine" }),
  );
});

const GRANTS_PASS = { lat: 42.439, lng: -123.3289 };

test("a field shop searches homeowner prospects on the consumer table", () => {
  const plan = planConsumerLeadSearch({
    niche: "field",
    state: "or",
    county: "Josephine County",
    zipCode: "97537",
    lat: GRANTS_PASS.lat,
    lng: GRANTS_PASS.lng,
  });
  assert.equal(plan.mode, "county-zip");
  assert.equal(plan.radiusMiles, 25);
  assert.equal(plan.homeownerStatus, "homeowner");
  assert.equal(plan.segment, "Homeowner field prospects within 25 miles of Josephine County, OR 97537");
  const { text, values } = consumerLeadSearchSql(plan);
  assert.match(text, /from consumer_leads/);
  assert.doesNotMatch(text, /preloaded_leads/);
  assert.match(text, /state = \$2/);
  assert.match(text, /lower\(county\) in \(lower\(\$3\), lower\(\$4\)\)/);
  assert.match(text, /zip_code = \$5/);
  assert.match(text, /homeowner_status = 'homeowner'/);
  assert.match(text, /active = true/);
  assert.match(text, /3958\.7613/);
  const filter = text.slice(text.lastIndexOf("where"));
  assert.match(filter, /m\.lat is not null/);
  assert.match(filter, /<= \$8::float8/);
  assert.deepEqual(values.slice(0, 5), ["field", "OR", "Josephine", "Josephine County", "97537"]);
});

test("a consumer search cannot go nationwide or carry a session field", () => {
  assert.throws(() => planConsumerLeadSearch({ niche: "field", reach: "national" }), /radius/);
  assert.throws(
    () => planConsumerLeadSearch({ niche: "field", state: "OR", county: "Josephine", role: "admin" }),
    /session/,
  );
  assert.throws(() => planConsumerLeadSearch({ niche: "field", userId: "attacker", zipCode: "97537" }), /session/);
  assert.throws(() => planConsumerLeadSearch({ niche: "field", zipCode: "97537", homeownerStatus: "renter" }), /homeowners/);
});

test("a tenant only sees residential prospects for their own shop niche", () => {
  assert.equal(canSearchConsumerLeads({ role: "owner", shopNiches: ["field"], niche: "field" }), true);
  assert.equal(canSearchConsumerLeads({ role: "employee", shopNiches: ["field"], niche: "field" }), true);
  assert.equal(canSearchConsumerLeads({ role: "owner", shopNiches: ["location"], niche: "field" }), false);
  assert.equal(canSearchConsumerLeads({ role: "customer", shopNiches: ["field"], niche: "field" }), false);
  assert.equal(canSearchConsumerLeads({ role: null, shopNiches: ["field"], niche: "field" }), false);
  assert.equal(canSearchConsumerLeads({ role: "platform_admin", shopNiches: [], niche: "field" }), true);
  assert.equal(canSearchConsumerLeads({ role: "admin", shopNiches: [], niche: "locksmith" }), true);
  assert.deepEqual(ACTIVE_SHOP_BILLING, ["active", "trialing"]);
});
