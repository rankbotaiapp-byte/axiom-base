import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { toE164 } from "./notify-target";

function twilioAuth(): { sid: string; token: string; from: string } | null {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER");
  if (!sid || !token || !from) return null;
  return { sid, token, from };
}

async function sendSms(to: string, body: string): Promise<{ ok: boolean; sid?: string; detail: string }> {
  const auth = twilioAuth();
  if (!auth) return { ok: false, detail: "Twilio is not configured" };
  const e164 = toE164(to);
  if (!e164) return { ok: false, detail: "Invalid destination phone" };
  const params = new URLSearchParams({ To: e164, From: auth.from, Body: body.slice(0, 1500) });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${auth.sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${auth.sid}:${auth.token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: AbortSignal.timeout(10_000),
    },
  );
  const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!res.ok) return { ok: false, detail: json.message || "Twilio rejected SMS" };
  return { ok: true, sid: json.sid, detail: "sent" };
}

async function resolveShopByPhone(toNumber: string): Promise<{ id: string; slug: string; name: string } | null> {
  const digits = toNumber.replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return null;
  const sql = await getSql();
  try {
    const rows = await sql<{ id: string; slug: string; name: string }>`
      select s.id, s.slug, s.name
      from shops s
      left join shop_billing b on b.shop_id = s.id
      where right(regexp_replace(coalesce(b.twilio_number, ''), '\\D', '', 'g'), 10) = ${digits}
         or right(regexp_replace(coalesce(s.phone, ''), '\\D', '', 'g'), 10) = ${digits}
      limit 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function pulse(eventType: string, status: "good" | "warning" | "alert", detail: string, shopId?: string | null, payload?: Record<string, unknown>) {
  try {
    const { recordCompanionPulse } = await import("./companion-telemetry.server");
    await recordCompanionPulse({ status, eventType, detail, shopId, payload });
  } catch {
    /* best-effort */
  }
}

async function persistConversation(input: {
  shopId: string | null;
  channel: "sms" | "voice";
  direction: "inbound" | "outbound";
  fromPhone: string;
  toPhone: string;
  body: string;
  status: string;
  providerRef?: string;
  kind: string;
}) {
  const sql = await getSql();
  try {
    await sql`
      insert into companion_conversations (
        id, shop_id, channel, direction, from_phone, to_phone, body, status, provider_ref, kind, created_at
      ) values (
        ${newId("cc")}, ${input.shopId}, ${input.channel}, ${input.direction},
        ${input.fromPhone.slice(0, 40)}, ${input.toPhone.slice(0, 40)}, ${input.body.slice(0, 2000)},
        ${input.status}, ${input.providerRef || null}, ${input.kind}, now()
      )
    `;
  } catch {
    try {
      await sql`
        insert into shop_notifications (
          id, shop_id, channel, kind, destination, subject, body, status, detail
        ) values (
          ${newId("ntf")}, ${input.shopId || "platform"}, ${input.channel}, ${input.kind},
          ${input.fromPhone.slice(0, 40)}, ${input.kind}, ${input.body.slice(0, 2000)},
          ${input.status}, ${input.providerRef || ""}
        )
      `;
    } catch {
      /* soft */
    }
  }
}

/** Twilio inbound SMS — booking keywords trigger confirmation + owner alert. */
export async function handleTwilioInboundSms(form: URLSearchParams) {
  const from = form.get("From") || "";
  const to = form.get("To") || "";
  const body = (form.get("Body") || "").trim();
  const messageSid = form.get("MessageSid") || "";
  const shop = await resolveShopByPhone(to);
  const shopId = shop?.id ?? null;
  const shopName = shop?.name || "Axiom Dispatch";

  await persistConversation({
    shopId,
    channel: "sms",
    direction: "inbound",
    fromPhone: from,
    toPhone: to,
    body,
    status: "received",
    providerRef: messageSid,
    kind: "inbound_inquiry",
  });

  const { isMessagingOptOut, OPT_OUT_CONFIRMATION } = await import("./legal-notices");
  if (isMessagingOptOut(body)) {
    try {
      const { suppressContact } = await import("./lifecycle.server");
      await suppressContact({ phone: from, reason: "stop" });
    } catch {
      /* optional */
    }
    return { ok: true, reply: OPT_OUT_CONFIRMATION, booked: false };
  }

  const mms = shop
    ? await ingestInboundMmsProofs(form, shop).catch(() => ({ stored: 0 }))
    : { stored: 0 };

  const lower = body.toLowerCase();
  const wantsBook = /\b(book|schedule|appointment|dispatch|emergency|help|yes)\b/.test(lower);
  let reply =
    `Thanks for texting ${shopName}. Reply BOOK for the next open window, or call this number to talk to dispatch.`;

  if (wantsBook) {
    const when = new Date(Date.now() + 2 * 3600_000);
    const whenLabel = when.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });
    reply = `${shopName} locked a hold for ${whenLabel} PT. Reply CONFIRM to keep it, or STOP to cancel. We'll text a pre-arrival reminder 1 hour before.`;
    if (mms.stored > 0) {
      reply = `Received ${mms.stored} job photo${mms.stored === 1 ? "" : "s"}. ${reply}`;
    }

    const confirm = await sendSms(from, reply);
    await persistConversation({
      shopId,
      channel: "sms",
      direction: "outbound",
      fromPhone: to,
      toPhone: from,
      body: reply,
      status: confirm.ok ? "sent" : "failed",
      providerRef: confirm.sid,
      kind: "booking_confirmation",
    });

    // Owner lead alert via Resend
    if (shopId) {
      try {
        const { sendLeadAlertEmail } = await import("./resend-loops.server");
        await sendLeadAlertEmail({
          shopId,
          shopName,
          guestPhone: from,
          guestMessage: body,
          holdUntil: when.toISOString(),
        });
      } catch {
        /* optional */
      }
    }

    await pulse("twilio.sms.booking", "good", `Booking hold for ${from}`, shopId, {
      messageSid,
      conversion: true,
    });

    // Schedule pre-arrival reminder (~1h before hold → fire in ~1h from now for demo holds)
    void schedulePreArrivalReminder({
      shopId,
      shopName,
      guestPhone: from,
      fromNumber: to,
      startsAt: when.toISOString(),
    });

    return { ok: true, reply, booked: true };
  }

  if (mms.stored > 0) {
    reply = `${shopName} received ${mms.stored} proof-of-work photo${mms.stored === 1 ? "" : "s"}. ${reply}`;
  }

  await pulse("twilio.sms.inbound", "good", `SMS from ${from.slice(-4)}`, shopId, { messageSid, mms: mms.stored });
  return { ok: true, reply, booked: false };
}

