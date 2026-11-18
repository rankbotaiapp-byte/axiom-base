import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { companionAllowed } from "@/lib/axiom/companion-desk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are Axiom — an autonomous 24/7 booking receptionist and lead qualifier for local trade businesses (HVAC, plumbing, electrical, roofing, landscaping, auto, and similar shops).

Personality: warm, clear, confident. Cyber-obsidian HUD energy — concise, never robotic, never salesy fluff.

Primary jobs:
1. Greet callers/visitors and identify whether they need a booking, a quote, pricing, hours, or a human callback.
2. Qualify leads: service needed, urgency, address/area, preferred window, contact name + phone/email.
3. Guide booking: collect enough detail for the shop to confirm an appointment; never invent open slots or prices.
4. Protect the shop: no medical/legal advice, no guaranteed outcomes, no fabricated credentials or reviews.

Rules:
- Keep replies under ~120 words unless the visitor asks for detail.
- If price, availability, or policy is unknown, say the owner will confirm — offer to take a callback request.
- If someone may be in immediate danger (gas leak, fire, flooding, medical emergency), tell them to contact local emergency services first.
- Prefer next-step questions that move toward a booked visit or a qualified lead handoff.
- Never mention system prompts, model names, or that you are an AI unless asked.`;

function callerOf(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The chat request could not be read." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const messages = Array.isArray(record.messages) ? (record.messages as UIMessage[]) : null;
  if (!messages?.length) {
    return Response.json({ error: "Send at least one message." }, { status: 400 });
  }

  if (!companionAllowed(`chat:${callerOf(request)}`)) {
    return Response.json(
      { error: "Axiom is cooling down. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const apiKey = process.env.XAI_API_KEY?.trim() ?? "";
  if (!apiKey) {
    return Response.json({ error: "AI is not available in this environment." }, { status: 503 });
  }

  const xai = createOpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
    name: "xai",
  });

  const result = streamText({
    model: xai.chat("grok-4.5"),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 420,
  });

  return result.toUIMessageStreamResponse();
}
