import assert from "node:assert/strict";
import test from "node:test";
import { CORE_SPHERE_FRAG } from "../../components/core-sphere-shader.ts";
import {
  clearInquiry,
  createFluid,
  diffuseGlyphs,
  gestureCurl,
  gestureVelocity,
  injectGesture,
  packField,
  stepFluid,
  swipeBreaksGlyphs,
  textShear,
  unpackVelocity,
  videoCoverMap,
} from "./orb-fluid.ts";

test("a straight drag pushes velocity and dye along the pointer", () => {
  const field = createFluid();
  const motion = gestureVelocity(40, 0, 1 / 60);
  assert.ok(motion.vx > 1000);
  assert.equal(gestureCurl(motion.vx, 0, motion.vx, 0), 0);
  injectGesture(field, 0.5, 0.5, motion.vx, motion.vy, 0);
  const center = textShear(field, 0.5, 0.5);
  assert.ok(center.x > 1);
  assert.ok(Math.abs(center.y) < center.x * 0.35);
  assert.ok(center.dissolve > 0.42);
  const i = 18 + 18 * field.size;
  assert.ok((field.cyan[i] ?? 0) > 0.4);
});

test("a turning gesture adds a tangential vortex", () => {
  const field = createFluid();
  const curl = gestureCurl(1200, 0, 0, 1200);
  assert.ok(curl > 0);
  injectGesture(field, 0.5, 0.5, 700, 0, curl);
  const right = 20 + 18 * field.size;
  assert.ok((field.vy[right] ?? 0) > 0.4);
});

test("dye advects downstream and a center swipe breaks the glyphs", () => {
  const field = createFluid();
  field.vx.fill(4);
  field.cyan[10 + 18 * field.size] = 1;
  stepFluid(field, 0.2);
  assert.ok((field.cyan[16 + 18 * field.size] ?? 0) > 0.4);
  assert.ok((field.cyan[10 + 18 * field.size] ?? 0) < 0.25);

  const calm = createFluid();
  assert.equal(swipeBreaksGlyphs(calm), false);
  injectGesture(calm, 0.5, 0.5, 1600, 80, 0);
  assert.equal(swipeBreaksGlyphs(calm), true);
  const before = calm.heldGold[18 + 18 * calm.size] ?? 0;
  diffuseGlyphs(calm);
  assert.ok((calm.heldGold[18 + 18 * calm.size] ?? 0) > before);
  const edge = createFluid();
  injectGesture(edge, 0.02, 0.02, 1600, 0, 0);
  assert.equal(swipeBreaksGlyphs(edge), false);
});

test("melted letters stay in the dye until the next inquiry", () => {
  const field = createFluid();
  diffuseGlyphs(field);
  let before = 0;
  for (const value of field.heldGold) before += value;
  assert.ok(before > 1);
  for (let step = 0; step < 480; step += 1) stepFluid(field, 1 / 60);
  let after = 0;
  for (const value of field.heldGold) after += value;
  assert.ok(after > before * 0.7);

  const gesture = createFluid();
  gesture.cyan[18 + 18 * gesture.size] = 1;
  for (let step = 0; step < 480; step += 1) stepFluid(gesture, 1 / 60);
  assert.ok((gesture.cyan[18 + 18 * gesture.size] ?? 0) < 0.05);

  clearInquiry(field);
  let left = 0;
  for (let i = 0; i < field.heldGold.length; i += 1) {
    left += (field.heldGold[i] ?? 0) + (field.heldCyan[i] ?? 0) + (field.gold[i] ?? 0) + (field.cyan[i] ?? 0);
  }
  assert.equal(left, 0);
});

test("the field pack round-trips velocity and the shader shears ink into cyan and gold", () => {
  const field = createFluid(4);
  field.vx[0] = 1;
  field.vy[0] = -0.5;
  const bytes = new Uint8Array(4 * 4 * 4);
  packField(field, bytes);
  const back = unpackVelocity(bytes[0] ?? 0, bytes[1] ?? 0);
  assert.ok(Math.abs(back.vx - 1) < 0.08);
  assert.ok(Math.abs(back.vy + 0.5) < 0.08);
  assert.match(CORE_SPHERE_FRAG, /uField/);
  assert.match(CORE_SPHERE_FRAG, /vel \* shear/);
  assert.match(CORE_SPHERE_FRAG, /1\.0 - uBreak/);
  assert.doesNotMatch(CORE_SPHERE_FRAG, /smear \* uBreak \+/);
  assert.match(CORE_SPHERE_FRAG, /0\.953/);
  assert.match(CORE_SPHERE_FRAG, /0\.718/);

  const cover = videoCoverMap({
    cardW: 400,
    cardH: 500,
    videoW: 1280,
    videoH: 720,
    orbX: 100,
    orbY: 140,
    orbSize: 200,
  });
  assert.ok(cover.mulX > 0 && cover.mulX < 0.5);
  assert.ok(cover.addX > 0.2 && cover.addX < 0.6);
});
