/**
 * Twilio voice webhook → TwiML <Connect><Stream> to a conversational AI
 * (ElevenLabs ConvAI, Retell, or this function's own media WebSocket).
 *
 * JWT verify is off — Twilio posts form-encoded, not a Supabase JWT.
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  buildConnectTwiml,
  last10Digits,
  mediaWebsocketUrl,
  normalizeBookInput,
  phonesMatch,
  pricingLine,
  receptionistPrompt,
  type BookAppointmentInput,
  type StreamTarget,
  type TenantVoiceContext,
} from "./lib.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

function env(name: string): string {
  return (Deno.env.get(name) ?? "").trim();
}

function supabaseAdmin(): SupabaseClient {
  const url = env("SUPABASE_URL") || env("SB_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function xml(body: string, status = 200): Response {
  return new Response(body, { status, headers: { ...cors, "Content-Type": "text/xml; charset=utf-8" } });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function formMap(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) out[key] = String(value ?? "");
    return out;
  }
  const text = await req.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}

async function loadVoiceContext(toNumber: string): Promise<TenantVoiceContext | null> {
  const db = supabaseAdmin();
  const needle = last10Digits(toNumber);
  if (!needle) return null;

  const tenants = await db
    .from("tenants")
    .select("id,slug,business_name,phone,dispatch_phone,trade,plan")
    .limit(80);
  const tenantRows = (tenants.data ?? []) as Array<Record<string, string | null>>;
  const tenant = tenantRows.find(
    (row) => phonesMatch(row.phone, toNumber) || phonesMatch(row.dispatch_phone, toNumber),
  );

  const shops = await db
    .from("shops")
    .select("id,slug,name,niche,notify_phone,notification_phone,phone")
    .limit(80);
  const shopRows = (shops.data ?? []) as Array<Record<string, string | null>>;
  const shop =
    shopRows.find(
      (row) =>
        phonesMatch(row.notify_phone, toNumber) ||
        phonesMatch(row.notification_phone, toNumber) ||
        phonesMatch(row.phone, toNumber) ||
        (tenant && row.slug === tenant.slug),
    ) ?? null;

  if (!tenant && !shop) return null;

  let pricing = "Quote on site after a short diagnose.";
  if (shop?.id) {
    const services = await db.from("services").select("name,price_cents").eq("shop_id", shop.id).limit(8);
    pricing = pricingLine((services.data ?? []) as Array<{ name?: string; price_cents?: number }>);
  }

  const businessName = tenant?.business_name || shop?.name || "this shop";
  const niche = tenant?.trade || shop?.niche || tenant?.plan || "local service";
  return {
    tenantId: String(tenant?.id ?? ""),
    shopId: String(shop?.id ?? ""),
    slug: String(tenant?.slug || shop?.slug || ""),
    businessName,
    niche,
    phone: toNumber,
    pricing,
  };
}

async function elevenLabsStream(ctx: TenantVoiceContext): Promise<StreamTarget | null> {
  const agent = env("ELEVENLABS_AGENT_ID");
  const key = env("ELEVENLABS_API_KEY");
  if (!agent) return null;
  let url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agent)}`;
  if (key) {
    const signed = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agent)}`,
      { headers: { "xi-api-key": key } },
    ).catch(() => null);
    if (signed?.ok) {
      const body = (await signed.json()) as { signed_url?: string };
      if (body.signed_url) url = body.signed_url;
    }
  }
  return {
    provider: "elevenlabs",
    url,
    parameters: {
      business_name: ctx.businessName,
      niche: ctx.niche,
      pricing: ctx.pricing.slice(0, 240),
      tenant_id: ctx.tenantId,
      shop_id: ctx.shopId,
      prompt: receptionistPrompt(ctx).slice(0, 500),
    },
  };
}

async function retellStream(ctx: TenantVoiceContext, fromNumber: string, toNumber: string): Promise<StreamTarget | null> {
  const agent = env("RETELL_AGENT_ID");
  const key = env("RETELL_API_KEY");
  if (!agent || !key) return null;
  const res = await fetch("https://api.retellai.com/v2/register-phone-call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agent,
      from_number: fromNumber,
      to_number: toNumber,
      metadata: { tenant_id: ctx.tenantId, shop_id: ctx.shopId, slug: ctx.slug },
      retell_llm_dynamic_variables: {
        business_name: ctx.businessName,
        niche: ctx.niche,
        pricing: ctx.pricing,
        system_prompt: receptionistPrompt(ctx),
      },
    }),
  }).catch(() => null);
  if (!res?.ok) return null;
  const body = (await res.json()) as { call_id?: string };
  if (!body.call_id) return null;
  return {
    provider: "retell",
    url: `wss://api.retellai.com/audio-websocket/${body.call_id}`,
    parameters: { tenant_id: ctx.tenantId, shop_id: ctx.shopId },
  };
}

async function resolveStream(
  req: Request,
  ctx: TenantVoiceContext,
  fromNumber: string,
  toNumber: string,
): Promise<StreamTarget> {
  const provider = env("VOICE_AI_PROVIDER").toLowerCase();
  if (provider !== "axiom") {
    const eleven = provider === "retell" ? null : await elevenLabsStream(ctx);
    if (eleven) return eleven;
    const retell = await retellStream(ctx, fromNumber, toNumber);
    if (retell) return retell;
  }
  return {
    provider: "axiom",
    url: mediaWebsocketUrl(req.url),
    parameters: {
      tenant_id: ctx.tenantId,
      shop_id: ctx.shopId,
      from: fromNumber,
      to: toNumber,
      prompt: receptionistPrompt(ctx).slice(0, 900),
    },
  };
}

async function bookAppointment(raw: BookAppointmentInput, fallbackPhone = "") {
  const input = normalizeBookInput(raw, fallbackPhone);
  if (!input.tenantId && !input.shopId) {
    return { ok: false as const, error: "tenant_id or shop_id required" };
  }
  const when = input.startsAt ? new Date(input.startsAt) : new Date(Date.now() + 90 * 60 * 1000);
  if (Number.isNaN(when.getTime())) {
    return { ok: false as const, error: "invalid starts_at" };
  }
  const db = supabaseAdmin();
  const row = {
    tenant_id: input.tenantId || null,
    shop_id: input.shopId || null,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    starts_at: when.toISOString(),
    service_name: input.serviceName,
    price_cents: input.priceCents ?? 0,
    notes: input.notes,
    status: "pending",
    source: "voice_ai",
  };
  const inserted = await db.from("tenant_calendar").insert(row).select("id,starts_at").limit(1).single();
  if (inserted.error) {
    return { ok: false as const, error: inserted.error.message };
  }
  return {
    ok: true as const,
    id: inserted.data?.id,
    startsAt: inserted.data?.starts_at ?? when.toISOString(),
    spoken: `Booked ${input.serviceName} for ${input.customerName} at ${when.toLocaleString("en-US")}.`,
  };
}

function attachMediaSocket(socket: WebSocket, prompt: string) {
  const provider = env("VOICE_AI_PROVIDER").toLowerCase();
  const elevenAgent = env("ELEVENLABS_AGENT_ID");
  let upstream: WebSocket | null = null;

  socket.onopen = () => {
    if ((provider === "elevenlabs" || (!provider && elevenAgent)) && elevenAgent) {
      const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(elevenAgent)}`;
      upstream = new WebSocket(url);
      upstream.onmessage = (event) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(event.data);
      };
    }
  };

  socket.onmessage = (event) => {
    const raw = String(event.data ?? "");
    let parsed: { event?: string; media?: { payload?: string }; start?: { customParameters?: Record<string, string> } } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return;
    }
    if (parsed.event === "start") {
      const injected = parsed.start?.customParameters?.prompt || prompt;
      if (upstream && upstream.readyState === WebSocket.OPEN) {
        upstream.send(JSON.stringify({ type: "conversation_initiation_client_data", conversation_config_override: { agent: { prompt: { prompt: injected } } } }));
      }
    }
    if (parsed.event === "media" && parsed.media?.payload && upstream && upstream.readyState === WebSocket.OPEN) {
      upstream.send(JSON.stringify({ user_audio_chunk: parsed.media.payload }));
    }
    if (parsed.event === "stop") upstream?.close();
  };

  socket.onclose = () => upstream?.close();
}

async function handleTwilioVoice(req: Request): Promise<Response> {
  const form = await formMap(req);
  const to = form.To || form.to || "";
  const from = form.From || form.from || "";
  const ctx = (await loadVoiceContext(to)) ?? {
    tenantId: "",
    shopId: "",
    slug: "",
    businessName: "Axiom Dispatch",
    niche: "local trades",
    phone: to,
    pricing: "Quote on site after a short diagnose.",
  };
  const stream = await resolveStream(req, ctx, from, to);
  const greeting = `Connecting you to ${ctx.businessName}.`;
  return xml(buildConnectTwiml({ stream, greeting }));
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    attachMediaSocket(socket, url.searchParams.get("prompt") || "");
    return response;
  }

  const path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/tools/book_appointment") && req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as BookAppointmentInput & { from?: string };
    const result = await bookAppointment(body, body.from || body.customerPhone || "");
    return json(result, result.ok ? 200 : 400);
  }

  if (req.method === "GET") {
    return json({
      ok: true,
      function: "inbound-voice-agent",
      tools: ["book_appointment"],
      providers: ["elevenlabs", "retell", "axiom"],
    });
  }

  if (req.method === "POST") return handleTwilioVoice(req);
  return json({ error: "Method not allowed" }, 405);
});
