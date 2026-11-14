import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  brandSafeReply,
  classifySocialIntent,
  extractContactFromText,
  heuristicIntent,
  metaVerifyChallenge,
  parseClassifiedJson,
  parseGbpWebhookPayload,
  parseMetaWebhookPayload,
  metaSignatureMatches,
  storefrontPath,
  storefrontUrl,
} from "./autopilot-engagement.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("booking comments become warm leads and include the tenant storefront", () => {
  const classified = classifySocialIntent({
    text: "Can you come out today? Our main drain is clogged. Call me at (541) 555-0199",
    shopName: "Accurate Plumbing",
    slug: "accurate-plumbing",
    origin: "https://axiom.example",
    fromName: "Jordan Lee",
  });
  assert.equal(classified.intent, "booking");
  assert.equal(classified.booking, true);
  assert.equal(classified.liveNeed, true);
  assert.equal(classified.contactPhone, "+15415550199");
  assert.match(classified.reply, /\/t\/accurate-plumbing/);
  assert.equal(storefrontPath("accurate-plumbing"), "/t/accurate-plumbing");
  assert.equal(storefrontUrl("https://axiom.example/", "accurate-plumbing"), "https://axiom.example/t/accurate-plumbing");
});

test("pricing, review, and generic questions stay brand-safe", () => {
  assert.equal(heuristicIntent("How much to snake a kitchen sink?").intent, "pricing");
  assert.equal(heuristicIntent("Five stars, great job last week").intent, "review");
  assert.equal(heuristicIntent("Do you work Saturdays?").intent, "question");
  const reply = brandSafeReply({
    shopName: "Accurate Plumbing",
    slug: "accurate-plumbing",
    origin: "https://axiom.example",
    intent: "question",
    fromName: "Sam",
  });
  assert.match(reply, /Accurate Plumbing/);
  assert.match(reply, /\/t\/accurate-plumbing/);
  assert.ok(reply.length < 280);
});

test("Meta and GBP webhooks parse comments, DMs, reviews, and Q&A", () => {
  const meta = parseMetaWebhookPayload({
    object: "page",
    entry: [
      {
        id: "page_1",
        time: 1730000000,
        changes: [
          {
            field: "feed",
            value: {
              item: "comment",
              verb: "add",
              comment_id: "c_9",
              post_id: "p_1",
              message: "Need a plumber today",
              from: { id: "user_2", name: "Alex" },
            },
          },
        ],
        messaging: [{ sender: { id: "user_3" }, message: { mid: "m_1", text: "What's a hydro jet cost?" }, timestamp: 1730000001000 }],
      },
    ],
  });
  assert.equal(meta.length, 2);
  assert.equal(meta[0]?.kind, "comment");
  assert.equal(meta[0]?.fromName, "Alex");
  assert.equal(meta[1]?.kind, "dm");
  assert.match(meta[1]?.text ?? "", /hydro jet/i);

  const gbp = parseGbpWebhookPayload({
    locationId: "loc_8",
    review: {
      reviewId: "rev_1",
      comment: "Fixed our overflow fast",
      starRating: "FIVE",
      reviewer: { displayName: "Pat" },
    },
    question: { name: "q_1", text: "Do you do water heaters?" },
  });
  assert.equal(gbp.some((row) => row.kind === "review"), true);
  assert.equal(gbp.some((row) => row.kind === "question"), true);
});

test("AI JSON merge keeps the storefront link and extracted contact", () => {
  const fallback = classifySocialIntent({
    text: "quote please",
    shopName: "Accurate Plumbing",
    slug: "accurate-plumbing",
    origin: "https://axiom.example",
  });
  const merged = parseClassifiedJson(
    '{"intent":"pricing","reply":"Open us here https://axiom.example/t/accurate-plumbing","phone":"5415550100","confidence":0.9}',
    fallback,
  );
  assert.equal(merged.intent, "pricing");
  assert.match(merged.reply, /\/t\/accurate-plumbing/);
  assert.equal(extractContactFromText("reach me 541-555-0100").phone, "+15415550100");
});

test("Meta verify + signature and cron engagement tick are wired", () => {
  const params = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.verify_token": "secret",
    "hub.challenge": "12345",
  });
  assert.equal(metaVerifyChallenge(params, "secret"), "12345");
  assert.equal(metaVerifyChallenge(params, "nope"), null);

  const body = '{"object":"page"}';
  const header = `sha256=${createHmac("sha256", "app-secret").update(body).digest("hex")}`;
  assert.equal(metaSignatureMatches(body, header, "app-secret"), true);
  assert.equal(metaSignatureMatches(body, "sha256=deadbeef", "app-secret"), false);

  const cron = readFileSync(join(root, "src/lib/axiom/outreach-cron.server.ts"), "utf8");
  const metaRoute = readFileSync(join(root, "src/routes/api/webhooks.meta.ts"), "utf8");
  const gbpRoute = readFileSync(join(root, "src/routes/api/webhooks.gbp.ts"), "utf8");
  const worker = readFileSync(join(root, "src/lib/axiom/autopilot-engagement.server.ts"), "utf8");
  const sql = readFileSync(join(root, "migrations/0085_social_engagement.sql"), "utf8");
  assert.match(cron, /tickSocialEngagement/);
  assert.match(metaRoute, /handleMetaWebhook/);
  assert.match(gbpRoute, /handleGbpWebhook/);
  assert.match(worker, /notifyShop/);
  assert.match(worker, /consumer_leads/);
  assert.match(worker, /api\.x\.ai\/v1\/chat\/completions/);
  assert.match(sql, /shop_social_inbox/);
});
