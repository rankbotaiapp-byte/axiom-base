import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { before } from "node:test";
import { fileURLToPath } from "node:url";
import {
  AUTOPILOT_PUBLISH_PER_RUN_CAP,
  AUTOPILOT_SOCIAL_DAILY_CAP,
  applyWebPresencePreview,
  buildTenantPublishBundle,
  canPublishItem,
  createLiveSocialAdapterStub,
  createMemoryOAuthStore,
  createSimulationSocialAdapter,
  mergeAutopilotWebPreview,
  publishFingerprint,
  runPublishPlan,
  SOCIAL_PUBLISH_TARGETS,
} from "./autopilot-publish.ts";
import { AUTOPILOT_EMAIL_DAILY_CAP, AUTOPILOT_SMS_DAILY_CAP } from "./autopilot-limits.ts";

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    throw new Error(`simulation blocked live fetch: ${String(input)}`);
  }) as typeof fetch;
});

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function validBundle(over: Partial<Parameters<typeof buildTenantPublishBundle>[0]> = {}) {
  return buildTenantPublishBundle({
    shopId: "shop_cascade",
    slug: "cascade-electric",
    shopName: "Cascade Electric",
    niche: "electrical",
    city: "Medford",
    stillUrl: "https://cdn.example.com/proof.webp",
    motionUrl: "https://cdn.example.com/loop.mp4",
    origin: "https://axiom.example",
    now: new Date("2026-11-22T20:00:00.000Z"),
    ...over,
  });
}

test("publish bundle pairs validated media and booking URL with trade copy", () => {
  const bundle = validBundle();
  assert.equal(bundle.approved, true);
  assert.equal(bundle.copy.shopName, "Cascade Electric");
  assert.match(bundle.copy.caption, /Cascade Electric/);
  assert.equal(bundle.copy.bookUrl, "https://axiom.example/cascade-electric/book");
  assert.equal(bundle.copy.claimUrl, "https://axiom.example/t/cascade-electric");
  assert.equal(bundle.asset.kind, "loop-video");
  assert.deepEqual(bundle.targets, [...SOCIAL_PUBLISH_TARGETS]);
  const rejected = validBundle({ shopName: "placeholder", stillUrl: "javascript:alert(1)" });
  assert.equal(rejected.approved, false);
  assert.ok(rejected.rejectReason);
});

test("web presence updates preview media and leaves unvalidated branding untouched", () => {
  const bundle = validBundle();
  const ok = applyWebPresencePreview({
    branding: { shopName: "Cascade Electric", phone: "5417700148" },
    bundle,
  });
  assert.equal(ok.preview.applied, true);
  assert.equal(ok.preview.stillUrl, bundle.asset.stillUrl);
  assert.equal(ok.branding.shopName, "Cascade Electric");
  const profile = mergeAutopilotWebPreview(
    { shopConfig: { autopilotLoopCursor: 2 }, ownerNote: "keep" },
    ok.preview,
  );
  const preview = (profile.shopConfig as { autopilotWebPreview: { applied: boolean; stillUrl: string } })
    .autopilotWebPreview;
  assert.equal(preview.applied, true);
  assert.equal(preview.stillUrl, bundle.asset.stillUrl);
  assert.equal((profile.shopConfig as { autopilotLoopCursor: number }).autopilotLoopCursor, 2);
  assert.equal(profile.ownerNote, "keep");
  const blocked = applyWebPresencePreview({
    branding: { shopName: "placeholder" },
    currentPreview: { stillUrl: "/media/keep.jpg", caption: "old" },
    bundle,
  });
  assert.equal(blocked.preview.applied, false);
  assert.equal(blocked.preview.stillUrl, "/media/keep.jpg");
  assert.equal(blocked.branding.shopName, "placeholder");
});

test("simulation adapter records payloads and never calls live Graph stubs", () => {
  const bundle = validBundle();
  const adapter = createSimulationSocialAdapter();
  const plan = runPublishPlan({
    bundle,
    adapter,
    branding: { shopName: "Cascade Electric" },
    now: new Date("2026-11-22T20:00:00.000Z"),
  });
  assert.equal(adapter.mode, "simulation");
  assert.equal(plan.web.preview.applied, true);
  assert.equal(plan.receipts.filter((row) => row.status === "simulated").length, 4);
  assert.equal(adapter.log.length, 4);
  assert.ok(adapter.log.every((row) => /No external API called/.test(row.detail)));
  const oauth = createMemoryOAuthStore();
  const live = createLiveSocialAdapterStub(oauth);
  const skipped = live.publish({
    target: "facebook",
    bundle,
    payload: { channel: "facebook" },
  });
  assert.equal(live.mode, "live");
  assert.equal(skipped.status, "skipped");
  assert.match(skipped.detail, /OAuth/);
});

