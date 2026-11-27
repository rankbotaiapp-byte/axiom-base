import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyOwnerMmsMenu,
  lastMmsIsFresh,
  OWNER_MMS_MENU,
  ownerMmsCaptionSeed,
  parseOwnerMmsKeyword,
  parseOwnerMmsMenuReply,
} from "./owner-mms.ts";
import { mmsSenderMayUpdateProof } from "./mms-owner-gate.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("owner MMS keywords route HERO, BEFORE/AFTER, and default PROOF", () => {
  assert.equal(parseOwnerMmsKeyword("HERO van wrap"), "hero");
  assert.equal(parseOwnerMmsKeyword("BANNER"), "hero");
  assert.equal(parseOwnerMmsKeyword("BEFORE kitchen"), "before");
  assert.equal(parseOwnerMmsKeyword("AFTER"), "after");
  assert.equal(parseOwnerMmsKeyword("PROOF drain"), "proof");
  assert.equal(parseOwnerMmsKeyword("camera scoped the main line"), "proof");
  assert.equal(parseOwnerMmsKeyword(""), "proof");
  assert.equal(ownerMmsCaptionSeed("HERO van wrap"), "van wrap");
  assert.match(OWNER_MMS_MENU, /Reply \*\*1\*\*|Reply 1/);
});

test("owner follow-up 1 / 2 / 3 moves or undoes the last MMS photo", () => {
  assert.equal(parseOwnerMmsMenuReply("1"), "hero");
  assert.equal(parseOwnerMmsMenuReply("2"), "before");
  assert.equal(parseOwnerMmsMenuReply("3"), "undo");
  assert.equal(parseOwnerMmsMenuReply("UNDO"), "undo");
  assert.equal(parseOwnerMmsMenuReply("book"), null);
  const pointer = {
    url: "https://cdn.example.com/mms.webp",
    prevHeroUrl: "https://cdn.example.com/old.webp",
    portfolioId: "pf_1",
    slot: "proof" as const,
    uploadedAt: new Date().toISOString(),
  };
  assert.equal(lastMmsIsFresh(pointer), true);
  const hero = applyOwnerMmsMenu(pointer, "hero");
  assert.equal(hero.slot, "hero");
  assert.equal(hero.heroUrl, pointer.url);
  const before = applyOwnerMmsMenu(pointer, "before");
  assert.equal(before.slot, "before");
  const undo = applyOwnerMmsMenu(pointer, "undo");
  assert.equal(undo.slot, "removed");
  assert.equal(undo.heroUrl, pointer.prevHeroUrl);
  assert.equal(mmsSenderMayUpdateProof("+15415550148", ["5415550148"]), true);
  assert.equal(mmsSenderMayUpdateProof("+15415550999", ["5415550148"]), false);
  const sms = readFileSync(join(root, "src/lib/axiom/twilio-booking.server.ts"), "utf8");
  assert.match(sms, /handleOwnerMmsMenuReply/);
  assert.match(sms, /ingestInboundMmsProofs/);
  const route = readFileSync(join(root, "src/app/api/webhooks/twilio/sms/route.ts"), "utf8");
  assert.match(route, /verifyTwilioSignature/);
});
