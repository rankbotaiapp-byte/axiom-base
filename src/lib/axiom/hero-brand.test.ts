import assert from "node:assert/strict";
import test from "node:test";
import { resolveHeroMedia } from "./media.ts";
import { ownerHeroMedia } from "./hero-motion.ts";
import {
  brandPlate,
  heroAssetTooLarge,
  heroAtmosphereActive,
  HERO_BRAND_MAX_BYTES,
  isHeroEffect,
  isPublishableHeroStill,
  keepHeroBrand,
  morphProfileFromPrompt,
  parseHeroEffect,
  parseMorphDuration,
  readHeroBrandFallback,
  shopHeroStillPath,
  shopIdFromBrandPath,
  sniffHeroAsset,
  withHeroBrandFallback,
} from "./hero-brand.ts";

test("the branding plate etches the shop and keeps a niche sticker", () => {
  const plate = brandPlate({
    name: "  Atlas   Cuts  ",
    niche: "barber",
    trade: "Barber",
    tagline: "  Walk-ins before dusk  ",
  });
  assert.equal(plate.etch, "Atlas Cuts");
  assert.equal(plate.sticker, "Chair mark");
  assert.equal(plate.line, "Walk-ins before dusk");
  assert.equal(isHeroEffect("rain"), true);
  assert.equal(isHeroEffect("orb_genesis_transform"), true);
  assert.equal(isHeroEffect("fog"), false);
  assert.equal(parseHeroEffect("orb_transform"), "orb_genesis_transform");
  assert.equal(morphProfileFromPrompt("liquid chrome dropping glass vessel with engraved logo"), "vessel");
  assert.equal(morphProfileFromPrompt("chrome skull"), "skull");
  assert.equal(morphProfileFromPrompt("crest monogram"), "logo");
  assert.equal(parseMorphDuration("slow"), 4.5);
  assert.equal(parseMorphDuration(9), 9);
  assert.equal(heroAssetTooLarge(HERO_BRAND_MAX_BYTES + 1), true);
  assert.equal(heroAssetTooLarge(HERO_BRAND_MAX_BYTES), false);
});

test("a branded still is the shop hero and a catalog film is not", () => {
  const path = shopHeroStillPath("shop_abc", 9);
  assert.equal(path, "/api/hero/brand/shop_abc?v=9");
  assert.equal(shopIdFromBrandPath("/api/hero/brand/shop_abc"), "shop_abc");
  assert.equal(shopIdFromBrandPath("/api/hero/brand"), null);
  assert.equal(heroAtmosphereActive(path, ""), true);
  assert.equal(heroAtmosphereActive("/media/heroes/salon.jpg", ""), false);
  assert.equal(heroAtmosphereActive("/media/heroes/salon.jpg", "Open late"), true);
  const media = resolveHeroMedia({
    niche: "barber",
    heroImageUrl: path,
    heroVideoUrl: null,
  });
  assert.equal(media.imageUrl, path);
  assert.equal(media.videoUrl, null);
  assert.deepEqual(ownerHeroMedia(null, path), { video: "", image: path });
  assert.equal(ownerHeroMedia("/media/heroes/landscaper.mp4", "/media/heroes/landscaper.jpg"), null);
});

test("a missing hero column can live on the trade profile without dropping the rest", () => {
  const saved = withHeroBrandFallback(
    JSON.stringify({ note: "Same-day cuts", hud: { wash: "obsidian" } }),
    { effect: "rain", tagline: "  Open late  " },
  );
  const parsed = JSON.parse(saved) as { note: string; heroBrand: { effect: string; tagline: string } };
  assert.equal(parsed.note, "Same-day cuts");
  assert.deepEqual(readHeroBrandFallback(saved), {
    effect: "rain",
    tagline: "Open late",
    prompt: "",
    morphDurationSec: 4.5,
  });
  const kept = JSON.parse(keepHeroBrand({ note: "Fades" }, saved)) as {
    note: string;
    heroBrand: { effect: string; tagline: string };
  };
  assert.equal(kept.note, "Fades");
  assert.equal(kept.heroBrand.tagline, "Open late");
  assert.equal(keepHeroBrand({ note: "Fades" }, "{}").includes("heroBrand"), false);
  assert.equal(isPublishableHeroStill("shop_abc", "/api/hero/brand/shop_abc?v=2"), true);
  assert.equal(isPublishableHeroStill("shop_abc", "data:image/jpeg;base64,aaaa"), true);
  assert.equal(isPublishableHeroStill("shop_abc", "/media/heroes/salon.jpg"), false);
});

test("photo and film uploads are recognized by their file signature", () => {
  const jpeg = new Uint8Array(16);
  jpeg[0] = 0xff;
  jpeg[1] = 0xd8;
  jpeg[2] = 0xff;
  const mp4 = new Uint8Array(16);
  mp4[4] = 0x66;
  mp4[5] = 0x74;
  mp4[6] = 0x79;
  mp4[7] = 0x70;
  assert.equal(sniffHeroAsset(jpeg), "jpeg");
  assert.equal(sniffHeroAsset(mp4), "mp4");
  assert.equal(sniffHeroAsset(new Uint8Array(16)), null);
});
