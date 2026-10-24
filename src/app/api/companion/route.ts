import { companionAllowed, companionMessages, parseCompanionAsk } from "@/lib/axiom/companion-desk";

export const runtime = "nodejs";

const CHAT_URL = "https://api.x.ai/v1/chat/completions";

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
  const parsed = parseCompanionAsk(body);
  if (!parsed.ok) return Response.json(parsed, { status: 400 });
  if (!companionAllowed(callerOf(request))) {
    return Response.json({ ok: false, error: "The companion is cooling down. Try again in a few minutes." }, { status: 429 });
  }
  const apiKey = process.env.XAI_API_KEY?.trim() ?? "";
  if (!apiKey) return Response.json({ ok: false, error: "AI is not available in this environment" }, { status: 503 });

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 360,
      messages: companionMessages(parsed.ask),
    }),
  });
  if (!res.ok) return Response.json({ ok: false, error: `The companion could not answer (${res.status}).` }, { status: 502 });
  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return Response.json({ ok: false, error: "The companion returned an empty reply." }, { status: 502 });
  return Response.json({ ok: true, text });
}
