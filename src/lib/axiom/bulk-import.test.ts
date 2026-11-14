import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createLeadCsvReader, leadCsvChunks, parseLeadCsv, prepareBulkImport } from "./bulk-import.ts";

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
  assert.equal(plan.leads[0].tradeType, "landscaper");
});

test("a filing title is classified before it is staged", () => {
  const plan = prepareBulkImport([
    { name: "River Firewood", city: "Medford", county: "Jackson", trade: "Sole proprietor", line: 2 },
    { name: "Peak Lock", city: "Ashland", county: "Jackson", trade: "Self-employed", line: 3 },
    { name: "Ada Holt", city: "Medford", county: "Jackson", trade: "Drywall", line: 4 },
    { name: "Lane Handyman", city: "Grants Pass", county: "Josephine", trade: "Services", line: 5 },
  ]);
  assert.equal(plan.invalid.length, 0);
  assert.deepEqual(plan.leads.map((lead) => lead.tradeType), ["firewood", "locksmith", "contractor", "field"]);
});

test("a county sheet splits into batches of 1000 and keeps file line numbers", () => {
  const lines = ["Business,City,County,Niche"];
  for (let i = 0; i < 2500; i += 1) lines.push(`Shop ${i},Medford,Jackson,Tattoo shop`);
  const chunks = [...leadCsvChunks(lines.join("\n"))];
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 1000);
  assert.equal(chunks[1].length, 1000);
  assert.equal(chunks[2].length, 500);
  assert.equal(chunks[0][0].line, 2);
  assert.equal(chunks[2][499].line, 2501);
  assert.equal(chunks[2][499].name, "Shop 2499");
});

test("a quoted field can span two file slices", () => {
  const reader = createLeadCsvReader(10);
  const first = reader.push('Business,City,County,Niche\n"North');
  const second = reader.push(' Glass, LLC",Medford,Jackson,Tattoo shop\n');
  const tail = reader.finish();
  const rows = [...first.flat(), ...second.flat(), ...tail];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "North Glass, LLC");
  assert.equal(rows[0].city, "Medford");
  assert.equal(rows[0].line, 2);
});

test("an escaped quote at a slice boundary stays in the cell", () => {
  const reader = createLeadCsvReader(10);
  reader.push('Business,City,County,Niche\n"Say "');
  const rows = [...reader.push('"hello""",Medford,Jackson,Tattoo shop').flat(), ...reader.finish()];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Say "hello"');
});

test("the staging migration is present", () => {
  const sql = readFileSync(new URL("../../../migrations/0039_lead_staging.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists preloaded_leads_staging/i);
  assert.match(sql, /batch_id/);
  assert.match(sql, /preloaded_leads_staging_batch_slug_idx/);
});
