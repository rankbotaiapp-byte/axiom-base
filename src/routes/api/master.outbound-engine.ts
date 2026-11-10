import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/master/outbound-engine")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { GET } = await import("../../app/api/master/outbound-engine/route");
        return GET(request);
      },
      POST: async ({ request }) => {
        const { POST } = await import("../../app/api/master/outbound-engine/route");
        return POST(request);
      },
    },
  },
});
