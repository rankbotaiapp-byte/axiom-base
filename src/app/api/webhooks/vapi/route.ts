import { publicJsonError } from "@/lib/axiom/public-api-error";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const { handleVapiWebhook } = await import("@/lib/axiom/vapi-webhook.server");
    return await handleVapiWebhook(request);
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}
