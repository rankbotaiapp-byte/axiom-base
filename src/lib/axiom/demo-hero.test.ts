import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_FIREWOOD_FILM, DEMO_LOCKSMITH_FILM, DEMO_TRAINER_FILM, demoHeroFilm } from "./demo-hero.ts";

test("demo films follow the niche, not a single trainer loop", () => {
  assert.equal(demoHeroFilm("fitness"), DEMO_TRAINER_FILM);
  assert.equal(demoHeroFilm("photo"), "/media/heroes/photographer.mp4");
  assert.equal(demoHeroFilm("contractor"), "/media/heroes/contractors-hero.mp4");
  assert.equal(demoHeroFilm("contractor", "Main Street Plumbing"), "/media/heroes/plumbers-hero.mp4.mp4");
  assert.equal(demoHeroFilm("locksmith"), DEMO_LOCKSMITH_FILM);
  assert.equal(demoHeroFilm("locksmith", "Peak Lock"), DEMO_LOCKSMITH_FILM);
  assert.equal(demoHeroFilm("firewood"), DEMO_FIREWOOD_FILM);
  assert.equal(demoHeroFilm("firewood", "Defensible space"), DEMO_FIREWOOD_FILM);
  assert.notEqual(demoHeroFilm("locksmith"), demoHeroFilm("fitness"));
  assert.notEqual(demoHeroFilm("locksmith"), demoHeroFilm("contractor"));
  assert.notEqual(demoHeroFilm("firewood"), demoHeroFilm("landscaper"));
  assert.equal(demoHeroFilm("landscaper"), "/media/heroes/landscaper.mp4");
  assert.equal(demoHeroFilm("therapy"), "/media/heroes/wellness.mp4");
  assert.notEqual(demoHeroFilm("therapy"), demoHeroFilm("trade"));
  assert.notEqual(demoHeroFilm("photo"), demoHeroFilm("fitness"));
});
