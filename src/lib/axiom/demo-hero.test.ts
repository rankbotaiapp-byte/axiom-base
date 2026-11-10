import assert from "node:assert/strict";
import test from "node:test";
import { tradeLoopUrl } from "../../config/catalog.ts";
import { DEMO_FIREWOOD_FILM, DEMO_LOCKSMITH_FILM, DEMO_TRAINER_FILM, demoHeroFilm } from "./demo-hero.ts";

test("demo films use root *-hero-animation.mp4 loops", () => {
  assert.equal(demoHeroFilm("fitness"), DEMO_TRAINER_FILM);
  assert.equal(demoHeroFilm("photo"), tradeLoopUrl("glasswork"));
  assert.equal(demoHeroFilm("contractor"), tradeLoopUrl("contractor"));
  assert.equal(demoHeroFilm("contractor", "Main Street Plumbing"), tradeLoopUrl("plumbing"));
  assert.equal(demoHeroFilm("locksmith"), DEMO_LOCKSMITH_FILM);
  assert.equal(demoHeroFilm("firewood"), DEMO_FIREWOOD_FILM);
  assert.notEqual(demoHeroFilm("locksmith"), demoHeroFilm("fitness"));
  assert.equal(demoHeroFilm("landscaper"), tradeLoopUrl("landscaping"));
});
