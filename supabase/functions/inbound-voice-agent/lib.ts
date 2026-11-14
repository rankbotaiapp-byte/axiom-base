/** Pure helpers for the inbound Twilio voice receptionist. Safe for Deno and Node tests. */

export type TenantVoiceContext = {
  tenantId: string;
  shopId: string;
  slug: string;
  businessName: string;
  niche: string;
  phone: string;
  pricing: string;
};

export function last10Digits(raw: string | null | undefined): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.slice(-10);
}

export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = last10Digits(a);
  const right = last10Digits(b);
  return Boolean(left && right && left === right);
}

export function escapeTwiml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatMoney(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function pricingLine(services: Array<{ name?: string; price_cents?: number }>): string {
  const parts = services
    .map((row) => {
      const name = String(row.name ?? "").trim();
      const price = formatMoney(Number(row.price_cents) || 0);
      if (!name) return "";
      return price ? `${name} ${price}` : name;
    })
    .filter(Boolean)
    .slice(0, 8);
  return parts.join("; ") || "Quote on site after a short diagnose.";
}

export function receptionistPrompt(ctx: TenantVoiceContext): string {
  return [
    `You are the live phone receptionist for ${ctx.businessName}.`,
    `Niche: ${ctx.niche || "local trades"}.`,
    `Speak as their dedicated front desk — warm, brief, Cyber-Obsidian professional, never generic AI.`,
    `Pricing you may quote: ${ctx.pricing}. Never invent other prices.`,
    `If they want a visit, collect name, callback number, service, and a start time, then call tool book_appointment.`,
    `Confirm the slot in one sentence. Emergency leaks or no-heat: take the job first, then book.`,
    `Do not collect card numbers. If they say stop, end politely.`,
  ].join(" ");
}

export type BookAppointmentInput = {
  tenantId?: string;
  shopId?: string;
  customerName?: string;
  customerPhone?: string;
  startsAt?: string;
  serviceName?: string;
  notes?: string;
  priceCents?: number;
};

export function normalizeBookInput(raw: BookAppointmentInput, fallbackPhone = ""): BookAppointmentInput {
  return {
    tenantId: String(raw.tenantId ?? "").trim(),
    shopId: String(raw.shopId ?? "").trim(),
    customerName: String(raw.customerName ?? "Caller").trim().slice(0, 80) || "Caller",
    customerPhone: last10Digits(raw.customerPhone || fallbackPhone)
      ? `+1${last10Digits(raw.customerPhone || fallbackPhone)}`
      : "",
    startsAt: String(raw.startsAt ?? "").trim(),
    serviceName: String(raw.serviceName ?? "Service call").trim().slice(0, 80),
    notes: String(raw.notes ?? "").trim().slice(0, 400),
    priceCents: Number.isFinite(Number(raw.priceCents)) ? Math.max(0, Math.round(Number(raw.priceCents))) : 0,
  };
}

export type StreamTarget = {
  url: string;
  parameters: Record<string, string>;
  provider: "elevenlabs" | "retell" | "axiom";
};

export function buildConnectTwiml(input: {
  stream: StreamTarget;
  greeting: string;
}): string {
  const params = Object.entries(input.stream.parameters)
    .map(([name, value]) => `<Parameter name="${escapeTwiml(name)}" value="${escapeTwiml(value)}" />`)
    .join("");
  const say = input.greeting.trim()
    ? `<Say voice="Polly.Joanna">${escapeTwiml(input.greeting.trim())}</Say>`
    : "";
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    `${say}` +
    `<Connect>` +
    `<Stream url="${escapeTwiml(input.stream.url)}">${params}</Stream>` +
    `</Connect>` +
    `</Response>`
  );
}

export function mediaWebsocketUrl(reqUrl: string): string {
  const url = new URL(reqUrl);
  const proto = url.protocol === "https:" ? "wss:" : "ws:";
  url.protocol = proto;
  url.pathname = url.pathname.replace(/\/$/, "") + "/media";
  url.search = "";
  url.hash = "";
  return url.toString();
}
