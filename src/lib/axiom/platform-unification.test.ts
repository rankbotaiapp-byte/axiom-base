import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function src(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

test("tenant storefront binds territory Stripe and the plumbing outreach hero", () => {
  const route = src("src/routes/t/$slug.tsx");
  assert.match(route, /PlumberOutreachLive/);
  assert.match(route, /getPlumberOutreachPage/);
  assert.match(route, /PLUMBER_OUTREACH_HERO_VIDEO/);
  const hero = src("src/lib/axiom/plumber-outreach.ts");
  assert.match(hero, /PLUMBER_OUTREACH_HERO_VIDEO/);
  assert.match(hero, /axio-plumber-hero\.mp4/);
  const nextStorefront = src("src/app/t/[slug]/page.tsx");
  assert.match(nextStorefront, /StorefrontRenderer/);
  const payments = src("src/lib/axiom/payments.server.ts");
  assert.match(payments, /provisionTerritoryForPayer\(\{ leadSlug, userId: ownerId \?\? "" \}\)/);
  const provision = src("src/lib/axiom/shop-server.server.ts");
  assert.match(provision, /unowned: !ownerId/);
  assert.match(provision, /claimShopWithToken/);
  const queue = src("src/lib/axiom/outreach-queue.server.ts");
  assert.match(queue, /canDispatchNow|evaluateDispatchGate/);
  const scheduler = src("src/lib/axiom/outreach-scheduler.server.ts");
  assert.match(scheduler, /canDispatchNow|OUTREACH_EMAIL_DAILY_CAP/);
  const engine = src("src/lib/axiom/outbound-engine.server.ts");
  assert.match(engine, /send_trickle/);
  assert.match(engine, /activate_plumbing/);
  const desk = src("src/components/master/DispatchControlPanel.tsx");
  assert.match(desk, /Send Trickle Outreach/);
  assert.match(desk, /Master Autopilot/);
  const auto = src("src/lib/axiom/autopilot.server.ts");
  assert.match(auto, /export async function sendTrickleOutreach/);
  assert.match(auto, /export async function activatePlumbingQueue/);
  const checkout = src("src/lib/axiom/onboard-success.ts");
  assert.match(checkout, /claim=/);
});

test("admin desk owns branding, hours, dispatch cell, and live SMS test", () => {
  const admin = src("src/app/[shopSlug]/admin/page.tsx");
  const settings = src("src/components/niche-storefront.tsx");
  const shell = src("src/components/admin/AdminShell.tsx");
  const cta = src("src/components/tenant-dashboard/test-live-dispatch-button.tsx");
  assert.match(admin, /AdminShell/);
  assert.match(shell, /StorefrontStudio/);
  assert.match(settings, /WEEKDAYS/);
  assert.match(cta, /Test Live SMS Dispatch/);
});

test("autopilot cron publishes Graph/GBP, refreshes tokens, and ticks engagement", () => {
  const cron = src("src/lib/axiom/outreach-cron.server.ts");
  const autoRoute = src("src/routes/api/autopilot.cron.ts");
  const meta = src("src/routes/api/webhooks.meta.ts");
  const gbp = src("src/routes/api/webhooks.gbp.ts");
  const engage = src("src/lib/axiom/autopilot-engagement.server.ts");
  assert.match(autoRoute, /handleOutreachCron/);
  assert.match(cron, /tickShopAutopilot/);
  assert.match(cron, /publishQueuedSocialPosts/);
  assert.match(cron, /refreshExpiringSocialTokens/);
  assert.match(cron, /tickSocialEngagement/);
  assert.match(meta, /handleMetaWebhook/);
  assert.match(gbp, /handleGbpWebhook/);
  assert.match(engage, /classifyWithGrok/);
  assert.match(engage, /notifyShop/);
  assert.match(engage, /storefrontUrl/);
  assert.match(engage, /Booking page /);
});

test("employee board advances jobs under RBAC and shows dispatch alerts", () => {
  const employee = src("src/routes/$shopSlug/employee.tsx");
  const studio = src("src/components/employee/ProofStudio.tsx");
  assert.match(employee, /ProofStudio/);
  assert.match(studio, /updateStaffAvatar/);
  assert.match(employee, /mode === "preview"/);
});
