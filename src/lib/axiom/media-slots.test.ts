import assert from "node:assert/strict";
import test from "node:test";
import {
  assetIdFromMediaPath,
  parseMediaSlot,
  placeBrandedAssets,
  shopMediaPath,
  socialCaptionDraft,
  parseSocialChannels,
} from "./media-slots.ts";

test("shop media stays on the shop API, not the public hero catalog", () => {
  assert.equal(shopMediaPath("med_abc123", 4), "/api/shop-media/med_abc123?v=4");
  assert.equal(assetIdFromMediaPath("/api/shop-media/med_abc123"), "med_abc123");
  assert.equal(assetIdFromMediaPath("/api/hero/brand/shop_x"), null);
  assert.throws(() => shopMediaPath("lead_x", 1), /stays on this shop/);
  assert.equal(parseMediaSlot("logo"), "logo");
  assert.equal(parseMediaSlot("nope"), "gallery");
});

test("placement picks the hero still and slots the rest", () => {
  const placed = placeBrandedAssets([
    { id: "med_g1", slot: "gallery", isHero: false },
    { id: "med_h1", slot: "gallery", isHero: true },
    { id: "med_l1", slot: "logo", isHero: false },
    { id: "med_s1", slot: "staff", isHero: false },
    { id: "med_o1", slot: "outreach", isHero: false },
  ]);
  assert.equal(placed.heroId, "med_h1");
  assert.deepEqual(placed.galleryIds, ["med_g1"]);
  assert.equal(placed.logoId, "med_l1");
  assert.equal(placed.staffId, "med_s1");
});

test("social drafts stay short and only keep known channels", () => {
  const draft = socialCaptionDraft({
    shopName: "Night Key",
    trade: "Mobile locksmith",
    city: "Medford",
    pageUrl: "https://example.com/night-key",
  });
  assert.match(draft.caption, /Night Key/);
  assert.match(draft.caption, /Medford/);
  assert.ok(draft.caption.length <= 240);
  assert.deepEqual(parseSocialChannels(["facebook", "myspace", "x"]), ["facebook", "x"]);
});

