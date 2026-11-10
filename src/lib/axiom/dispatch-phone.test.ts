import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  collectedDispatchPhone,
  isPlaceholderDispatchPhone,
  maskDispatchPhone,
  needsDispatchPhoneLock,
  testDispatchCopy,
} from "./dispatch-phone.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("placeholder 555 numbers are not lockable dispatch mobiles", () => {
  assert.equal(isPlaceholderDispatchPhone("(541) 555-0100"), true);
  assert.equal(collectedDispatchPhone("(541) 555-0100"), "");
  assert.equal(collectedDispatchPhone("5417610140"), "+15417610140");
  assert.equal(isPlaceholderDispatchPhone("5417610140"), false);
});

test("post-payment lock prompts until a real mobile is stored", () => {
  assert.equal(needsDispatchPhoneLock({ paid: false, dispatchPhone: "5417610140" }), false);
  assert.equal(needsDispatchPhoneLock({ paid: true, dispatchPhone: "(541) 555-0100" }), true);
  assert.equal(
    needsDispatchPhoneLock({ paid: true, dispatchPhone: "+15417610140", dispatchPhoneLocked: true }),
    false,
  );
  assert.equal(maskDispatchPhone("+15417610140").includes("7610") === false, true);
  assert.match(maskDispatchPhone("+15417610140"), /\+1541/);
  assert.match(testDispatchCopy("Accurate Plumbing"), /Accurate Plumbing/);
});

test("tenant desk and APIs wire lock + live Twilio test dispatch", () => {
  const desk = readFileSync(join(root, "src/components/tenant-dashboard/PlumberTenantDashboard.tsx"), "utf8");
  const cta = readFileSync(join(root, "src/components/tenant-dashboard/test-live-dispatch-button.tsx"), "utf8");
  const lock = readFileSync(join(root, "src/lib/axiom/dispatch.server.ts"), "utf8");
  const testRoute = readFileSync(join(root, "src/routes/api/axiom.test-dispatch.ts"), "utf8");
  const lockRoute = readFileSync(join(root, "src/routes/api/axiom.lock-dispatch.ts"), "utf8");
  const storefront = readFileSync(join(root, "src/routes/t/$slug.tsx"), "utf8");
  const notify = readFileSync(join(root, "src/lib/axiom/notify.server.ts"), "utf8");
  assert.match(cta, /Test Live SMS Dispatch/);
  assert.match(cta, /\/api\/axiom\/test-dispatch/);
  assert.match(cta, /disabled=\{busy\}/);
  assert.match(desk, /TestLiveDispatchButton/);
  assert.doesNotMatch(desk, /disabled=\{!overlay.dispatchPhoneLocked\}/);
  assert.match(lock, /Skip sample numbers like 555/);
  assert.match(desk, /tenant-preview-bar/);
  assert.match(desk, /DispatchPhoneLock/);
  assert.match(lock, /notify_phone/);
  assert.match(lock, /dispatch_phone_locked/);
  assert.match(lock, /sendTwilioSms/);
  assert.match(testRoute, /\/api\/axiom\/test-dispatch/);
  assert.match(lockRoute, /\/api\/axiom\/lock-dispatch/);
  assert.match(storefront, /DispatchPhoneLock/);
  assert.match(storefront, /stripe === "return"/);
  assert.match(notify, /export async function sendTwilioSms/);
});
