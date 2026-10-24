import { createFileRoute } from "@tanstack/react-router";
import { handleHeroBrandPost } from "@/lib/axiom/hero-brand-http";

export const Route = createFileRoute("/api/hero/brand")({
  server: {
    handlers: {
      POST: ({ request }) => handleHeroBrandPost(request),
    },
  },
});
