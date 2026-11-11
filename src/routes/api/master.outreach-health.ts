import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/master/outreach-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { readOutreachHealthForDesk } = await import("@/lib/axiom/self-correction.server");
          return Response.json(await readOutreachHealthForDesk(request));
        } catch (err) {
          const { publicJsonError } = await import("@/lib/axiom/public-api-error");
          return publicJsonError(err, "Internal server error");
        }
      },
    },
  },
});
