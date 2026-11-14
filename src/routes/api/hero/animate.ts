import { createFileRoute } from "@tanstack/react-router";
import { handleHeroAnimate } from "@/lib/axiom/hero-brand-http";

export const Route = createFileRoute("/api/hero/animate")({
  server: {
    handlers: {
      POST: ({ request }) => handleHeroAnimate(request),
    },
  },
});
