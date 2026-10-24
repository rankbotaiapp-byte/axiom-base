import assert from "node:assert/strict";
import test from "node:test";
import {
  BRAND_STAGES,
  HERO_LOOP_FRAMES,
  HERO_LOOP_FPS,
  HERO_LOOP_HEIGHT,
  HERO_LOOP_WIDTH,
  PROOF_BATCH_LIMIT,
  brandPlate,
  brandStageLabel,
  fittedSize,
  framePlacement,
  frameTiming,
  hasProofDeploy,
  heroDrift,
  heroEncoderConfig,
  isImageFile,
  markProofDeploy,
  proofCaption,
  proofDeployKey,
  takeBatch,
} from "./branded-hero.ts";

test("the brand plate keeps the shop name and a two-letter mark", () => {
  assert.deepEqual(brandPlate("  River   Hawk  "), { line: "River Hawk", mark: "RH" });
  assert.deepEqual(brandPlate("Axiom"), { line: "Axiom", mark: "A" });
  assert.equal(brandPlate("   ").line, "Axiom");
  assert.equal(brandPlate("Northline Repair and Fabrication Studio West").line.length, 42);
  assert.equal(brandStageLabel(0), BRAND_STAGES[0]);
  assert.equal(brandStageLabel(9), BRAND_STAGES[2]);
});

test("the six second drift meets itself and stays on the obsidian field", () => {
  const start = heroDrift(0);
  const end = heroDrift(6);
  assert.ok(Math.abs(start.scale - end.scale) < 1e-9);
  assert.ok(Math.abs(start.x - end.x) < 1e-9);
  assert.ok(Math.abs(start.y - end.y) < 1e-9);
  for (let frame = 0; frame < HERO_LOOP_FRAMES; frame += 1) {
    const drift = heroDrift(frame / HERO_LOOP_FPS);
    for (const source of [
      [900, 1600],
      [1600, 900],
      [1920, 1080],
    ]) {
      const place = framePlacement(source[0]!, source[1]!, HERO_LOOP_WIDTH, HERO_LOOP_HEIGHT, drift);
      assert.ok(place.dx >= -0.05, `left ${frame}`);
      assert.ok(place.dy >= -0.05, `top ${frame}`);
      assert.ok(place.dx + place.dw <= HERO_LOOP_WIDTH + 0.05, `right ${frame}`);
      assert.ok(place.dy + place.dh <= HERO_LOOP_HEIGHT + 0.05, `bottom ${frame}`);
    }
  }
});

test("the encoder asks for a hardware AVC loop and the timestamps fill six seconds", () => {
  const config = heroEncoderConfig();
  assert.equal(config.hardwareAcceleration, "prefer-hardware");
  assert.equal(config.codec, "avc1.42001f");
  assert.equal(config.avc.format, "avc");
  assert.equal(config.width % 2, 0);
  assert.equal(config.height % 2, 0);
  assert.equal(frameTiming(0).timestamp, 0);
  assert.equal(frameTiming(HERO_LOOP_FPS).timestamp, 1_000_000);
  let sum = 0;
  for (let frame = 0; frame < HERO_LOOP_FRAMES; frame += 1) sum += frameTiming(frame).duration;
  assert.equal(sum, 6_000_000);
});

test("proof captions, batch size, and deploy keys stay inside the gallery rules", () => {
  assert.equal(proofCaption("truck_door-final.JPG"), "truck door final");
  assert.equal(proofCaption("   "), "Proof of work");
  assert.equal(proofCaption(`${"a".repeat(90)}.png`).length, 80);
  assert.equal(fittedSize(4000, 3000, 1000).width, 1000);
  assert.equal(fittedSize(4000, 3000, 1000).height, 750);
  const batch = takeBatch([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  assert.equal(batch.kept.length, PROOF_BATCH_LIMIT);
  assert.equal(batch.overflow, 1);
  assert.equal(isImageFile({ type: "image/jpeg", name: "a.jpg" }), true);
  assert.equal(isImageFile({ type: "", name: "site.PNG" }), true);
  assert.equal(isImageFile({ type: "video/mp4", name: "clip.mp4" }), false);
  const key = proofDeployKey("north", "data:image/jpeg;base64,aaaa");
  assert.equal(proofDeployKey("north", "data:image/jpeg;base64,aaaa"), key);
  assert.notEqual(proofDeployKey("north", "data:image/jpeg;base64,bbbb"), key);
  assert.equal(hasProofDeploy(key), false);
  markProofDeploy(key);
  assert.equal(hasProofDeploy(key), true);
});
