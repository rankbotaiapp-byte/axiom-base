/** Pure inbound SMS qualify/book helpers. No DB, no Grok. */

export const SMS_INBOUND_INTENTS = ["booking", "qualify", "question", "other"] as const;
export type SmsInboundIntent = (typeof SMS_INBOUND_INTENTS)[number];

export type SmsInboundDecision = {
  intent: SmsInboundIntent;
  wantsSlot: boolean;
  serviceName: string;
  startsAt: string | null;
  customerName: string;
  projectSummary: string;
  reply: string;
};

const BOOKING_RE =
  /\b(book|booking|appoint|schedule|slot|tomorrow|today|tonight|asap|this (morning|afternoon|evening)|am|pm|\d{1,2}:\d{2})\b/i;
const SERVICE_RE =
  /\b(drain|sewer|leak|burst|pipe|heater|sump|clog|toilet|faucet|water heater|emergency)\b/i;

const DEFAULT_REPLY =
  "Got it. What service do you need, and what day and time works? Example: drain clear tomorrow 9am.";

export function emptySmsDecision(overrides: Partial<SmsInboundDecision> = {}): SmsInboundDecision {
  return {
    intent: "qualify",
    wantsSlot: false,
    serviceName: "",
    startsAt: null,
    customerName: "",
    projectSummary: "",
    reply: DEFAULT_REPLY,
    ...overrides,
  };
}

export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return "";
  return body.slice(start, end + 1);
}

function asIntent(value: unknown): SmsInboundIntent {
  const key = String(value ?? "").trim().toLowerCase();
  if (key === "booking" || key === "qualify" || key === "question" || key === "other") return key;
  return "qualify";
}

export function parseIsoSlot(raw: string, now = Date.now()): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const when = new Date(trimmed);
  if (Number.isNaN(when.getTime())) return null;
  const t = when.getTime();
  if (t < now - 60_000) return null;
  if (t > now + 90 * 86_400_000) return null;
  return when.toISOString();
}

export function roundUpHalfHourIso(from = new Date()): string {
  const ms = 30 * 60 * 1000;
  const soon = new Date(from.getTime() + 75 * 60 * 1000);
  return new Date(Math.ceil(soon.getTime() / ms) * ms).toISOString();
}

export function heuristicSmsDecision(text: string, now = Date.now()): SmsInboundDecision {
  const raw = text.replace(/\s+/g, " ").trim().slice(0, 600);
  if (!raw) return emptySmsDecision();
  const wants = BOOKING_RE.test(raw);
  const service = raw.match(SERVICE_RE)?.[0] ?? "";
  const asap = /\b(asap|right now|as soon as|today)\b/i.test(raw);
  const startsAt = wants && asap ? roundUpHalfHourIso(new Date(now)) : null;
  if (wants && startsAt) {
    return emptySmsDecision({
      intent: "booking",
      wantsSlot: true,
      serviceName: service,
      startsAt,
      projectSummary: raw.slice(0, 180),
      reply: "I can hold a slot. Confirm the time and we will lock it for the crew.",
    });
  }
  if (wants) {
    return emptySmsDecision({
      intent: "booking",
      wantsSlot: true,
      serviceName: service,
      projectSummary: raw.slice(0, 180),
      reply: "I can book this. Reply with a day and time (for example tomorrow 9am) and the job type.",
    });
  }
  return emptySmsDecision({
    intent: SERVICE_RE.test(raw) ? "qualify" : "question",
    serviceName: service,
    projectSummary: raw.slice(0, 180),
    reply: DEFAULT_REPLY,
  });
}

export function parseGrokSmsJson(raw: string, fallback: SmsInboundDecision, now = Date.now()): SmsInboundDecision {
  const json = extractJsonObject(raw);
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const wantsSlot = Boolean(parsed.wantsSlot ?? parsed.booking);
    const startsAt = parseIsoSlot(String(parsed.startsAt ?? parsed.starts_at ?? ""), now);
    const reply = String(parsed.reply ?? "").trim().slice(0, 420);
    return {
      intent: asIntent(parsed.intent),
      wantsSlot,
      serviceName: String(parsed.serviceName ?? parsed.service ?? "").trim().slice(0, 80),
      startsAt,
      customerName: String(parsed.customerName ?? parsed.name ?? "").trim().slice(0, 80),
      projectSummary: String(parsed.projectSummary ?? parsed.summary ?? "").trim().slice(0, 240),
      reply: reply || fallback.reply,
    };
  } catch {
    return fallback;
  }
}

export function escapeTwiml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function twimlResponse(message = ""): Response {
  const inner = message.trim() ? `<Message>${escapeTwiml(message.trim())}</Message>` : "";
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, {
    headers: { "content-type": "text/xml" },
  });
}

export function matchServiceName<T extends { name: string }>(catalog: T[], wanted: string): T | null {
  const needle = wanted.trim().toLowerCase();
  if (!needle || catalog.length === 0) return catalog[0] ?? null;
  const exact = catalog.find((row) => row.name.toLowerCase() === needle);
  if (exact) return exact;
  const partial = catalog.find(
    (row) => row.name.toLowerCase().includes(needle) || needle.includes(row.name.toLowerCase()),
  );
  return partial ?? catalog[0] ?? null;
}