async function ingestInboundMmsProofs(
  form: URLSearchParams,
  shop: { id: string; slug: string },
): Promise<{ stored: number }> {
  const count = Number(form.get("NumMedia") || 0);
  if (!Number.isFinite(count) || count <= 0) return { stored: 0 };
  const auth = twilioAuth();
  const { isRasterJobPhoto } = await import("./cinematic-enhance.server");
  const { uploadEnhancedImageToStorage } = await import("./storefront-layout.server");
  const sql = await getSql();
  const staff = await sql<{ id: string }>`
    select id from employees where shop_id = ${shop.id} order by created_at asc limit 1
  `.catch(() => [] as { id: string }[]);
  const employeeId = staff[0]?.id ?? null;
  let stored = 0;

  for (let index = 0; index < Math.min(count, 8); index += 1) {
    const mediaUrl = form.get(`MediaUrl${index}`) || "";
    const contentType = form.get(`MediaContentType${index}`) || "";
    if (!mediaUrl || !isRasterJobPhoto(contentType, mediaUrl)) continue;
    try {
      const headers: HeadersInit = {};
      if (auth) {
        headers.Authorization = `Basic ${Buffer.from(`${auth.sid}:${auth.token}`).toString("base64")}`;
      }
      const response = await fetch(mediaUrl, { headers, signal: AbortSignal.timeout(15_000) });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength < 32 || bytes.byteLength > 8 * 1024 * 1024) continue;
      const uploaded = await uploadEnhancedImageToStorage(shop.slug, bytes, "mms");
      if (!uploaded?.url) continue;
      const caption = (form.get("Body") || "Field proof of work").slice(0, 140);
      if (employeeId) {
        await sql`
          insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
          values (${newId("pf")}, ${shop.id}, ${employeeId}, ${uploaded.url}, ${caption})
        `.catch(() => undefined);
      }
      stored += 1;
    } catch {
      /* skip a bad attachment */
    }
  }
  return { stored };
}

