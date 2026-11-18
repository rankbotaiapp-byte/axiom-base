import { readDeployedAtmosphere } from "@/lib/axiom/storefront-atmosphere.server";
import { publicJsonError } from "@/lib/axiom/public-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const shopSlug = new URL(request.url).searchParams.get("shopSlug")?.trim() || "";
    if (!shopSlug) {
      return Response.json({ error: "shopSlug required" }, { status: 400 });
    }
    const payload = await readDeployedAtmosphere(shopSlug);
    return Response.json(payload, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}