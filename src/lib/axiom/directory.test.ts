import assert from "node:assert/strict";
import test from "node:test";
import { classifyFiling, classifyTrade, isTradeKey, nicheForLead, nicheLabel, sortLeads } from "./directory.ts";
import { leadHeroFor } from "./media.ts";

test("known directory labels stay on the built-in niche", () => {
  assert.deepEqual(classifyTrade("Barber"), { tradeType: "barber", tradeLabel: "Barber", known: true });
  assert.equal(classifyTrade("advisor").tradeType, "advisor");
  assert.equal(classifyTrade("advisor").known, false);
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
  assert.equal(hero.introPreset, "kenburns");
  assert.equal(hero.heroBlendPercent, 60);
});

test("a named trade uses the contractor film, and legacy keys use the trade film", () => {
  const hvac = classifyTrade("Rooftop HVAC");
  assert.equal(hvac.known, true);
  assert.equal(hvac.tradeType, "hvac");
  const film = leadHeroFor(hvac.tradeType, "Acme Mechanical", hvac.tradeLabel);
  assert.match(film.heroVideoUrl, /\.mp4$/);
  assert.equal(leadHeroFor("hvac", "Acme Mechanical", "HVAC").heroVideoUrl, film.heroVideoUrl);
  const forestry = leadHeroFor("forestry", "Oak Cord", "Firewood");
  assert.match(forestry.heroVideoUrl, /\.mp4$/);
});

test("a paid lead uses its niche template", () => {
  assert.equal(nicheForLead("barber", "Barber"), "barber");
  assert.equal(nicheForLead("dog-walking", "Dog walking"), "canine");
  assert.equal(nicheForLead("auto-detailing", "Auto detailing"), "auto");
  assert.equal(nicheForLead("plumbing", "Plumbing"), "plumbing");
  assert.equal(nicheForLead("tattoo", "Tattoo shop"), "taxidermy");
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
  assert.equal(nicheLabel("barber"), "Barber");
  assert.equal(nicheLabel("dog-walking"), "Contractor");
});

test("registry titles map onto platform niches", () => {
  assert.equal(classifyTrade("Electrical").tradeType, "electrical");
  assert.equal(classifyTrade("Plumbing").tradeType, "plumbing");
  assert.equal(classifyTrade("Construction").tradeType, "contractor");
  assert.equal(classifyTrade("Firewood").tradeType, "forestry");
  assert.equal(classifyTrade("Forestry").tradeType, "forestry");
  assert.equal(classifyTrade("Services").tradeType, "contractor");
  assert.equal(classifyTrade("Sole proprietor").tradeType, "contractor");
  assert.equal(classifyTrade("Self-employed").tradeType, "contractor");
  assert.equal(classifyTrade("Dog walking").tradeType, "canine");
  assert.equal(classifyTrade("Auto detailing").tradeType, "auto");
  assert.equal(classifyTrade("Mobile detailer").tradeType, "auto");
  assert.equal(classifyTrade("Custom bow technician").tradeType, "bow-tech");
  assert.equal(classifyTrade("Block Concrete").tradeType, classifyTrade("Block Concrete").tradeType);
});

test("a sole proprietor title uses the business name when it names a craft", () => {
  assert.equal(classifyFiling("River Firewood", "Sole proprietor").tradeType, "contractor");
  assert.equal(classifyFiling("Peak Lock", "Self-employed").tradeType, "contractor");
  assert.equal(classifyFiling("Ada Holt", "Services").tradeType, "contractor");
  assert.equal(classifyFiling("Ada Holt", "Sole proprietor").tradeType, "contractor");
  assert.equal(classifyFiling("Holt Electric Services", "Business services").tradeType, "contractor");
});
