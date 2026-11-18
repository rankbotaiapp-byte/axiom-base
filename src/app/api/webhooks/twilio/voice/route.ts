import { handleTwilioVoice } from "@/lib/axiom/twilio-booking.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Twilio Voice webhook — returns TwiML for greeting + digit gather booking.
 */
export async function POST(request: Request) {
  try {
    const form = new URLSearchParams(await request.text());
    const step = new URL(request.url).searchParams.get("step");
    const twiml = await handleTwilioVoice(form, step);
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio voice webhook failed";
    console.error("[twilio/voice]", message.slice(0, 200));
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Dispatch is temporarily unavailable.</Say></Response>`,
      { headers: { "Content-Type": "text/xml" }, status: 200 },
    );
  }
}
