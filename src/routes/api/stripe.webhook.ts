import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleStripeWebhook } = await import("@/lib/axiom/payments.server");
        try {
          return await handleStripeWebhook(request);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Webhook failed";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
