import assert from "node:assert/strict";
import test from "node:test";
import { CORE_PRESENCE_FRAG } from "../../components/core-presence-shader.ts";
import {
  CORE_SURFACES,
  INSIDE_CAMERA,
  ORBIT_RADIUS,
  approachCamera,
  GLASS_CLEARANCE,
  cameraDistance,
  frameCover,
  mixCamera,
  orbitCamera,
  stateIndex,
  surfaceAt,
} from "./core-presence.ts";

test("the orbit meets itself and the step-inside stop stays outside the glass", () => {
  const start = orbitCamera(0);
  const lap = orbitCamera(1);
  assert.ok(Math.abs(start.x - lap.x) < 1e-6);
  assert.ok(Math.abs(start.y - lap.y) < 1e-6);
  assert.ok(Math.abs(start.z - lap.z) < 1e-6);
  assert.ok(Math.abs(start.z - ORBIT_RADIUS) < 1e-6);
  assert.ok(Math.abs(orbitCamera(0.25).x - ORBIT_RADIUS) < 1e-6);
  const parked = mixCamera(start, 0);
  assert.ok(Math.abs(parked.z - start.z) < 1e-6);
  const inside = mixCamera(start, 1);
  assert.ok(Math.abs(inside.z - INSIDE_CAMERA.z) < 1e-6);
  assert.ok(cameraDistance(INSIDE_CAMERA) > 1.4);
  assert.ok(cameraDistance(INSIDE_CAMERA) < ORBIT_RADIUS);
  const cover = frameCover(400, 400, 1280, 720);
  assert.ok(cover.mulX > 0.4 && cover.mulX < 0.7);
  assert.ok(cover.addX > 0.15 && cover.addX < 0.35);
  assert.ok(Math.abs(cover.mulY - 1) < 0.05);
  const flown = approachCamera(start);
  assert.ok(cameraDistance(flown) > GLASS_CLEARANCE - 0.01);
  assert.ok(cameraDistance(flown) < ORBIT_RADIUS);
  assert.ok(flown.z > 0 && flown.z < start.z);
  const side = orbitCamera(0.25);
  const joined = approachCamera(side);
  const sameWay = side.x * joined.x + side.y * joined.y + side.z * joined.z;
  assert.ok(sameWay > 0);
});

test("the four states blend from water through fog", () => {
  assert.equal(stateIndex("water"), 0);
  assert.equal(stateIndex("fog"), 3);
  assert.equal(surfaceAt(0).warp, CORE_SURFACES.water.warp);
  assert.equal(surfaceAt(3).fog, CORE_SURFACES.fog.fog);
  const mid = surfaceAt(0.5);
  assert.ok(mid.displace > CORE_SURFACES.water.displace);
  assert.ok(mid.displace < CORE_SURFACES.goop.displace);
  assert.ok(surfaceAt(2).metal > 0.9);
  assert.match(CORE_PRESENCE_FRAG, /uVideo/);
  assert.match(CORE_PRESENCE_FRAG, /vel \* uWarp/);
  assert.match(CORE_PRESENCE_FRAG, /vel \* shear/);
  assert.match(CORE_PRESENCE_FRAG, /1\.0 - uBreak/);
  assert.doesNotMatch(CORE_PRESENCE_FRAG, /smear \* uBreak \+/);
  assert.match(CORE_PRESENCE_FRAG, /0\.953/);
  assert.match(CORE_PRESENCE_FRAG, /0\.718/);
});
