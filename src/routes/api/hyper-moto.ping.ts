import { createFileRoute } from "@tanstack/react-router";

/** Lightweight RTT probe for Hyper Moto telemetry. */
export const Route = createFileRoute("/api/hyper-moto/ping")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          { ok: true, t: Date.now() },
          { headers: { "Cache-Control": "no-store" } },
        ),
    },
  },
});
