import { handleLeadPost } from "@/lib/axiom-landing/launch.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return await handleLeadPost(request);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Launch failed.";
    console.error("[storefront] /api/lead unhandled", error, err);
    return Response.json({ ok: false, error }, { status: 502 });
  }
}
