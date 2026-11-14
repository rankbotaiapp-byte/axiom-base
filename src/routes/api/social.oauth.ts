import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/social/oauth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const platform = url.searchParams.get("platform") ?? "";
        const shop = url.searchParams.get("shop") ?? url.searchParams.get("shopId") ?? "";
        try {
          const { socialConnectUrl } = await import("@/lib/axiom/social-oauth.server");
          const started = await socialConnectUrl({ origin: url.origin, platform, shop });
          return Response.redirect(started.url, 302);
        } catch (err) {
          const message = err instanceof Error ? err.message : "OAuth did not start";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
