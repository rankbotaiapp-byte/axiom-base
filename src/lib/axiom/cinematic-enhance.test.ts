import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { enhanceJobPhoto, isRasterJobPhoto } from "./cinematic-enhance.server.ts";

test("raster job photo sniff accepts field stills and rejects video", () => {
  assert.equal(isRasterJobPhoto("image/jpeg", "job.jpg"), true);
  assert.equal(isRasterJobPhoto("image/webp", "hero.webp"), true);
  assert.equal(isRasterJobPhoto("video/mp4", "loop.mp4"), false);
});

test("enhanceJobPhoto rotates, finishes, and emits webp plus thumbnail", async () => {
  const png = await sharp({
    create: { width: 64, height: 48, channels: 3, background: { r: 70, g: 82, b: 94 } },
  })
    .png()
    .toBuffer();
  const out = await enhanceJobPhoto(png);
  assert.equal(out.mime, "image/webp");
  assert.ok(out.webp.byteLength > 32);
  assert.ok(out.thumb.byteLength > 16);
  const meta = await sharp(out.webp).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 64);
  assert.equal(meta.height, 48);
});
