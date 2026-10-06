import assert from "node:assert/strict";
import test from "node:test";
import { modeAfterCheckout, renewalFor, territoryPlan, territorySessionSettled, TERRITORY_PLANS } from "./pricing.ts";

test("territory plans keep the three published prices", () => {
  assert.deepEqual(
    TERRITORY_PLANS.map((plan) => [plan.id, plan.amountCents]),
    [
      ["trial", 0],
      ["growth", 49700],
      ["lifetime", 249700],
    ],
  );
  assert.equal(territoryPlan("nope"), null);
  assert.equal(territoryPlan("growth")?.name, "Managed Territory Growth Engine");
});

test("a trial renews at $497 on day 31 and a buyout does not renew", () => {
  const start = new Date("2026-10-05T12:00:00.000Z");
  const trial = renewalFor("trial", start);
  assert.equal(trial.renewsAt, "2026-11-04T12:00:00.000Z");
  assert.equal(trial.renewalCents, 49700);
  assert.deepEqual(renewalFor("lifetime", start), { renewsAt: null, renewalCents: null });
  assert.equal(modeAfterCheckout(), "live");
  const trialPlan = territoryPlan("trial");
  const growthPlan = territoryPlan("growth");
  if (!trialPlan || !growthPlan) throw new Error("plans missing");
  assert.equal(territorySessionSettled(trialPlan, "no_payment_required"), true);
  assert.equal(territorySessionSettled(trialPlan, "unpaid"), false);
  assert.equal(territorySessionSettled(growthPlan, "paid"), true);
  assert.equal(territorySessionSettled(growthPlan, "no_payment_required"), false);
});
