import { publicJsonError } from "@/lib/axiom/public-api-error";

export async function GET(request: Request): Promise<Response> {
  try {
    const { readMasterTelemetry } = await import("@/lib/axiom/master-dashboard.server");
    return Response.json(await readMasterTelemetry(request));
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}
