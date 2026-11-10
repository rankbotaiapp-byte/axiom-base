import { createFileRoute } from "@tanstack/react-router";

/** Facebook Page comments/mentions/DMs and Instagram comments. */
export const Route = createFileRoute("/api/webhooks/meta")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleMetaWebhook } = await import("@/lib/axiom/autopilot-engagement.server");
        return handleMetaWebhook(request);
      },
      POST: async ({ request }) => {
        const { handleMetaWebhook } = await import("@/lib/axiom/autopilot-engagement.server");
        return handleMetaWebhook(request);
      },
    },
  },
});
