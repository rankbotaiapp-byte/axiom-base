import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/get-avatar-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { issueAvatarSession } = await import("@/lib/axiom/avatar.server");
        return issueAvatarSession(request);
      },
    },
  },
});
