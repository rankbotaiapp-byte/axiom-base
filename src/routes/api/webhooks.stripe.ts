import { createFileRoute } from "@tanstack/react-router";

/** checkout.session.completed, subscription created/updated/deleted, and invoice.payment_succeeded. */
export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { handleStripeWebhook } = await import("@/lib/axiom/payments.server");
          return await handleStripeWebhook(request);
        } catch (err) {
          const { publicJsonError } = await import("@/lib/axiom/public-api-error");
          return publicJsonError(err, "Internal server error");
        }
      },
    },
  },
});
