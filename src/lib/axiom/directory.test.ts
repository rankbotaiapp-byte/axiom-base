import assert from "node:assert/strict";
import test from "node:test";
import { classifyTrade, isTradeKey, nicheForLead, nicheLabel, sortLeads } from "./directory.ts";
import { leadHeroFor } from "./media.ts";

test("known directory labels stay on the built-in niche", () => {
  assert.deepEqual(classifyTrade("Barber"), { tradeType: "location", tradeLabel: "Barber", known: true });
  assert.deepEqual(classifyTrade("advisor"), { tradeType: "counsel", tradeLabel: "Advisor", known: true });
  assert.equal(classifyTrade("location").tradeType, "location");
});

test("a new local trade gets its own key and the universal hero", () => {
  const dog = classifyTrade("Dog walking");
  assert.equal(dog.tradeType, "dog-walking");
  assert.equal(dog.tradeLabel, "Dog walking");
  assert.equal(dog.known, false);
  assert.equal(isTradeKey(dog.tradeType), true);
  const hero = leadHeroFor(dog.tradeType, "Park Loop Walks", dog.tradeLabel);
  assert.equal(hero.heroImageUrl, "/media/heroes/trade.jpg");
  assert.equal(hero.introPreset, "zoomin");
  assert.equal(hero.heroBlendPercent, 58);
});

test("a named trade still uses its own still", () => {
  const hvac = classifyTrade("Rooftop HVAC");
  assert.equal(hvac.known, false);
  assert.equal(leadHeroFor(hvac.tradeType, "Acme Mechanical", hvac.tradeLabel).heroImageUrl, "/media/heroes/hvac.jpg");
  assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroImageUrl, "/media/heroes/hunting-guide.jpg");
  assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroVideoUrl, "/media/heroes/deer-hunting-guide.mp4");
  assert.equal(leadHeroFor("firewood", "Oak Cord", "Firewood").heroImageUrl, "/media/heroes/firewood.jpg");
});

test("a paid lead uses its niche template", () => {
  assert.equal(nicheForLead("tattoo", "Tattoo shop"), "tattoo");
  assert.equal(nicheForLead("barber", "Barber"), "location");
  assert.equal(nicheForLead("dog-walking", "Dog walking"), "trade");
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
