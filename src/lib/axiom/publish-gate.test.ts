import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePublishGate, type TenantPublishState } from "./publish-gate.ts";

function state(partial: Partial<TenantPublishState>): TenantPublishState {
  return {
    unlockStatus: "unlocked",
    publishStatus: "draft",
    planStatus: "none",
    ...partial,
  };
}

test("publish gate follows the $1 unlock then plan rule", () => {
  const locked = evaluatePublishGate(state({ unlockStatus: "locked", planStatus: "active" }));
  assert.equal(locked.reason, "UNLOCK_REQUIRED");
  assert.equal(locked.requiresUnlockFirst, true);
  assert.equal(locked.canPublishImmediately, false);

  for (const planStatus of ["none", "past_due", "canceled"] as const) {
    const blocked = evaluatePublishGate(state({ planStatus }));
    assert.equal(blocked.reason, "PLAN_SELECTION_REQUIRED");
    assert.equal(blocked.requiresPlanSelection, true);
    assert.equal(blocked.requiresUnlockFirst, false);
  }

  for (const planStatus of ["active", "trialing"] as const) {
    const ready = evaluatePublishGate(state({ planStatus, stripeSubscriptionId: "sub_123" }));
    assert.equal(ready.reason, "READY_TO_PUBLISH");
    assert.equal(ready.canPublishImmediately, true);
    assert.equal(ready.requiresPlanSelection, false);
  }
});
