import { publicJsonError } from "@/lib/axiom/public-api-error";

function fail(err: unknown): Response {
  return publicJsonError(err, "Internal server error");
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { readOutboundEngine } = await import("@/lib/axiom/outbound-engine.server");
    return Response.json(await readOutboundEngine(request));
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { runOutboundEngine } = await import("@/lib/axiom/outbound-engine.server");
    return Response.json(await runOutboundEngine(request));
  } catch (err) {
    return fail(err);
  }
}
