import assert from "node:assert/strict";
import test from "node:test";
import { heroMotionPreview, heroPresetLabel, ownerHeroMedia, parseHeroMotion, planLiveHero } from "./hero-motion.ts";
import { heroClipTooLong } from "./hero-video.ts";

test("owner presets use the trade names on the dashboard", () => {
  assert.equal(heroPresetLabel("field", "Field service"), "Auto Repair");
  assert.equal(heroPresetLabel("landscaper", "Yards"), "Landscaping");
  assert.equal(heroPresetLabel("contractor", "General contractor"), "Trades");
  assert.equal(heroPresetLabel("guide", "Guide services"), "Guide services");
});

test("the live preview pairs the two-word mark with a heroes film", () => {
  const preview = heroMotionPreview("North Frame", "Northline Repair", "/media/heroes/auto-repair.mp4", "");
  assert.equal(preview.line, "North Frame");
  assert.equal(preview.kind, "video");
  assert.equal(preview.mediaUrl, "/media/heroes/auto-repair.mp4");
  const blocked = heroMotionPreview("Axiom", "Northline Repair", "https://example.test/nope.mp4", "/tmp/secret.jpg");
  assert.equal(blocked.line, "Axiom Repair");
  assert.equal(blocked.mediaUrl, "");
});

test("set as live hero pins a catalog film and the motion that the shop can store", () => {
  const plan = planLiveHero(
    { upload: null, catalogVideo: "/media/heroes/landscaper.mp4", catalogImage: "" },
    { pan: true, ripple: true, neon: true, particle: false },
  );
  assert.equal(plan.catalogFilm, "/media/heroes/landscaper.mp4");
  assert.equal(plan.mediaPath, "/media/heroes/landscaper.mp4");
  assert.equal(plan.introPreset, "cinematic-pan");
  assert.equal(plan.glowEnabled, true);
  assert.equal(plan.uploadVideo, false);
  assert.deepEqual(plan.motion, { pan: true, ripple: true, neon: true, particle: false });
});

test("a shop upload is the hero and a catalog film is not", () => {
  assert.equal(heroClipTooLong(21), true);
  assert.equal(heroClipTooLong(12), false);
  assert.equal(heroClipTooLong(Number.NaN), false);
  const owned = ownerHeroMedia("/api/hero-video/shop_abc?v=4", "data:image/jpeg;base64,aa");
  assert.deepEqual(owned, { video: "/api/hero-video/shop_abc?v=4", image: "data:image/jpeg;base64,aa" });
  assert.deepEqual(ownerHeroMedia(null, "data:image/jpeg;base64,aa"), {
    video: "",
    image: "data:image/jpeg;base64,aa",
  });
  assert.equal(ownerHeroMedia("/media/heroes/landscaper.mp4", "/media/heroes/landscaper.jpg"), null);
});

test("an upload replaces the niche film and a stray path is not a hero", () => {
  const uploaded = planLiveHero(
    { upload: "video", catalogVideo: "/media/heroes/trades-hero.mp4", catalogImage: "" },
    parseHeroMotion({ pan: "yes", neon: false }),
  );
  assert.equal(uploaded.uploadVideo, true);
  assert.equal(uploaded.catalogFilm, undefined);
  assert.equal(uploaded.mediaPath, "upload");
  assert.equal(uploaded.introPreset, undefined);
  const stray = planLiveHero(
    { upload: null, catalogVideo: "https://cdn.example/film.mp4", catalogImage: "../secrets.mp4" },
    parseHeroMotion(null),
  );
  assert.equal(stray.mediaPath, "");
  assert.equal(stray.catalogFilm, undefined);
});
