import { companionAllowed } from "@/lib/axiom/companion-desk";
import { orbAnswerMessages, parseOrbQuestion } from "@/lib/axiom/orb-answer";

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
    return Response.json({ ok: false, error: "The question could not be read." }, { status: 400 });
  }
  const question = parseOrbQuestion(body);
  if (!question) return Response.json({ ok: false, error: "Ask a question first." }, { status: 400 });
  if (!companionAllowed(callerOf(request))) {
    return Response.json({ ok: false, error: "The assistant is cooling down. Try again in a few minutes." }, { status: 429 });
  }
  const apiKey = process.env.XAI_API_KEY?.trim() ?? "";
  if (!apiKey) return Response.json({ ok: false, error: "AI is not available in this environment" }, { status: 503 });

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 180,
      messages: orbAnswerMessages(question),
    }),
  });
  if (!res.ok) return Response.json({ ok: false, error: `The assistant could not answer (${res.status}).` }, { status: 502 });
  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return Response.json({ ok: false, error: "The assistant returned an empty reply." }, { status: 502 });
  return Response.json({ ok: true, text });
}
