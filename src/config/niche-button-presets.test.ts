import assert from "node:assert/strict";
import test from "node:test";
import { deepSeaHeroButtons, nicheHeroButtons, studioDefaultButtons } from "./niche-button-presets.ts";

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
  assert.equal(land[0]?.label, "Book a Site Visit");
  assert.equal(land[1]?.label, "View Grounds Work");
  assert.equal(land[1]?.clickAnimation, "particle-burst");
  assert.ok(land.every((button) => button.x <= 12 || button.x >= 88));
  assert.ok(land.every((button) => button.y < 30));

  const raft = nicheHeroButtons("rafting", { bookHref: "/river/book" });
  assert.equal(raft[0]?.label, "Book a Trip");
  assert.equal(raft[0]?.href, "/river/book");
  assert.equal(nicheHeroButtons("auto_repair")[0]?.label, "Book the Bay");
  assert.equal(nicheHeroButtons("cleaning")[0]?.label, "Book a Clean");

  const sea = deepSeaHeroButtons({ bookHref: "/reef/book", phone: "5415550100", mapsUrl: "https://maps.example/reef" });
  assert.equal(sea.length, 4);
  assert.equal(sea[0]?.label, "Book Now");
  assert.equal(sea[0]?.href, "/reef/book");
  assert.equal(sea[1]?.label, "Call Now");
  assert.equal(sea[1]?.href, "tel:5415550100");
  assert.equal(sea[2]?.label, "Directions");
  assert.equal(sea[2]?.href, "https://maps.example/reef");
  assert.equal(sea[3]?.label, "Instant Quote");
  assert.ok(sea.every((button) => button.x <= 12 || button.x >= 88));

  const fromShark = studioDefaultButtons("barber", "/media/shark-hero-animation.mp4", "/reef/book");
  assert.equal(fromShark.length, 4);
  assert.equal(fromShark[0]?.label, "Book Now");
  assert.equal(fromShark[3]?.label, "Instant Quote");
  const fromWater = studioDefaultButtons("water-systems", "/media/otter-hero-animation.mp4", "/abyss/book");
  assert.equal(fromWater[0]?.label, "Book Now");
  assert.equal(fromWater[3]?.label, "Instant Quote");
  const fromAbyssalAlias = studioDefaultButtons("abyssal-hero", "", "/abyss/book");
  assert.equal(fromAbyssalAlias[0]?.label, "Book Now");
  const fromBarber = studioDefaultButtons("barber", "/media/barber-hero-animation.mp4");
  assert.equal(fromBarber[0]?.label, "Book Fade & Trim");
});
