import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { CATALOG, catalogFilmUrl, resolveCatalogNiche, tradeLoopUrl } from "./catalog.ts";
import { LOOP_TAIL_TRIM_SEC } from "../lib/axiom/loop-trim.ts";
import { bustStorefrontFilm, resolveShopHeroFilm } from "../lib/axiom/resolve-hero-film.ts";
import { MASTER_CATEGORY_CARDS } from "./MasterCategoryDefaults.ts";
import { MASTER_CATEGORY_IDS, MASTER_HERO_DEFAULTS, MASTER_LOOP_TAIL_TRIM_SEC } from "./MasterHeroDefaults.ts";
import { NICHE_REGISTRY, defaultHeroSrcForNiche, masterCategoryFor } from "./NicheRegistry.ts";

describe("master hero defaults", () => {
  it("maps every catalog niche onto one of five category loops", () => {
    assert.equal(MASTER_LOOP_TAIL_TRIM_SEC, LOOP_TAIL_TRIM_SEC);
    assert.equal(MASTER_CATEGORY_IDS.length, 5);
    assert.equal(MASTER_CATEGORY_CARDS.length, 5);
    const dir = fileURLToPath(new URL("../../public", import.meta.url));
    for (const id of MASTER_CATEGORY_IDS) {
      const src = MASTER_HERO_DEFAULTS[id].src;
      assert.equal(existsSync(join(dir, src.replace(/^\//, ""))), true, src);
      assert.equal(MASTER_HERO_DEFAULTS[id].loopTailTrimSec, LOOP_TAIL_TRIM_SEC);
    }
    for (const card of MASTER_CATEGORY_CARDS) {
      assert.ok(card.modules.length > 0, `${card.id} modules`);
      assert.ok(card.src.startsWith("/media/"), card.src);
      if (card.poster) {
        assert.ok(card.poster.startsWith("/media/heroes/") || card.poster.startsWith("/media/"), card.poster);
      }
    }
    for (const row of CATALOG) {
      assert.equal(row.id in NICHE_REGISTRY, true, row.id);
      assert.equal(catalogFilmUrl(row.id), defaultHeroSrcForNiche(row.id));
      assert.equal(catalogFilmUrl(row.id), MASTER_HERO_DEFAULTS[masterCategoryFor(row.id)].src);
    }
    assert.equal(catalogFilmUrl("plumbing"), "/media/otter-hero-animation.mp4");
    assert.equal(catalogFilmUrl("contractor"), "/media/leopard-hero-path.mp4");
    assert.equal(catalogFilmUrl("auto"), "/media/apex-launch-hero-animation.mp4");
    assert.equal(catalogFilmUrl("barber"), "/media/polar-bear-hero-animation.mp4");
    assert.equal(catalogFilmUrl("taxidermy"), "/media/shark-hero-animation.mp4");
    assert.equal(masterCategoryFor("junk-removal"), "residential-outdoor");
    assert.equal(tradeLoopUrl("plumbing"), "/media/axiom-plumber-hero.mp4");
    assert.notEqual(tradeLoopUrl("plumbing"), catalogFilmUrl("plumbing"));
    assert.equal(resolveShopHeroFilm({ niche: "plumbing" }), "/media/axiom-plumber-hero.mp4");
    assert.equal(
      resolveShopHeroFilm({ niche: "plumbing", overrideHeroVideoUrl: "/media/tiger-hero-animation.mp4" }),
      "/media/tiger-hero-animation.mp4",
    );
    assert.equal(
      bustStorefrontFilm("/media/tiger-hero-animation.mp4", 1730000000000),
      "/media/tiger-hero-animation.mp4?v=1730000000000",
    );
    assert.equal(resolveCatalogNiche("fitness"), "personal-trainer");
  });
});
