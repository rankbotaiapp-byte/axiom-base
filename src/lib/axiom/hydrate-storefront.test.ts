import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { before } from "node:test";
import { fileURLToPath } from "node:url";

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    throw new Error(`simulation blocked live fetch: ${String(input)}`);
  }) as typeof fetch;
});
import { FOUNDER_WELCOME_POSTER, FOUNDER_WELCOME_VIDEO } from "./founder-welcome.ts";
import { deskPhase, hydrateLeadStorefront, isStorefrontUnlockPayment, STOREFRONT_UNLOCK_CENTS } from "./hydrate-storefront.ts";
import { validateForPublish } from "../schemas/publishGate.ts";

const hydrateSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "hydrate-storefront.ts"), "utf8");

test("dataset hydration is a valid draft and the $1 unlock is a paid 100-cent payment", () => {
  assert.equal(STOREFRONT_UNLOCK_CENTS, 100);
  assert.equal(isStorefrontUnlockPayment({ kind: "storefront_unlock", amountCents: 100, paymentStatus: "paid" }), true);
  assert.equal(isStorefrontUnlockPayment({ kind: "territory", amountCents: 100, paymentStatus: "paid" }), false);
  assert.equal(isStorefrontUnlockPayment({ kind: "storefront_unlock", amountCents: 15000, paymentStatus: "paid" }), false);
  const config = hydrateLeadStorefront({
    slug: "Cascade Electric!",
    businessName: "Cascade Electric",
    niche: "electrical",
    phone: "5415550148",
    city: "Medford",
    email: "desk@cascade-electric.example",
    leadId: "lead_cascade",
  });
  assert.equal(config.slug, "cascade-electric");
  assert.equal(config.hero.media.kind, "loop-video");
  assert.match(hydrateSrc, /from ["']@\/lib\/axiom\/founder-welcome["']/);
  assert.ok(FOUNDER_WELCOME_VIDEO.startsWith("/"));
  assert.ok(FOUNDER_WELCOME_POSTER.startsWith("/"));
  assert.equal(config.conversion.serviceCities[0], "Medford");
  assert.equal(validateForPublish(config).ok, true);
  assert.equal(deskPhase({ unlockStatus: "locked", publishStatus: "draft" }), "locked");
  assert.equal(deskPhase({ unlockStatus: "unlocked", publishStatus: "draft" }), "draft");
  assert.equal(deskPhase({ unlockStatus: "unlocked", publishStatus: "published" }), "published");
});
