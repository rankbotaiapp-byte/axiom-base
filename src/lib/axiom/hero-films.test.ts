import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { AUTO_REPAIR_SRC, swapMissingAutoHero } from "./auto-sequence.ts";
import { resolveHeroMedia } from "./media.ts";
import {
  BROWSER_LOG_ORDER,
  HERO_MP4_FILES,
  UNIVERSAL_FALLBACK,
  applyBrowserFilmOverride,
  catalogChoices,
  filmMatchingText,
  heroStem,
  heroTelemetryOrder,
  resolveNicheFilm,
  scoreHeroFile,
} from "./hero-films.ts";

describe("hero film directory", () => {
  it("lists the mp4 files in the hero folder and ignores a doubled extension", () => {
    const dir = fileURLToPath(new URL("../../../public/media/heroes", import.meta.url));
    const onDisk = readdirSync(dir)
      .filter((file) => /\.mp4$/i.test(file))
      .sort();
    assert.deepEqual([...HERO_MP4_FILES].sort(), onDisk);
    assert.equal(heroStem("contractors-hero.mp4.mp4"), "contractors hero");
    assert.equal(heroStem("plumbers-hero.mp4.mp4"), "plumbers hero");
  });

  it("skips welcome, outreach, coastal, and charging clips", () => {
    const skipped = HERO_MP4_FILES.filter((file) => /\b(welcome|outreach|coastal|charging)\b/i.test(heroStem(file)));
    assert.deepEqual(skipped.sort(), [
      "admin-welcome.mp4",
      "charging-bear.mp4",
      "coastal-drive.mp4",
      "employee-welcome.mp4",
      "intro-welcome.mp4",
      "outreach-welcome.mp4",
    ]);
    for (const file of skipped) {
      assert.equal(scoreHeroFile(file, "guide"), 0);
      assert.equal(scoreHeroFile(file, "field"), 0);
      assert.equal(scoreHeroFile(file, "location"), 0);
    }
  });

  it("keeps the named films on their niches", () => {
    assert.equal(resolveNicheFilm("contractor"), "/media/heroes/contractors-hero.mp4.mp4");
    assert.equal(resolveNicheFilm("field"), "/media/heroes/auto-repair.mp4.mp4");
    assert.equal(resolveNicheFilm("location"), "/media/heroes/barbers-hero.mp4.mp4");
    assert.equal(filmMatchingText("Main Street Plumbing"), "/media/heroes/plumbers-hero.mp4.mp4");
    assert.equal(filmMatchingText("Northside Barbers"), "/media/heroes/barbers-hero.mp4.mp4");
    assert.equal(filmMatchingText("Rogue Auto Repair"), "/media/heroes/auto-repair.mp4.mp4");
    assert.equal(filmMatchingText("Mobile mechanic"), "/media/heroes/auto-repair.mp4.mp4");
    assert.equal(filmMatchingText("Mobile mechanics"), "/media/heroes/auto-repair.mp4.mp4");
    assert.equal(filmMatchingText("Rooftop HVAC"), "/media/heroes/contractors-hero.mp4.mp4");
    assert.equal(filmMatchingText("Acme Mechanical"), null);
    assert.equal(resolveNicheFilm("firewood", "/media/heroes/wood.mp4"), UNIVERSAL_FALLBACK);
    assert.equal(catalogChoices("field")[0]?.url, "/media/heroes/auto-repair.mp4.mp4");
    assert.equal(catalogChoices("location")[0]?.url, "/media/heroes/barbers-hero.mp4.mp4");
  });

  it("lets a shop upload or a tenant pin beat the niche film and a browser override", () => {
    const upload = "/api/hero-video/shop_1?v=2";
    const pin = "/media/heroes/plumbers-hero.mp4.mp4";
    const nicheFilm = "/media/heroes/contractors-hero.mp4.mp4";
    const browserPick = "/media/heroes/trades-hero.mp4";
    assert.equal(resolveHeroMedia({ niche: "contractor", heroImageUrl: "", heroVideoUrl: upload }).videoUrl, upload);
    assert.equal(resolveHeroMedia({ niche: "contractor", heroImageUrl: "", heroVideoUrl: pin }).videoUrl, pin);
    assert.equal(applyBrowserFilmOverride(upload, nicheFilm, browserPick), upload);
    assert.equal(applyBrowserFilmOverride(pin, nicheFilm, browserPick), pin);
    assert.equal(applyBrowserFilmOverride(nicheFilm, nicheFilm, browserPick), browserPick);
  });

  it("plays saved lines, then GPU, frame rate, link, and engine", () => {
    assert.deepEqual(heroTelemetryOrder(["  Lane open  ", "", "Second"]), ["Lane open", "Second", ...BROWSER_LOG_ORDER]);
    assert.deepEqual(BROWSER_LOG_ORDER, ["GPU", "FRAME", "LINK", "AI engine"]);
  });

  it("sends the timed auto reel to auto-repair when auto-hero is missing", () => {
    const missing = {
      dataset: {} as DOMStringMap,
      currentSrc: "",
      src: "/media/heroes/auto-hero.mp4",
      play() {
        return Promise.resolve();
      },
    };
    swapMissingAutoHero(missing as unknown as HTMLVideoElement);
    assert.equal(missing.src, AUTO_REPAIR_SRC);
    assert.equal(missing.dataset.repairFallback, "1");
    missing.src = "/api/hero-video/shop_1";
    missing.dataset.repairFallback = "";
    swapMissingAutoHero(missing as unknown as HTMLVideoElement);
    assert.equal(missing.src, "/api/hero-video/shop_1");
  });

  it("offers the plumber film as a contractor pin without making it the niche default", () => {
    const choices = catalogChoices("contractor").map((row) => row.url);
    assert.equal(choices[0], "/media/heroes/contractors-hero.mp4.mp4");
    assert.equal(choices.includes("/media/heroes/plumbers-hero.mp4.mp4"), true);
  });
});
