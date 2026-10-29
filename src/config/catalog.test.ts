import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CATALOG,
  CATALOG_NICHES,
  assertCatalogNiche,
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
