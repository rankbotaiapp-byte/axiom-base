import { createFileRoute } from "@tanstack/react-router";
import { getTenantBySlug } from "@/lib/axiom-landing/tenants/store";

export const Route = createFileRoute("/api/tenants/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const t = await getTenantBySlug(params.slug, { fresh: true });
        if (!t) return Response.json({ ok: false }, { status: 404 });
        return Response.json({ ok: true, slug: t.slug, status: t.status, business_name: t.business_name });
      },
    },
  },
});
