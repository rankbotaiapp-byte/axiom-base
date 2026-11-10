import assert from "node:assert/strict";
import test from "node:test";
import {
  appendFounderOfferAssets,
  clampNamedPriceCents,
  dollarsToNamedPriceCents,
  founderOfferMedia,
  founderOfferPitchUrl,
  FOUNDER_LIFETIME_CENTS,
  NAME_YOUR_PRICE_MIN_CENTS,
  STANDARD_MONTHLY_CENTS,
} from "./commercial.ts";

test("commercial floors and lifetime constants", () => {
  assert.equal(NAME_YOUR_PRICE_MIN_CENTS, 100);
  assert.equal(STANDARD_MONTHLY_CENTS, 15_000);
  assert.equal(FOUNDER_LIFETIME_CENTS, 150_000);
  assert.equal(clampNamedPriceCents(1), 100);
  assert.equal(dollarsToNamedPriceCents("25"), 2500);
});

test("founder offer media and pitch URLs are absolute", () => {
  const media = founderOfferMedia("https://app.axiom.shop");
  assert.equal(media.videoUrl, "https://app.axiom.shop/media/welcome-to-axiom.mp4");
  assert.equal(media.thumbUrl, "https://app.axiom.shop/media/eric.jpg");
  const pitch = founderOfferPitchUrl("https://app.axiom.shop/", {
    leadSlug: "ridge-line-roofing",
    county: "Jackson",
  });
  assert.match(pitch, /b=ridge-line-roofing/);
  assert.match(pitch, /pitch=1/);
  assert.match(pitch, /offer=1/);
});

test("appendFounderOfferAssets fills missing video and preview", () => {
  const body = appendFounderOfferAssets("Hi shop", {
    videoUrl: "https://app.axiom.shop/media/welcome-to-axiom.mp4",
    thumbUrl: "https://app.axiom.shop/media/eric.jpg",
    previewUrl: "https://app.axiom.shop/?b=demo&pitch=1",
  });
  assert.match(body, /welcome-to-axiom\.mp4/);
  assert.match(body, /Name Your Price/);
  assert.match(body, /b=demo/);
});
