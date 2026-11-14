import { createFileRoute } from "@tanstack/react-router";

/** Google Business Profile reviews and Q&A. */
export const Route = createFileRoute("/api/webhooks/gbp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleGbpWebhook } = await import("@/lib/axiom/autopilot-engagement.server");
        return handleGbpWebhook(request);
      },
    },
  },
});
