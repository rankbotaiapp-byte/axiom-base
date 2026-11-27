import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePublishGate } from "../src/lib/billing/publishGate";

test("evaluatePublishGate enforces lock, plan selection, and active/trialing/lifetime publish states", () => {
  // 1. Locked page -> $1 unlock required first
  assert.deepEqual(
    evaluatePublishGate({
      unlockStatus: "locked",
      publishStatus: "draft",
      planStatus: "none",
    }),
    {
      canPublishImmediately: false,
      requiresPlanSelection: false,
      requiresUnlockFirst: true,
      reason: "UNLOCK_REQUIRED",
    },
  );

  // 2. Unlocked ($1 paid), but no plan / past_due / canceled -> opens plan step
  for (const planStatus of ["none", "past_due", "canceled"] as const) {
    assert.deepEqual(
      evaluatePublishGate({
        unlockStatus: "unlocked",
        publishStatus: "draft",
        planStatus,
      }),
      {
        canPublishImmediately: false,
        requiresPlanSelection: true,
        requiresUnlockFirst: false,
        reason: "PLAN_SELECTION_REQUIRED",
      },
    );
  }

  // 3. Unlocked + active, trialing, or lifetime (stored as active) -> ready to publish
  for (const planStatus of ["active", "trialing"] as const) {
    assert.deepEqual(
      evaluatePublishGate({
        unlockStatus: "unlocked",
        publishStatus: "draft",
        planStatus,
      }),
      {
        canPublishImmediately: true,
        requiresPlanSelection: false,
        requiresUnlockFirst: false,
        reason: "READY_TO_PUBLISH",
      },
    );
  }
});
