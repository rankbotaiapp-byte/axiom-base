import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { easeInOutCubic, freezeOverlayAmount, freezePanOrbit } from "./freeze-pan-orbit.ts";

describe("freeze-pan orbit", () => {
  it("eases from 0 to 1", () => {
    assert.equal(easeInOutCubic(0), 0);
    assert.equal(easeInOutCubic(1), 1);
    assert.ok(easeInOutCubic(0.5) > 0.4 && easeInOutCubic(0.5) < 0.6);
  });

  it("starts and ends facing the frozen subject", () => {
    const a = freezePanOrbit(0, { radius: 5 });
    const b = freezePanOrbit(1, { radius: 5 });
    assert.ok(Math.abs(a.x) < 1e-6);
    assert.ok(a.z > 4.5);
    assert.ok(Math.abs(b.x) < 1e-6);
    assert.ok(b.z > 4.5);
    assert.equal(a.angle, 0);
    assert.ok(Math.abs(b.angle - Math.PI * 2) < 1e-6);
  });

  it("travels a full 360 around the origin", () => {
    const mid = freezePanOrbit(0.5, { radius: 5 });
    assert.ok(mid.z < 0);
    assert.ok(Math.abs(mid.x) < 0.8);
    const q = freezePanOrbit(0.25);
    assert.ok(q.x > 0);
  });

  it("fades overlay in and out so the source film is unobstructed", () => {
    assert.equal(freezeOverlayAmount(0), 0);
    assert.ok(freezeOverlayAmount(0.4) > 0.9);
    assert.ok(freezeOverlayAmount(1) < 0.05);
  });
});
