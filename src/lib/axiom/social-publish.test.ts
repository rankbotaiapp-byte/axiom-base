import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  defaultAutopilotChannels,
  facebookFeedPayload,
  facebookTokenNeedsRefresh,
  gbpLocalPostPayload,
  instagramMediaPayload,
  mergeDeliveries,
  parseDeliveredJson,
  publicMediaUrl,
  tokenNeedsRefresh,
} from "./social-publish.ts";
import { composeSocialPublishJob } from "./autopilot-content.ts";
import { territoryLeadSeedForSlug } from "./territory-bind.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("Graph and GBP payloads carry caption, page, and CTA", () => {
  const fb = facebookFeedPayload({
    pageId: "12345",
    message: "Accurate Plumbing on call in Jackson County.",
    link: "https://example.com/t/accurate-plumbing",
  });
  assert.match(fb.endpoint, /graph\.facebook\.com\/v21\.0\/12345\/feed/);
  assert.equal(fb.body.message.includes("Accurate Plumbing"), true);
  assert.equal(fb.body.link, "https://example.com/t/accurate-plumbing");

  const ig = instagramMediaPayload({
    igUserId: "9988",
    imageUrl: "https://cdn.example.com/still.jpg",
    caption: "Drain emergency",
  });
  assert.match(ig.createEndpoint, /9988\/media$/);
  assert.match(ig.publishEndpoint, /media_publish$/);

  const gbp = gbpLocalPostPayload({
    accountId: "acc-1",
    locationId: "loc-9",
    summary: "Same-day drain service in Medford.",
    articleUrl: "https://example.com/t/accurate-plumbing",
  });
  assert.match(gbp.endpoint, /accounts\/acc-1\/locations\/loc-9\/localPosts/);
  assert.equal(gbp.body.callToAction.actionType, "LEARN_MORE");
  assert.deepEqual(defaultAutopilotChannels(), ["facebook", "instagram", "gbp"]);
});

test("token refresh fires before expiry; Facebook refreshes inside 7 days", () => {
  const soon = new Date(Date.now() + 60_000).toISOString();
  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const fortyDays = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(tokenNeedsRefresh(soon), true);
  assert.equal(tokenNeedsRefresh(threeDays), false);
  assert.equal(facebookTokenNeedsRefresh(threeDays), true);
  assert.equal(facebookTokenNeedsRefresh(fortyDays), false);
  assert.equal(facebookTokenNeedsRefresh(null), true);
});

test("delivery receipts keep platform post ids and timestamps", () => {
  const delivered = parseDeliveredJson([
    { channel: "facebook", platformPostId: "111_222", deliveredAt: "2026-11-10T10:00:00.000Z", ok: true },
    { channel: "myspace", platformPostId: "x", deliveredAt: "2026-11-10T10:00:00.000Z", ok: true },
  ]);
  assert.equal(delivered.length, 1);
  const merged = mergeDeliveries(delivered, [
    {
      channel: "instagram",
      platformPostId: "ig_9",
      deliveredAt: "2026-11-10T10:01:00.000Z",
      ok: true,
    },
  ]);
  assert.equal(merged.length, 2);
  assert.equal(publicMediaUrl("https://app.example", "/api/shop-media/med_a"), "https://app.example/api/shop-media/med_a");
});

test("Accurate Plumbing slug binds a Jackson County territory lead", () => {
  const seed = territoryLeadSeedForSlug("accurate-plumbing");
  assert.ok(seed);
  assert.equal(seed.businessName, "Accurate Plumbing");
  assert.equal(seed.phone, "(541) 555-0100");
  assert.equal(seed.county, "Jackson County");
  assert.equal(seed.city, "Medford");
});

test("autopilot composeSocialPublishJob builds Graph and GBP API payloads", () => {
  const job = composeSocialPublishJob({
    caption: "Jackson County drain emergency — Accurate Plumbing.",
    storefrontUrl: "https://example.com/t/accurate-plumbing",
    imageUrl: "https://cdn.example.com/drain.jpg",
    pageId: "12345",
    igUserId: "9988",
    gbpAccountId: "acc-1",
    gbpLocationId: "loc-9",
  });
  assert.match(job.facebook.endpoint, /12345\/feed/);
  assert.match(job.instagram.createEndpoint, /9988\/media$/);
  assert.match(job.gbp.endpoint, /accounts\/acc-1\/locations\/loc-9\/localPosts/);
});

test("cron and approve paths publish instead of returning an empty delivered array", () => {
  const cron = readFileSync(join(root, "src/lib/axiom/outreach-cron.server.ts"), "utf8");
  const tick = readFileSync(join(root, "src/lib/axiom/shop-autopilot.server.ts"), "utf8");
  const approve = readFileSync(join(root, "src/lib/axiom/media-pipeline.server.ts"), "utf8");
  const oauth = readFileSync(join(root, "src/lib/axiom/social-oauth.server.ts"), "utf8");
  const publish = readFileSync(join(root, "src/lib/axiom/social-publish.server.ts"), "utf8");
  const vercel = readFileSync(join(root, "vercel.json"), "utf8");
  const migration = readFileSync(join(root, "migrations/0084_shop_social_publish.sql"), "utf8");
  assert.match(cron, /refreshExpiringSocialTokens/);
  assert.match(cron, /publishQueuedSocialPosts/);
  assert.match(cron, /socialPublished/);
  assert.match(cron, /socialDeliveries/);
  assert.match(publish, /composeSocialPublishJob/);
  assert.match(publish, /persistDeliveryToSupabase/);
  assert.match(publish, /loadDueAccountsFromSupabase/);
  assert.doesNotMatch(approve, /delivered: \[\],\s*\n\s*pending: \["facebook"/);
  assert.match(tick, /publishQueuedSocialPosts/);
  assert.match(approve, /publishSocialPostForShop/);
  assert.match(approve, /platformPostId/);
  assert.match(oauth, /grant_type/);
  assert.match(oauth, /refresh_token/);
  assert.match(publish, /fb_exchange_token/);
  assert.match(publish, /grant_type: "refresh_token"/);
  assert.match(publish, /SUPABASE_URL|shop_social_accounts/);
  assert.match(publish, /FACEBOOK_PAGE_ACCESS_TOKEN|envSocialAccounts/);
  assert.match(vercel, /\/api\/autopilot\/cron/);
  assert.match(migration, /shop_social_accounts/);
  assert.match(migration, /accurate-plumbing/);
});
