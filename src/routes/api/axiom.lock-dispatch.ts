import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/axiom/lock-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as { slug?: string; phone?: string };
          const slug = String(body.slug ?? "").trim().toLowerCase();
          const phone = String(body.phone ?? "").trim();
          const { lockDispatchPhone } = await import("@/lib/axiom/dispatch.server");
          const result = await lockDispatchPhone(slug, phone);
          return Response.json({ ok: true, ...result });
        } catch (err) {
          const { publicJsonError } = await import("@/lib/axiom/public-api-error");
          return publicJsonError(err, "Could not lock dispatch number");
        }
      },
    },
  },
});
