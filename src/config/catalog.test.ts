import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CATALOG,
  CATALOG_BY_ID,
  CATALOG_NICHES,
  DEDICATED_NICHE_LOOPS,
  FILM_FILE_ALIASES,
  NICHE_HERO_FILENAME,
  assertCatalogNiche,
  catalogByFilm,
  catalogCardSrc,
  catalogCardStill,
  catalogFilmUrl,
  defaultNicheFilm,
  tradeLoopUrl,
  isCatalogNiche,
  resolveCatalogNiche,
} from "./catalog.ts";

describe("verified 21-loop catalog", () => {
  it("lists twenty-one niches and matching on-disk films", () => {
    assert.equal(CATALOG.length, 23);
    assert.equal(CATALOG_NICHES.length, 23);
    const dir = fileURLToPath(new URL("../../public/media", import.meta.url));
    const dedicated = CATALOG.filter((row) => existsSync(join(dir, row.id, NICHE_HERO_FILENAME))).map((row) => row.id);
    assert.deepEqual([...DEDICATED_NICHE_LOOPS].sort(), [...dedicated].sort());
    for (const row of CATALOG) {
      const url = catalogFilmUrl(row.id);
      const relative = url.replace(/^\/media\//, "");
      assert.equal(existsSync(join(dir, relative)), true, url);
      assert.equal(isCatalogNiche(row.id), true);
    }
  });

  it("keys landing-card media by niche id, not catalog offset", () => {
    assert.equal(catalogCardSrc("hvac"), "/media/heroes/hvac.jpg");
    assert.equal(catalogCardSrc("roofing"), "/media/heroes/roofing.jpg");
    assert.equal(catalogCardSrc("landscaping"), "/media/heroes/landscaper.jpg");
    assert.equal(catalogCardSrc("power-sports"), "/media/heroes/snow-sports-lessons.jpg");
    assert.equal(catalogCardSrc("plumbing"), "/media/heroes/plumbing.jpg");
    assert.equal(catalogCardSrc("machining"), catalogFilmUrl("machining"));
    assert.equal(CATALOG_BY_ID.hvac.card, "/media/heroes/hvac.jpg");
    assert.equal(CATALOG_BY_ID.roofing.card, "/media/heroes/roofing.jpg");
    assert.equal(CATALOG_BY_ID.hvac.label, "HVAC");
    assert.equal(CATALOG_BY_ID.roofing.label, "Roofing");
    assert.equal("card" in CATALOG_BY_ID.machining, false);
    assert.equal(catalogCardStill("hvac"), "/media/heroes/hvac.jpg");
    assert.equal(catalogCardStill("roofing"), "/media/heroes/roofing.jpg");
    assert.equal(catalogCardStill("machining"), "");
    assert.equal(CATALOG_BY_ID.hvac.file, "cleaner-hero-animation.mp4");
    assert.equal(CATALOG_BY_ID.roofing.file, "tiger-hero-animation.mp4");
    assert.notEqual(catalogCardSrc("hvac"), catalogFilmUrl("hvac"));
    assert.notEqual(catalogCardSrc("roofing"), catalogFilmUrl("roofing"));
    const hvacIndex = CATALOG.findIndex((row) => row.id === "hvac");
    const roofingIndex = CATALOG.findIndex((row) => row.id === "roofing");
    assert.notEqual(catalogCardSrc(CATALOG[hvacIndex]!.id), catalogFilmUrl(CATALOG[roofingIndex]!.id));
  });

  it("maps the uploaded hero-animation loops onto the matching trades", () => {
    assert.equal(CATALOG_BY_ID.plumbing.file, "axiom-plumber-hero.mp4");
    assert.equal(tradeLoopUrl("plumbing"), "/media/axiom-plumber-hero.mp4");
    assert.equal(defaultNicheFilm("plumbing"), "/media/axiom-plumber-hero.mp4");
    assert.equal(catalogFilmUrl("water-systems"), "/media/otter-hero-animation.mp4");
    assert.equal(catalogByFilm("axio-plumber-hero.mp4")?.id, "plumbing");
    assert.equal(catalogByFilm("axiom-plumber-hero.mp4")?.id, "plumbing");
    assert.equal(catalogByFilm("emergency-plumbing-web-page.mp4")?.id, "plumbing");
    assert.equal(CATALOG_BY_ID["water-systems"].defaultName, "Abyssal Systems");
    assert.equal(CATALOG_BY_ID["water-systems"].file, "otter-hero-animation.mp4");
    assert.equal(CATALOG_BY_ID["water-systems"].fallback, "shark-hero-animation.mp4");
    assert.equal(catalogFilmUrl("fabrication"), "/media/shark-hero-animation.mp4");
    assert.equal(catalogFilmUrl("auto"), "/media/apex-launch-hero-animation.mp4");
    assert.equal(catalogFilmUrl("glasswork"), "/media/polar-bear-hero-animation.mp4");
    assert.equal(catalogFilmUrl("taxidermy"), "/media/shark-hero-animation.mp4");
    assert.equal(CATALOG_BY_ID.taxidermy.fallback, "raptor-hero-animation.mp4");
    assert.equal(CATALOG_BY_ID.machining.file, "welding-hero-animation.mp4");
    assert.equal(catalogFilmUrl("machining"), "/media/shark-hero-animation.mp4");
    assert.equal(catalogByFilm("shark-hero-animation.mp4")?.id, "water-systems");
    assert.equal(catalogByFilm("abyssal-hero-loop.mp4")?.id, "water-systems");
    assert.equal(resolveCatalogNiche("abyssal-hero"), "water-systems");
    assert.equal(resolveCatalogNiche("abyssal"), "water-systems");
    assert.equal(catalogFilmUrl("bow-tech"), "/media/shark-hero-animation.mp4");
    assert.equal(CATALOG_BY_ID.fabrication.file, "polar-bear-hero-animation.mp4");
    assert.equal(catalogFilmUrl("forestry"), "/media/leopard-hero-path.mp4");
    assert.equal(catalogFilmUrl("contractor"), "/media/leopard-hero-path.mp4");
    assert.equal(catalogByFilm("charging-bear-hero-animation.mp4")?.id, "contractor");
    assert.equal(catalogFilmUrl("electrical"), "/media/otter-hero-animation.mp4");
    assert.equal(catalogFilmUrl("power-sports"), "/media/leopard-hero-path.mp4");
    assert.equal(CATALOG_BY_ID["power-sports"].label, "Outdoor sports lessons");
    assert.equal(resolveCatalogNiche("outdoor-sports-lessons"), "power-sports");
    assert.equal(catalogByFilm("boarding-lessons-hero-animation.mp4")?.id, "power-sports");
    assert.equal(catalogByFilm("raptor-hero-animation.mp4")?.id, "security");
    assert.equal(catalogByFilm("taxidermy-her-animation.mp4")?.id, "taxidermy");
    assert.equal(catalogByFilm("infrastructure-hero-animation.mp4")?.id, "contractor");
    assert.equal(catalogByFilm("locksmith-hero-animation.mp4")?.id, "electrical");
    assert.equal(catalogByFilm("welding-hero-animation.mp4")?.id, "machining");
    assert.equal(catalogFilmUrl("personal-trainer"), "/media/polar-bear-hero-animation.mp4");
    assert.equal(catalogFilmUrl("beauty-salon"), "/media/polar-bear-hero-animation.mp4");
    assert.equal(catalogByFilm("physical-trainer-hero-animation.mp4")?.id, "personal-trainer");
    assert.equal(catalogByFilm("silver-orb-hero-animation.mp4")?.id, "beauty-salon");
    assert.equal(resolveCatalogNiche("fitness"), "personal-trainer");
    assert.equal(resolveCatalogNiche("salon"), "beauty-salon");
    assert.equal(resolveCatalogNiche("beauty"), "beauty-salon");
    assert.equal(catalogByFilm("auto-tuning-hero-animation.mp4")?.id, "auto");
    assert.equal(catalogByFilm("personal-protectio-hero-animation.mp4")?.id, "security");
    assert.equal(catalogFilmUrl("security"), "/media/shark-hero-animation.mp4");
    assert.equal(resolveCatalogNiche("protection"), "security");
    assert.equal(catalogByFilm("content-cretion-hero-animation.mp4")?.id, "glasswork");
    assert.equal(FILM_FILE_ALIASES["underwater-leopard-hero-animation.mp4"], "taxidermy");
    assert.equal(FILM_FILE_ALIASES["snowleopard-hero-animation.mp4"], "machining");
    assert.equal(resolveCatalogNiche("river"), "water-systems");
    assert.equal(resolveCatalogNiche("saas"), "fabrication");
    assert.equal(resolveCatalogNiche("marine"), "water-systems");
  });

  it("rejects legacy wellness niches and remaps them", () => {
    assert.equal(isCatalogNiche("fitness"), false);
    assert.equal(isCatalogNiche("wellness"), false);
    assert.equal(isCatalogNiche("salon"), false);
    assert.equal(isCatalogNiche("beauty"), false);
    assert.equal(resolveCatalogNiche("fitness"), "personal-trainer");
    assert.equal(resolveCatalogNiche("salon"), "beauty-salon");
    assert.equal(resolveCatalogNiche("beauty"), "beauty-salon");
    assert.equal(resolveCatalogNiche("wellness"), "woodworking");
    assert.equal(assertCatalogNiche("plumbing"), "plumbing");
    assert.throws(() => assertCatalogNiche("massage"), /Unknown catalog niche/);
  });
});
