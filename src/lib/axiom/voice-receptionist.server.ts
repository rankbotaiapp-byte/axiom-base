import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { customerQuoteSms, ownerSlotAlertSms, quoteDepositCents } from "./closed-job.ts";
import { handleVoiceMissedOrPress1, lockCalendarSlot } from "./closed-job.server";
import { listShopPriceBook } from "./price-book.server";
import { resolvePublicAppOrigin } from "./public-app-url";
import { computeShopArrivalWindows } from "./closed-job.server";
import { persistConversation, sendSms, type TwilioShop } from "./twilio-booking.server";
import {
  buildConversationRelayTwiml,
  buildGatherTwiml,
  DEFAULT_VOICE_DAILY_CAP_CENTS,
  nextVoiceReply,
  parseVoiceAnswerMode,
  receptionistSystemPrompt,
  shouldFallbackToMissedCallSms,
  VOICE_TURN_CENTS,
  voiceGreeting,
  voiceSpendExceeded,
  type VoiceSessionState,
} from "./voice-receptionist.ts";

type SessionRow = {
  call_sid: string;
  shop_id: string;
  from_phone: string;
  to_phone: string;
  status: string;
  turns: number;
  spend_cents: number;
  booked: boolean;
  payload: VoiceSessionState | Record<string, unknown>;
};

async function todaySpendCents(shopId: string): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ cents: string | number }>`
    select coalesce(sum(cents), 0) as cents
    from voice_spend_ledger
    where shop_id = ${shopId} and created_at > date_trunc('day', now())
  `.catch(() => [{ cents: 0 }]);
  return Number(rows[0]?.cents) || 0;
}

async function recordSpend(shopId: string, callSid: string, cents: number) {
  const sql = await getSql();
  await sql`
    insert into voice_spend_ledger (id, shop_id, call_sid, cents, kind)
    values (${newId("vsp")}, ${shopId}, ${callSid}, ${cents}, ${"turn"})
  `.catch(() => undefined);
}

async function loadSession(callSid: string): Promise<SessionRow | null> {
  const sql = await getSql();
  const rows = await sql<SessionRow>`
    select call_sid, shop_id, from_phone, to_phone, status, turns, spend_cents, booked, payload
    from voice_call_sessions where call_sid = ${callSid} limit 1
  `.catch(() => []);
  return rows[0] ?? null;
}

async function upsertSession(input: {
  callSid: string;
  shopId: string;
  from: string;
  to: string;
  patch?: Partial<SessionRow> & { payload?: VoiceSessionState; appointment_id?: string; quote_id?: string };
}) {
  const sql = await getSql();
  const payload = JSON.stringify(input.patch?.payload || {});
  const status = input.patch?.status || "active";
  const turns = input.patch?.turns ?? 0;
  const spend = input.patch?.spend_cents ?? 0;
  const booked = Boolean(input.patch?.booked);
  const appointmentId = input.patch?.appointment_id || null;
  const quoteId = input.patch?.quote_id || null;
  await sql`
    insert into voice_call_sessions (
      call_sid, shop_id, from_phone, to_phone, status, turns, spend_cents, booked, payload, appointment_id, quote_id, updated_at
    ) values (
      ${input.callSid}, ${input.shopId}, ${input.from}, ${input.to},
      ${status}, ${turns}, ${spend}, ${booked}, ${payload}::jsonb, ${appointmentId}, ${quoteId}, now()
    )
    on conflict (call_sid) do update set
      status = excluded.status,
      turns = excluded.turns,
      spend_cents = excluded.spend_cents,
      booked = excluded.booked or voice_call_sessions.booked,
      payload = excluded.payload,
      appointment_id = coalesce(excluded.appointment_id, voice_call_sessions.appointment_id),
      quote_id = coalesce(excluded.quote_id, voice_call_sessions.quote_id),
      updated_at = now()
  `.catch(() => undefined);
}

async function grokGroundedSay(input: {
  shopName: string;
  niche: string;
  catalog: Awaited<ReturnType<typeof listShopPriceBook>>;
  windows: Awaited<ReturnType<typeof computeShopArrivalWindows>>;
  speech: string;
  fallback: string;
}): Promise<string> {
  const apiKey = env("XAI_API_KEY");
  if (!apiKey) return input.fallback;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 90,
        messages: [
          { role: "system", content: receptionistSystemPrompt({ shopName: input.shopName, niche: input.niche, catalog: input.catalog, windows: input.windows }) },
          { role: "user", content: input.speech.slice(0, 400) },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content?.replace(/\s+/g, " ").trim() || "";
    return text.slice(0, 280) || input.fallback;
  } catch {
    return input.fallback;
  }
}

