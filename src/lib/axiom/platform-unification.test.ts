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
  const hero = src("src/components/plumbing/plumber-outreach-landing.tsx");
  assert.match(hero, /HERO_FILM = "\/media\/axio-plumber-hero\.mp4"/);
  assert.match(hero, /autoPlay/);
  assert.match(hero, /\bmuted\b/);
  assert.match(hero, /\bloop\b/);
  assert.match(hero, /playsInline/);
  assert.match(hero, /preload="auto"/);
  assert.match(hero, /beginOutreachCheckout|OutreachCheckoutModal/);
  assert.match(hero, /Go live for \$1|fillTemplate\(config\.feature\.ctaLabel/);
  assert.match(hero, /tenant\.known/);
  const payments = src("src/lib/axiom/payments.server.ts");
  assert.match(payments, /provisionTerritoryForPayer\(\{ leadSlug, userId: ownerId \?\? "" \}\)/);
  const provision = src("src/lib/axiom/shop-server.server.ts");
  assert.match(provision, /unowned: !ownerId/);
  assert.match(provision, /claimShopWithToken/);
  const queue = src("src/lib/axiom/outreach-queue.server.ts");
  assert.match(queue, /CONCURRENCY = 6/);
  const scheduler = src("src/lib/axiom/outreach-scheduler.server.ts");
  assert.match(scheduler, /CONCURRENCY = 6/);
  const engine = src("src/lib/axiom/outbound-engine.server.ts");
  assert.match(engine, /send_trickle/);
  assert.match(engine, /activate_plumbing/);
  const desk = src("src/components/master/DispatchControlPanel.tsx");
  assert.match(desk, /Send Trickle Outreach/);
  assert.match(desk, /Master Autopilot/);
  const auto = src("src/lib/axiom/autopilot.server.ts");
  assert.match(auto, /export async function sendTrickleOutreach/);
  assert.match(auto, /export async function activatePlumbingQueue/);
  const checkout = src("src/components/plumbing/outreach-checkout-modal.tsx");
  assert.match(checkout, /claim=/);
});

test("admin desk owns branding, hours, dispatch cell, and live SMS test", () => {
  const admin = src("src/routes/$shopSlug/admin.tsx");
  const settings = src("src/components/operator-panels.tsx");
  const notify = src("src/lib/axiom/shop-server.server.ts");
  assert.match(admin, /TestLiveDispatchButton/);
  assert.match(admin, /ServicesPanel/);
  assert.match(admin, /BrandPanel/);
  assert.match(settings, /updateShopHours/);
  assert.match(settings, /WEEKDAYS/);
  assert.match(settings, /TestLiveDispatchButton/);
  assert.match(notify, /isPlaceholderDispatchPhone/);
  assert.match(notify, /dispatch_phone_locked/);
  assert.match(notify, /advanceJobStatusHandler/);
  assert.match(notify, /updateShopHoursHandler/);
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
  const admin = src("src/routes/$shopSlug/admin.tsx");
  assert.match(employee, /advanceJobStatus/);
  assert.match(employee, /DispatchAlerts/);
  assert.match(employee, /Mark finished/);
  assert.match(employee, /mode === "preview"/);
  assert.match(admin, /data\.mode === "employee"/);
  assert.match(admin, /Navigate to="\/\$shopSlug\/employee"/);
});
