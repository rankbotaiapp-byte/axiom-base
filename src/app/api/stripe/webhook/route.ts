import { HANDLED_STRIPE_EVENTS, handleStripeWebhook } from "@/lib/axiom/payments.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Canonical Stripe webhook entry (`/api/stripe/webhook`).
 * Same handler as `/api/webhooks/stripe` — Connect standing, Name Your Price
 * provisioning, application_fee booking splits, and tenants status sync.
 */
export async function POST(request: Request) {
  const response = await handleStripeWebhook(request);
  response.headers.set("x-axiom-stripe-events", HANDLED_STRIPE_EVENTS.join(","));
  response.headers.set("x-axiom-stripe-path", "/api/stripe/webhook");
  return response;
}
