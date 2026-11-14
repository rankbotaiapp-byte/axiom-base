import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { inspectTemplateAssets } from "./template-assets.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("template tracker flags empty hero, plate, and service slots", () => {
  const empty = inspectTemplateAssets({});
  assert.equal(empty.ready, false);
  assert.deepEqual(empty.missing, ["hero-loop", "branded-plate", "service-media"]);
  const ready = inspectTemplateAssets({
    heroLoop: "/media/otter-hero-animation.mp4",
    brandedPlate: "/media/heroes/plumbing.jpg",
    serviceOnboarded: true,
  });
  assert.equal(ready.ready, true);
  assert.equal(ready.filled, 3);
});

test("Hero Studio, funnel layout, and speaker-phone widget are wired", () => {
  const studio = readFileSync(join(root, "src/app/[shopSlug]/admin/components/HeroStudio.tsx"), "utf8");
  const store = readFileSync(join(root, "src/components/storefront/immutable-storefront.tsx"), "utf8");
  const phone = readFileSync(join(root, "src/components/ai/AvatarSpeakerPhone.tsx"), "utf8");
  assert.match(studio, /TemplateAssetTracker/);
  assert.match(store, /FunnelLayout/);
  assert.match(store, /AvatarSpeakerPhone/);
  assert.match(phone, /speech|companion|speaker-phone/);
});
