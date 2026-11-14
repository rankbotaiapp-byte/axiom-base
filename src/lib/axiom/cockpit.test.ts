import assert from "node:assert/strict";
import test from "node:test";
import { autoBeatFromFilm } from "./auto-sequence.ts";
import { usesAutomotiveCockpit } from "./cockpit.ts";
import { paletteFromFrame } from "./film-palette.ts";

test("mobile mechanic and auto repair open the cockpit", () => {
  assert.equal(usesAutomotiveCockpit("field", "Mobile mechanic"), true);
  assert.equal(usesAutomotiveCockpit("trade", "Auto Repair"), true);
  assert.equal(usesAutomotiveCockpit("field", "Mobile auto service. The van rolls."), true);
  assert.equal(usesAutomotiveCockpit("field", "Field service"), true);
});

test("other field trades keep the cinematic hero", () => {
  assert.equal(usesAutomotiveCockpit("field", "Pest control on the ridge"), false);
  assert.equal(usesAutomotiveCockpit("field", "Handyman"), false);
  assert.equal(usesAutomotiveCockpit("tattoo", "Tattoo shop"), false);
  assert.equal(usesAutomotiveCockpit("detailer", "Auto detailing"), false);
});

test("auto hero film walks from the mechanic into the head unit and then the desk", () => {
  assert.equal(autoBeatFromFilm(0), "mechanic");
  assert.equal(autoBeatFromFilm(9.5), "mechanic");
  assert.equal(autoBeatFromFilm(11.2), "headunit");
  assert.equal(autoBeatFromFilm(18), "headunit");
  assert.equal(autoBeatFromFilm(21.6), "dashboard");
});

test("a warm frame and a cool frame produce different ripple stops", () => {
  const warm = new Uint8ClampedArray([
    220, 120, 40, 255, 210, 90, 30, 255, 180, 70, 20, 255, 200, 100, 40, 255,
    190, 80, 30, 255, 230, 140, 50, 255, 10, 10, 10, 255, 8, 8, 8, 255,
  ]);
  const cool = new Uint8ClampedArray([
    40, 140, 220, 255, 30, 120, 210, 255, 50, 160, 230, 255, 20, 100, 200, 255,
    60, 170, 240, 255, 35, 130, 215, 255, 10, 10, 12, 255, 6, 6, 8, 255,
  ]);
  const sunset = paletteFromFrame(warm);
  const cabin = paletteFromFrame(cool);
  assert.ok(sunset && cabin);
  assert.ok(sunset.accent[0] > sunset.accent[2]);
  assert.ok(cabin.accent[2] > cabin.accent[0]);
  assert.ok(Math.abs(sunset.accent[0] - cabin.accent[0]) > 0.2);
});
