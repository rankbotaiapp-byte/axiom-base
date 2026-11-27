import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { stripeEventClaimed } from "./stripe-event-claim.ts";
import {
  decideUnlockWelcomeSms,
  deliverUnlockWelcomeSms,
  isPaidStorefrontUnlockSession,
  ownerNotifyPhone,
  unlockWelcomeSms,
} from "./unlock-welcome.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("unlock welcome copy is proof-of-life with a test command and STOP/HELP", () => {
  const body = unlockWelcomeSms("Cascade Electric");
  assert.match(body, /Axiom is live for Cascade Electric/);
  assert.match(body, /\$1 desk is unlocked/);
  assert.match(body, /proof of life/i);
  assert.match(body, /QUOTE 350 8126/);
  assert.match(body, /OMW 8126/);
  assert.match(body, /Reply STOP to opt out/);
  assert.match(body, /Reply HELP for help/);
  assert.equal(ownerNotifyPhone("541-555-0148", "+15551218002"), "+15415550148");
  assert.equal(ownerNotifyPhone("", "n/a"), null);
});

test("$1 storefront unlock session is paid 100 cents", () => {
  assert.equal(
    isPaidStorefrontUnlockSession({
      amount_total: 100,
      payment_status: "paid",
      metadata: { kind: "storefront_unlock" },
    }),
    true,
  );
  assert.equal(
    isPaidStorefrontUnlockSession({
      amount_total: 100,
      payment_status: "unpaid",
      metadata: { kind: "storefront_unlock" },
    }),
    false,
  );
  assert.equal(
    isPaidStorefrontUnlockSession({
      amount_total: 15000,
      payment_status: "paid",
      metadata: { kind: "storefront_unlock" },
    }),
    false,
  );
});

test("immediate send on $1 confirmation; duplicate webhook events stay idempotent", async () => {
  assert.equal(
    decideUnlockWelcomeSms({ alreadySent: false, ownerE164: "+15415550148", suppressed: false }),
    "send",
  );
  assert.equal(
    decideUnlockWelcomeSms({ alreadySent: true, ownerE164: "+15415550148", suppressed: false }),
    "already",
  );
  assert.equal(
    decideUnlockWelcomeSms({ alreadySent: false, ownerE164: "+15415550148", suppressed: true }),
    "suppressed",
  );
  assert.equal(
    decideUnlockWelcomeSms({ alreadySent: false, ownerE164: null, suppressed: false }),
    "no_phone",
  );

  let claimed = false;
  let sends = 0;
  const first = await deliverUnlockWelcomeSms({
    alreadySent: false,
    ownerE164: "+15415550148",
    suppressed: false,
    shopName: "Cascade Electric",
    claim: async () => {
      if (claimed) return false;
      claimed = true;
      return true;
    },
    send: async () => {
      sends += 1;
      return true;
    },
  });
  assert.equal(first.sent, true);
  assert.equal(sends, 1);

  const replay = await deliverUnlockWelcomeSms({
    alreadySent: claimed,
    ownerE164: "+15415550148",
    suppressed: false,
    shopName: "Cascade Electric",
    claim: async () => {
      if (claimed) return false;
      claimed = true;
      return true;
    },
    send: async () => {
      sends += 1;
      return true;
    },
  });
  assert.equal(replay.sent, false);
  assert.equal(replay.reason, "already");
  assert.equal(sends, 1);

  assert.equal(stripeEventClaimed([{ id: "evt_unlock_1" }], "evt_unlock_1"), true);
  assert.equal(stripeEventClaimed([], "evt_unlock_1"), false);
  assert.equal(stripeEventClaimed([{ id: "evt_unlock_1" }], "evt_unlock_1"), true);
});

test("opt-out claims the stamp so webhook retries never text again", async () => {
  let claimed = false;
  let sends = 0;
  const skipped = await deliverUnlockWelcomeSms({
    alreadySent: false,
    ownerE164: "+15415550148",
    suppressed: true,
    shopName: "Cascade Electric",
    claim: async () => {
      claimed = true;
      return true;
    },
    send: async () => {
      sends += 1;
      return true;
    },
  });
  assert.equal(skipped.sent, false);
  assert.equal(skipped.reason, "suppressed");
  assert.equal(claimed, true);
  assert.equal(sends, 0);
});

test("Stripe $1 webhook claims stripe_events then fires unlock welcome SMS", () => {
  const payments = readFileSync(join(root, "lib/axiom/payments.server.ts"), "utf8");
  const server = readFileSync(join(root, "lib/axiom/sprint2-dispatch.server.ts"), "utf8");
  const migration = readFileSync(join(root, "../migrations/0114_unlock_welcome_sms.sql"), "utf8");
  assert.match(payments, /claimDurableStripeEvent/);
  assert.match(payments, /fireUnlockWelcomeSms/);
  assert.match(payments, /sendUnlockWelcomeSms/);
  assert.match(payments, /durableClaim === "duplicate"/);
  assert.match(server, /welcome_sms_sent_at = now()/);
  assert.match(server, /unlock_welcome/);
  assert.match(migration, /tenants/);
  assert.match(migration, /welcome_sms_sent_at/);
});
