import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DEFAULT_PLUMBING_STOREFRONT } from "./plumbing-storefront.ts";
import { DEFAULT_COMPETITOR_LAND_GRAB } from "./competitor-land-grab.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("plumbing storefront reaches $1 checkout in one click", () => {
  const hero = readFileSync(join(root, "src/components/plumbing/emergency-storefront.tsx"), "utf8");
  assert.match(hero, /checkout\.onTrial/);
  assert.match(hero, /Own it forever/);
  assert.match(hero, /checkout \? \(/);
  assert.equal(DEFAULT_PLUMBING_STOREFRONT.ctas.trialLabel, "$1 this month");
  assert.equal(DEFAULT_COMPETITOR_LAND_GRAB.ctaLabel, "$1 this month");
});

test("stripe return opens a three-step dispatch checklist then live SMS proof", () => {
  const lock = readFileSync(join(root, "src/components/tenant-dashboard/dispatch-phone-lock.tsx"), "utf8");
  const desk = readFileSync(join(root, "src/components/tenant-dashboard/PlumberTenantDashboard.tsx"), "utf8");
  const admin = readFileSync(join(root, "src/routes/$shopSlug/admin.tsx"), "utf8");
  const cta = readFileSync(join(root, "src/components/tenant-dashboard/test-live-dispatch-button.tsx"), "utf8");
  const shop = readFileSync(join(root, "src/routes/$shopSlug/route.tsx"), "utf8");
  assert.match(lock, /tenant-lock-steps/);
  assert.match(lock, /isPlaceholderDispatchPhone/);
  assert.match(lock, /Test Live SMS Dispatch/);
  assert.match(lock, /\/admin\/tenant\?slug=/);
  assert.match(desk, /TestLiveDispatchButton/);
  assert.match(desk, /tenant-preview-bar/);
  assert.match(admin, /TestLiveDispatchButton/);
  assert.match(cta, /Check your phone/);
  assert.match(shop, /Owner desk/);
  assert.match(shop, /Crew board/);
  assert.match(shop, /Public page/);
});
