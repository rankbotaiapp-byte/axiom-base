import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/axiom/test-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as { slug?: string };
          const slug = String(body.slug ?? "").trim().toLowerCase();
          const { testLiveDispatch } = await import("@/lib/axiom/dispatch.server");
          const result = await testLiveDispatch(slug);
          return Response.json(result);
        } catch (err) {
          const { publicJsonError } = await import("@/lib/axiom/public-api-error");
          return publicJsonError(err, "Dispatch test failed");
        }
      },
    },
  },
});
