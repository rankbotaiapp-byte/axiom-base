import assert from "node:assert/strict";
import test from "node:test";
import { classifyFiling, classifyTrade, isTradeKey, nicheForLead, nicheLabel, sortLeads } from "./directory.ts";
import { leadHeroFor } from "./media.ts";

test("known directory labels stay on the built-in niche", () => {
  assert.deepEqual(classifyTrade("Barber"), { tradeType: "location", tradeLabel: "Barber", known: true });
  assert.deepEqual(classifyTrade("advisor"), { tradeType: "counsel", tradeLabel: "Advisor", known: true });
  assert.equal(classifyTrade("location").tradeType, "location");
});

test("a new local trade gets its own key and the universal hero", () => {
  const sitting = classifyTrade("House sitting");
  assert.equal(sitting.tradeType, "house-sitting");
  assert.equal(sitting.tradeLabel, "House sitting");
  assert.equal(sitting.known, false);
  assert.equal(isTradeKey(sitting.tradeType), true);
  const hero = leadHeroFor(sitting.tradeType, "Park Loop Walks", sitting.tradeLabel);
  assert.equal(hero.heroImageUrl, "");
  assert.equal(hero.introPreset, "zoomin");
  assert.equal(hero.heroBlendPercent, 58);
});

test("a named trade uses the contractor film, and legacy keys use the trade film", () => {
  const hvac = classifyTrade("Rooftop HVAC");
  assert.equal(hvac.known, true);
  assert.equal(hvac.tradeType, "contractor");
  assert.equal(hvac.tradeLabel, "Rooftop HVAC");
  assert.equal(leadHeroFor(hvac.tradeType, "Acme Mechanical", hvac.tradeLabel).heroVideoUrl, "/media/heroes/contractors-hero.mp4.mp4");
  assert.equal(leadHeroFor(hvac.tradeType, "Acme Mechanical", hvac.tradeLabel).heroImageUrl, "");
  assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroImageUrl, "");
  assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroVideoUrl, "/media/heroes/hunting-guide.mp4");
  assert.equal(leadHeroFor("outdoor-expeditions", "Ridge Outfitters", "Outdoor expeditions").heroVideoUrl, "/media/heroes/hunting-guide.mp4");
  assert.equal(leadHeroFor("firewood", "Oak Cord", "Firewood").heroImageUrl, "");
  assert.equal(leadHeroFor("firewood", "Oak Cord", "Firewood").heroVideoUrl, "/media/heroes/universal-fallback.mp4.mp4");
});

test("a paid lead uses its niche template", () => {
  assert.equal(nicheForLead("tattoo", "Tattoo shop"), "tattoo");
  assert.equal(nicheForLead("barber", "Barber"), "location");
  assert.equal(nicheForLead("dog-walking", "Dog walking"), "dogwalk");
  assert.equal(nicheForLead("auto-detailing", "Auto detailing"), "detailer");
  assert.equal(nicheForLead("atv-sports-rentals", "ATV sports rentals"), "trade");
});

test("leads sort by trade without losing rows", () => {
  const rows = sortLeads(
    [
      { businessName: "B", city: "Medford", tradeLabel: "Roofing" },
      { businessName: "A", city: "Ashland", tradeLabel: "Dog walking" },
    ],
    "trade",
  );
  assert.deepEqual(rows.map((row) => row.tradeLabel), ["Dog walking", "Roofing"]);
  assert.equal(nicheLabel("location"), "Barber");
  assert.equal(nicheLabel("dog-walking"), "dog walking");
});

test("registry titles map onto platform niches", () => {
  assert.equal(classifyTrade("Electrical").tradeType, "contractor");
  assert.equal(classifyTrade("Plumbing").tradeType, "contractor");
  assert.equal(classifyTrade("Drywall").tradeType, "contractor");
  assert.equal(classifyTrade("Framing").tradeType, "contractor");
  assert.equal(classifyTrade("Construction").tradeType, "contractor");
  assert.equal(classifyTrade("Firewood").tradeType, "firewood");
  assert.equal(classifyTrade("Lock Services").tradeType, "locksmith");
  assert.equal(classifyTrade("Handyman").tradeType, "field");
  assert.equal(classifyTrade("Mobile services").tradeType, "field");
  assert.equal(classifyTrade("Services").tradeType, "field");
  assert.equal(classifyTrade("Sole proprietor").tradeType, "trade");
  assert.equal(classifyTrade("Self-employed").tradeType, "trade");
  assert.equal(classifyTrade("Dog walking").tradeType, "dogwalk");
  assert.equal(classifyTrade("Auto detailing").tradeType, "detailer");
  assert.equal(classifyTrade("Mobile detailer").tradeType, "detailer");
  assert.equal(classifyTrade("Private hunting guide").tradeType, "hunting");
  assert.equal(classifyTrade("Physical therapy").tradeType, "therapy");
  assert.equal(classifyTrade("Custom bow technician").tradeType, "bowtech");
  assert.equal(classifyTrade("Clock Repair").tradeType, "clock-repair");
  assert.equal(classifyTrade("Block Concrete").tradeType, "contractor");
});

test("a sole proprietor title uses the business name when it names a craft", () => {
  assert.equal(classifyFiling("River Firewood", "Sole proprietor").tradeType, "firewood");
  assert.equal(classifyFiling("Peak Lock", "Self-employed").tradeType, "locksmith");
  assert.equal(classifyFiling("Ada Holt", "Services").tradeType, "field");
  assert.equal(classifyFiling("Ada Holt", "Sole proprietor").tradeType, "trade");
  assert.equal(classifyFiling("Holt Electric Services", "Business services").tradeType, "contractor");
});
