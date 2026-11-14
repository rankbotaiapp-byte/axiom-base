import { createFileRoute } from "@tanstack/react-router";
import { handleHeroIntro } from "@/lib/axiom/hero-animator-http";

export const Route = createFileRoute("/api/admin/hero-studio/generate")({
  server: {
    handlers: {
      POST: ({ request }) => handleHeroIntro(request),
    },
  },
});
