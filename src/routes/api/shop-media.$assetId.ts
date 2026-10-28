import { createFileRoute } from "@tanstack/react-router";
import { handleShopMediaGet } from "@/lib/axiom/media-pipeline-http";

export const Route = createFileRoute("/api/shop-media/$assetId")({
  server: {
    handlers: {
      GET: ({ request }) => handleShopMediaGet(request),
    },
  },
});
