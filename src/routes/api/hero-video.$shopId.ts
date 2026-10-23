import { createFileRoute } from "@tanstack/react-router";
import { handleHeroVideoRequest } from "@/lib/axiom/hero-video-http";

export const Route = createFileRoute("/api/hero-video/$shopId")({
  server: {
    handlers: {
      GET: ({ request }) => handleHeroVideoRequest(request),
      POST: ({ request }) => handleHeroVideoRequest(request),
    },
  },
});
