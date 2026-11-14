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
  for (const niche of SHOP_NICHES) {
    if (niche === "trade" || niche === "practice" || niche === "counsel") continue;
    assert.ok(niches.has(niche), niche);
  }
  assert.equal(niches.has("practice"), false);
  assert.equal(niches.has("counsel"), false);
  assert.equal(REGIONAL_VERTICALS.some((row) => /clinic|practice|advisor|counsel/i.test(row.category)), false);
  assert.ok(niches.has("firewood"));
  assert.equal(classifyTrade("HVAC").tradeType, "contractor");
  assert.equal(classifyTrade("Plumbing").tradeType, "contractor");
  assert.equal(classifyTrade("Electrical").tradeType, "contractor");
  assert.equal(classifyTrade("Dog walking").tradeType, "dogwalk");
  assert.equal(classifyTrade("Auto detailing").tradeType, "detailer");
  assert.equal(classifyTrade("Mobile food truck").tradeType, "foodtruck");
  assert.equal(classifyTrade("Landscaper").tradeType, "landscaper");
  assert.ok(niches.has("house-sitting"));
  assert.ok(niches.has("personal-chef"));

  function heroFor(category: string) {
    const lead = leads.find((row) => row.tradeType === category);
    if (!lead) throw new Error(`missing ${category}`);
    const classified = classifyTrade(lead.tradeType);
    return leadHeroFor(classified.tradeType, lead.businessName, classified.tradeLabel);
  }

  assert.equal(heroFor("Guide services").heroVideoUrl, "/media/heroes/guide.mp4");
  assert.equal(heroFor("Photography").heroVideoUrl, "/media/heroes/wildlife-photographer.mp4");
  assert.equal(heroFor("Photography").heroVideos.length, 3);
  assert.equal(heroFor("Barber").heroVideoUrl, "/media/heroes/barber-hero.mp4");
  assert.equal(heroFor("Hair salon").heroImageUrl, "");
  assert.equal(heroFor("Hair salon").heroVideoUrl, "/media/heroes/salon.mp4");
  assert.equal(heroFor("HVAC").heroImageUrl, "");
  assert.equal(heroFor("HVAC").heroVideoUrl, "/media/heroes/contractors-hero.mp4");
  assert.equal(heroFor("Plumbing").heroVideoUrl, "/media/heroes/plumbers-hero.mp4.mp4");
  assert.equal(heroFor("Hunting guide").heroImageUrl, "");
  assert.equal(heroFor("Hunting guide").heroVideoUrl, "/media/heroes/hunting-guide.mp4");
  assert.equal(heroFor("Physical therapy").heroVideoUrl, "/media/heroes/wellness.mp4");
  assert.equal(classifyTrade("Physical therapy").tradeType, "therapy");
  assert.equal(classifyTrade("Hunting guide").tradeType, "hunting");
  assert.equal(classifyTrade("Custom bow technician").tradeType, "bowtech");
  assert.equal(heroFor("Custom bow technician").heroVideoUrl, "/media/heroes/custom-bow-tech-hero.mp4.mp4");
  assert.equal(heroFor("Private security").heroVideoUrl, "/media/heroes/private-security.mp4");
  assert.equal(heroFor("Mobile food truck").heroVideoUrl, "/media/heroes/mobile-foodtruck.mp4");
  assert.equal(heroFor("Landscaper").heroVideoUrl, "/media/heroes/landscaper.mp4");
  assert.equal(heroFor("Air conditioning").heroImageUrl, "");
  assert.equal(heroFor("Air conditioning").heroVideoUrl, "/media/heroes/contractors-hero.mp4");
  assert.equal(heroFor("Dog walking").heroImageUrl, "");
  assert.equal(heroFor("Dog walking").heroVideoUrl, "/media/heroes/dogwalking.mp4");
  assert.equal(heroFor("Auto detailing").heroVideoUrl, "/media/heroes/mobile-detailer.mp4");
  assert.equal(heroFor("Mobile mechanic").heroVideoUrl, "/media/heroes/auto-repair.mp4");
  assert.equal(heroFor("Firewood").heroVideoUrl, "/media/heroes/firewood-hero.mp4");
});
