import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { AI_CREDIT_PACK, AI_CREDIT_PACK_CENTS } from "./shop-branding.ts";
import {
  RENDER_CREDIT_PACK,
  RENDER_CREDIT_PACK_CENTS,
  RENDER_MIN_MARGIN_CENTS,
  assertRenderProfit,
  canPurchasePack,
  clampMonthlySpendLimitCents,
  gpuCostCents,
  needsAutoReload,
  renderMarginCents,
  saleCents,
} from "./render-credits.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("$15 buys 20 hero animations and keeps GPU margin", () => {
  assert.equal(RENDER_CREDIT_PACK, 20);
  assert.equal(RENDER_CREDIT_PACK_CENTS, 1_500);
  assert.equal(AI_CREDIT_PACK, 20);
  assert.equal(AI_CREDIT_PACK_CENTS, 1_500);
  assert.equal(saleCents(1), 75);
  assert.ok(gpuCostCents("video", 1) < saleCents(1));
  assert.ok(renderMarginCents("video") >= RENDER_MIN_MARGIN_CENTS);
  assert.doesNotThrow(() => assertRenderProfit("video", 1));
  assert.doesNotThrow(() => assertRenderProfit("image", 1));
});

test("monthly spend slider snaps to pack multiples and blocks over-limit reloads", () => {
  assert.equal(clampMonthlySpendLimitCents(0), 1_500);
  assert.equal(clampMonthlySpendLimitCents(2_200), 1_500);
  assert.equal(clampMonthlySpendLimitCents(2_800), 3_000);
  assert.equal(canPurchasePack(0, 1_500), true);
  assert.equal(canPurchasePack(1_500, 1_500), false);
  assert.equal(needsAutoReload(1, true), true);
  assert.equal(needsAutoReload(8, true), false);
  assert.equal(needsAutoReload(0, false), false);
});

test("wallet checkout, auto-reload, and Stripe webhook kinds are wired", () => {
  const server = readFileSync(join(root, "src/lib/axiom/hero-motion-studio.server.ts"), "utf8");
  const pay = readFileSync(join(root, "src/lib/axiom/payments.server.ts"), "utf8");
  const ui = readFileSync(join(root, "src/components/admin/HeroAnimationStudio.tsx"), "utf8");
  const sql = readFileSync(join(root, "migrations/0093_render_credit_wallet.sql"), "utf8");
  assert.match(server, /assertRenderProfit/);
  assert.match(server, /chargeSavedRenderPack/);
  assert.match(server, /ai_credits_setup/);
  assert.match(server, /payment_intent_data\[setup_future_usage\]/);
  assert.match(pay, /ai_credits_reload/);
  assert.match(pay, /settleAiCreditReload/);
  assert.match(ui, /Auto-reload credits when low/);
  assert.match(ui, /Buy \$15 \/ 20 renders/);
  assert.match(ui, /CinematicHeroCanvas/);
  assert.match(sql, /auto_reload/);
  assert.match(sql, /monthly_spend_limit_cents/);
});
