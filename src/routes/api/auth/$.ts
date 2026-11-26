import { createFileRoute } from "@tanstack/react-router";
import { handleAuthRequest } from "@/lib/auth/auth-route-guard";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handleAuthRequest(request, async () => {
          const { auth } = await import("@/lib/auth/server");
          return await auth.handler(request);
        }),
      POST: ({ request }) =>
        handleAuthRequest(request, async () => {
          const { auth } = await import("@/lib/auth/server");
          return await auth.handler(request);
        }),
    },
  },
});
