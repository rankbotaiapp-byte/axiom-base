import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/outreach/cron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleOutreachCron } = await import("@/lib/axiom/outreach-cron.server");
        return handleOutreachCron(request);
      },
    },
  },
});
