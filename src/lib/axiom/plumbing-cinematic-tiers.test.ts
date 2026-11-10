import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  PLUMBING_DIAGNOSTIC_SRC,
  PLUMBING_DIAGNOSTIC_SRC_FALLBACK,
  PLUMBING_FIELD_OPS_SRC,
  PLUMBING_FIELD_OPS_SRC_FALLBACK,
  PLUMBERS_DRAIN_SRC,
} from "../axiom-landing/storefront-films.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function mediaPath(url: string) {
  return join(root, "public", url.replace(/^\//, ""));
}

describe("plumbing cinematic tiers", () => {
  it("ships diagnostic and field-ops loops under /media", () => {
    assert.equal(PLUMBERS_DRAIN_SRC, "/media/plumbers-outreach-hero-animation.mp4");
    assert.equal(PLUMBING_DIAGNOSTIC_SRC, "/media/plumbing-diagnostic-telemetry.mp4");
    assert.equal(PLUMBING_FIELD_OPS_SRC, "/media/plumber-field-operations.mp4");
    assert.equal(existsSync(mediaPath(PLUMBERS_DRAIN_SRC)), true);
    assert.equal(existsSync(mediaPath(PLUMBING_DIAGNOSTIC_SRC)) || existsSync(mediaPath(PLUMBING_DIAGNOSTIC_SRC_FALLBACK)), true);
    assert.equal(existsSync(mediaPath(PLUMBING_FIELD_OPS_SRC)) || existsSync(mediaPath(PLUMBING_FIELD_OPS_SRC_FALLBACK)), true);
  });

  it("wires both films into the plumbing tenant storefront under the drain hero", () => {
    const store = readFileSync(join(root, "src/components/plumbing/emergency-storefront.tsx"), "utf8");
    const heroIdx = store.indexOf("<HeroFilm");
    const diagIdx = store.indexOf("<PlumbingDiagnosticStage");
    const fieldIdx = store.indexOf("<FieldOperationsShowcase");
    assert.ok(heroIdx >= 0, "drain hero missing");
    assert.ok(diagIdx > heroIdx, "diagnostic tier must follow the drain hero");
    assert.ok(fieldIdx > diagIdx, "field ops must follow the diagnostic tier");

    const diagnostic = readFileSync(join(root, "src/components/plumbing/PlumbingDiagnosticStage.tsx"), "utf8");
    assert.match(diagnostic, /PLUMBING_DIAGNOSTIC_SRC/);
    assert.match(diagnostic, /Tap for sound/);
    assert.match(diagnostic, /autoPlay/);
    assert.match(diagnostic, /preload="auto"/);

    const field = readFileSync(join(root, "src/components/plumbing/FieldOperationsShowcase.tsx"), "utf8");
    assert.match(field, /PLUMBING_FIELD_OPS_SRC/);
    assert.match(field, /autoPlay/);
    assert.match(field, /loop/);
    assert.match(field, /muted/);
    assert.match(field, /playsInline/);
    assert.match(field, /preload="auto"/);
    assert.match(field, /rounded-2xl border border-zinc-800\/80 bg-zinc-900\/50/);
  });
});
