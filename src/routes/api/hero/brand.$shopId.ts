import { createFileRoute } from "@tanstack/react-router";
import { handleHeroBrandGet } from "@/lib/axiom/hero-brand-http";

export const Route = createFileRoute("/api/hero/brand/$shopId")({
  server: {
    handlers: {
      GET: ({ request }) => handleHeroBrandGet(request),
    },
  },
});