test("idempotency and per-run/daily caps block a double post of the same item", () => {
  assert.equal(AUTOPILOT_SMS_DAILY_CAP, 40);
  assert.equal(AUTOPILOT_EMAIL_DAILY_CAP, 80);
  assert.equal(AUTOPILOT_SOCIAL_DAILY_CAP, 4);
  assert.equal(AUTOPILOT_PUBLISH_PER_RUN_CAP, 4);
  const day = "2026-11-22";
  const key = publishFingerprint({
    shopId: "shop_cascade",
    target: "facebook",
    stillUrl: "https://cdn.example.com/proof.webp",
    motionUrl: "https://cdn.example.com/loop.mp4",
    day,
  });
  const first = canPublishItem([], {
    shopId: "shop_cascade",
    target: "facebook",
    fingerprint: key,
    day,
    perRunPosted: 0,
  });
  assert.equal(first.ok, true);
  const dup = canPublishItem(
    [{ key, shopId: "shop_cascade", target: "facebook", day, status: "simulated" }],
    { shopId: "shop_cascade", target: "facebook", fingerprint: key, day, perRunPosted: 1 },
  );
  assert.equal(dup.ok, false);
  if (!dup.ok) assert.equal(dup.reason, "duplicate");
  const runCap = canPublishItem([], {
    shopId: "shop_cascade",
    target: "instagram",
    fingerprint: key + "|ig",
    day,
    perRunPosted: 4,
  });
  assert.equal(runCap.ok, false);
  if (!runCap.ok) assert.equal(runCap.reason, "run_cap");
  const filled = Array.from({ length: 4 }, (_, index) => ({
    key: `other-${index}`,
    shopId: "shop_cascade",
    target: "instagram" as const,
    day,
    status: "simulated",
  }));
  const daily = canPublishItem(filled, {
    shopId: "shop_cascade",
    target: "google_business",
    fingerprint: "fresh",
    day,
    perRunPosted: 0,
  });
  assert.equal(daily.ok, false);
  if (!daily.ok) assert.equal(daily.reason, "daily_cap");

  const bundle = validBundle();
  const adapter = createSimulationSocialAdapter();
  const firstPlan = runPublishPlan({
    bundle,
    adapter,
    branding: { shopName: "Cascade Electric" },
    now: new Date("2026-11-22T20:00:00.000Z"),
  });
  const secondPlan = runPublishPlan({
    bundle,
    adapter,
    ledger: firstPlan.ledger,
    branding: { shopName: "Cascade Electric" },
    now: new Date("2026-11-22T20:00:00.000Z"),
  });
  assert.ok(secondPlan.receipts.every((row) => row.status === "skipped"));
  assert.ok(secondPlan.receipts.some((row) => /Already posted/.test(row.detail)));
});

test("plumbing storefront simulation records web preview and skips a second tick", () => {
  const bundle = validBundle({
    shopId: "shop_plumb",
    slug: "ridge-plumbing",
    shopName: "Ridge Plumbing",
    niche: "plumbing",
    city: "Ashland",
    stillUrl: "https://cdn.example.com/van.webp",
    motionUrl: "https://cdn.example.com/van.mp4",
  });
  assert.equal(bundle.approved, true);
  assert.match(bundle.copy.caption, /Ridge Plumbing/);
  const adapter = createSimulationSocialAdapter();
  const first = runPublishPlan({
    bundle,
    adapter,
    branding: { shopName: "Ridge Plumbing" },
    now: new Date("2026-11-22T20:00:00.000Z"),
  });
  const tradeProfile = mergeAutopilotWebPreview({}, first.web.preview);
  const stored = (tradeProfile.shopConfig as { autopilotWebPreview: { applied: boolean; stillUrl: string } })
    .autopilotWebPreview;
  assert.equal(stored.applied, true);
  assert.equal(stored.stillUrl, "https://cdn.example.com/van.webp");
  assert.equal(first.receipts.filter((row) => row.status === "simulated").length, 4);
  assert.ok(first.receipts.every((row) => !/graph\.facebook|googleapis|replicate|twilio/i.test(JSON.stringify(row))));
  const second = runPublishPlan({
    bundle,
    adapter,
    ledger: first.ledger,
    branding: { shopName: "Ridge Plumbing" },
    now: new Date("2026-11-22T20:00:00.000Z"),
  });
  assert.ok(second.receipts.every((row) => row.status === "skipped"));
});

test("shop autopilot tick stays on the session-auth path and does not flip outreach mode", () => {
  const tick = readFileSync(join(root, "src/lib/axiom/shop-autopilot.server.ts"), "utf8");
  const hook = readFileSync(join(root, "src/lib/axiom/autopilot-publish.server.ts"), "utf8");
  assert.match(tick, /publishApprovedAutopilotBundle/);
  assert.match(hook, /runPublishPlan/);
  assert.match(hook, /createSimulationSocialAdapter/);
  assert.doesNotMatch(tick, /OUTREACH_MODE\s*=\s*"live"/);
  assert.doesNotMatch(hook, /OUTREACH_MODE\s*=\s*"live"/);
});
