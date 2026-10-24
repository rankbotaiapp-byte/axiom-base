import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { applyLiquidShader, createLiquidUniforms, LIQUID_SURFACE } from "./LiquidOrbShader.ts";

test("the liquid shader keeps the glass surface and displaces the physical orb", () => {
  assert.equal(LIQUID_SURFACE.transmission, 0.95);
  assert.equal(LIQUID_SURFACE.roughness, 0.05);
  assert.equal(LIQUID_SURFACE.thickness, 2.5);
  assert.equal(LIQUID_SURFACE.ior, 1.62);
  assert.equal(LIQUID_SURFACE.iridescence, 1);
  assert.equal(LIQUID_SURFACE.iridescenceIOR, 1.3);

  const next = applyLiquidShader(THREE.ShaderChunk.meshphysical_vert, THREE.ShaderChunk.meshphysical_frag);
  assert.match(next.vertex, /snoise/);
  assert.match(next.vertex, /liquidDisplace/);
  assert.match(next.vertex, /liquidRipple/);
  assert.equal(next.vertex.includes("#include <begin_vertex>"), false);
  assert.match(next.fragment, /vRipple/);
  assert.match(next.vertex, /uVoice/);
  assert.match(next.fragment, /dissolveProgress/);
  assert.match(next.fragment, /spectrumShift/);
  assert.match(next.fragment, /0\.953/);
  assert.match(next.fragment, /0\.718/);

  const uniforms = createLiquidUniforms();
  assert.equal(uniforms.uPull.value, 0);
  assert.equal(uniforms.uWaveAge.value.x, -1);
});