async function smsOut(to: string, body: string, shopId: string, kind: string) {
  const sent = await sendSms(to, body);
  await persistConversation({
    shopId,
    channel: "sms",
    direction: "outbound",
    fromPhone: "",
    toPhone: to,
    body,
    status: sent.ok ? "sent" : "failed",
    providerRef: sent.sid,
    kind,
  });
  return sent;
}

export async function lockLiveSlotAndDeposit(input: {
  shop: TwilioShop;
  from: string;
  serviceId?: string;
  windowIndex: 1 | 2;
  quoteCents: number;
  depositCents: number;
  spokenQuote: string;
}): Promise<{ appointmentId: string | null; quoteId: string | null; quoteUrl: string }> {
  const windows = await computeShopArrivalWindows(input.shop.id);
  const window = windows[(input.windowIndex || 1) - 1] || windows[0];
  const origin = (resolvePublicAppOrigin() || "https://rankbotapp.com").replace(/\/$/, "");
  if (!window) return { appointmentId: null, quoteId: null, quoteUrl: origin };
  const appointmentId = await lockCalendarSlot({
    shop: {
      id: input.shop.id,
      slug: input.shop.slug,
      name: input.shop.name,
      hours_json: input.shop.hoursJson || null,
      notify_phone: input.shop.notifyPhone || null,
      notification_phone: input.shop.notifyPhone || null,
      owner_phone: input.shop.ownerPhone || null,
      google_review_url: input.shop.googleReviewUrl || null,
      phone: input.shop.notifyPhone || null,
      address: null,
      last_mms_upload: null,
      license_number: null,
      ad_tagline: null,
      tagline: null,
    },
    customerPhone: input.from,
    issue: input.spokenQuote || "Voice booking",
    startsAt: window.startsAt,
    employeeId: window.employeeId,
    windowLabel: window.label,
    serviceId: input.serviceId,
  });
  const quoteId = newId("qte");
  const quoteUrl = `${origin}/q/${quoteId}`;
  const deposit = input.depositCents > 0 ? input.depositCents : quoteDepositCents(input.quoteCents);
  const sql = await getSql();
  let checkoutUrl = quoteUrl;
  try {
    const { createConnectCheckout } = await import("./payments.server");
    const billing = await sql<{ stripe_account_id: string | null; stripe_charges_enabled: boolean | null }>`
      select stripe_account_id, stripe_charges_enabled from shop_billing where shop_id = ${input.shop.id} limit 1
    `;
    const destination = billing[0]?.stripe_account_id;
    if (destination && billing[0]?.stripe_charges_enabled && appointmentId && deposit > 0) {
      const session = await createConnectCheckout({
        destination,
        amountCents: deposit,
        serviceName: (input.spokenQuote || "Service deposit").slice(0, 120),
        shopId: input.shop.id,
        appointmentId,
        shopSlug: input.shop.slug,
        successUrl: `${quoteUrl}?paid=1`,
        cancelUrl: `${quoteUrl}?canceled=1`,
      });
      checkoutUrl = session.url;
      await sql`
        insert into shop_quotes (
          id, shop_id, appointment_id, customer_phone, customer_name, description,
          total_cents, deposit_cents, stripe_session_id, stripe_checkout_url, status
        ) values (
          ${quoteId}, ${input.shop.id}, ${appointmentId}, ${input.from}, ${`Caller ${input.from.slice(-4)}`},
          ${input.spokenQuote}, ${input.quoteCents || deposit}, ${deposit}, ${session.id}, ${session.url}, ${"sent"}
        )
      `.catch(() => undefined);
    } else {
      await sql`
        insert into shop_quotes (
          id, shop_id, appointment_id, customer_phone, customer_name, description,
          total_cents, deposit_cents, stripe_checkout_url, status
        ) values (
          ${quoteId}, ${input.shop.id}, ${appointmentId}, ${input.from}, ${`Caller ${input.from.slice(-4)}`},
          ${input.spokenQuote}, ${input.quoteCents || deposit}, ${deposit}, ${quoteUrl}, ${"sent"}
        )
      `.catch(() => undefined);
    }
  } catch {
    await sql`
      insert into shop_quotes (
        id, shop_id, appointment_id, customer_phone, customer_name, description,
        total_cents, deposit_cents, stripe_checkout_url, status
      ) values (
        ${quoteId}, ${input.shop.id}, ${appointmentId}, ${input.from}, ${`Caller ${input.from.slice(-4)}`},
        ${input.spokenQuote}, ${input.quoteCents || deposit}, ${deposit}, ${quoteUrl}, ${"sent"}
      )
    `.catch(() => undefined);
  }
  if (deposit > 0) {
    await smsOut(
      input.from,
      customerQuoteSms({
        shopName: input.shop.name,
        amountCents: input.quoteCents || deposit,
        description: input.spokenQuote || "Service visit",
        quoteUrl,
      }),
      input.shop.id,
      "voice_deposit_sms",
    );
  }
  const owner = input.shop.notifyPhone || input.shop.ownerPhone;
  if (owner) {
    await smsOut(
      owner,
      ownerSlotAlertSms({
        customerName: `Caller ${input.from.slice(-4)}`,
        customerPhone: input.from,
        issue: input.spokenQuote || "Voice lock",
        windowLabel: window.label,
      }),
      input.shop.id,
      "owner_voice_slot",
    );
  }
  return { appointmentId, quoteId, quoteUrl: checkoutUrl };
}

