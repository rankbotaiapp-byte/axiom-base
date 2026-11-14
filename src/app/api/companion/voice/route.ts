import { COMPANION_VOICE_ID, companionAllowed, companionSpeechText } from "@/lib/axiom/companion-desk";

export const runtime = "nodejs";

function callerOf(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "The companion could not read that request." }, { status: 400 });
  }
  const text = companionSpeechText(body);
  if (!text) return Response.json({ ok: false, error: "Write a greeting before playing it." }, { status: 400 });
  if (!companionAllowed(`voice:${callerOf(request)}`)) {
    return Response.json({ ok: false, error: "Voice is cooling down. Try again in a few minutes." }, { status: 429 });
  }
  const apiKey = process.env.XAI_API_KEY?.trim() ?? "";
  if (!apiKey) return Response.json({ ok: false, error: "AI is not available in this environment" }, { status: 503 });

  const res = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ text, voice_id: COMPANION_VOICE_ID }),
  });
  if (!res.ok) return Response.json({ ok: false, error: `Voice could not play (${res.status}).` }, { status: 502 });
  const audio = await res.arrayBuffer();
  return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
