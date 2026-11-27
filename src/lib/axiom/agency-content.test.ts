import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  captionHitsRecent,
  composeProofCaption,
  emptyCreditHeroDecision,
  extractProofAtoms,
  pickUnusedAssetUrl,
  shouldSendOpsAlert,
  SOCIAL_REAUTH_COPY,
} from "./autopilot-caption.ts";
import { isExpiredOAuthError, tokenNeedsRefresh } from "./social-publish.ts";
import {
  buildTenantPublishBundle,
  canPublishItem,
  createSimulationSocialAdapter,
  livePublishCounted,
  publishFingerprint,
  runPublishPlan,
} from "./autopilot-publish.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("asset fingerprint ignores calendar day and rotates to the next unused still", async () => {
  const still = "https://cdn.example.com/van.webp";
  const day1 = publishFingerprint({
    shopId: "shop_a",
    target: "facebook",
    stillUrl: still,
    day: "2026-11-22",
  });
  const day2 = publishFingerprint({
    shopId: "shop_a",
    target: "facebook",
    stillUrl: still,
    day: "2026-11-23",
  });
  assert.equal(day1, day2);
  assert.doesNotMatch(day1, /2026-11-2/);
  const gate = canPublishItem(
    [{ key: day1, shopId: "shop_a", target: "facebook", day: "2026-11-22", status: "published" }],
    { shopId: "shop_a", target: "facebook", fingerprint: day2, day: "2026-11-23", perRunPosted: 0 },
  );
  assert.equal(gate.ok, false);
  if (!gate.ok) assert.equal(gate.reason, "duplicate");

  const used = new Set(["shop_a|https://cdn.example.com/van.webp"]);
  const next = pickUnusedAssetUrl(
    ["https://cdn.example.com/van.webp", "https://cdn.example.com/panel.webp"],
    used,
    "shop_a",
  );
  assert.equal(next, "https://cdn.example.com/panel.webp");

  const bundle = buildTenantPublishBundle({
    shopId: "shop_a",
    slug: "ridge-plumbing",
    shopName: "Ridge Plumbing",
    niche: "plumbing",
    city: "Ashland",
    stillUrl: still,
    proofAtom: "Camera-scoped a kitchen drain and pulled the clog the same afternoon",
    now: new Date("2026-11-22T20:00:00.000Z"),
  });
  const adapter = createSimulationSocialAdapter();
  const first = await runPublishPlan({
    bundle,
    adapter,
    branding: { shopName: "Ridge Plumbing" },
    now: new Date("2026-11-22T20:00:00.000Z"),
  });
  const second = await runPublishPlan({
    bundle,
    adapter,
    ledger: first.ledger,
    branding: { shopName: "Ridge Plumbing" },
    now: new Date("2026-11-23T20:00:00.000Z"),
  });
  assert.ok(second.receipts.every((row) => row.status === "skipped"));
  assert.equal(livePublishCounted(first.receipts, "simulation"), false);
});

test("captions fail closed without a shop-specific proof atom", () => {
  const missing = composeProofCaption({
    shopName: "Ridge Plumbing",
    city: "Ashland",
    tradeLabel: "Plumbing",
    proofAtom: "",
  });
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.reason, "queued_needs_copy");

  const generic = composeProofCaption({
    shopName: "Ridge Plumbing",
    city: "Ashland",
    tradeLabel: "Plumbing",
    proofAtom: "Book today",
  });
  assert.equal(generic.ok, false);

  const atoms = extractProofAtoms({ tagline: "quality work" }, ["Camera-scoped a kitchen drain in Ashland"]);
  assert.ok(atoms.some((atom) => /camera-scoped/i.test(atom)));

  const ok = composeProofCaption({
    shopName: "Ridge Plumbing",
    city: "Ashland",
    tradeLabel: "Plumbing",
    proofAtom: "Camera-scoped a kitchen drain and pulled the clog the same afternoon",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.match(ok.caption, /Ridge Plumbing/);
    assert.match(ok.caption, /Ashland/);
    assert.doesNotMatch(ok.caption, /541-555-0100/);
    assert.equal(captionHitsRecent(ok.caption, [ok.caption]), true);
  }

  const rejected = buildTenantPublishBundle({
    shopId: "shop_a",
    slug: "ridge-plumbing",
    shopName: "Ridge Plumbing",
    niche: "plumbing",
    city: "Ashland",
    stillUrl: "https://cdn.example.com/van.webp",
  });
  assert.equal(rejected.approved, false);
  assert.equal(rejected.rejectReason, "queued_needs_copy");
});

test("blank Google expiry needs refresh; expired Meta marks reauth once", () => {
  assert.equal(tokenNeedsRefresh(null), true);
  assert.equal(tokenNeedsRefresh(""), true);
  assert.equal(isExpiredOAuthError("invalid_grant"), true);
  assert.equal(isExpiredOAuthError("Facebook 400: Session has expired"), true);
  assert.equal(shouldSendOpsAlert([], "social_reauth"), true);
  assert.equal(shouldSendOpsAlert(["social_reauth"], "social_reauth"), false);
  assert.equal(SOCIAL_REAUTH_COPY.body.includes("Reconnect your social account"), true);
  const cron = readFileSync(join(root, "src/lib/axiom/outreach-cron.server.ts"), "utf8");
  assert.match(cron, /refreshExpiringSocialTokens/);
  const social = readFileSync(join(root, "src/lib/axiom/social-publish.server.ts"), "utf8");
  assert.match(social, /Meta app is not configured/);
  assert.match(social, /notifyOwnerOpsOnce/);
  assert.match(social, /me\/accounts/);
  assert.doesNotMatch(social, /if \(!clientId \|\| !clientSecret\) return account/);
});

test("empty render credits reuse the last approved still and skip generation", () => {
  const reuse = emptyCreditHeroDecision(0, 2, "https://cdn.example.com/last-approved.webp");
  assert.equal(reuse.generate, false);
  if (!reuse.generate) {
    assert.equal(reuse.reuseUrl, "https://cdn.example.com/last-approved.webp");
    assert.match(reuse.reason, /last approved still/);
  }
  const go = emptyCreditHeroDecision(8, 2, "https://cdn.example.com/last-approved.webp");
  assert.equal(go.generate, true);
  const hero = readFileSync(join(root, "src/lib/axiom/hero-motion-studio.server.ts"), "utf8");
  assert.match(hero, /emptyCreditHeroDecision/);
  assert.match(hero, /CREDITS_EMPTY_COPY/);
  assert.match(hero, /wallet\.autoReload/);
});
