import { createFileRoute } from "@tanstack/react-router";

/** Demo forms inside showcase builds POST here — acknowledge and drop. */
export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      POST: async () => Response.json({ ok: true, demo: true }),
    },
  },
});