export async function fallbackMissedCallIfNeeded(input: {
  shopId: string;
  from: string;
  booked: boolean;
  capped?: boolean;
  disconnected?: boolean;
  turns: number;
}): Promise<boolean> {
  if (!shouldFallbackToMissedCallSms({
    booked: input.booked,
    capped: Boolean(input.capped),
    disconnected: Boolean(input.disconnected),
    turns: input.turns,
  })) {
    return false;
  }
  return handleVoiceMissedOrPress1({
    shopId: input.shopId,
    customerPhone: input.from,
    digits: "1",
  });
}

export async function startVoiceReceptionist(input: {
  shop: TwilioShop;
  from: string;
  to: string;
  callSid: string;
  voiceAnswerMode?: string | null;
  voiceDailyCapCents?: number | null;
}): Promise<string> {
  const cap = Number(input.voiceDailyCapCents) || DEFAULT_VOICE_DAILY_CAP_CENTS;
  const spent = await todaySpendCents(input.shop.id);
  if (voiceSpendExceeded(spent, cap)) {
    await fallbackMissedCallIfNeeded({
      shopId: input.shop.id,
      from: input.from,
      booked: false,
      capped: true,
      turns: 99,
    });
    return buildGatherTwiml({
      say: `We're at capacity on the live line. I just texted you the next two arrival windows. Reply 1 or 2 to lock a spot.`,
      actionPath: "/api/webhooks/twilio/voice?step=ai",
      hangup: true,
    });
  }
  await upsertSession({
    callSid: input.callSid,
    shopId: input.shop.id,
    from: input.from,
    to: input.to,
    patch: { status: "active", turns: 0, payload: { stage: "greet" } },
  });
  const welcome = voiceGreeting(input.shop.name);
  const relay = env("TWILIO_CONVERSATION_RELAY_WSS");
  if (relay) {
    return buildConversationRelayTwiml({
      wssUrl: relay,
      welcome,
      shopId: input.shop.id,
      callSid: input.callSid,
      actionPath: "/api/webhooks/twilio/voice?step=relay-end",
    });
  }
  return buildGatherTwiml({
    say: welcome,
    actionPath: "/api/webhooks/twilio/voice?step=ai",
  });
}

