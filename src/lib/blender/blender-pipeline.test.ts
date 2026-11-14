import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { GPU_VIDEO_COST_CENTS, assertRenderProfit, renderMarginCents, saleCents } from "../axiom/render-credits.ts";
import { blenderEffectForNiche, blenderEffectIndex } from "./effects.ts";
import { heuristicDirector, parseDirectorShot } from "./creative-director.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("maps plumbing, HVAC, and auto onto hydro, frost, and ember templates", () => {
  assert.equal(blenderEffectForNiche("plumbing"), "hydro-splash");
  assert.equal(blenderEffectForNiche("hvac"), "frost-crystals");
  assert.equal(blenderEffectForNiche("auto"), "embers-sparks");
  assert.equal(blenderEffectIndex("hydro-splash"), 0);
  assert.equal(blenderEffectIndex("frost-crystals"), 1);
  assert.equal(blenderEffectIndex("embers-sparks"), 2);
});

test("creative director etches the tenant mark and locks Cyber-Obsidian HUD", () => {
  const shot = heuristicDirector({
    businessName: "Rogue Rapid Plumbing",
    niche: "plumbing",
    logoGeometry: "data:image/png;base64,aaaa",
  });
  assert.equal(shot.effect, "hydro-splash");
  assert.equal(shot.plateEtch, true);
  assert.match(shot.prompt, /#00f2fe/);
  assert.match(shot.prompt, /crosshair/i);
  assert.match(shot.prompt, /Rogue Rapid/);
  const parsed = parseDirectorShot({ effect: "embers-sparks", viscosity: 9, gravity: 4, prompt: "fire" }, shot);
  assert.equal(parsed.effect, "embers-sparks");
  assert.ok(parsed.viscosity <= 1.2);
  assert.ok(parsed.gravity < 0);
});

test("cloud GPU ~47¢ stays under the 75¢ pack deduction", () => {
  assert.equal(GPU_VIDEO_COST_CENTS, 47);
  assert.equal(saleCents(1), 75);
  assert.equal(renderMarginCents("video"), 28);
  assert.doesNotThrow(() => assertRenderProfit("video", 1));
});

test("headless bpy script and autopilot tick_blender are present", () => {
  const script = join(root, "src/lib/blender/scripts/master_scene.py");
  assert.equal(existsSync(script), true);
  const py = readFileSync(script, "utf8");
  assert.match(py, /import bpy/);
  assert.match(py, /plateEtch/);
  assert.match(py, /hydro-splash|frost-crystals|embers/);
  const route = readFileSync(join(root, "src/app/api/master/autopilot/route.ts"), "utf8");
  const hero = readFileSync(join(root, "src/lib/axiom/hero-motion-studio.server.ts"), "utf8");
  assert.match(route, /tick_blender/);
  assert.match(hero, /renderAutopilotHeroLoop/);
  assert.match(hero, /spendCredits/);
});
