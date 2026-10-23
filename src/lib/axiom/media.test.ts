import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { heroVideoPath, isMp4 } from "./hero-video.ts";
import { heroForCustomNiche, leadHeroFor, NICHE_MEDIA, resolveHeroMedia } from "./media.ts";
import { SHOP_NICHES } from "./types.ts";
import { isNotifyEmail, toE164 } from "./notify-target.ts";

describe("niche media", () => {
  it("maps curated niches to one film and legacy niches to the trade film", () => {
    assert.equal(NICHE_MEDIA.fitness.heroVideoUrl, "/media/heroes/tiger-deer.mp4");
    assert.equal(NICHE_MEDIA.fitness.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.locksmith.heroVideoUrl, "/media/heroes/mobile-locksmith.mp4");
    assert.equal(NICHE_MEDIA.contractor.heroVideoUrl, "/media/heroes/contractors-hero.mp4");
    assert.equal(NICHE_MEDIA.contractor.tone, "site");
    assert.equal(NICHE_MEDIA.location.heroVideoUrl, "/media/heroes/universal-fallback.mp4.mp4");
    assert.equal(NICHE_MEDIA.tattoo.heroVideoUrl, "/media/heroes/tattoo-hero.mp4");
    assert.equal(NICHE_MEDIA.tattoo.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.field.heroVideoUrl, "/media/heroes/auto-repair.mp4");
    assert.equal(NICHE_MEDIA.music.heroVideoUrl, "/media/heroes/music-hero.mp4");
    assert.equal(NICHE_MEDIA.studio.heroVideoUrl, NICHE_MEDIA.trade.heroVideoUrl);
    assert.equal(NICHE_MEDIA.retail.heroVideoUrl, "/media/heroes/welding-trade.mp4");
    assert.deepEqual(NICHE_MEDIA.fitness.staff, ["/media/alex-morgan.jpg", "/media/willa-grant.jpg"]);
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
    assert.equal(NICHE_MEDIA.location.heroVideoUrl, "/media/heroes/universal-fallback.mp4.mp4");
  });

  it("uses the tiger-deer film when a fitness shop has no custom film", () => {
    const media = resolveHeroMedia({
      niche: "fitness",
      heroImageUrl: "",
      heroVideoUrl: null,
    });
    assert.equal(media.videoUrl, "/media/heroes/tiger-deer.mp4");
    assert.equal(media.loopLabel, "Training loop · tiger-deer.mp4");
  });

  it("gives every niche a still or a film, and routes named trades", () => {
    const publicDir = fileURLToPath(new URL("../../../public", import.meta.url));
    const onDisk = (url: string) => existsSync(path.join(publicDir, url.replace(/^\//, "")));
    for (const niche of SHOP_NICHES) {
      const media = NICHE_MEDIA[niche];
      assert.ok(media.heroImageUrl || media.heroVideoUrl, niche);
      assert.equal(media.heroVideos[0] ?? "", media.heroVideoUrl, niche);
      for (const url of media.heroVideos) assert.equal(onDisk(url), true, `${niche} ${url}`);
      if (media.heroImageUrl) assert.equal(onDisk(media.heroImageUrl), true, `${niche} ${media.heroImageUrl}`);
    }
    assert.equal(NICHE_MEDIA.photo.heroVideos.length, 3);
    assert.equal(NICHE_MEDIA.fitness.heroVideos.length, 1);
    assert.equal(leadHeroFor("wellness", "Bear Creek Bodywork").heroImageUrl, "");
    assert.equal(leadHeroFor("wellness", "Bear Creek Bodywork").heroVideoUrl, "/media/heroes/wellness.mp4");
    assert.equal(leadHeroFor("wellness", "Bear Creek Bodywork").introPreset, "fade");
    assert.equal(NICHE_MEDIA.beauty.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.beauty.heroVideoUrl, "/media/heroes/nails-lashes.mp4");
    assert.equal(NICHE_MEDIA.lessons.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.lessons.heroVideoUrl, "/media/heroes/lessons.mp4");
    assert.equal(NICHE_MEDIA.pets.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.pets.heroVideoUrl, "/media/heroes/petgroom.mp4");
    assert.equal(leadHeroFor("atv-sports-rentals", "Ridge ATV", "ATV sports rentals").heroVideoUrl, "/media/heroes/welding-trade.mp4");
    assert.equal(NICHE_MEDIA.creator.heroVideoUrl, "/media/heroes/social-media-content-creator.mp4");
    assert.equal(NICHE_MEDIA.creator.tone, "cinema");
    assert.equal(NICHE_MEDIA.prompt.heroVideoUrl, NICHE_MEDIA.trade.heroVideoUrl);
    assert.equal(NICHE_MEDIA.prompt.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.retail.heroVideoUrl, "/media/heroes/welding-trade.mp4");
    assert.equal(NICHE_MEDIA.landscaper.heroVideoUrl, "/media/heroes/landscaper.mp4");
    assert.equal(NICHE_MEDIA.foodtruck.heroVideoUrl, "/media/heroes/mobile-foodtruck.mp4");
    assert.equal(NICHE_MEDIA.dogwalk.heroVideoUrl, "/media/heroes/dogwalking.mp4");
    assert.equal(NICHE_MEDIA.detailer.heroVideoUrl, "/media/heroes/mobile-detailer.mp4");
    assert.equal(NICHE_MEDIA.entertainer.heroVideoUrl, "/media/heroes/entertainer.mp4");
    const tattoo = resolveHeroMedia({
      niche: "tattoo",
      heroImageUrl: "",
      heroVideoUrl: "/media/tattoo-gun.mp4",
    });
    assert.equal(tattoo.videoUrl, "/media/heroes/tattoo-hero.mp4");
    const music = resolveHeroMedia({
      niche: "music",
      heroImageUrl: "/media/music-hero.jpg",
      heroVideoUrl: "/media/music-hero.mp4",
    });
    assert.equal(music.videoUrl, NICHE_MEDIA.music.heroVideoUrl);
    assert.equal(NICHE_MEDIA.clean.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.clean.heroVideoUrl, "/media/heroes/clean.mp4");
    assert.equal(NICHE_MEDIA.counsel.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.counsel.heroVideoUrl, "/media/heroes/universal-fallback.mp4.mp4");
    assert.equal(NICHE_MEDIA.salon.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.salon.heroVideoUrl, "/media/heroes/salon.mp4");
    assert.equal(NICHE_MEDIA.events.heroVideoUrl, "/media/heroes/events.mp4");
    assert.equal(NICHE_MEDIA.events.heroImageUrl, "/media/heroes/events.jpg");
    assert.equal(NICHE_MEDIA.guide.heroVideoUrl, "/media/heroes/guide.mp4");
    assert.equal(NICHE_MEDIA.photo.heroVideoUrl, "/media/heroes/wildlife-photographer.mp4");
    assert.deepEqual(NICHE_MEDIA.photo.heroVideos, [
      "/media/heroes/wildlife-photographer.mp4",
      "/media/heroes/photographer.mp4",
      "/media/heroes/outdoor-master.mp4",
    ]);
    assert.deepEqual(leadHeroFor("photo", "North Frame", "Photography").heroVideos, NICHE_MEDIA.photo.heroVideos);
    assert.equal(leadHeroFor("field", "Rogue HVAC").heroVideoUrl, "/media/heroes/contractors-hero.mp4");
    assert.equal(leadHeroFor("field", "Rogue HVAC").heroImageUrl, "");
    assert.equal(NICHE_MEDIA.practice.heroImageUrl, "/media/heroes/practice.jpg");
    assert.equal(NICHE_MEDIA.practice.heroVideoUrl, "");
    assert.equal(leadHeroFor("contractor", "Summit Roofing").heroVideoUrl, "/media/heroes/contractors-hero.mp4");
    assert.equal(leadHeroFor("contractor", "Valley Electric").heroVideoUrl, "/media/heroes/contractors-hero.mp4");
    assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroImageUrl, "");
    assert.equal(leadHeroFor("hunting-guide", "Ridge Outfitters", "Hunting guide").heroVideoUrl, "/media/heroes/hunting-guide.mp4");
    assert.equal(leadHeroFor("outdoor-expeditions", "Ridge Outfitters", "Outdoor expeditions").heroVideoUrl, "/media/heroes/hunting-guide.mp4");
    assert.equal(NICHE_MEDIA.hunting.heroVideoUrl, "/media/heroes/hunting-guide.mp4");
    assert.equal(NICHE_MEDIA.hunting.tone, "backcountry");
    assert.equal(NICHE_MEDIA.therapy.heroVideoUrl, "/media/heroes/universal-fallback.mp4.mp4");
    assert.equal(NICHE_MEDIA.bowtech.heroVideoUrl, "/media/heroes/custom-bow-tech-hero.mp4.mp4");
    const stock = NICHE_MEDIA.trade.heroVideoUrl;
    assert.equal(heroForCustomNiche("Watchmaker").heroVideoUrl, stock);
    assert.equal(heroForCustomNiche("Landscaper").heroVideoUrl, "/media/heroes/landscaper.mp4");
    const named = resolveHeroMedia({
      niche: "trade",
      customNiche: "Landscaper",
      heroImageUrl: "",
      heroVideoUrl: stock,
    });
    assert.equal(named.videoUrl, "/media/heroes/landscaper.mp4");
    assert.equal(NICHE_MEDIA.landscaper.heroVideoUrl, "/media/heroes/landscaper.mp4");
    const uploaded = resolveHeroMedia({
      niche: "trade",
      customNiche: "Watchmaker",
      heroImageUrl: "",
      heroVideoUrl: "/api/hero-video/shop_abc?v=3",
    });
    assert.equal(uploaded.videoUrl, "/api/hero-video/shop_abc?v=3");
    assert.equal(uploaded.loopLabel, "Custom loop · this shop");
    assert.equal(NICHE_MEDIA.trade.heroVideoUrl, stock);
    assert.equal(heroVideoPath("shop_abc", 3).includes("/media/"), false);
    assert.equal(NICHE_MEDIA.trade.heroVideoUrl, "/media/heroes/welding-trade.mp4");
    assert.equal(NICHE_MEDIA.trade.heroImageUrl, "");
    assert.equal(NICHE_MEDIA.security.heroVideoUrl, "/media/heroes/private-security.mp4");
    assert.equal(leadHeroFor("firewood", "Oak Cord", "Firewood").heroImageUrl, "");
    assert.equal(leadHeroFor("firewood", "Oak Cord", "Firewood").heroVideoUrl, "/media/heroes/universal-fallback.mp4.mp4");
    assert.equal(NICHE_MEDIA.firewood.heroVideoUrl, "/media/heroes/universal-fallback.mp4.mp4");
    assert.equal(NICHE_MEDIA.contractor.heroImageUrl, "");
    assert.equal(leadHeroFor("field", "Oak Lawn Care").heroImageUrl, "");
    assert.equal(leadHeroFor("field", "Oak Lawn Care").heroVideoUrl, "/media/heroes/landscaper.mp4");
    assert.equal(leadHeroFor("food-truck", "Urban Eats", "Mobile food truck").heroVideoUrl, "/media/heroes/mobile-foodtruck.mp4");
    assert.equal(leadHeroFor("trade", "Main Street Plumbing").heroVideoUrl, "/media/heroes/plumbers-hero.mp4.mp4");
    assert.equal(leadHeroFor("field", "Curb Call Rogue").heroVideoUrl, "/media/heroes/auto-repair.mp4");
    assert.equal(leadHeroFor("field", "Rogue Auto Repair").heroVideoUrl, "/media/heroes/auto-repair.mp4");
    const pinned = resolveHeroMedia({
      niche: "field",
      heroImageUrl: "",
      heroVideoUrl: "/media/heroes/trades-hero.mp4",
    });
    assert.equal(pinned.videoUrl, "/media/heroes/trades-hero.mp4");
    assert.equal(pinned.loopLabel, "Catalog film · trades-hero.mp4");
  });

  it("falls back to the niche film when the shop row has no video", () => {
    const media = resolveHeroMedia({
      niche: "studio",
      heroImageUrl: "/media/apps-hero.jpg",
      heroVideoUrl: null,
    });
    assert.equal(media.videoUrl, NICHE_MEDIA.trade.heroVideoUrl);
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
