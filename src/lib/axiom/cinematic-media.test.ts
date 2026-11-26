import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { TenantStorefrontSchema } from "../schemas/tenant.ts";
import { hydrateLeadStorefront } from "./hydrate-storefront.ts";
import {
  CINEMATIC_GRADE_FILTER,
  CINEMATIC_GRAIN_OPACITY,
  resolveCinemaGrade,
} from "./cinematic-media.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("cinemaGrade defaults on, with per-photo override", () => {
  assert.equal(resolveCinemaGrade(undefined, undefined), true);
  assert.equal(resolveCinemaGrade(true, undefined), true);
  assert.equal(resolveCinemaGrade(false, undefined), false);
  assert.equal(resolveCinemaGrade(false, true), true);
  assert.equal(resolveCinemaGrade(true, false), false);
});

test("tenant storefront schema defaults cinemaGrade true", () => {
  const parsed = TenantStorefrontSchema.parse(hydrateLeadStorefront({
    slug: "ridge-air",
    businessName: "Ridge Air",
    niche: "hvac",
  }));
  assert.equal(parsed.theme.cinemaGrade, true);
});

test("cinematic overlay tokens and pointer-events lock live in the frame CSS", () => {
  const css = readFileSync(join(root, "components/storefront/cinematic-media-frame.css"), "utf8");
  assert.match(css, new RegExp(CINEMATIC_GRADE_FILTER.replace(/[()]/g, "\\$&")));
  assert.match(css, new RegExp(String(CINEMATIC_GRAIN_OPACITY)));
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /#00ffcc/);
  assert.match(css, /#FFE500|#ffe500/);
  assert.match(css, /#050507/);
  const frame = readFileSync(join(root, "components/storefront/CinematicMediaFrame.tsx"), "utf8");
  assert.match(frame, /cmf-overlays/);
  const inbound = readFileSync(join(root, "lib/axiom/twilio-booking.server.ts"), "utf8");
  assert.match(inbound, /NumMedia/);
  assert.match(inbound, /uploadEnhancedImageToStorage/);
  const assets = readFileSync(join(root, "app/api/storefront/assets/route.ts"), "utf8");
  assert.match(assets, /uploadLayoutAssetBundle/);
});
