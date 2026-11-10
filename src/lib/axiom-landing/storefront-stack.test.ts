import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("cinematic storefront stack", () => {
  it("stacks hero, brutal truth, field tiers, then how-it-works", () => {
    const landing = readFileSync(join(root, "components/axiom-landing/AxiomMasterLanding.tsx"), "utf8");
    const hero = landing.indexOf("<Hero />");
    const truth = landing.indexOf("<BrutalTruth");
    const tiers = landing.indexOf("<FieldDominanceTiers");
    const how = landing.indexOf("<HowItWorks");
    assert.ok(hero >= 0 && truth > hero && tiers > truth && how > tiers);
    assert.doesNotMatch(landing, /HeroPipelineDiagnostic/);
  });

  it("paces cinematic tiers with void buffers on an obsidian stack", () => {
    const css = readFileSync(join(root, "styles.css"), "utf8");
    assert.match(css, /--color-void:\s*#07080c/i);
    assert.match(css, /\.am-stack-buffer/);
    assert.match(css, /padding-block:\s*7rem/);
    const tiers = readFileSync(join(root, "components/axiom-landing/FieldDominanceTiers.tsx"), "utf8");
    assert.match(tiers, /PLUMBERS_DRAIN_SRC/);
    assert.match(tiers, /PLUMBING_DIAGNOSTIC_SRC/);
    assert.match(tiers, /PLUMBING_FIELD_OPS_SRC/);
    assert.match(tiers, /autoPlay/);
  });

  it("keeps the top hero film uncrowded with a clear offer overlay", () => {
    const hero = readFileSync(join(root, "components/axiom-landing/Hero.tsx"), "utf8");
    assert.match(hero, /HEART_GEARS_ALIAS/);
    assert.match(hero, /Stop Losing After-Hours Calls to Voicemail/);
    assert.match(hero, /\$1 this month/);
    assert.match(hero, /View Live Trade Demos/);
    assert.doesNotMatch(hero, /HERO_FEED/);
  });
});
