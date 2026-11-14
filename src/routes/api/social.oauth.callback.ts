import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/social/oauth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleSocialOAuthCallback } = await import("@/lib/axiom/social-oauth.server");
        return handleSocialOAuthCallback(request);
      },
    },
  },
});
