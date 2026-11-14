import { createServerFn } from "@tanstack/react-start";
import { isLaunchPlanId, launchPlan, launchSessionSettled, provisioningPath, type LaunchPlanId } from "./launch-plans";

export type LaunchCheckoutStart =
  | { status: "ready"; sessionId: string; clientSecret: string; publishableKey: string }
  | { status: "unconfigured" };

/** Opens a Stripe Embedded Checkout session for a landing-page tier. */
export const beginLaunchCheckout = createServerFn({ method: "POST" })
  .validator((input: { planId?: string }) => {
    const planId = String(input?.planId ?? "").trim();
    if (!isLaunchPlanId(planId)) throw new Error("Unknown plan");
    return { planId };
  })
  .handler(async ({ data }): Promise<LaunchCheckoutStart> => {
    const payments = await import("./payments.server");
    const publishableKey = payments.stripePublishableKey();
    if (!payments.stripeConfigured() || !publishableKey) return { status: "unconfigured" };
    const plan = launchPlan(data.planId)!;
    let userId: string | undefined;
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      userId = (await getSessionUser())?.id;
    } catch {
      userId = undefined;
    }
    const session = await payments.createLaunchCheckout({
      planId: plan.id,
      planName: plan.name,
      mode: plan.mode,
      dueTodayCents: plan.dueTodayCents,
      monthlyCents: plan.monthlyCents,
      trialDays: plan.trialDays,
      userId,
    });
    return { status: "ready", sessionId: session.id, clientSecret: session.clientSecret, publishableKey };
  });

/** Re-reads the session from Stripe so the client never decides on its own that a payment settled. */
export const confirmLaunchCheckout = createServerFn({ method: "POST" })
  .validator((sessionId: string) => {
    const id = String(sessionId ?? "").trim();
    if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new Error("Invalid session");
    return id;
  })
  .handler(async ({ data }): Promise<{ planId: LaunchPlanId; next: string }> => {
    const { readLaunchSession } = await import("./payments.server");
    const session = await readLaunchSession(data);
    const plan = launchPlan(session.planId);
    if (!plan) throw new Error("Unknown plan");
    if (!launchSessionSettled(session.status, session.paymentStatus)) throw new Error("Payment is not complete");
    const due = plan.dueTodayCents;
    const monthly = plan.monthlyCents ?? 0;
    const paid = session.amountTotal;
    const amountOk = paid === due || paid === 0 || (monthly > 0 && (paid === monthly || paid === due + monthly));
    if (!amountOk) throw new Error("Paid amount does not match the plan");
    return { planId: plan.id, next: provisioningPath(plan.id) };
  });
