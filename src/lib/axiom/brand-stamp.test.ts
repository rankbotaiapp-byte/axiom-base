import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { applyAxiomBrandStamp } from "./brand-stamp.server.ts";
import { brandStampCopy, gbpNativeCta, stampSafeCaption, stampShowsPhone } from "./brand-stamp.ts";

const shop = {
  name: "Ridge Plumbing",
  city: "Ashland",
  phone: "5415550148",
  license_number: "CCB 123456",
  ad_tagline: "Same-day drain service",
};

test("IG/FB brand stamp inlays phone; GBP strips phone and email", async () => {
  assert.equal(stampShowsPhone("instagram"), true);
  assert.equal(stampShowsPhone("facebook"), true);
  assert.equal(stampShowsPhone("gbp"), false);
  const ig = brandStampCopy(shop, "instagram");
  assert.equal(ig.includePhone, true);
  assert.match(ig.phone, /541/);
  assert.ok(ig.lines.some((line) => /Ridge Plumbing/.test(line)));
  const gbp = brandStampCopy(shop, "google_business");
  assert.equal(gbp.includePhone, false);
  assert.equal(gbp.phone, "");
  assert.doesNotMatch(gbp.lines.join(" "), /5415550148/);
  assert.equal(gbpNativeCta(shop.phone).actionType, "CALL");
  assert.equal(gbpNativeCta("").actionType, "BOOK");
  assert.doesNotMatch(stampSafeCaption("Call 541-555-0148 or shop@example.com", "gbp"), /541|@/);

  const still = await sharp({
    create: { width: 640, height: 800, channels: 3, background: "#222222" },
  })
    .png()
    .toBuffer();
  const igStamp = await applyAxiomBrandStamp({ imageBuffer: still, shop, platform: "instagram" });
  assert.ok(igStamp.webp.byteLength > 32);
  assert.equal(igStamp.copy.includePhone, true);
  const gbpStamp = await applyAxiomBrandStamp({ imageBuffer: still, shop, platform: "google_business" });
  assert.equal(gbpStamp.copy.includePhone, false);
  assert.doesNotMatch(gbpStamp.copy.lines.join(" "), /5415550148/);
  assert.doesNotMatch(gbpStamp.captionSafe("Text 541-555-0100"), /541/);
});
