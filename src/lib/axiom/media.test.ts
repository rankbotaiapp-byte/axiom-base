import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMp4 } from "./hero-video.ts";
import { leadHeroFor, NICHE_MEDIA, resolveHeroMedia } from "./media.ts";
import { SHOP_NICHES } from "./types.ts";
import { isNotifyEmail, toE164 } from "./notify-target.ts";

describe("niche media", () => {
  it("maps each niche to its own loop", () => {
    assert.equal(NICHE_MEDIA.fitness.heroVideoUrl, "/media/heroes/tiger-deer.mp4");
    assert.equal(NICHE_MEDIA.fitness.insetLoopUrl, "/media/tiger.mp4");
    assert.equal(NICHE_MEDIA.music.heroVideoUrl, "/media/music-hero.mp4");
    assert.equal(NICHE_MEDIA.music.tone, "stage");
    assert.equal(NICHE_MEDIA.contractor.heroVideoUrl, "/media/contractor-hero.mp4");
    assert.equal(NICHE_MEDIA.contractor.tone, "site");
    assert.equal(NICHE_MEDIA.location.heroVideoUrl, "/media/clipper.mp4");
    assert.equal(NICHE_MEDIA.tattoo.heroVideoUrl, "/media/heroes/tattooshop.mp4");
    assert.equal(NICHE_MEDIA.tattoo.insetLoopUrl, "/media/tattoo-gun.mp4");
    assert.equal(NICHE_MEDIA.field.heroVideoUrl, "/media/auto-hero.mp4");
    assert.equal(NICHE_MEDIA.studio.heroVideoUrl, "/media/apps-hero.mp4");
  });

  it("hides the niche loop when the owner uploads a still", () => {
    const media = resolveHeroMedia({
      niche: "field",
      heroImageUrl: "data:image/jpeg;base64,abc",
      heroVideoUrl: "/media/auto-hero.mp4",
    });
    assert.equal(media.videoUrl, null);
    assert.equal(media.imageUrl.startsWith("data:"), true);
  });

  it("keeps a tenant upload in front of the niche film", () => {
    const media = resolveHeroMedia({
      niche: "field",
      heroImageUrl: "/media/auto-hero.jpg",
      heroVideoUrl: "/api/hero-video/shop_abc?v=1",
    });
    assert.equal(media.videoUrl, "/api/hero-video/shop_abc?v=1");
    assert.equal(media.loopLabel, "Custom loop · this shop");
  });

  it("keeps a tenant upload even when a custom still is set", () => {
    const media = resolveHeroMedia({
      niche: "location",
      heroImageUrl: "data:image/jpeg;base64,abc",
      heroVideoUrl: "/api/hero-video/shop_abc?v=2",
    });
    assert.equal(media.videoUrl, "/api/hero-video/shop_abc?v=2");
    assert.equal(NICHE_MEDIA.location.heroVideoUrl, "/media/clipper.mp4");
  });

  it("uses the tiger-deer film when a fitness shop has no custom film", () => {
    const media = resolveHeroMedia({
      niche: "fitness",
      heroImageUrl: "/media/tiger-poster.svg",
      heroVideoUrl: null,
    });
    assert.equal(media.videoUrl, "/media/heroes/tiger-deer.mp4");
    assert.equal(media.loopLabel, "Training loop · tiger-deer.mp4");
  });

  it("gives every niche a still or a film, and routes named trades", () => {
    for (const niche of SHOP_NICHES) {
      const media = NICHE_MEDIA[niche];
      assert.ok(media.heroImageUrl || media.heroVideoUrl, niche);
    }
    assert.equal(leadHeroFor("wellness", "Bear Creek Bodywork").heroImageUrl, "/media/heroes/wellness.jpg");
    assert.equal(leadHeroFor("wellness", "Bear Creek Bodywork").heroVideoUrl, "/media/heroes/wellness.mp4");
    assert.equal(leadHeroFor("wellness", "Bear Creek Bodywork").introPreset, "fade");
    assert.equal(NICHE_MEDIA.beauty.heroImageUrl, "/media/heroes/beauty.jpg");
    assert.equal(NICHE_MEDIA.beauty.heroVideoUrl, "/media/heroes/nails-lashes.mp4");
    assert.equal(NICHE_MEDIA.beauty.insetImageUrl, "/media/heroes/beauty.jpg");
    assert.equal(NICHE_MEDIA.lessons.heroImageUrl, "/media/heroes/lessons.jpg");
    assert.equal(NICHE_MEDIA.lessons.heroVideoUrl, "/media/heroes/lessons.mp4");
    assert.equal(NICHE_MEDIA.lessons.insetImageUrl, "/media/heroes/lessons.jpg");
    assert.equal(NICHE_MEDIA.pets.heroImageUrl, "/media/heroes/pets.jpg");
    assert.equal(NICHE_MEDIA.pets.heroVideoUrl, "/media/heroes/petgroom.mp4");
    assert.equal(NICHE_MEDIA.pets.insetImageUrl, "/media/heroes/pets.jpg");
    assert.equal(leadHeroFor("atv-sports-rentals", "Ridge ATV", "ATV sports rentals").heroVideoUrl, "/media/heroes/atv-sportsrentals.mp4");
    const tattoo = resolveHeroMedia({
      niche: "tattoo",
      heroImageUrl: "",
      heroVideoUrl: "/media/tattoo-gun.mp4",
    });
    assert.equal(tattoo.videoUrl, "/media/heroes/tattooshop.mp4");
    assert.equal(NICHE_MEDIA.clean.heroImageUrl, "/media/heroes/clean.jpg");
    assert.equal(NICHE_MEDIA.clean.heroVideoUrl, "/media/heroes/clean.mp4");
    assert.equal(NICHE_MEDIA.counsel.heroImageUrl, "/media/heroes/counsel.jpg");
    assert.equal(NICHE_MEDIA.counsel.heroVideoUrl, "/media/heroes/counsel.mp4");
    assert.equal(NICHE_MEDIA.salon.heroImageUrl, "/media/heroes/salon.jpg");
    assert.equal(NICHE_MEDIA.salon.heroVideoUrl, "/media/heroes/salon.mp4");
    assert.equal(NICHE_MEDIA.events.heroImageUrl, "/media/heroes/events.jpg");
    assert.equal(NICHE_MEDIA.events.heroVideoUrl, "/media/heroes/events.mp4");
    assert.equal(NICHE_MEDIA.events.tone, "stage");
    assert.equal(NICHE_MEDIA.guide.heroVideoUrl, "/media/heroes/guide.mp4");
    assert.equal(NICHE_MEDIA.photo.heroVideoUrl, "/media/heroes/photo.mp4");
    assert.equal(leadHeroFor("field", "Rogue HVAC").heroImageUrl, "/media/heroes/hvac.jpg");
    assert.equal(NICHE_MEDIA.practice.heroImageUrl, "/media/heroes/practice.jpg");
    assert.equal(leadHeroFor("contractor", "Summit Roofing").heroImageUrl, "/media/heroes/roofing.jpg");
    assert.equal(leadHeroFor("contractor", "Valley Electric").heroImageUrl, "/media/heroes/electrical.jpg");
    assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroImageUrl, "/media/heroes/hunting-guide.jpg");
    assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroVideoUrl, "/media/heroes/deer-hunting-guide.mp4");
    assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").insetImageUrl, "/media/heroes/hunting-guide.jpg");
    assert.equal(NICHE_MEDIA.trade.heroVideoUrl, "/media/heroes/welding-trade.mp4");
    assert.equal(NICHE_MEDIA.trade.insetImageUrl, "/media/heroes/trade.jpg");
    assert.equal(NICHE_MEDIA.security.heroVideoUrl, "/media/heroes/private-security.mp4");
    assert.equal(leadHeroFor("firewood", "Oak Cord", "Firewood").heroImageUrl, "/media/heroes/firewood.jpg");
    assert.equal(NICHE_MEDIA.contractor.heroImageUrl, "/media/heroes/contractor.jpg");
    assert.equal(leadHeroFor("field", "Oak Lawn Care").heroImageUrl, "/media/heroes/landscaping.jpg");
    assert.equal(leadHeroFor("food-truck", "Urban Eats", "Mobile food truck").heroImageUrl, "/media/heroes/food-truck.jpg");
    assert.equal(leadHeroFor("trade", "Main Street Plumbing").heroImageUrl, "/media/heroes/plumbing.jpg");
    assert.equal(leadHeroFor("field", "Curb Call Rogue").heroVideoUrl, "/media/auto-hero.mp4");
  });

  it("falls back to the niche film when the shop row has no video", () => {
    const media = resolveHeroMedia({
      niche: "studio",
      heroImageUrl: "/media/apps-hero.jpg",
      heroVideoUrl: null,
    });
    assert.equal(media.videoUrl, "/media/apps-hero.mp4");
  });
});

describe("mp4 uploads", () => {
  it("accepts an ftyp header and rejects a short file", () => {
    const ok = new Uint8Array(16);
    ok.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70], 0);
    assert.equal(isMp4(ok), true);
    assert.equal(isMp4(new Uint8Array([1, 2, 3])), false);
  });
});

describe("notify targets", () => {
  it("normalizes US numbers and rejects junk", () => {
    assert.equal(toE164("5418908126"), "+15418908126");
    assert.equal(toE164("+1 (541) 890-8126"), "+15418908126");
    assert.equal(toE164("123"), null);
  });

  it("accepts a plain email", () => {
    assert.equal(isNotifyEmail("owner@shop.test"), true);
    assert.equal(isNotifyEmail("not-an-email"), false);
  });
});
