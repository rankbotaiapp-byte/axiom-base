import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/business/brand")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleBusinessBrandGet } = await import("@/lib/axiom/business-lookup.server");
        return handleBusinessBrandGet(request);
      },
    },
  },
});
