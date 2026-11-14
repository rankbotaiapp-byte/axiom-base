import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  FALLBACK_HERO_LOOP,
  FALLBACK_HERO_POSTER,
  isGitLfsPointerText,
  resolvePublicMediaUrl,
  toRootPublicPath,
} from "./public-media.ts";
import { resolveShopHeroFilm } from "./resolve-hero-film.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("tenant shop routes collapse onto /media and /assets", () => {
  assert.equal(toRootPublicPath("/media/auto-hero-animation.mp4"), "/media/auto-hero-animation.mp4");
  assert.equal(toRootPublicPath("media/auto-hero-animation.mp4"), "/media/auto-hero-animation.mp4");
  assert.equal(toRootPublicPath("auto-hero-animation.mp4"), "/media/auto-hero-animation.mp4");
  assert.equal(toRootPublicPath("public/media/otter-hero-animation.mp4"), "/media/otter-hero-animation.mp4");
  assert.equal(toRootPublicPath("/axiom-auto/media/auto-hero-animation.mp4"), "/media/auto-hero-animation.mp4");
  assert.equal(toRootPublicPath("/axiom-auto/admin/media/auto-hero-animation.mp4"), "/media/auto-hero-animation.mp4");
  assert.equal(toRootPublicPath("/assets/avatars/cyber-male-intro.mp4"), "/assets/avatars/cyber-male-intro.mp4");
  assert.equal(toRootPublicPath("/shop/assets/avatars/cyber-male-intro.mp4"), "/assets/avatars/cyber-male-intro.mp4");
  assert.equal(toRootPublicPath("/api/hero-video/shop_1?v=2"), "/api/hero-video/shop_1?v=2");
  assert.equal(toRootPublicPath("../media/secret.mp4"), "");
});

test("origin prefix yields an absolute domain URL for the video element", () => {
  assert.equal(
    resolvePublicMediaUrl("/media/auto-hero-animation.mp4", "https://axiom.example"),
    "https://axiom.example/media/auto-hero-animation.mp4",
  );
  assert.equal(
    resolvePublicMediaUrl("https://cdn.example/film.mp4", "https://axiom.example"),
    "https://cdn.example/film.mp4",
  );
  assert.equal(resolvePublicMediaUrl(FALLBACK_HERO_POSTER), FALLBACK_HERO_POSTER);
  assert.equal(resolvePublicMediaUrl(FALLBACK_HERO_LOOP), FALLBACK_HERO_LOOP);
});

test("shop hero pins stored under a tenant path still resolve to /media", () => {
  assert.equal(
    resolveShopHeroFilm({ overrideHeroVideoUrl: "/acme-plumbing/media/axio-plumber-hero.mp4", niche: "plumbing" }),
    "/media/axio-plumber-hero.mp4",
  );
});

test("public/media MP4s on disk are real ISO BMFF files, not Git LFS pointers", () => {
  const sample = readFileSync(join(root, "public/media/auto-hero-animation.mp4"));
  assert.equal(isGitLfsPointerText(sample.subarray(0, 256)), false);
  const ascii = sample.subarray(4, 8).toString("ascii");
  assert.equal(ascii, "ftyp");
  assert.ok(sample.byteLength > 10_000);
});
