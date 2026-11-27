import assert from "node:assert/strict";
import { before, test } from "node:test";
import sharp from "sharp";
import { FOUNDER_LIFETIME_CENTS, STANDARD_MONTHLY_CENTS } from "../stripe/commercial.ts";
import { resolveNumberAssignment } from "./axiom-business-number.ts";
import {
  BULLETPROOF_NICHES,
  duplicatePostCount,
  firstLeadMonthlyCents,
  founderLifetimeCents,
  isolateExternalFailure,
  isPermanentMediaUrl,
  nicheHeroCopy,
  simulateNicheAutopilotSweep,
  storefrontUnlockCents,
} from "./bulletproof-autopilot.ts";
import { enhanceJobPhoto } from "./cinematic-enhance.server.ts";
import { AXIOM_PRO_MONTHLY_CENTS, AXIOM_PRO_PLAN, decideFirstLeadActivation } from "./lifecycle.ts";
import { mmsSenderMayUpdateProof } from "./mms-owner-gate.ts";
import {
  classifyStripeEventType,
  HANDLED_STRIPE_EVENTS,
  rememberStripeEvent,
  stripeEventIsDuplicate,
  stripeSignatureHeader,
  verifyStripeSignature,
} from "./stripe-webhook-crypto.ts";

const SECRET = "whsec_bulletproof_test";

before(() => {
  process.env.OUTREACH_MODE = "simulation";
});

test("Stripe HMAC rejects unsigned and stale payloads", () => {
  const payload = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
  assert.equal(verifyStripeSignature(payload, "", SECRET), false);
  assert.equal(verifyStripeSignature(payload, stripeSignatureHeader(payload, "wrong"), SECRET), false);
  const stale = stripeSignatureHeader(payload, SECRET, Math.floor(Date.now() / 1000) - 301);
  assert.equal(verifyStripeSignature(payload, stale, SECRET), false);
  assert.equal(verifyStripeSignature(payload, stripeSignatureHeader(payload, SECRET), SECRET), true);
});

test("handled families cover checkout, invoice.paid alias, failure, and first-lead money", () => {
  assert.equal(classifyStripeEventType("checkout.session.completed"), "checkout_completed");
  assert.equal(classifyStripeEventType("invoice.paid"), "invoice_paid");
  assert.equal(classifyStripeEventType("invoice.payment_succeeded"), "invoice_paid");
  assert.equal(classifyStripeEventType("invoice.payment_failed"), "invoice_failed");
  assert.ok((HANDLED_STRIPE_EVENTS as readonly string[]).includes("invoice.paid"));
  assert.equal(storefrontUnlockCents(), 100);
  assert.equal(firstLeadMonthlyCents(), 15_000);
  assert.equal(firstLeadMonthlyCents(), STANDARD_MONTHLY_CENTS);
  assert.equal(founderLifetimeCents(), 150_000);
  assert.equal(founderLifetimeCents(), FOUNDER_LIFETIME_CENTS);
});

test("signed invoice.paid replay is idempotent in the event-id lock", () => {
  const seen = new Map<string, number>();
  const eventId = "evt_paid_replay";
  assert.equal(stripeEventIsDuplicate(seen, eventId), false);
  rememberStripeEvent(seen, eventId);
  assert.equal(stripeEventIsDuplicate(seen, eventId), true);
  assert.equal(classifyStripeEventType("invoice.payment_failed"), "invoice_failed");
  const payload = JSON.stringify({ id: eventId, type: "invoice.paid" });
  assert.equal(verifyStripeSignature(payload, stripeSignatureHeader(payload, SECRET), SECRET), true);
});

test("checkout.session.completed duplicate session does not re-assign the Axiom number", () => {
  const first = resolveNumberAssignment({
    existingE164: "",
    poolE164: "+15415550100",
    inventoryE164: "+15415550999",
    fallbackE164: "+15415550000",
    liveA2P: true,
  });
  const retry = resolveNumberAssignment({
    existingE164: first.e164,
    poolE164: "+15415550111",
    inventoryE164: "+15415550999",
    fallbackE164: "+15415550000",
    liveA2P: true,
  });
  assert.equal(retry.reused, true);
  assert.equal(retry.e164, first.e164);
});

test("first-lead $150/mo activates once; $1,500 lifetime stays lifetime", () => {
  const awaiting = {
    awaitingFirstRealLead: true,
    plan: "unlock",
    planStatus: "unlocked",
    billingStatus: "unlocked",
    stripeCustomerId: "cus_bp",
    stripePaymentMethodId: "pm_bp",
    stripeSubscriptionId: "",
    stripePriceId: "price_axiom_pro",
    isSimulated: false,
  };
  const charge = decideFirstLeadActivation(awaiting);
  assert.equal(charge.action, "subscribe");
  assert.equal(charge.plan, AXIOM_PRO_PLAN);
  assert.equal(charge.priceCents, AXIOM_PRO_MONTHLY_CENTS);
  const lifetime = decideFirstLeadActivation({
    ...awaiting,
    plan: "lifetime",
    planStatus: "lifetime",
    billingStatus: "lifetime",
  });
  assert.equal(lifetime.action, "skip");
  assert.equal(lifetime.preserveLifetime, true);
  assert.equal(lifetime.plan, "lifetime");
});

