import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCAL_DEV_CHANNEL_TOKEN,
  LOCAL_DEV_DEFAULT_EMAIL,
  LOCAL_DEV_SHOP_SLUG,
  isLocalDevChannelToken,
  localDevAuthAllowed,
} from "./local-dev-bypass.ts";

test("local channel token accepts empty, aliases, and shared secret", () => {
  assert.equal(isLocalDevChannelToken(""), true);
  assert.equal(isLocalDevChannelToken("dev"), true);
  assert.equal(isLocalDevChannelToken("LOCAL"), true);
  assert.equal(isLocalDevChannelToken(LOCAL_DEV_CHANNEL_TOKEN), true);
  assert.equal(isLocalDevChannelToken("real-supabase-otp-token"), false);
});

test("defaults point at the axiom-auto test tenant", () => {
  assert.equal(LOCAL_DEV_SHOP_SLUG, "axiom-auto");
  assert.equal(LOCAL_DEV_DEFAULT_EMAIL, "admin@axiom.shop");
  assert.ok(LOCAL_DEV_CHANNEL_TOKEN.length >= 8);
});

test("localDevAuthAllowed respects VERCEL_ENV and AXIOM_LOCAL_AUTH", () => {
  const prevVercel = process.env.VERCEL_ENV;
  const prevFlag = process.env.AXIOM_LOCAL_AUTH;
  try {
    // NODE_ENV is read-only under tsc; exercise VERCEL_ENV + flag gates instead.
    delete process.env.VERCEL_ENV;
    delete process.env.AXIOM_LOCAL_AUTH;
    if (process.env.NODE_ENV !== "production") {
      assert.equal(localDevAuthAllowed(), true);
    }

    process.env.AXIOM_LOCAL_AUTH = "false";
    assert.equal(localDevAuthAllowed(), false);

    process.env.AXIOM_LOCAL_AUTH = "true";
    process.env.VERCEL_ENV = "production";
    assert.equal(localDevAuthAllowed(), false);
  } finally {
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    if (prevFlag === undefined) delete process.env.AXIOM_LOCAL_AUTH;
    else process.env.AXIOM_LOCAL_AUTH = prevFlag;
  }
});
