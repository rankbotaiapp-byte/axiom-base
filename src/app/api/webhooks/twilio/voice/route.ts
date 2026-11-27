import { env } from "@/lib/env.server";
import { paramsFromUrlSearch, verifyTwilioSignature } from "@/lib/axiom/twilio-signature";
import { resolvePublicAppOrigin } from "@/lib/axiom/public-app-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(code: string, error: string, status: number): Response {
  return Response.json({ ok: false, error, code }, { status });
}

function webhookUrl(request: Request): string {
  try {
    const origin = resolvePublicAppOrigin(new URL(request.url).origin);
    const incoming = new URL(request.url);
    return `${origin.replace(/\/$/, "")}${incoming.pathname}${incoming.search}`;
  } catch {
    return request.url;
  }
}

/**
 * Twilio Voice webhook. Invalid signatures are 403 JSON before booking/DB loads.
 */
export async function POST(request: Request) {
  try {
    const form = new URLSearchParams(await request.text());
    const token = env("TWILIO_AUTH_TOKEN") || "";
    const signature = request.headers.get("x-twilio-signature") || "";
    const ok = verifyTwilioSignature({
      authToken: token,
      signature,
      url: webhookUrl(request),
      params: paramsFromUrlSearch(form),
    });
    if (!ok) {
      return jsonError("TWILIO_SIGNATURE", "Forbidden", 403);
    }
    const step = new URL(request.url).searchParams.get("step");
    const { handleTwilioVoice } = await import("@/lib/axiom/twilio-booking.server");
    const twiml = await handleTwilioVoice(form, step);
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio voice webhook failed";
    console.error("[twilio/voice]", message.slice(0, 200));
    return jsonError("WEBHOOK_ERROR", "Internal server error", 500);
  }
}
