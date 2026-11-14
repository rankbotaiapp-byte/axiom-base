import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/master/telemetry")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { GET } = await import("../../app/api/master/telemetry/route");
        return GET(request);
      },
    },
  },
});
