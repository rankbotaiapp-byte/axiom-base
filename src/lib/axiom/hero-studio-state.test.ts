import assert from "node:assert/strict";
import test from "node:test";
import { readHeroAnimationPresets } from "./hero-animation-scan.server.ts";
import {
  AUTO_HERO_ANIMATION,
  LEOPARD_HERO_ANIMATION,
  boundHeroAnimation,
  cleanHeroUrl,
  heroAnimationLabel,
  heroAnimationsFromNames,
  isHeroAnimationFile,
  heroPresets,
  mediaLibrary,
  readHeroDraft,
  resolveHeroSelection,
  resolveStorefrontFilm,
  writeHeroDraft,
} from "./hero-studio-state.ts";

test("studio draft replaces the shop film and tagline", () => {
  const memory = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  });
  try {
    writeHeroDraft("Rogue-River", {
      hero_video_url: "/media/leopard-hero-animation.mp4",
      tagline: "Night water",
    });
    const draft = readHeroDraft("rogue-river");
    assert.equal(draft?.hero_video_url, "/media/leopard-hero-animation.mp4");
    const selection = resolveHeroSelection({
      draft,
      shopVideoUrl: "/media/guide-service-hero-animation.mp4",
      fallbackVideoUrl: "/media/orb-explosion-hero-animation.mp4",
      shopTagline: "Old line",
    });
    assert.equal(selection.source, "studio");
    assert.equal(selection.hero_video_url, "/media/leopard-hero-animation.mp4");
    assert.equal(selection.tagline, "Night water");
    assert.equal(cleanHeroUrl("javascript:alert(1)"), "");
    assert.equal(cleanHeroUrl("/media/leopard-hero-animation.mp4"), "/media/leopard-hero-animation.mp4");
    assert.equal(cleanHeroUrl("/media/../secret.mp4"), "");
    assert.equal(heroPresets().every((preset) => preset.url.endsWith("-hero-animation.mp4")), true);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
});

test("auto and wildlife niches use the new animation loops", () => {
  assert.equal(boundHeroAnimation("field"), AUTO_HERO_ANIMATION);
  assert.equal(boundHeroAnimation("trade", "cyberpunk garage"), AUTO_HERO_ANIMATION);
  assert.equal(boundHeroAnimation("hunting", "wildlife"), LEOPARD_HERO_ANIMATION);
  assert.equal(boundHeroAnimation("guide", "outdoor expedition"), LEOPARD_HERO_ANIMATION);
  const wild = resolveStorefrontFilm({
    draft: null,
    shopVideoUrl: "/media/leopard-hero-animation.mp4",
    niche: "hunting",
    customNiche: "wildlife",
    fallbackVideoUrl: "/media/owl-attack-hero-animation.mp4",
    shopTagline: "Night country",
  });
  assert.equal(wild.hero_video_url, LEOPARD_HERO_ANIMATION);
  const picked = resolveStorefrontFilm({
    draft: {
      hero_video_url: AUTO_HERO_ANIMATION,
      tagline: "Night garage",
      updatedAt: "2026-10-28T00:00:00.000Z",
    },
    shopVideoUrl: "/media/leopard-hero-animation.mp4",
    niche: "hunting",
    customNiche: "wildlife",
    fallbackVideoUrl: "/media/owl-attack-hero-animation.mp4",
    shopTagline: "Night country",
  });
  assert.equal(picked.source, "studio");
  assert.equal(picked.hero_video_url, AUTO_HERO_ANIMATION);
  assert.equal(picked.tagline, "Night garage");
  const unbound = resolveStorefrontFilm({
    draft: null,
    shopVideoUrl: "/media/heroes/legacy-guide.mp4",
    niche: "guide",
    customNiche: "guided river fishing",
    fallbackVideoUrl: "/media/orb-explosion-hero-animation.mp4",
    shopTagline: "Water",
  });
  assert.equal(unbound.hero_video_url, "/media/guide-service-hero-animation.mp4");
  const scanned = heroAnimationsFromNames([
    "auto-hero-animation.mp4",
    "leopard-hero-animation.mp4",
    "auto-hero-animation.mp4",
    "auto-hero-animation.mp4.mp4",
    "leapard-hero-aniation.mp4.mp4",
    "guide.mp4",
    "hunting-guide.mp4",
  ]);
  assert.deepEqual(scanned.map((row) => row.label), ["Auto", "Leopard"]);
  assert.equal(scanned.every((row) => row.url.endsWith("-hero-animation.mp4")), true);
  assert.equal(heroAnimationLabel("snow-cat-hero-animation.mp4"), "Snow Cat");
  assert.equal(isHeroAnimationFile("auto-hero-animation.mp4"), true);
  assert.equal(isHeroAnimationFile("auto-hero-animation.mp4.mp4"), false);
  assert.equal(isHeroAnimationFile("leopard.mp4"), false);
  const library = mediaLibrary();
  assert.equal(library.some((row) => row.url.includes("/heroes/")), false);
  assert.equal(library.some((row) => row.url === AUTO_HERO_ANIMATION), true);
  const onDisk = readHeroAnimationPresets();
  assert.equal(onDisk.some((row) => row.url === AUTO_HERO_ANIMATION), true);
  assert.equal(onDisk.some((row) => row.url === LEOPARD_HERO_ANIMATION), true);
  assert.equal(onDisk.every((row) => /-hero-animation\.mp4$/.test(row.url)), true);
});

test("a shop film is used when the studio has not published", () => {
  const selection = resolveHeroSelection({
    draft: null,
    shopVideoUrl: "/api/hero-video/shop_demo?v=1",
    fallbackVideoUrl: "/media/electrician-hero-animation.mp4",
    shopTagline: "The book stays open",
  });
  assert.equal(selection.source, "shop");
  assert.equal(selection.hero_video_url, "/api/hero-video/shop_demo?v=1");
  assert.equal(selection.tagline, "The book stays open");
});
