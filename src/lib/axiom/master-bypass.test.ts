import assert from "node:assert/strict";
import test from "node:test";
import { masterKeysMatch, masterKeyUsable, signMasterPass, verifyMasterPass } from "./master-bypass.ts";

const SECRET = "owner-key-that-is-long-enough";

test("the owner pass verifies only for its secret and expiry", () => {
  const now = 1_700_000_000;
  const token = signMasterPass(SECRET, now + 60);
  assert.equal(verifyMasterPass(SECRET, token, now), true);
  assert.equal(verifyMasterPass(SECRET, token, now + 60), false);
  assert.equal(verifyMasterPass("another-owner-key-value", token, now), false);
  assert.equal(verifyMasterPass(SECRET, `${token}x`, now), false);
  assert.equal(verifyMasterPass(SECRET, "v1.nope.mac", now), false);
  assert.equal(verifyMasterPass(SECRET, "", now), false);
});

test("the owner key compare ignores length tricks and rejects short keys", () => {
  assert.equal(masterKeysMatch(SECRET, SECRET), true);
  assert.equal(masterKeysMatch(SECRET, `${SECRET}x`), false);
  assert.equal(masterKeysMatch("short", SECRET), false);
  assert.equal(masterKeyUsable(SECRET), true);
  assert.equal(masterKeyUsable("too-short"), false);
  assert.equal(masterKeyUsable(undefined), false);
});
