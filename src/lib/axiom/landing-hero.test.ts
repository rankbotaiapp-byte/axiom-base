import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  LANDING_HERO_CLAIM,
  LANDING_HERO_PRICE,
  LANDING_HERO_PROOF,
  LANDING_REVENUE_MACHINE_HERO,
} from "./landing-hero.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("landing revenue-machine hero is a public still and names the live $1 claim", () => {
  const rel = LANDING_REVENUE_MACHINE_HERO.replace(/^\//, "");
  const file = join(root, "public", rel);
  assert.equal(existsSync(file), true);
  assert.ok(readFileSync(file).byteLength > 50_000);
  assert.match(LANDING_HERO_CLAIM, /\$1/);
  assert.match(LANDING_HERO_PRICE, /verified real lead/);
  assert.match(LANDING_HERO_PROOF, /Before \/ After/);
  const stage = readFileSync(join(root, "src/components/axiom/AxiomHeroStage.tsx"), "utf8");
  assert.match(stage, /LANDING_REVENUE_MACHINE_HERO/);
  assert.doesNotMatch(stage, /AxiomHeroCompare/);
  const landing = readFileSync(join(root, "src/components/axiom/AxiomLanding.tsx"), "utf8");
  assert.match(landing, /AxiomProofCompare/);
});
