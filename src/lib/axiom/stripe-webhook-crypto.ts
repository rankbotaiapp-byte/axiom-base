import { createHmac, timingSafeEqual } from "node:crypto";

export const STRIPE_SIGNATURE_TOLERANCE_SEC = 300;

export const HANDLED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "payment_intent.payment_failed",
  "payment_intent.succeeded",
  "account.updated",
] as const;

export function stripeSignatureHeader(payload: string, secret: string, timestampSec = Math.floor(Date.now() / 1000)): string {
  const digest = createHmac("sha256", secret).update(`${timestampSec}.${payload}`).digest("hex");
  return `t=${timestampSec},v1=${digest}`;
}

export function verifyStripeSignature(payload: string, header: string, secret: string, nowSec = Date.now() / 1000): boolean {
  const parts = header.split(",").map((part) => {
    const idx = part.indexOf("=");
    return [part.slice(0, idx), part.slice(idx + 1)] as const;
  });
  const timestamp = parts.find((part) => part[0] === "t")?.[1];
  const signatures = parts.filter((part) => part[0] === "v1").map((part) => part[1]);
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(nowSec - Number(timestamp));
  if (!Number.isFinite(age) || age > STRIPE_SIGNATURE_TOLERANCE_SEC) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  return signatures.some((sig) => {
    if (sig.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(sig), expectedBuf);
  });
}

export type StripeBillingFamily =
  | "checkout_completed"
  | "invoice_paid"
  | "invoice_failed"
  | "subscription"
  | "payment_intent"
  | "account"
  | "ignored";

export function classifyStripeEventType(type: string | undefined): StripeBillingFamily {
  switch (type) {
    case "checkout.session.completed":
      return "checkout_completed";
    case "invoice.paid":
    case "invoice.payment_succeeded":
      return "invoice_paid";
    case "invoice.payment_failed":
    case "payment_intent.payment_failed":
      return "invoice_failed";
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return "subscription";
    case "payment_intent.succeeded":
      return "payment_intent";
    case "account.updated":
      return "account";
    default:
      return "ignored";
  }
}

/** In-process replay window. Persist settlement still owns real DB idempotency. */
export function stripeEventIsDuplicate(
  seen: Map<string, number>,
  eventId: string,
  now = Date.now(),
  ttlMs = 86_400_000,
): boolean {
  const id = eventId.trim();
  if (!id) return false;
  const previous = seen.get(id);
  return Boolean(previous && now - previous < ttlMs);
}

export function rememberStripeEvent(
  seen: Map<string, number>,
  eventId: string,
  now = Date.now(),
  ttlMs = 86_400_000,
): void {
  const id = eventId.trim();
  if (!id) return;
  seen.set(id, now);
  if (seen.size > 2_000) {
    for (const [key, at] of seen) {
      if (now - at >= ttlMs) seen.delete(key);
    }
  }
}