test("Plumbing / HVAC / Electrical heroes stay niche-locked and permanent", () => {
  const tenants = [
    { niche: "plumbing" as const, name: "Rogue Valley Plumbing", city: "Medford" },
    { niche: "hvac" as const, name: "Ridge Air", city: "Ashland" },
    { niche: "electrical" as const, name: "Cascade Electric", city: "Talent" },
  ];
  const copies = tenants.map((row) => nicheHeroCopy(row.niche, row.name, row.city));
  assert.equal(copies[0]?.niche, "plumbing");
  assert.match(copies[0]?.tradeLabel ?? "", /plumb/i);
  assert.match(copies[1]?.tradeLabel ?? "", /hvac|heat|air/i);
  assert.match(copies[2]?.tradeLabel ?? "", /electric/i);
  for (const copy of copies) {
    assert.equal(copy.permanentHero, true);
    assert.equal(isPermanentMediaUrl(copy.heroVideoUrl), true);
    assert.doesNotMatch(copy.heroVideoUrl, /replicate/i);
  }
  assert.notEqual(copies[0]?.heroVideoUrl, copies[1]?.heroVideoUrl);
  assert.notEqual(copies[1]?.heroVideoUrl, copies[2]?.heroVideoUrl);
});

test("owner MMS is granted; non-owner is rejected; WebP thumb is 720px", async () => {
  assert.equal(mmsSenderMayUpdateProof("+15415550148", ["541-555-0148"]), true);
  assert.equal(mmsSenderMayUpdateProof("+15415550999", ["541-555-0148"]), false);
  assert.equal(mmsSenderMayUpdateProof("+15415550148", []), false);
  const src = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: { r: 32, g: 40, b: 48 } },
  })
    .jpeg()
    .toBuffer();
  const out = await enhanceJobPhoto(src);
  assert.equal(out.mime, "image/webp");
  const thumb = await sharp(out.thumb).metadata();
  assert.equal(thumb.format, "webp");
  assert.equal(thumb.width, 720);
});

test("Autopilot simulation sweep is niche-matched with zero leakage or duplicate posts", () => {
  const posts = simulateNicheAutopilotSweep([
    { slug: "rogue-valley-plumbing", businessName: "Rogue Valley Plumbing", niche: "plumbing", city: "Medford" },
    { slug: "ridge-air", businessName: "Ridge Air", niche: "hvac", city: "Ashland" },
    { slug: "cascade-electric", businessName: "Cascade Electric", niche: "electrical", city: "Talent" },
  ]);
  assert.equal(posts.length, 3);
  assert.ok(posts.every((post) => post.status === "scheduled"));
  assert.equal(duplicatePostCount(posts), 0);
  assert.equal(duplicatePostCount([...posts, posts[0]!]), 1);
  for (const post of posts) {
    assert.equal(post.leakage.length, 0, `${post.niche} leaked ${post.leakage.join(",")}`);
    assert.match(post.caption, new RegExp(post.niche === "hvac" ? /hvac|air/i : post.niche, "i"));
  }
  assert.deepEqual(
    [...BULLETPROOF_NICHES].sort(),
    posts.map((p) => p.niche).sort(),
  );
});

test("10 parallel storefront ops plus Replicate/Twilio/Resend 500/timeout leave shop state intact", async () => {
  const seen = new Map<string, number>();
  const parallel = await Promise.all(
    Array.from({ length: 10 }, async (_, index) => {
      const assignment = resolveNumberAssignment({
        existingE164: index % 2 === 0 ? "+15415550100" : "",
        poolE164: "+15415550100",
        inventoryE164: "+15415550999",
        fallbackE164: "+15415550000",
        liveA2P: true,
      });
      const png = await sharp({
        create: { width: 48, height: 32, channels: 3, background: { r: 12, g: 18, b: 24 } },
      })
        .png()
        .toBuffer();
      const photo = await enhanceJobPhoto(png);
      rememberStripeEvent(seen, "evt_parallel");
      return {
        reused: assignment.reused,
        e164: assignment.e164,
        webp: photo.mime,
        duplicate: stripeEventIsDuplicate(seen, "evt_parallel"),
      };
    }),
  );
  assert.equal(parallel.length, 10);
  assert.ok(parallel.every((row) => row.e164 === "+15415550100"));
  assert.ok(parallel.every((row) => row.webp === "image/webp"));
  assert.ok(parallel.every((row) => row.duplicate));

  const timeout = await isolateExternalFailure(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return { ok: true, status: 200 };
  }, 20);
  assert.equal(timeout.kind, "timeout");
  assert.equal(timeout.shopIntact, true);

  const replicate500 = await isolateExternalFailure(async () => ({ ok: false, status: 500 }));
  const twilio500 = await isolateExternalFailure(async () => ({ ok: false, status: 500 }));
  const resend500 = await isolateExternalFailure(async () => ({ ok: false, status: 500 }));
  assert.equal(replicate500.kind, "http_error");
  assert.equal(twilio500.shopIntact, true);
  assert.equal(resend500.status, 500);
});
