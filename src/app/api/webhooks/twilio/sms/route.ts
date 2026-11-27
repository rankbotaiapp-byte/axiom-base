import { env } from "@/lib/env.server";
import { paramsFromUrlSearch, verifyTwilioSignature } from "@/lib/axiom/twilio-signature";
import { resolvePublicAppOrigin } from "@/lib/axiom/public-app-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPTY_TWIML = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

function jsonError(code: string, error: string, status: number): Response {
  return Response.json({ ok: false, error, code }, { status });
}

function twiml(message?: string): Response {
  if (!message) {
    return new Response(EMPTY_TWIML, { status: 200, headers: { "Content-Type": "text/xml" } });
  }
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { status: 200, headers: { "Content-Type": "text/xml" } },
  );
}

async function parseForm(request: Request): Promise<URLSearchParams> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return new URLSearchParams(await request.text());
  }
  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, string>;
    return new URLSearchParams(Object.entries(json).map(([k, v]) => [k, String(v ?? "")]));
  }
  return new URLSearchParams(await request.text());
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
 * Twilio SMS webhook. Signature is checked before any DB/Twilio booking import
 * so a missing token or unsigned POST is always 403 JSON, never an HTML 500.
 */
export async function POST(request: Request) {
  try {
    const form = await parseForm(request);
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

    const { handleTwilioInboundSms, handleTwilioSmsStatus } = await import("@/lib/axiom/twilio-booking.server");
    const url = new URL(request.url);
    const isStatus =
      url.searchParams.get("type") === "status" ||
      Boolean(form.get("MessageStatus") || form.get("SmsStatus"));

    if (isStatus && !form.get("Body")) {
      await handleTwilioSmsStatus(form);
      return twiml();
    }

    const result = await handleTwilioInboundSms(form);
    if (result.booked) return twiml();
    return twiml(result.reply);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio SMS webhook failed";
    console.error("[twilio/sms]", message.slice(0, 200));
    return jsonError("WEBHOOK_ERROR", "Internal server error", 500);
  }
}
