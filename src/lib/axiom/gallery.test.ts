import assert from "node:assert/strict";
import test from "node:test";
import {
  countDefaultPlaceholders,
  DEFAULT_PREVIEW_LABEL,
  defaultProof,
  isCustomStorefrontAsset,
  isDefaultStorefrontAsset,
  nextProofFallback,
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

test("empty shops pad three proof frames with resilient local srcs", () => {
  const frames = defaultProof("hvac");
  assert.equal(frames.length, 3);
  assert.equal(frames.every((frame) => frame.placeholder), true);
  assert.equal(frames.every((frame) => Boolean(frame.src)), true);
  assert.equal(
    frames.every(
      (frame) =>
        frame.src.startsWith("/media/") || frame.src.startsWith("https://images.unsplash.com/"),
    ),
    true,
  );
  const padded = padProofFrames([{ src: "/api/shop-media/med_1", caption: "Job", kind: "image" }], "hvac");
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

test("nextProofFallback walks the cascade then lands on the SVG plate", () => {
  const chain = ["/media/defaults/hvac-1.jpg", "/media/heroes/hvac.jpg", "/media/defaults/proof-plate.svg"];
  assert.equal(nextProofFallback(chain[0]!, chain), chain[1]);
  assert.equal(nextProofFallback(chain[1]!, chain), chain[2]);
  assert.equal(nextProofFallback("missing", []), "/media/defaults/proof-plate.svg");
});
