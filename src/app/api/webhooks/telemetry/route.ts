import { publicJsonError } from "@/lib/axiom/public-api-error";

/** Twilio statusCallback + Resend bounce/complaint ingestion. */
export async function POST(request: Request): Promise<Response> {
  try {
    const { handleTelemetryWebhook } = await import("@/lib/axiom/self-correction.server");
    return await handleTelemetryWebhook(request);
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}
