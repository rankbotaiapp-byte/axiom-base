import { publicJsonError } from "@/lib/axiom/public-api-error";
import { resolveChaChingMetrics } from "@/lib/axiom/cha-ching.server";

export const runtime = "nodejs";

/** Owner desk pipeline telemetry — jobs + revenue today (no PII). */
export async function GET(request: Request): Promise<Response> {
  try {
    const shopSlug = new URL(request.url).searchParams.get("shopSlug")?.trim() || "";
    if (!shopSlug) {
      return Response.json({ error: "shopSlug required" }, { status: 400 });
    }
    const metrics = await resolveChaChingMetrics(shopSlug);
    return Response.json(metrics, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}