import assert from "node:assert/strict";
import test from "node:test";
import { classifyTrade } from "./directory.ts";
import { isEmailReady, isLeadSlug, isSmsReady, leadChannelTags } from "./funnel.ts";
import { leadHeroFor } from "./media.ts";
import {
  HOME_REGION_CITIES,
  HOME_REGION_COPIES,
  HOME_REGION_COUNTIES,
  HOME_REGION_LABEL,
  REGIONAL_VERTICALS,
  homeRegionLeads,
} from "./regional-roster.ts";
import { SHOP_NICHES } from "./types.ts";

test("the southern oregon roster loads a large mixed set in the named cities", () => {
  const leads = homeRegionLeads();
  const cityCount = HOME_REGION_COUNTIES.reduce((sum, county) => sum + HOME_REGION_CITIES[county].length, 0);
  assert.equal(HOME_REGION_LABEL, "Southern Oregon");
  assert.ok(leads.length > 1000);
  assert.equal(leads.length, cityCount * REGIONAL_VERTICALS.length * HOME_REGION_COPIES);
  assert.ok(HOME_REGION_COPIES > 2);

  for (const county of HOME_REGION_COUNTIES) {
    const rows = leads.filter((lead) => lead.county === county);
    const allowed = HOME_REGION_CITIES[county];
    assert.equal(rows.length, allowed.length * REGIONAL_VERTICALS.length * HOME_REGION_COPIES);
    for (const lead of rows) assert.ok(allowed.includes(lead.city), `${lead.city} is not in ${county}`);
    for (const city of allowed) {
      assert.ok(rows.some((lead) => lead.city === city));
    }
    const tags = rows.map((lead) => leadChannelTags(lead).join("|"));
    assert.ok(tags.some((tag) => tag === "SMS-ready"));
    assert.ok(tags.some((tag) => tag === "Email-ready"));
    assert.ok(tags.some((tag) => tag === "SMS-ready|Email-ready"));
    assert.ok(tags.some((tag) => tag === "No channel"));
  }

  const slugs = leads.map((lead) => lead.leadSlug);
  assert.equal(new Set(slugs).size, slugs.length);
  const phones = leads.map((lead) => lead.contactPhone);
  assert.equal(new Set(phones).size, phones.length);

  const niches = new Set<string>();
  for (const lead of leads) {
    assert.equal(isLeadSlug(lead.leadSlug), true);
    assert.ok(lead.contactName.length > 1);
    assert.ok(lead.reviewCount > 0);
    assert.ok(lead.reviewScore >= 0 && lead.reviewScore <= 5);
    assert.ok(lead.phoneLine === "mobile" || lead.phoneLine === "landline");
    assert.match(lead.contactPhone, /^541-555-\d{4}$/);
    assert.equal(isSmsReady(lead.phoneLine), lead.phoneLine === "mobile");
    if (lead.hasWebsite) assert.equal(isEmailReady(lead.contactEmail), true);
    else assert.equal(lead.contactEmail, "");
    niches.add(classifyTrade(lead.tradeType).tradeType);
  }
  assert.ok(niches.has("plumbing") || niches.has("contractor"));
  assert.equal(niches.has("practice"), false);
  assert.equal(niches.has("counsel"), false);
  assert.equal(REGIONAL_VERTICALS.some((row) => /clinic|practice|advisor|counsel/i.test(row.category)), false);
  assert.ok(niches.has("forestry") || niches.has("firewood"));
  assert.equal(classifyTrade("HVAC").tradeType, "hvac");
  assert.equal(classifyTrade("Plumbing").tradeType, "plumbing");
  assert.equal(classifyTrade("Electrical").tradeType, "electrical");
  assert.equal(classifyTrade("Dog walking").tradeType, "canine");
  assert.equal(classifyTrade("Auto detailing").tradeType, "auto");
  assert.equal(classifyTrade("Landscaper").tradeType, "landscaping");
  assert.ok(niches.has("house-sitting"));
  assert.ok(niches.has("personal-chef"));

  function heroFor(category: string) {
    const want = classifyTrade(category).tradeType;
    const lead = leads.find(
      (row) =>
        row.tradeType === category ||
        classifyTrade(row.tradeType).tradeType === want ||
        row.tradeLabel === category,
    );
    if (!lead) throw new Error(`missing ${category}`);
    const classified = classifyTrade(lead.tradeType);
    return leadHeroFor(classified.tradeType, lead.businessName, classified.tradeLabel);
  }

  for (const category of [
    "Guide services",
    "Photography",
    "Barber",
    "Hair salon",
    "HVAC",
    "Plumbing",
    "Custom bow technician",
    "Private security",
    "Landscaper",
    "Air conditioning",
    "Dog walking",
    "Auto detailing",
    "Mobile mechanic",
  ]) {
    assert.match(heroFor(category).heroVideoUrl, /\.mp4$/, category);
  }
  assert.equal(classifyTrade("Custom bow technician").tradeType, "bow-tech");
  assert.equal(classifyTrade("Private security").tradeType, "security");
});
