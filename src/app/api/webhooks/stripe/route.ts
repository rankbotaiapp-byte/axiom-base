import { HANDLED_STRIPE_EVENTS, handleStripeWebhook } from "@/lib/axiom/payments.server";

export const runtime = "nodejs";

/**
 * Verified Stripe entry for territory checkout, shop trials, and subscription status.
 * Handled events: checkout.session.completed, customer.subscription.created,
 * customer.subscription.updated, customer.subscription.deleted,
 * invoice.payment_succeeded, invoice.payment_failed.
 */
export async function POST(request: Request) {
  const response = await handleStripeWebhook(request);
  response.headers.set("x-axiom-stripe-events", HANDLED_STRIPE_EVENTS.join(","));
  return response;
}
