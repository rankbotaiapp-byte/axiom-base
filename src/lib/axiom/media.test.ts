import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NICHE_MEDIA, resolveHeroMedia } from "./media.ts";
import { isNotifyEmail, toE164 } from "./notify-target.ts";

describe("niche media", () => {
  it("maps each niche to its own loop", () => {
    assert.equal(NICHE_MEDIA.location.heroVideoUrl, "/media/barber-hero.mp4");
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

  it("falls back to the niche film when the shop row has no video", () => {
    const media = resolveHeroMedia({
      niche: "studio",
      heroImageUrl: "/media/apps-hero.jpg",
      heroVideoUrl: null,
    });
    assert.equal(media.videoUrl, "/media/apps-hero.mp4");
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
