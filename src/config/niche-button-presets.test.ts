import assert from "node:assert/strict";
import test from "node:test";
import { nicheHeroButtons } from "./niche-button-presets.ts";

test("niche presets stay on the outer edges", () => {
  const barber = nicheHeroButtons("barber");
  assert.equal(barber[0]?.label, "Book Fade & Trim");
  assert.equal(barber[0]?.response, "modal");
  assert.equal(barber[0]?.clickAnimation, "morph-success");
  assert.equal(barber[1]?.label, "View Cut Gallery");
  assert.equal(barber[1]?.response, "scrollTo");
  assert.equal(barber[1]?.clickAnimation, "ripple-shockwave");

  const field = nicheHeroButtons("contractor", { phone: "5415550100" });
  assert.equal(field[0]?.label, "Request Free Estimate");
  assert.equal(field[1]?.label, "Call Direct");
  assert.equal(field[1]?.href, "tel:5415550100");
  assert.equal(field[1]?.clickAnimation, "pulse-glow");

  const land = nicheHeroButtons("landscaping");
  assert.equal(land[0]?.label, "Get Instant Quote");
  assert.equal(land[1]?.label, "Explore Services");
  assert.equal(land[1]?.clickAnimation, "ripple-shockwave");
  assert.ok(land.every((button) => button.x <= 12 || button.x >= 88));
  assert.ok(land.every((button) => button.y < 30));
});
