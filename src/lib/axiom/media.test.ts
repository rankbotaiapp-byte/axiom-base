import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG, catalogFilmUrl } from "../../config/catalog.ts";
import { isCatalogHeroUrl } from "./hero-films.ts";
import { SHOP_NICHES } from "./types.ts";
import { heroForCustomNiche, leadHeroFor, NICHE_MEDIA, resolveHeroMedia } from "./media.ts";

describe("niche media", () => {
  it("maps niches to *-hero-animation loops under /media/", () => {
    assert.equal(NICHE_MEDIA["tool-repair"].heroVideoUrl, catalogFilmUrl("tool-repair"));
    assert.equal(NICHE_MEDIA.auto.heroVideoUrl, "/media/auto-hero-animation.mp4");
    assert.equal(NICHE_MEDIA.barber.heroVideoUrl, "/media/barber-hero-animation.mp4");
    assert.equal(NICHE_MEDIA.forestry.heroVideoUrl, "/media/leopard-hero-animation.mp4");
    assert.equal(NICHE_MEDIA.electrical.heroVideoUrl, "/media/electrician-hero-animation.mp4");
    assert.equal(NICHE_MEDIA.landscaping.heroVideoUrl, "/media/guide-service-hero-animation.mp4");
    assert.ok(isCatalogHeroUrl(NICHE_MEDIA.contractor.heroVideoUrl));
    assert.equal(isCatalogHeroUrl("/media/heroes/leopard.mp4"), false);
  });

  it("hides the niche loop when the owner uploads a still", () => {
    const media = resolveHeroMedia({
      niche: "auto",
      heroImageUrl: "/media/alex-morgan.jpg",
      heroVideoUrl: null,
    });
    // Video from catalog still wins when no upload film is set.
    assert.equal(media.videoUrl, "/media/auto-hero-animation.mp4");
  });

  it("keeps a tenant upload in front of the niche film", () => {
    const media = resolveHeroMedia({
      niche: "electrical",
      heroImageUrl: "",
      heroVideoUrl: "/api/hero-video/shop_demo?v=1",
    });
    assert.equal(media.videoUrl, "/api/hero-video/shop_demo?v=1");
  });

  it("uses the trainer animation when a fitness shop has no custom film", () => {
    const media = resolveHeroMedia({
      niche: "tool-repair",
      heroImageUrl: "",
      heroVideoUrl: null,
    });
    assert.equal(media.videoUrl, "/media/physical-trainer-hero-animation.mp4");
  });

  it("gives every niche a hero-animation film that exists on disk", () => {
    for (const niche of SHOP_NICHES) {
      const media = NICHE_MEDIA[niche];
      assert.match(media.heroVideoUrl, /\/media\/[a-z0-9-]+-hero-animation\.mp4$/i, niche);
    }
    assert.equal(CATALOG.length, SHOP_NICHES.length);
    assert.equal(leadHeroFor("wellness", "Creek Bodywork").heroVideoUrl, catalogFilmUrl("woodworking"));
    assert.equal(leadHeroFor("auto", "Rogue Detail").heroVideoUrl, "/media/auto-hero-animation.mp4");
    assert.equal(heroForCustomNiche("Landscaper").heroVideoUrl, "/media/guide-service-hero-animation.mp4");
  });
});
