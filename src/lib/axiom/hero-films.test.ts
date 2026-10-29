import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../../config/catalog.ts";
import { AUTO_HERO_SRC, AUTO_REPAIR_SRC, swapMissingAutoHero } from "./auto-sequence.ts";
import { PHOTO_REELS, resolveHeroMedia } from "./media.ts";
import {
  ANIMATION_MP4_FILES,
  BROWSER_LOG_ORDER,
  HERO_MP4_FILES,
  UNIVERSAL_FALLBACK,
  applyBrowserFilmOverride,
  catalogChoices,
  filmMatchingText,
  heroStem,
  heroTelemetryOrder,
  heroVideoList,
  isCatalogHeroUrl,
  nextReelIndex,
  resolveNicheFilm,
} from "./hero-films.ts";

describe("hero film directory", () => {
  it("lists only *-hero-animation.mp4 files matching the catalog", () => {
    const dir = fileURLToPath(new URL("../../../public/media", import.meta.url));
    const onDisk = readdirSync(dir)
      .filter((file) => /^[a-z0-9]+(?:-[a-z0-9]+)*-hero-animation\.mp4$/i.test(file))
      .sort();
    assert.deepEqual([...ANIMATION_MP4_FILES].sort(), onDisk);
    assert.deepEqual([...HERO_MP4_FILES].sort(), onDisk);
    assert.equal(CATALOG.length, 21);
    assert.equal(onDisk.includes("otter-hero-animation.mp4"), true);
    assert.equal(isCatalogHeroUrl("/media/heroes/auto-repair.mp4"), false);
    assert.equal(isCatalogHeroUrl("/media/auto-hero-animation.mp4"), true);
    assert.equal(heroStem("auto-hero-animation.mp4"), "auto hero animation");
  });

  it("keeps the named animations on their niches", () => {
    assert.equal(resolveNicheFilm("electrical"), "/media/electrician-hero-animation.mp4");
    assert.equal(resolveNicheFilm("auto"), "/media/auto-hero-animation.mp4");
    assert.equal(resolveNicheFilm("barber"), "/media/barber-hero-animation.mp4");
    assert.equal(filmMatchingText("Main Street Plumbing"), "/media/plumbers-hero-animation.mp4");
    assert.equal(catalogChoices("auto")[0]?.url, "/media/auto-hero-animation.mp4");
    assert.equal(catalogChoices("barber")[0]?.url, "/media/barber-hero-animation.mp4");
    assert.equal(UNIVERSAL_FALLBACK, "/media/orb-explosion-hero-animation.mp4");
  });

  it("lets a shop upload or a tenant pin beat the niche film and a browser override", () => {
    const upload = "/api/hero-video/shop_1?v=2";
    const pin = "/media/plumbers-hero-animation.mp4";
    const nicheFilm = "/media/electrician-hero-animation.mp4";
    const browserPick = "/media/tiger-hero-animation.mp4";
    assert.equal(resolveHeroMedia({ niche: "electrical", heroImageUrl: "", heroVideoUrl: upload }).videoUrl, upload);
    assert.equal(resolveHeroMedia({ niche: "electrical", heroImageUrl: "", heroVideoUrl: pin }).videoUrl, pin);
    assert.equal(applyBrowserFilmOverride(upload, nicheFilm, browserPick), upload);
    assert.equal(applyBrowserFilmOverride(pin, nicheFilm, browserPick), pin);
    assert.equal(applyBrowserFilmOverride(nicheFilm, nicheFilm, browserPick), browserPick);
  });

  it("plays saved lines, then GPU, frame rate, link, and engine", () => {
    assert.deepEqual(heroTelemetryOrder(["  Lane open  ", "", "Second"]), ["Lane open", "Second", ...BROWSER_LOG_ORDER]);
  });

  it("keeps the timed auto reel on auto-hero-animation", () => {
    const missing = {
      dataset: {} as DOMStringMap,
      currentSrc: "",
      src: "/media/auto-hero-animation.mp4",
      play() {
        return Promise.resolve();
      },
    };
    swapMissingAutoHero(missing as unknown as HTMLVideoElement);
    assert.equal(missing.src, AUTO_REPAIR_SRC);
    assert.equal(AUTO_HERO_SRC, AUTO_REPAIR_SRC);
  });

  it("accepts one film or a rotation and advances on ended", () => {
    assert.deepEqual(heroVideoList(PHOTO_REELS[0]), [PHOTO_REELS[0]]);
    assert.equal(nextReelIndex(0, 3), 1);
    assert.equal(nextReelIndex(2, 3), 0);
  });

  it("offers every active animation in the admin dropdown", () => {
    const choices = catalogChoices("electrical").map((row) => row.url);
    assert.equal(choices[0], "/media/electrician-hero-animation.mp4");
    assert.equal(choices.length, CATALOG.length);
  });
});
