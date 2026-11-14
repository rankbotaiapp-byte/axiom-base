import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  describePlumbingCheckoutError,
  plumbingCheckoutLeadSlug,
  plumbingCheckoutRedirect,
  plumbingCheckoutSlugFromPath,
  unwrapCheckoutPayload,
} from "./plumbing-checkout.ts";
import { FOUNDER_LIFETIME_CENTS, NAME_YOUR_PRICE_MIN_CENTS, STANDARD_MONTHLY_CENTS } from "../stripe/commercial.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("checkout lead slug picks the first valid territory slug", () => {
  assert.equal(plumbingCheckoutLeadSlug("", "Not A Slug", "grants-pass-rooter"), "grants-pass-rooter");
  assert.equal(plumbingCheckoutLeadSlug(undefined, "plumbing"), "plumbing");
  assert.equal(plumbingCheckoutLeadSlug("Not Valid!!"), "");
  assert.equal(plumbingCheckoutLeadSlug("accurate-plumbing"), "accurate-plumbing");
  assert.equal(
    plumbingCheckoutSlugFromPath("/t/accurate-plumbing?niche=plumbing&greet=1"),
    "accurate-plumbing",
  );
  assert.equal(plumbingCheckoutSlugFromPath("/t/accurate-plumbing"), "accurate-plumbing");
});

test("stripe redirect requires a live https checkout url", () => {
  assert.equal(
    plumbingCheckoutRedirect({ processor: "stripe", url: "https://checkout.stripe.com/c/pay/cs_test" }),
    "https://checkout.stripe.com/c/pay/cs_test",
  );
  assert.throws(() => plumbingCheckoutRedirect({ processor: "stripe" }), /did not return/);
  assert.throws(() => plumbingCheckoutRedirect({ processor: "trial", url: "https://checkout.stripe.com/x" }), /did not return/);
});

test("checkout errors stay short and readable", () => {
  assert.equal(describePlumbingCheckoutError(new Error("Card checkout is not configured")), "Card checkout is not configured");
  assert.match(describePlumbingCheckoutError(new Error("Unknown business")), /bind this storefront|Stripe/);
  assert.equal(describePlumbingCheckoutError("nope"), "Checkout did not start");
});

test("checkout payload unwraps nested server-fn data and binds accurate-plumbing", () => {
  assert.equal(unwrapCheckoutPayload({ data: { leadSlug: "accurate-plumbing", planId: "trial" } }).leadSlug, "accurate-plumbing");
  assert.equal(unwrapCheckoutPayload({ leadSlug: "accurate-plumbing", planId: "lifetime" }).planId, "lifetime");
});

test("territory checkout wires $1 month-one, $150/mo, and $1,500 lifetime", () => {
  const payments = readFileSync(join(root, "lib/axiom/payments.server.ts"), "utf8");
  const route = readFileSync(join(root, "routes/t/$slug.tsx"), "utf8");
  assert.match(payments, /FOUNDER_LIFETIME_CENTS/);
  assert.match(payments, /STANDARD_MONTHLY_CENTS/);
  assert.match(payments, /subscription_data\[trial_period_days\]/);
  assert.match(payments, /founder_lifetime/);
  assert.match(payments, /name_your_price/);
  assert.equal(NAME_YOUR_PRICE_MIN_CENTS, 100);
  assert.equal(STANDARD_MONTHLY_CENTS, 15_000);
  assert.equal(FOUNDER_LIFETIME_CENTS, 150_000);
  assert.match(route, /PlumberOutreachLive/);
  assert.match(route, /getPlumberOutreachPage/);
  assert.match(route, /PLUMBER_OUTREACH_HERO_VIDEO/);
  const landing = readFileSync(join(root, "components/plumbing/plumber-outreach-landing.tsx"), "utf8");
  assert.match(landing, /OutreachCheckoutModal/);
  assert.match(landing, /HERO_FILM = "\/media\/axio-plumber-hero\.mp4"/);
  const hook = readFileSync(join(root, "components/plumbing/use-plumbing-checkout.ts"), "utf8");
  const tenant = readFileSync(join(root, "lib/axiom/tenant-billing.functions.ts"), "utf8");
  assert.match(hook, /startTenantStorefrontCheckout/);
  assert.match(hook, /plumbingCheckoutSlugFromPath/);
  assert.match(tenant, /export const startTenantStorefrontCheckout/);
  assert.match(tenant, /createTenantLicenseCheckout/);
  assert.doesNotMatch(route, /preview: search\.preview \?\? true/);
  const handler = readFileSync(join(root, "lib/axiom/master.server.ts"), "utf8");
  const territory = readFileSync(join(root, "lib/axiom/territory.server.ts"), "utf8");
  assert.match(handler, /ensureTerritoryLead/);
  assert.match(handler, /createTenantLicenseCheckout/);
  assert.match(territory, /export async function ensureTerritoryLead/);
  assert.match(payments, /metadata\[lead_slug\]/);
});
