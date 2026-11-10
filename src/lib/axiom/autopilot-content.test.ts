import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { REGISTERED_NICHES } from "../../config/NicheRegistry.ts";
import {
  brandOverlayStamp,
  brandedStockPosterSvg,
  composeBrandedStock,
  curatedStockImage,
  curatedStockVideo,
  daySeedFromDate,
  framedStockSvg,
  framedSvgDataUrl,
  libraryStockAsset,
  pickTradeKeyword,
  tradeKeywordsForNiche,
} from "./autopilot-content.ts";

describe("autopilot content sourcing + branding", () => {
  it("maps every registered niche to trade search keywords", () => {
    for (const niche of REGISTERED_NICHES) {
      const keys = tradeKeywordsForNiche(niche);
      assert.ok(keys.length >= 2, niche);
      assert.ok(keys.every((k) => k.length > 2));
      assert.ok(pickTradeKeyword(niche, 0).length > 2);
    }
  });

  it("stamps shop name, city, and CTA onto stock composition metadata", () => {
    const overlay = brandOverlayStamp({
      shopName: "Rogue Plumbing",
      city: "Medford",
      bookUrl: "/rogue-plumbing/book",
      niche: "plumbing",
    });
    assert.equal(overlay.shopName, "Rogue Plumbing");
    assert.equal(overlay.city, "Medford");
    assert.match(overlay.cta, /Book in Medford/);
    assert.match(overlay.tradeLabel, /Plumbing/i);

    const base = curatedStockImage("plumbing", 0);
    assert.equal(base.kind, "image");
    assert.match(base.src, /^https:\/\/images\.unsplash\.com\//);
    assert.equal(base.license.license, "unsplash-curated");

    const composition = composeBrandedStock({
      base,
      shopName: "Rogue Plumbing",
      city: "Medford",
      bookUrl: "/rogue-plumbing/book",
      niche: "plumbing",
    });
    assert.match(composition.caption, /Rogue Plumbing/);
    assert.match(composition.caption, /Medford/);
    assert.match(composition.caption, /Book in Medford/);
    assert.match(composition.posterSvg, /Rogue Plumbing/);
    assert.match(composition.framedSvg, /Rogue Plumbing/);
    assert.match(composition.framedSvg, /images\.unsplash\.com|href=/);
    assert.equal(composition.metadata.version, 1);
    assert.equal(composition.metadata.niche, "plumbing");
    assert.ok(composition.metadata.keywords.includes("plumbing") || composition.metadata.keywords.length > 0);
    assert.ok(framedSvgDataUrl(composition.posterSvg).startsWith("data:image/svg+xml"));
  });

  it("selects a local library loop for a trade before remote stock", () => {
    const local = libraryStockAsset("plumbing", "video", 0);
    assert.ok(local);
    assert.equal(local.kind, "video");
    assert.match(local.src, /^\/media\//);
    assert.equal(local.license.license, "platform");
    const still = libraryStockAsset("auto", "image", 3);
    assert.ok(still);
    assert.equal(still.kind, "image");
  });

  it("falls back to the master cinematic loop for video when APIs are offline", () => {
    const video = curatedStockVideo("auto");
    assert.equal(video.kind, "video");
    assert.match(video.src, /^\/media\//);
    assert.match(video.src, /\.mp4$/);
    const svg = brandedStockPosterSvg(
      brandOverlayStamp({ shopName: "Night Circuit", city: "Ashland", niche: "auto" }),
      video,
    );
    assert.match(svg, /Night Circuit/);
    assert.match(framedStockSvg(
      brandOverlayStamp({ shopName: "Night Circuit", city: "Ashland", niche: "auto" }),
      video,
    ), /Night Circuit/);
    assert.ok(daySeedFromDate() > 0);
  });

  it("rotates keyword picks by day seed for fresh daily queries", () => {
    const a = pickTradeKeyword("roofing", 0);
    const b = pickTradeKeyword("roofing", 1);
    const keys = tradeKeywordsForNiche("roofing");
    assert.ok(keys.includes(a));
    assert.ok(keys.includes(b));
    if (keys.length > 1) assert.notEqual(a, b);
  });
});
