import assert from "node:assert/strict";
import test from "node:test";
import {
  countDefaultPlaceholders,
  DEFAULT_PREVIEW_LABEL,
  defaultProof,
  isCustomStorefrontAsset,
  isDefaultStorefrontAsset,
  padProofFrames,
  parseServiceThumbs,
} from "./gallery.ts";

test("shop-hosted stills count as custom; catalog stills stay default", () => {
  assert.equal(isCustomStorefrontAsset("/api/shop-media/med_abc"), true);
  assert.equal(isCustomStorefrontAsset("data:image/jpeg;base64,xx"), true);
  assert.equal(isCustomStorefrontAsset("/media/heroes/hvac.jpg"), false);
  assert.equal(isDefaultStorefrontAsset(""), true);
  assert.match(DEFAULT_PREVIEW_LABEL, /Replace in Admin Studio/);
});

test("empty shops pad three proof frames and three service plates", () => {
  assert.equal(defaultProof("hvac").length, 3);
  assert.equal(defaultProof("hvac").every((frame) => frame.placeholder), true);
  const padded = padProofFrames([{ src: "/api/shop-media/med_1", caption: "Job", kind: "image" }]);
  assert.equal(padded.length, 3);
  assert.equal(padded[0]?.placeholder, undefined);
  assert.equal(padded[1]?.placeholder, true);
  const counts = countDefaultPlaceholders({
    proofUrls: ["/api/shop-media/med_1"],
    serviceUrls: ["", "/media/heroes/hvac.jpg"],
  });
  assert.equal(counts.proof, 2);
  assert.equal(counts.service, 3);
  assert.equal(counts.total, 5);
  assert.deepEqual(parseServiceThumbs(["/api/shop-media/med_s", "nope"]).length, 3);
});
