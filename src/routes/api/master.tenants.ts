import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/master/tenants")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { GET } = await import("../../app/api/master/tenants/route");
        return GET(request);
      },
    },
  },
});
