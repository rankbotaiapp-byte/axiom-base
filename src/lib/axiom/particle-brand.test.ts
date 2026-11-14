import assert from "node:assert/strict";
import test from "node:test";
import { coveredShare, createCover, particleStudioModel, revealStroke, twoWordBrand } from "./particle-brand.ts";

test("the branding engine keeps two words from the shop name", () => {
  assert.deepEqual(twoWordBrand("North Frame", "Northline Repair"), {
    first: "North",
    second: "Frame",
    line: "North Frame",
  });
  assert.equal(twoWordBrand("The Glass Eddy Shop", "Glass Eddy").line, "Glass Eddy");
  assert.equal(twoWordBrand("Axiom", "Northline Repair").line, "Axiom Repair");
});

test("a niche studio reads a hero film from public/media/heroes", () => {
  const field = particleStudioModel({
    business: "North Frame",
    defaultName: "Northline Repair",
    heroVideoUrl: "/media/heroes/auto-hero.mp4",
    heroImageUrl: "",
    staffFront: "/media/alex-morgan.jpg",
    staffBack: "/media/willa-grant.jpg",
    filmLabel: "Field loop",
  });
  assert.equal(field.line, "North Frame");
  assert.equal(field.heroKind, "video");
  assert.equal(field.heroUrl, "/media/heroes/auto-hero.mp4");
  assert.notEqual(field.staffFront, field.staffBack);

  const quiet = particleStudioModel({
    defaultName: "Lane Practice",
    heroVideoUrl: "https://example.test/nope.mp4",
    heroImageUrl: "/media/heroes/practice.jpg",
    staffFront: "/media/alex-morgan.jpg",
    staffBack: "/media/willa-grant.jpg",
    filmLabel: "Practice still",
  });
  assert.equal(quiet.line, "Lane Practice");
  assert.equal(quiet.heroKind, "image");
  assert.equal(quiet.heroUrl, "/media/heroes/practice.jpg");
});

test("a wide swipe clears more of the cover than a tap", () => {
  const tap = createCover(40, 24);
  const swipe = createCover(40, 24);
  revealStroke(tap, 40, 24, 20, 12, 1.2);
  revealStroke(swipe, 40, 24, 20, 12, 6);
  assert.ok(coveredShare(tap) - coveredShare(swipe) > 0.05);
  assert.ok(coveredShare(tap) > 0.9);
});
