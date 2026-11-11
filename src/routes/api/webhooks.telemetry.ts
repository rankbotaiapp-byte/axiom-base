import { createFileRoute } from "@tanstack/react-router";

/** Twilio statusCallback and Resend bounce / complaint events. */
export const Route = createFileRoute("/api/webhooks/telemetry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { POST } = await import("../../app/api/webhooks/telemetry/route");
          return POST(request);
        } catch (err) {
          const { publicJsonError } = await import("@/lib/axiom/public-api-error");
          return publicJsonError(err, "Internal server error");
        }
      },
    },
  },
});
