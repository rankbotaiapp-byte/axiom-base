import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CATALOG,
  CATALOG_BY_ID,
  CATALOG_NICHES,
  assertCatalogNiche,
  catalogCardSrc,
  catalogCardStill,
  catalogFilmUrl,
  isCatalogNiche,
  resolveCatalogNiche,
} from "./catalog.ts";

describe("verified 21-loop catalog", () => {
  it("lists twenty-one niches and matching on-disk films", () => {
    assert.equal(CATALOG.length, 21);
    assert.equal(CATALOG_NICHES.length, 21);
    const dir = fileURLToPath(new URL("../../public/media", import.meta.url));
    const onDisk = new Set(
      readdirSync(dir).filter((name) => /^[a-z0-9]+(?:-[a-z0-9]+)*-hero-animation\.mp4$/i.test(name)),
    );
    for (const row of CATALOG) {
      assert.equal(onDisk.has(row.file), true, row.file);
      assert.equal(catalogFilmUrl(row.id), `/media/${row.file}`);
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

  it("rejects legacy wellness niches and remaps them", () => {
    assert.equal(isCatalogNiche("fitness"), false);
    assert.equal(isCatalogNiche("wellness"), false);
    assert.equal(isCatalogNiche("salon"), false);
    assert.equal(isCatalogNiche("beauty"), false);
    assert.equal(resolveCatalogNiche("fitness"), "tool-repair");
    assert.equal(resolveCatalogNiche("salon"), "barber");
    assert.equal(resolveCatalogNiche("beauty"), "barber");
    assert.equal(resolveCatalogNiche("wellness"), "woodworking");
    assert.equal(assertCatalogNiche("plumbing"), "plumbing");
    assert.throws(() => assertCatalogNiche("massage"), /Unknown catalog niche/);
  });
});
