import { createFileRoute } from "@tanstack/react-router";

/** Twilio inbound SMS. Opt-out stops the drip; other replies go through Grok qualify/book. */
export const Route = createFileRoute("/api/outreach/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleOutreachInbound } = await import("@/lib/axiom/outreach-inbound.server");
        return handleOutreachInbound(request);
      },
    },
  },
});
