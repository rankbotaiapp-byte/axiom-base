import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/companion/telemetry")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { GET } = await import("../../app/api/companion/telemetry/route");
        return GET(request);
      },
      POST: async ({ request }) => {
        const { POST } = await import("../../app/api/companion/telemetry/route");
        return POST(request);
      },
    },
  },
});
