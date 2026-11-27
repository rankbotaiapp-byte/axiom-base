import { publicJsonError } from "@/lib/axiom/public-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { readMasterGrowth } = await import("@/lib/axiom/growth-engine.server");
    return Response.json(await readMasterGrowth(request));
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { saveTreasuryCaps, queuePublicCreative, readMasterGrowth } = await import("@/lib/axiom/growth-engine.server");
    const { assertAutopilotDesk } = await import("@/lib/axiom/autopilot.server");
    await assertAutopilotDesk(request);
    if (body.queueCreative) {
      await queuePublicCreative(String(body.variantId || ""), String(body.body || ""));
    } else {
      await saveTreasuryCaps(request, body);
    }
    return Response.json(await readMasterGrowth(request));
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}