/** Twilio MessageStatus callback — delivery telemetry. */
export async function handleTwilioSmsStatus(form: URLSearchParams) {
  const status = (form.get("MessageStatus") || form.get("SmsStatus") || "").toLowerCase();
  const sid = form.get("MessageSid") || "";
  const to = form.get("To") || "";
  const shop = await resolveShopByPhone(form.get("From") || "") || (await resolveShopByPhone(to));

  const mapped =
    status === "delivered" || status === "sent"
      ? "good"
      : status === "undelivered" || status === "failed"
        ? "alert"
        : "warning";

  await pulse(`twilio.sms.${status || "status"}`, mapped, `SMS ${status || "update"}`, shop?.id, {
    messageSid: sid,
    to,
  });

  try {
    const { persistTelemetryEvent } = await import("./self-correction.server");
    await persistTelemetryEvent({
      provider: "twilio",
      channel: "sms",
      eventType: status || "status",
      errorCode: status === "failed" || status === "undelivered" ? status : "",
      identity: to,
      destination: to,
      messageSid: sid,
    });
  } catch {
    /* optional */
  }

  return { ok: true, status };
}

/** Twilio voice webhook — TwiML greeting + gather for booking intent. */
export function buildTwilioVoiceTwiml(opts?: { shopName?: string }) {
  const name = (opts?.shopName || "Axiom Dispatch").replace(/[<>&]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thanks for calling ${name}. Press 1 to book the next emergency window, or stay on the line for dispatch.</Say>
  <Gather numDigits="1" timeout="8" action="/api/webhooks/twilio/voice?step=gather" method="POST">
    <Say voice="Polly.Joanna">Press 1 to book now.</Say>
  </Gather>
  <Say voice="Polly.Joanna">We did not get a selection. A dispatcher will follow up by text.</Say>
</Response>`;
}

export async function handleTwilioVoice(form: URLSearchParams, step: string | null) {
  const from = form.get("From") || "";
  const to = form.get("To") || "";
  const digits = form.get("Digits") || "";
  const callSid = form.get("CallSid") || "";
  const shop = await resolveShopByPhone(to);
  const shopName = shop?.name || "Axiom Dispatch";

  await persistConversation({
    shopId: shop?.id ?? null,
    channel: "voice",
    direction: "inbound",
    fromPhone: from,
    toPhone: to,
    body: step === "gather" ? `digits:${digits}` : "incoming_call",
    status: "received",
    providerRef: callSid,
    kind: step === "gather" ? "voice_gather" : "voice_inbound",
  });

  if (step === "gather" && digits === "1") {
    const when = new Date(Date.now() + 2 * 3600_000);
    const whenLabel = when.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });
    const smsBody = `${shopName}: voice booking hold for ${whenLabel} PT. Reply CONFIRM to keep it.`;
    await sendSms(from, smsBody);
    await pulse("twilio.voice.booking", "good", `Voice book from ${from.slice(-4)}`, shop?.id, {
      callSid,
      conversion: true,
    });
    if (shop?.id) {
      try {
        const { sendLeadAlertEmail } = await import("./resend-loops.server");
        await sendLeadAlertEmail({
          shopId: shop.id,
          shopName,
          guestPhone: from,
          guestMessage: "Voice press-1 booking",
          holdUntil: when.toISOString(),
        });
      } catch {
        /* optional */
      }
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Got it. We texted a booking hold for ${whenLabel}. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  await pulse("twilio.voice.inbound", "good", `Call from ${from.slice(-4)}`, shop?.id, { callSid });
  return buildTwilioVoiceTwiml({ shopName });
}

async function schedulePreArrivalReminder(input: {
  shopId: string | null;
  shopName: string;
  guestPhone: string;
  fromNumber: string;
  startsAt: string;
}) {
  // Fire-and-forget delayed reminder (best-effort in serverless — also log for worker pickup)
  const sql = await getSql();
  try {
    await sql`
      insert into booking_reminders (id, shop_id, phone, starts_at, status, body, created_at)
      values (
        ${newId("br")}, ${input.shopId}, ${input.guestPhone.slice(0, 40)},
        ${input.startsAt}, ${"pending"},
        ${`${input.shopName}: reminder — we are heading your way in about an hour. Reply STOP to cancel.`},
        now()
      )
    `;
  } catch {
    /* table may not exist — send soft delayed SMS via setTimeout only in long-lived runtimes */
  }

  const delayMs = Math.max(5_000, new Date(input.startsAt).getTime() - Date.now() - 3600_000);
  if (delayMs > 2 * 3600_000) return;
  setTimeout(() => {
    void sendSms(
      input.guestPhone,
      `${input.shopName}: reminder — crew is about an hour out. Reply STOP to cancel.`,
    ).then((result) =>
      pulse(
        result.ok ? "twilio.sms.reminder" : "twilio.sms.reminder_failed",
        result.ok ? "good" : "warning",
        result.detail,
        input.shopId,
      ),
    );
  }, Math.min(delayMs, 60_000));
}
