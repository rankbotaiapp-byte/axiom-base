/** Pure companion telemetry types + status scoring (no Node / DB). */

export const COMPANION_STATUSES = ["idle", "good", "warning", "alert"] as const;
export type CompanionTelemetryStatus = (typeof COMPANION_STATUSES)[number];

export const COMPANION_STATUS_WINDOW_MS = 5 * 60 * 1000;

export type CompanionTelemetryPulse = {
  id: string;
  status: CompanionTelemetryStatus;
  /** Provider / desk source for UI (derived from event_type when reading DB). */
  source: string;
  detail: string;
  eventType: string;
  shopId: string | null;
  createdAt: string;
};

export type CompanionTelemetrySnapshot = {
  status: CompanionTelemetryStatus;
  source: string | null;
  detail: string | null;
  eventType: string | null;
  shopId: string | null;
  updatedAt: string | null;
  windowMs: number;
};

const RANK: Record<CompanionTelemetryStatus, number> = {
  idle: 0,
  good: 1,
  warning: 2,
  alert: 3,
};

export function isCompanionTelemetryStatus(value: unknown): value is CompanionTelemetryStatus {
  return typeof value === "string" && (COMPANION_STATUSES as readonly string[]).includes(value);
}

export function companionSourceFromEventType(eventType: string): string {
  const head = eventType.trim().toLowerCase().split(".")[0] ?? "";
  if (head === "stripe" || head === "twilio" || head === "desk-test" || head === "system") return head;
  return head || "system";
}

/** Highest-severity pulse inside the window wins; otherwise idle. */
export function scoreCompanionStatus(
  pulses: Array<
    Pick<CompanionTelemetryPulse, "status" | "source" | "detail" | "eventType" | "shopId" | "createdAt">
  >,
  now = Date.now(),
): CompanionTelemetrySnapshot {
  const fresh = pulses.filter((pulse) => {
    const at = Date.parse(pulse.createdAt);
    return Number.isFinite(at) && now - at <= COMPANION_STATUS_WINDOW_MS;
  });
  if (fresh.length === 0) {
    return {
      status: "idle",
      source: null,
      detail: null,
      eventType: null,
      shopId: null,
      updatedAt: null,
      windowMs: COMPANION_STATUS_WINDOW_MS,
    };
  }
  let best = fresh[0]!;
  for (const pulse of fresh) {
    if (RANK[pulse.status] > RANK[best.status]) best = pulse;
    else if (RANK[pulse.status] === RANK[best.status] && Date.parse(pulse.createdAt) > Date.parse(best.createdAt)) {
      best = pulse;
    }
  }
  return {
    status: best.status,
    source: best.source,
    detail: best.detail || null,
    eventType: best.eventType || null,
    shopId: best.shopId,
    updatedAt: best.createdAt,
    windowMs: COMPANION_STATUS_WINDOW_MS,
  };
}

export function stripeCompanionEventType(type: string): string {
  const t = type.trim().toLowerCase();
  if (t === "checkout.session.completed") return "stripe.trial.created";
  if (t === "customer.subscription.created") return "stripe.subscription.created";
  if (t === "invoice.payment_succeeded") return "stripe.invoice.paid";
  if (t === "invoice.payment_failed") return "stripe.invoice.failed";
  if (t === "payment_intent.payment_failed") return "stripe.payment_failed";
  if (t === "customer.subscription.deleted") return "stripe.subscription.deleted";
  return `stripe.${t.replace(/[^a-z0-9._-]+/g, "_")}`;
}

export function twilioCompanionEventType(eventType: string): string {
  const status = eventType.trim().toLowerCase() || "unknown";
  return `twilio.sms.${status}`;
}

export function companionStatusFromStripeEvent(type: string): CompanionTelemetryStatus | null {
  const t = type.trim().toLowerCase();
  if (
    t === "checkout.session.completed" ||
    t === "customer.subscription.created" ||
    t === "invoice.payment_succeeded" ||
    t === "payment_intent.succeeded"
  ) {
    return "good";
  }
  if (
    t === "invoice.payment_failed" ||
    t === "payment_intent.payment_failed" ||
    t === "charge.failed" ||
    t === "checkout.session.async_payment_failed"
  ) {
    return "alert";
  }
  if (t === "customer.subscription.deleted") {
    return "warning";
  }
  return null;
}

export function companionStatusFromTwilioEvent(eventType: string, errorCode = ""): CompanionTelemetryStatus | null {
  const status = eventType.trim().toLowerCase();
  if (status === "failed" || status === "undelivered") return "alert";
  if (errorCode.trim() === "30007") return "alert";
  if (status === "queued" || status === "accepted" || status === "sending") return "warning";
  if (status === "delivered" || status === "sent") return "good";
  return null;
}
