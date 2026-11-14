import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/autopilot/cron")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleOutreachCron } = await import("@/lib/axiom/outreach-cron.server");
        return handleOutreachCron(request);
      },
      POST: async ({ request }) => {
        const { handleOutreachCron } = await import("@/lib/axiom/outreach-cron.server");
        return handleOutreachCron(request);
      },
    },
  },
});