export async function handleVoiceAiTurn(form: URLSearchParams, shop: TwilioShop): Promise<string> {
  const callSid = form.get("CallSid") || "";
  const from = form.get("From") || "";
  const speech = (form.get("SpeechResult") || form.get("Digits") || "").trim();
  const empty = !speech;
  let session = callSid ? await loadSession(callSid) : null;
  const state = (session?.payload || { stage: "greet" }) as VoiceSessionState;
  const catalog = await listShopPriceBook(shop.id);
  const windows = await computeShopArrivalWindows(shop.id);
  const spent = await todaySpendCents(shop.id);
  const cap = Number(shop.voiceDailyCapCents) || DEFAULT_VOICE_DAILY_CAP_CENTS;
  const turns = (session?.turns || 0) + 1;

  if (empty && turns > 1) {
    await fallbackMissedCallIfNeeded({
      shopId: shop.id,
      from,
      booked: Boolean(session?.booked),
      disconnected: true,
      turns,
    });
    return buildGatherTwiml({
      say: "I texted you two arrival windows. Reply 1 or 2. Goodbye.",
      actionPath: "/api/webhooks/twilio/voice?step=ai",
      hangup: true,
    });
  }

  if (voiceSpendExceeded(spent, cap) || turns >= 8) {
    await fallbackMissedCallIfNeeded({
      shopId: shop.id,
      from,
      booked: Boolean(session?.booked),
      capped: true,
      turns,
    });
    await upsertSession({
      callSid,
      shopId: shop.id,
      from,
      to: form.get("To") || "",
      patch: { status: "capped", turns, booked: Boolean(session?.booked) },
    });
    return buildGatherTwiml({
      say: "I'll text the next two windows so we don't keep you on the line. Reply 1 or 2.",
      actionPath: "/api/webhooks/twilio/voice?step=ai",
      hangup: true,
    });
  }

  const next = nextVoiceReply({
    speech: speech || "service call",
    shopName: shop.name,
    catalog,
    windows,
    state,
  });
  let say = next.say;
  if (next.action === "continue" && speech && state.stage !== "greet") {
    say = await grokGroundedSay({
      shopName: shop.name,
      niche: shop.niche || "plumbing",
      catalog,
      windows,
      speech,
      fallback: next.say,
    });
  }

  await recordSpend(shop.id, callSid, VOICE_TURN_CENTS);
  if (next.action === "book") {
    const booked = await lockLiveSlotAndDeposit({
      shop,
      from,
      serviceId: next.state.serviceId,
      windowIndex: next.state.windowIndex || 1,
      quoteCents: next.state.quoteCents || 0,
      depositCents: next.state.depositCents || 0,
      spokenQuote: next.state.spokenQuote || next.say,
    });
    await upsertSession({
      callSid,
      shopId: shop.id,
      from,
      to: form.get("To") || "",
      patch: {
        status: "booked",
        turns,
        booked: true,
        spend_cents: spent + VOICE_TURN_CENTS,
        payload: next.state,
        appointment_id: booked.appointmentId || undefined,
        quote_id: booked.quoteId || undefined,
      },
    });
    return buildGatherTwiml({ say: next.say, actionPath: "/api/webhooks/twilio/voice?step=ai", hangup: true });
  }
  if (next.action === "fallback") {
    await fallbackMissedCallIfNeeded({ shopId: shop.id, from, booked: false, disconnected: true, turns });
    await upsertSession({
      callSid,
      shopId: shop.id,
      from,
      to: form.get("To") || "",
      patch: { status: "fallback", turns, payload: next.state },
    });
    return buildGatherTwiml({ say: next.say, actionPath: "/api/webhooks/twilio/voice?step=ai", hangup: true });
  }
  await upsertSession({
    callSid,
    shopId: shop.id,
    from,
    to: form.get("To") || "",
    patch: { status: "active", turns, payload: next.state, spend_cents: spent + VOICE_TURN_CENTS },
  });
  return buildGatherTwiml({ say, actionPath: "/api/webhooks/twilio/voice?step=ai" });
}

export async function handleVoiceHangup(form: URLSearchParams, shop: TwilioShop | null): Promise<string> {
  const callSid = form.get("CallSid") || "";
  const from = form.get("From") || "";
  if (!shop?.id || !from) {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
  }
  const session = callSid ? await loadSession(callSid) : null;
  if (!session?.booked) {
    await fallbackMissedCallIfNeeded({
      shopId: shop.id,
      from,
      booked: false,
      disconnected: true,
      turns: session?.turns || 1,
    });
    if (callSid) {
      await upsertSession({
        callSid,
        shopId: shop.id,
        from,
        to: form.get("To") || "",
        patch: { status: "fallback" },
      });
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
}

export function shopVoiceMode(shop: { voiceAnswerMode?: string | null }): ReturnType<typeof parseVoiceAnswerMode> {
  return parseVoiceAnswerMode(shop.voiceAnswerMode);
}
