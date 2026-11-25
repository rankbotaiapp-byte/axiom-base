import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { HERO_LIBRARY, HERO_LIBRARY_CATEGORIES, heroLibraryEntryByUrl } from "./HeroLibrary.ts";
import { LOOP_TAIL_TRIM_SEC } from "../lib/axiom/loop-trim.ts";
import { isHeroLibrarySrc } from "../lib/axiom/hero-library.ts";
import { isCatalogHeroUrl } from "../lib/axiom/hero-films.ts";

describe("hero animation library", () => {
  it("indexes public media loops with category, collection, and trim", () => {
    const dir = fileURLToPath(new URL("../../public", import.meta.url));
    assert.equal(HERO_LIBRARY.length > 8, true);
    assert.equal(HERO_LIBRARY_CATEGORIES.length, 5);
    const urls = new Set<string>();
    for (const item of HERO_LIBRARY) {
      assert.equal(urls.has(item.videoUrl), false, item.videoUrl);
      urls.add(item.videoUrl);
      assert.equal(item.videoUrl.startsWith("/media/"), true);
      assert.equal(item.videoUrl.includes("//"), false, item.videoUrl);
      assert.equal(existsSync(join(dir, item.videoUrl.replace(/^\//, ""))), true, item.videoUrl);
      assert.equal(item.loopTailTrimSec, LOOP_TAIL_TRIM_SEC);
      assert.equal(isHeroLibrarySrc(item.videoUrl), true);
      assert.equal(isCatalogHeroUrl(item.videoUrl), true);
    }
    assert.equal(heroLibraryEntryByUrl("/media/auto-hero-animation.mp4")?.category, "Auto");
    assert.equal(heroLibraryEntryByUrl("/media/infrastructure-hero-animation.mp4")?.collection, "Abstract");
    assert.equal(heroLibraryEntryByUrl("/media/axio-plumber-hero.mp4")?.category, "Urgent");
    assert.equal(heroLibraryEntryByUrl("/media/axio-plumber-hero.mp4")?.collection, "Water");
    assert.equal(heroLibraryEntryByUrl("/media/axio-plumber-hero.mp4")?.name, "Axio Plumber Hero");
  });
});
