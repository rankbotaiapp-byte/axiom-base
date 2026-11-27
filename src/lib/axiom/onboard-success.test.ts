import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ONBOARD_SUCCESS_PATH,
  isCheckoutSessionId,
  onboardSuccessHref,
  shopAdminHref,
  shopDay1Href,
  territoryCheckoutSuccessUrl,
} from "./onboard-success.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("territory checkout success lands on the PWA handshake", () => {
  assert.equal(ONBOARD_SUCCESS_PATH, "/onboard/success");
  assert.equal(onboardSuccessHref("cs_test_abc"), "/onboard/success?session_id=cs_test_abc");
  assert.equal(
    territoryCheckoutSuccessUrl("https://app.axiom.test/"),
    "https://app.axiom.test/onboard/success?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(shopAdminHref("accurate-plumbing", "tok"), "/accurate-plumbing/admin?claim=tok");
  assert.equal(
    shopDay1Href("accurate-plumbing", { claimToken: "tok", phone: "+15415550100" }),
    "/t/accurate-plumbing/welcome?setup=1&claim=tok&phone=%2B15415550100",
  );
  assert.equal(isCheckoutSessionId("cs_live_12345678"), true);
  assert.equal(isCheckoutSessionId("not-a-session"), false);
});

test("stripe, embedded checkout, and Grant & Launch are wired to onboard success", () => {
  const payments = readFileSync(join(root, "lib/axiom/payments.server.ts"), "utf8");
  const modal = readFileSync(join(root, "lib/axiom/onboard-success.ts"), "utf8");
  const page = readFileSync(join(root, "routes/onboard.success.tsx"), "utf8");
  const pwa = readFileSync(join(root, "components/onboard/pwa-install-button.tsx"), "utf8");
  const grant = readFileSync(join(root, "lib/axiom/plumber-outreach.functions.ts"), "utf8");
  assert.match(payments, /territoryCheckoutSuccessUrl/);
  assert.match(payments, /settleTerritorySession\(object\.id/);
  assert.match(modal, /export function onboardSuccessHref/);
  assert.match(page, /Grant & Launch/);
  assert.match(page, /shopDay1Href/);
  assert.match(page, /grantOnboardLaunch/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /Add to Phone \(One Tap\)/);
  assert.match(grant, /grantOnboardLaunch/);
});
