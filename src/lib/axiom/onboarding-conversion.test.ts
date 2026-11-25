import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DEFAULT_PLUMBING_STOREFRONT } from "./plumbing-storefront.ts";
import { DEFAULT_COMPETITOR_LAND_GRAB } from "./competitor-land-grab.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("plumbing storefront reaches $1 checkout in one click", () => {
  assert.match(DEFAULT_PLUMBING_STOREFRONT.ctas.trialLabel, /\$1/);
  assert.match(DEFAULT_COMPETITOR_LAND_GRAB.ctaLabel, /\$1/);
  const payments = readFileSync(join(root, "src/lib/axiom/payments.server.ts"), "utf8");
  assert.match(payments, /STOREFRONT_UNLOCK_CENTS|unit_amount.*100|NAME_YOUR_PRICE_MIN_CENTS/);
});

test("stripe return opens a three-step dispatch checklist then live SMS proof", () => {
  const lock = readFileSync(join(root, "src/components/tenant-dashboard/dispatch-phone-lock.tsx"), "utf8");
  const cta = readFileSync(join(root, "src/components/tenant-dashboard/test-live-dispatch-button.tsx"), "utf8");
  const admin = readFileSync(join(root, "src/app/[shopSlug]/admin/page.tsx"), "utf8");
  assert.match(lock, /isPlaceholderDispatchPhone/);
  assert.match(lock, /Test Live SMS Dispatch/);
  assert.match(cta, /Check your phone|Test Live SMS Dispatch/);
  assert.match(admin, /AdminShell/);
});
