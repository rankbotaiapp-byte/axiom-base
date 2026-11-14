import { createFileRoute } from "@tanstack/react-router";
import { handleShopMediaUpload } from "@/lib/axiom/media-pipeline-http";

export const Route = createFileRoute("/api/admin/media/upload")({
  server: {
    handlers: {
      POST: ({ request }) => handleShopMediaUpload(request),
    },
  },
});
