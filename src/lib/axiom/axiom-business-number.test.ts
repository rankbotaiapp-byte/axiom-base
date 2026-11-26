import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  a2pOutboundLive,
  axiomDispatchFn,
  axiomWelcomeSmsBody,
  AXIOM_VCF_NOTE,
  buildAxiomVcard,
  decideWelcomeSms,
  formatAxiomPhoneDisplay,
  isTwilioAuthError,
  parsePoolList,
  resolveNumberAssignment,
} from "./axiom-business-number.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("vcard is a WORK TEL contact with the proof-of-work note", () => {
  const card = buildAxiomVcard({ businessName: "Cascade Electric", e164: "5415550148" });
  assert.match(card, /^BEGIN:VCARD/);
  assert.match(card, /VERSION:3.0/);
  assert.match(card, /FN:Axiom — Cascade Electric Dispatch/);
  assert.match(card, /TEL;TYPE=WORK,VOICE:\+15415550148/);
  assert.match(card, new RegExp(AXIOM_VCF_NOTE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(card, /END:VCARD/);
  assert.equal(axiomDispatchFn("Ridge Air"), "Axiom — Ridge Air Dispatch");
  assert.equal(formatAxiomPhoneDisplay("+15415550148"), "(541) 555-0148");
});

test("welcome SMS and A2P live gate stay conservative", () => {
  assert.match(axiomWelcomeSmsBody({ businessName: "Ridge Air", e164: "+15415550148" }), /Reply STOP/);
  assert.equal(a2pOutboundLive("simulation", "true"), false);
  assert.equal(a2pOutboundLive("live", "false"), false);
  assert.equal(a2pOutboundLive("live", "true"), true);
  assert.equal(isTwilioAuthError({ code: 20003 }), true);
  assert.equal(isTwilioAuthError({ code: 21610 }), false);
  assert.deepEqual(parsePoolList("+15415550100, 541-555-0101"), ["+15415550100", "+15415550101"]);
});

test("post-checkout assignment is idempotent and prefers the pool", () => {
  const first = resolveNumberAssignment({
    existingE164: "",
    poolE164: "+15415550100",
    inventoryE164: "+15415550999",
    fallbackE164: "+15415550000",
    liveA2P: true,
  });
  assert.equal(first.source, "pool");
  assert.equal(first.reused, false);
  assert.equal(first.e164, "+15415550100");
  const replay = resolveNumberAssignment({
    existingE164: first.e164,
    poolE164: "+15415550111",
    inventoryE164: "+15415550999",
    fallbackE164: "+15415550000",
    liveA2P: true,
  });
  assert.equal(replay.reused, true);
  assert.equal(replay.source, "existing");
  assert.equal(replay.e164, first.e164);
  assert.equal(
    resolveNumberAssignment({
      existingE164: "",
      poolE164: "",
      inventoryE164: "+15415550999",
      fallbackE164: "+15415550000",
      liveA2P: false,
    }).status,
    "simulated",
  );
});

test("welcome SMS is skipped for opt-outs, duplicates, and paused A2P", () => {
  assert.equal(
    decideWelcomeSms({
      alreadySent: true,
      ownerE164: "+15415550148",
      fromE164: "+15415550100",
      suppressed: false,
      liveA2P: true,
    }),
    "already",
  );
  assert.equal(
    decideWelcomeSms({
      alreadySent: false,
      ownerE164: "+15415550148",
      fromE164: "+15415550100",
      suppressed: true,
      liveA2P: true,
    }),
    "suppressed",
  );
  assert.equal(
    decideWelcomeSms({
      alreadySent: false,
      ownerE164: "+15415550148",
      fromE164: "+15415550100",
      suppressed: false,
      liveA2P: false,
    }),
    "simulated",
  );
  assert.equal(
    decideWelcomeSms({
      alreadySent: false,
      ownerE164: null,
      fromE164: "+15415550100",
      suppressed: false,
      liveA2P: true,
    }),
    "skipped",
  );
});

test("checkout success lands on the welcome screen and webhook provisions the number", () => {
  const payments = readFileSync(join(root, "lib/axiom/payments.server.ts"), "utf8");
  assert.match(payments, /\/welcome\?unlocked=1/);
  assert.match(payments, /provisionAxiomNumberAfterUnlock/);
  const welcome = readFileSync(join(root, "app/t/[slug]/welcome/page.tsx"), "utf8");
  assert.match(welcome, /AxiomBusinessNumberCard/);
  assert.match(welcome, /#050507/);
  assert.match(welcome, /#00ffcc/);
  const card = readFileSync(join(root, "components/storefront/AxiomBusinessNumberCard.tsx"), "utf8");
  assert.match(card, /Lock this number into your phone now/);
  assert.match(card, /Save Contact \(\.vcf\)/);
  assert.match(card, /Open Live Storefront/);
  assert.match(card, /Open My Dashboard/);
  const shopsVcard = readFileSync(join(root, "app/api/shops/[slug]/vcard/route.ts"), "utf8");
  assert.match(shopsVcard, /text\/vcard/);
  const vcard = readFileSync(join(root, "app/api/storefront/vcard/route.ts"), "utf8");
  assert.match(vcard, /text\/vcard/);
  const admin = readFileSync(join(root, "components/admin/AdminShell.tsx"), "utf8");
  assert.match(admin, /AxiomBusinessNumberCard/);
});
