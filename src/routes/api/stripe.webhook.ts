import { createFileRoute } from "@tanstack/react-router";

/** account.updated, payment_intent.succeeded, and checkout.session.completed. */
export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { handleStripeWebhook } = await import("@/lib/axiom/payments.server");
          return await handleStripeWebhook(request);
        } catch (err) {
          const raw = err instanceof Error ? err.message : "Webhook failed";
          const message = /sk_(live|test)_/i.test(raw) ? "Webhook failed" : raw;
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
