import { createFileRoute } from "@tanstack/react-router";

/** Twilio inbound SMS. A reply from a listed lead number stops the drip. */
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
