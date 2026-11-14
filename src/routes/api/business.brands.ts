import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/business/brands")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleBusinessBrandsGet } = await import("@/lib/axiom/business-lookup.server");
        return handleBusinessBrandsGet(request);
      },
    },
  },
});
