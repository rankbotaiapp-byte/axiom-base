import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/business/preview-links")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePreviewLinksPost } = await import("@/lib/axiom/business-lookup.server");
        return handlePreviewLinksPost(request);
      },
    },
  },
});
