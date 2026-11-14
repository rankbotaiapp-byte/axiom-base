import assert from "node:assert/strict";
import test from "node:test";
import {
  FOUNDER_LIFETIME_CENTS,
  NAME_YOUR_PRICE_MIN_CENTS,
  STANDARD_MONTHLY_CENTS,
  clampNamedPriceCents,
} from "../stripe/commercial.ts";
import { modeAfterCheckout, renewalFor, territoryPlan, territorySessionSettled, TERRITORY_PLANS } from "./pricing.ts";

test("territory plans publish Name Your Price and Founder Lifetime", () => {
  assert.deepEqual(
    TERRITORY_PLANS.map((plan) => [plan.id, plan.amountCents, plan.renewalCents]),
    [
      ["trial", NAME_YOUR_PRICE_MIN_CENTS, STANDARD_MONTHLY_CENTS],
      ["lifetime", FOUNDER_LIFETIME_CENTS, null],
    ],
  );
  assert.equal(territoryPlan("nope"), null);
  assert.equal(territoryPlan("lifetime")?.name, "Founder's Lifetime Access");
  assert.equal(territoryPlan("growth")?.amountCents, STANDARD_MONTHLY_CENTS);
});

test("Name Your Price renews at $150 on day 31 and lifetime does not renew", () => {
  const start = new Date("2026-10-05T12:00:00.000Z");
  const trial = renewalFor("trial", start);
  assert.equal(trial.renewsAt, "2026-11-04T12:00:00.000Z");
  assert.equal(trial.renewalCents, STANDARD_MONTHLY_CENTS);
  assert.deepEqual(renewalFor("lifetime", start), { renewsAt: null, renewalCents: null });
  assert.equal(modeAfterCheckout(), "live");
  const trialPlan = territoryPlan("trial");
  const lifetimePlan = territoryPlan("lifetime");
  if (!trialPlan || !lifetimePlan) throw new Error("plans missing");
  assert.equal(territorySessionSettled(trialPlan, "paid"), true);
  assert.equal(territorySessionSettled(trialPlan, "unpaid"), false);
  assert.equal(territorySessionSettled(lifetimePlan, "paid"), true);
  assert.equal(clampNamedPriceCents(50), NAME_YOUR_PRICE_MIN_CENTS);
  assert.equal(clampNamedPriceCents(2500), 2500);
});
