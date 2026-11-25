export type UnlockStatus = "locked" | "unlocked";
export type PublishStatus = "draft" | "published";
export type PlanStatus = "none" | "trialing" | "active" | "past_due" | "canceled";

export interface TenantPublishState {
  unlockStatus: UnlockStatus;
  publishStatus: PublishStatus;
  planStatus: PlanStatus;
  stripeSubscriptionId?: string | null;
}

export interface PublishDecision {
  canPublishImmediately: boolean;
  requiresPlanSelection: boolean;
  requiresUnlockFirst: boolean;
  reason: "READY_TO_PUBLISH" | "UNLOCK_REQUIRED" | "PLAN_SELECTION_REQUIRED";
}

/**
 * Enforces the C) funnel rule:
 * 1. $1 one-time unlock grants Studio access (`unlockStatus = 'unlocked'`, `publishStatus = 'draft'`).
 * 2. Clicking "Publish Live" requires an active/trialing subscription plan (`planStatus`).
 * A lifetime purchase is stored as `planStatus = 'active'`.
 */
export function evaluatePublishGate(state: TenantPublishState): PublishDecision {
  if (state.unlockStatus !== "unlocked") {
    return {
      canPublishImmediately: false,
      requiresPlanSelection: false,
      requiresUnlockFirst: true,
      reason: "UNLOCK_REQUIRED",
    };
  }

  const hasEligiblePlan = state.planStatus === "active" || state.planStatus === "trialing";

  if (!hasEligiblePlan) {
    return {
      canPublishImmediately: false,
      requiresPlanSelection: true,
      requiresUnlockFirst: false,
      reason: "PLAN_SELECTION_REQUIRED",
    };
  }

  return {
    canPublishImmediately: true,
    requiresPlanSelection: false,
    requiresUnlockFirst: false,
    reason: "READY_TO_PUBLISH",
  };
}
