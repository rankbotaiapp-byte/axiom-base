import { handleTwilioInboundSms, handleTwilioSmsStatus } from "@/lib/axiom/twilio-booking.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * Twilio SMS webhook — inbound Body messages + MessageStatus callbacks.
 * Configure Messaging webhook URL to this path (POST).
 */
export async function POST(request: Request) {
  try {
    const form = await parseForm(request);
    const url = new URL(request.url);
    const isStatus =
      url.searchParams.get("type") === "status" ||
      Boolean(form.get("MessageStatus") || form.get("SmsStatus"));

    if (isStatus && !form.get("Body")) {
      const result = await handleTwilioSmsStatus(form);
      return Response.json(result);
    }

    const result = await handleTwilioInboundSms(form);
    // TwiML-ish plain response keeps Twilio happy without requiring XML for SMS reply
    // when Messaging Service auto-responds via REST — we already sent via API.
    if (result.booked) {
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        headers: { "Content-Type": "text/xml" },
      });
    }
    const escaped = result.reply
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio SMS webhook failed";
    console.error("[twilio/sms]", message.slice(0, 200));
    return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
