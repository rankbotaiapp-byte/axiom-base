import assert from "node:assert/strict";
import test from "node:test";
import { isEmailReady, isLeadSlug } from "./funnel.ts";
import { HOME_REGION_COUNTIES, HOME_REGION_LABEL, homeRegionLeads } from "./regional-roster.ts";
import { SHOP_NICHES } from "./types.ts";

const CITIES: Record<(typeof HOME_REGION_COUNTIES)[number], string[]> = {
  "Jackson County": ["Medford", "Ashland", "Central Point", "Jacksonville", "Eagle Point", "Talent", "Phoenix", "White City", "Shady Cove"],
  "Josephine County": ["Grants Pass", "Cave Junction", "Merlin", "Wilderville", "Selma"],
  "Douglas County": ["Roseburg", "Winston", "Sutherlin", "Myrtle Creek", "Glide", "Canyonville"],
};

test("the southern oregon roster covers every trade in each county", () => {
  const leads = homeRegionLeads();
  assert.equal(HOME_REGION_LABEL, "Southern Oregon");
  assert.equal(leads.length, SHOP_NICHES.length * 2 * HOME_REGION_COUNTIES.length);
  assert.deepEqual(
    HOME_REGION_COUNTIES.map((county) => county),
    [...new Set(leads.map((lead) => lead.county))],
  );
  for (const county of HOME_REGION_COUNTIES) {
    const rows = leads.filter((lead) => lead.county === county);
    assert.equal(rows.length, SHOP_NICHES.length * 2);
    for (const niche of SHOP_NICHES) {
      assert.equal(rows.filter((lead) => lead.tradeType === niche).length, 2);
    }
    for (const lead of rows) {
      assert.ok(CITIES[county].includes(lead.city), `${lead.city} is not in ${county}`);
    }
  }
  assert.ok(leads.some((lead) => lead.city === "Medford" && lead.county === "Jackson County"));
  assert.ok(leads.some((lead) => lead.city === "Grants Pass" && lead.county === "Josephine County"));
  assert.ok(leads.some((lead) => lead.city === "Roseburg" && lead.county === "Douglas County"));
  const slugs = leads.map((lead) => lead.leadSlug);
  assert.equal(new Set(slugs).size, slugs.length);
  const phones = leads.map((lead) => lead.contactPhone);
  assert.equal(new Set(phones).size, phones.length);
  for (const lead of leads) {
    assert.equal(isLeadSlug(lead.leadSlug), true);
    assert.ok(lead.contactName.length > 1);
    assert.ok(lead.reviewCount > 0);
    assert.ok(lead.reviewScore >= 0 && lead.reviewScore <= 5);
    assert.equal(typeof lead.hasWebsite, "boolean");
    assert.ok(lead.phoneLine === "mobile" || lead.phoneLine === "landline");
    assert.match(lead.contactPhone, /^541-555-\d{4}$/);
    if (lead.hasWebsite) assert.equal(isEmailReady(lead.contactEmail), true);
    else assert.equal(lead.contactEmail, "");
  }
});
