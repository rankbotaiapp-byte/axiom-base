import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMp4 } from "./hero-video.ts";
import { NICHE_MEDIA, resolveHeroMedia } from "./media.ts";
import { isNotifyEmail, toE164 } from "./notify-target.ts";

describe("niche media", () => {
  it("maps each niche to its own loop", () => {
    assert.equal(NICHE_MEDIA.fitness.heroVideoUrl, "/media/tiger.mp4");
    assert.equal(NICHE_MEDIA.music.heroVideoUrl, "/media/music-hero.mp4");
    assert.equal(NICHE_MEDIA.music.tone, "stage");
    assert.equal(NICHE_MEDIA.contractor.heroVideoUrl, "/media/contractor-hero.mp4");
    assert.equal(NICHE_MEDIA.contractor.tone, "site");
    assert.equal(NICHE_MEDIA.location.heroVideoUrl, "/media/clipper.mp4");
    assert.equal(NICHE_MEDIA.tattoo.heroVideoUrl, "/media/tattoo-gun.mp4");
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

  it("uses tiger.mp4 when a fitness shop has no custom film", () => {
    const media = resolveHeroMedia({
      niche: "fitness",
      heroImageUrl: "/media/tiger-poster.svg",
      heroVideoUrl: null,
    });
    assert.equal(media.videoUrl, "/media/tiger.mp4");
    assert.equal(media.loopLabel, "Training loop · tiger.mp4");
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
