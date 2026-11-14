import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  LEAD_CAPTURE_HAPTIC,
  STRIPE_SETTLEMENT_HAPTIC,
  VIDEO_BRUSH_HEAVY,
  VIDEO_BRUSH_LIGHT,
  axiomTactile,
  brushIntensityFromVelocity,
  clampStereoPan,
  panFromClientX,
  tactileCueForPulse,
} from "./tactile-engine.ts";

const root = join(import.meta.dirname, "../../..");

test("stereo pan clamps to HRTF range and maps pointer X", () => {
  assert.equal(clampStereoPan(-4), -1);
  assert.equal(clampStereoPan(2), 1);
  assert.equal(clampStereoPan(Number.NaN), 0);
  assert.equal(panFromClientX(0, 1000), -1);
  assert.equal(panFromClientX(1000, 1000), 1);
  assert.equal(panFromClientX(500, 1000), 0);
});

test("brush velocity and companion pulses map onto tactile cues", () => {
  assert.equal(brushIntensityFromVelocity(0.2), "light");
  assert.equal(brushIntensityFromVelocity(2), "heavy");
  assert.equal(tactileCueForPulse("emergency"), "lead");
  assert.equal(tactileCueForPulse("trial"), "stripe");
  assert.equal(tactileCueForPulse("autopilot"), null);
  assert.deepEqual([...LEAD_CAPTURE_HAPTIC], [20, 50, 40, 50, 120]);
  assert.equal(STRIPE_SETTLEMENT_HAPTIC, 140);
  assert.ok(VIDEO_BRUSH_LIGHT.length >= 3);
  assert.ok(VIDEO_BRUSH_HEAVY[0]! > VIDEO_BRUSH_LIGHT[0]!);
});

test("engine methods are safe off-window (Node test runner)", () => {
  assert.doesNotThrow(() => axiomTactile.triggerLeadCapture());
  assert.doesNotThrow(() => axiomTactile.triggerStripeSettlement());
  assert.doesNotThrow(() => axiomTactile.triggerVideoBrushBy("heavy", 3));
  assert.doesNotThrow(() => axiomTactile.dispatchCue("lead"));
});

test("HUD, companion, checkout, and hero film surfaces wire the tactile engine", () => {
  const engine = readFileSync(join(root, "src/lib/axiom/tactile-engine.ts"), "utf8");
  assert.match(engine, /panningModel = "HRTF"/);
  assert.match(engine, /triggerLeadCapture/);
  assert.match(engine, /triggerStripeSettlement/);
  assert.match(engine, /triggerVideoBrushBy/);
  const comms = readFileSync(join(root, "src/lib/axiom/companion-comms.ts"), "utf8");
  assert.match(comms, /tactileCueForPulse/);
  assert.match(comms, /axiomTactile\.dispatchCue/);
  const ring = readFileSync(join(root, "src/components/axiom-ring.tsx"), "utf8");
  assert.match(ring, /pulseHaptic\("settle"\)/);
  const audio = readFileSync(join(root, "src/components/interface-audio.tsx"), "utf8");
  assert.match(audio, /axiomTactile\.triggerVideoBrushBy/);
  assert.match(audio, /axiom-tactile/);
  const canvas = readFileSync(join(root, "src/components/canvas/CinematicHeroCanvas.tsx"), "utf8");
  assert.match(canvas, /data-tactile-film/);
  const checkout = readFileSync(join(root, "src/components/pricing/LaunchCheckoutDrawer.tsx"), "utf8");
  assert.match(checkout, /cue: "stripe"/);
  const landing = readFileSync(join(root, "src/components/plumbing/plumber-outreach-landing.tsx"), "utf8");
  assert.match(landing, /triggerLeadCapture/);
});
