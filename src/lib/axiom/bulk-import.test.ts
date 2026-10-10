import assert from "node:assert/strict";
import test from "node:test";
import { parseLeadCsv, prepareBulkImport } from "./bulk-import.ts";

test("csv headers map onto lead fields and quotes survive", () => {
  const leads = parseLeadCsv(
    'Business,City,County,Niche,Email,Phone,Website\n"North Glass, LLC",Medford,Jackson County,Tattoo shop,desk@north.test,541-555-0100,https://north.test\n',
  );
  const plan = prepareBulkImport(leads);
  assert.equal(plan.invalid.length, 0);
  assert.equal(plan.leads.length, 1);
  const lead = plan.leads[0];
  assert.equal(lead.businessName, "North Glass, LLC");
  assert.equal(lead.city, "Medford");
  assert.equal(lead.county, "Jackson County");
  assert.equal(lead.tradeType, "tattoo");
  assert.equal(lead.contactEmail, "desk@north.test");
  assert.equal(lead.contactPhone, "541-555-0100");
  assert.equal(lead.website, "https://north.test");
  assert.equal(lead.hasWebsite, true);
  assert.equal(lead.leadSlug, "north-glass-llc-medford");
});

test("a repeated business keeps one slug and fills a blank email", () => {
  const plan = prepareBulkImport([
    { name: "North Glass", city: "Medford", county: "Jackson", trade: "Tattoo shop", phone: "5415550100", line: 2 },
    { name: "North Glass", city: "Medford", county: "Jackson", niche: "tattoo", email: "desk@north.test", line: 3 },
  ]);
  assert.equal(plan.merged, 1);
  assert.equal(plan.leads.length, 1);
  assert.equal(plan.leads[0].contactEmail, "desk@north.test");
  assert.equal(plan.leads[0].contactPhone, "5415550100");
  assert.equal(plan.leads[0].tradeType, "tattoo");
});

test("a broken row is reported and the rest stay", () => {
  const plan = prepareBulkImport([
    { name: "A", city: "Medford", trade: "HVAC", line: 2 },
    { name: "Oak Lawn", city: "Ashland", county: "Jackson", trade: "Landscaping", email: "not-an-email", line: 3 },
    { name: "Oak Lawn", city: "Ashland", county: "Jackson", trade: "Landscaping", website: "oak.example", line: 4 },
  ]);
  assert.equal(plan.invalid.length, 2);
  assert.equal(plan.invalid[0].reason, "Business name is required");
  assert.equal(plan.invalid[1].reason, "Email is not usable");
  assert.equal(plan.leads.length, 1);
  assert.equal(plan.leads[0].hasWebsite, true);
  assert.equal(plan.leads[0].website, "oak.example");
  assert.equal(plan.leads[0].tradeType, "landscaping");
});
