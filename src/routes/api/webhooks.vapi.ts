import { createFileRoute } from "@tanstack/react-router";

/** Vapi end-of-call reports land in consumer_leads and appointment_requests. */
export const Route = createFileRoute("/api/webhooks/vapi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { handleVapiWebhook } = await import("@/lib/axiom/vapi-webhook.server");
          return await handleVapiWebhook(request);
        } catch (err) {
          const raw = err instanceof Error ? err.message : "Webhook failed";
          const message = /vapi|secret|sk_/i.test(raw) ? "Webhook failed" : raw;
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
