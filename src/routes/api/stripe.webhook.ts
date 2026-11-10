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
          const { publicJsonError } = await import("@/lib/axiom/public-api-error");
          return publicJsonError(err, "Internal server error");
        }
      },
    },
  },
});
