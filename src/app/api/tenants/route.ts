import { handleTenantPost } from "@/lib/axiom-landing/launch.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return await handleTenantPost(request);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Tenant setup failed.";
    console.error("[storefront] /api/tenants unhandled", error, err);
    return Response.json({ ok: false, error }, { status: 502 });
  }
}
