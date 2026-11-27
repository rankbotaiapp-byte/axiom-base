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

export async function sendSms(
  to: string,
  body: string,
  fromOverride?: string,
): Promise<{ ok: boolean; sid?: string; detail: string }> {
  const auth = twilioAuth();
  if (!auth) return { ok: false, detail: "Twilio is not configured" };
  const e164 = toE164(to);
  if (!e164) return { ok: false, detail: "Invalid destination phone" };
  const origin = toE164(fromOverride || "") || auth.from;
  const params = new URLSearchParams({ To: e164, From: origin, Body: body.slice(0, 1500) });
  try {
    const { resolvePublicAppOrigin } = await import("./public-app-url");
    const originUrl = resolvePublicAppOrigin();
    if (originUrl) params.set("StatusCallback", `${originUrl.replace(/\/$/, "")}/api/webhooks/telemetry?provider=twilio`);
  } catch {
    /* public origin optional */
  }
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

export type TwilioShop = {
  id: string;
  slug: string;
  name: string;
  hoursJson?: string | null;
  notifyPhone?: string | null;
  ownerPhone?: string | null;
  googleReviewUrl?: string | null;
  voiceAnswerMode?: string | null;
  voiceDailyCapCents?: number | null;
  niche?: string | null;
};

async function resolveShopByPhone(toNumber: string): Promise<TwilioShop | null> {
  const digits = toNumber.replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return null;
  const sql = await getSql();
  try {
    const rows = await sql<{
      id: string;
      slug: string;
      name: string;
      hours_json: string | null;
      notify_phone: string | null;
      notification_phone: string | null;
      owner_phone: string | null;
      google_review_url: string | null;
      voice_answer_mode: string | null;
      voice_daily_cap_cents: number | null;
      niche: string | null;
    }>`
      select s.id, s.slug, s.name, s.hours_json, s.notify_phone, s.notification_phone,
             s.owner_phone, s.google_review_url, s.voice_answer_mode, s.voice_daily_cap_cents, s.niche
      from shops s
      left join shop_billing b on b.shop_id = s.id
      where right(regexp_replace(coalesce(b.twilio_number, ''), '\\D', '', 'g'), 10) = ${digits}
         or right(regexp_replace(coalesce(s.axiom_phone_number, ''), '\\D', '', 'g'), 10) = ${digits}
         or right(regexp_replace(coalesce(s.phone, ''), '\\D', '', 'g'), 10) = ${digits}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      hoursJson: row.hours_json,
      notifyPhone: row.notify_phone || row.notification_phone,
      ownerPhone: row.owner_phone,
      googleReviewUrl: row.google_review_url,
      voiceAnswerMode: row.voice_answer_mode,
      voiceDailyCapCents: row.voice_daily_cap_cents,
      niche: row.niche,
    };
  } catch {
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
}

async function pulse(eventType: string, status: "good" | "warning" | "alert", detail: string, shopId?: string | null, payload?: Record<string, unknown>) {
  try {
    const { recordCompanionPulse } = await import("./companion-telemetry.server");
    await recordCompanionPulse({ status, eventType, detail, shopId, payload });
  } catch {
    /* best-effort */
  }
}

export async function persistConversation(input: {
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

  const { isMessagingHelp, isMessagingOptOut, OPT_OUT_CONFIRMATION, smsHelpReply } = await import("./legal-notices");
  if (isMessagingOptOut(body)) {
    try {
      const { suppressContact } = await import("./lifecycle.server");
      await suppressContact({ phone: from, reason: "stop" });
    } catch {
      /* optional */
    }
    return { ok: true, reply: OPT_OUT_CONFIRMATION, booked: false };
  }
  if (isMessagingHelp(body)) {
    const { resolvePublicAppOrigin } = await import("./public-app-url");
    return {
      ok: true,
      reply: smsHelpReply(resolvePublicAppOrigin()),
      booked: false,
    };
  }

  if (shop) {
    const closed = await import("./closed-job.server");
    const quote = await closed.handleOwnerQuoteSms({ shopId: shop.id, from, body }).catch(() => ({
      handled: false,
      reply: "",
    }));
    if (quote.handled) return { ok: true, reply: quote.reply, booked: false };

    const omw = await import("./sprint2-dispatch.server").then((mod) =>
      mod.handleOwnerOmwSms({ shopId: shop.id, from, body }).catch(() => ({ handled: false, reply: "" })),
    );
    if (omw.handled) return { ok: true, reply: omw.reply, booked: false };

    const paid = await closed.handleOwnerPaidSms({ shopId: shop.id, from, body }).catch(() => ({
      handled: false,
      reply: "",
    }));
    if (paid.handled) return { ok: true, reply: paid.reply, booked: false };

    const proof = await closed.handleOwnerProofPublishReply({ shopId: shop.id, from, body }).catch(() => ({
      handled: false,
      reply: "",
    }));
    if (proof.handled) return { ok: true, reply: proof.reply, booked: false };

    const slot = await closed.handleCustomerSlotReply({ shopId: shop.id, from, body }).catch(() => ({
      handled: false,
      reply: "",
      booked: false,
    }));
    if (slot.handled) return { ok: true, reply: slot.reply, booked: slot.booked };

    const { handleOwnerMmsMenuReply } = await import("./owner-mms.server");
    const menu = await handleOwnerMmsMenuReply({ shopId: shop.id, from, body }).catch(() => ({
      handled: false,
      reply: "",
    }));
    if (menu.handled) {
      return { ok: true, reply: menu.reply, booked: false };
    }
  }

  const review = shop
    ? await handleOwnerReviewRequest({ shop, from, to, body, form }).catch(() => null)
    : null;
  if (review) {
    return { ok: true, reply: review.reply, booked: false };
  }

  const mms = shop
    ? await import("./owner-mms.server").then((mod) => mod.ingestInboundMmsProofs(form, shop, from)).catch(() => ({
        stored: 0,
        handled: false,
        reply: undefined as string | undefined,
      }))
    : { stored: 0, handled: false, reply: undefined as string | undefined };

  if (mms.handled && mms.reply) {
    return { ok: true, reply: mms.reply, booked: false };
  }

  const lower = body.toLowerCase();
  const wantsBook = /\b(book|schedule|appointment|dispatch|emergency|help|yes)\b/.test(lower);
  let reply =
    `Thanks for texting ${shopName}. Reply BOOK for the next open window, or call this number to talk to dispatch.`;

  if (wantsBook && shopId) {
    const closed = await import("./closed-job.server");
    const offer = await closed.offerMissedCallSlots({ shopId, customerPhone: from }).catch(() => null);
    if (offer?.body) {
      reply = mms.stored > 0 ? `Received ${mms.stored} job photo${mms.stored === 1 ? "" : "s"}. ${offer.body}` : offer.body;
    } else {
      reply = `${shopName}: reply 1 or 2 after we text open windows, or use the book link on the shop page.`;
    }

    if (messageSid) {
      try {
        const { recordIntakeLead } = await import("./lifecycle.server");
        await recordIntakeLead({
          shopId,
          slug: shop?.slug || "",
          name: from,
          phone: from,
          mode: "hybrid-dispatch",
          answers: { service: "sms-book", source: "twilio-inbound" },
          sourceRoute: "twilio-sms",
          isSimulated: false,
          twilioMessageSid: messageSid,
        });
      } catch (err) {
        console.error("[twilio/sms] persist booking", err instanceof Error ? err.message : err);
      }
    }

    await pulse("twilio.sms.booking", "good", `Open windows offered to ${from}`, shopId, {
      messageSid,
      conversion: true,
    });

    return { ok: true, reply, booked: false };
  }

  if (mms.stored > 0) {
    reply = `${shopName} received ${mms.stored} proof-of-work photo${mms.stored === 1 ? "" : "s"}. ${reply}`;
    if (shop) {
      const extra = await handleOwnerReviewRequest({
        shop,
        from,
        to,
        body,
        form,
        fromProofCaption: true,
      }).catch(() => null);
      if (extra?.reply) reply = `${reply} ${extra.reply}`;
    }
  }

  await pulse("twilio.sms.inbound", "good", `SMS from ${from.slice(-4)}`, shopId, { messageSid, mms: mms.stored });
  return { ok: true, reply, booked: false };
}

async function handleOwnerReviewRequest(input: {
  shop: { id: string; slug: string; name: string };
  from: string;
  to: string;
  body: string;
  form: URLSearchParams;
  fromProofCaption?: boolean;
}): Promise<{ reply: string } | null> {
  const {
    decideReviewRequestSms,
    extractCustomerPhoneFromProofCaption,
    ownerReviewReply,
    parseReviewCommand,
  } = await import("./google-review-request");
  const { a2pOutboundLive } = await import("./axiom-business-number");
  const { parseOutreachMode } = await import("./outreach-queue");
  const sql = await getSql();
  const rows = await sql<{
    google_review_url: string | null;
    notify_phone: string | null;
    notification_phone: string | null;
  }>`
    select google_review_url, notify_phone, notification_phone
    from shops where id = ${input.shop.id} limit 1
  `.catch(() => [] as { google_review_url: string | null; notify_phone: string | null; notification_phone: string | null }[]);
  const ownerPhones = [rows[0]?.notify_phone, rows[0]?.notification_phone];
  const fromCommand = parseReviewCommand(input.body);
  const fromCaption = input.fromProofCaption
    ? extractCustomerPhoneFromProofCaption(input.body, ownerPhones)
    : null;
  const customerRaw = fromCommand || fromCaption;
  if (!input.fromProofCaption && !fromCommand) return null;
  if (input.fromProofCaption && !fromCaption) return null;

  const { isSuppressed } = await import("./lifecycle.server");
  const customerSuppressed = customerRaw ? await isSuppressed("", customerRaw) : false;
  const liveA2P = a2pOutboundLive(parseOutreachMode(env("OUTREACH_MODE")), env("TWILIO_A2P_LIVE"));
  const decision = decideReviewRequestSms({
    ownerFrom: input.from,
    ownerPhones,
    customerRaw,
    googleReviewUrl: rows[0]?.google_review_url || "",
    shopName: input.shop.name,
    customerSuppressed,
    liveA2P,
  });
  const reply = ownerReviewReply(decision);
  if (!reply) return null;

  if (decision.action === "send") {
    const sent = await sendSms(decision.customerE164, decision.body, input.to);
    await persistConversation({
      shopId: input.shop.id,
      channel: "sms",
      direction: "outbound",
      fromPhone: input.to,
      toPhone: decision.customerE164,
      body: decision.body,
      status: sent.ok ? "sent" : "failed",
      providerRef: sent.sid,
      kind: "review_request",
    });
    if (!sent.ok) {
      return { reply: `Review text did not send (${sent.detail}).` };
    }
  }

  const confirm = await sendSms(input.from, reply, input.to);
  await persistConversation({
    shopId: input.shop.id,
    channel: "sms",
    direction: "outbound",
    fromPhone: input.to,
    toPhone: input.from,
    body: reply,
    status: confirm.ok || decision.action === "simulate" ? "sent" : "failed",
    providerRef: confirm.sid,
    kind: "review_request_ack",
  });
  return { reply };
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

/** Twilio voice webhook — TwiML greeting + gather, then ring-through. */
export function buildTwilioVoiceTwiml(opts?: { shopName?: string; dialNumber?: string | null }) {
  const name = (opts?.shopName || "Axiom Dispatch").replace(/[<>&]/g, "");
  const dial = (opts?.dialNumber || "").replace(/[^\d+]/g, "");
  const dialBlock = dial
    ? `<Dial timeout="18" action="/api/webhooks/twilio/voice?step=dial-result" method="POST"><Number>${dial}</Number></Dial>`
    : `<Redirect method="POST">/api/webhooks/twilio/voice?step=no-input</Redirect>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="5" action="/api/webhooks/twilio/voice?step=gather" method="POST">
    <Say voice="Polly.Joanna">Thanks for calling ${name}. Press 1 to lock an arrival window by text, or hold to ring the shop.</Say>
  </Gather>
  ${dialBlock}
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
    body: step === "gather" ? `digits:${digits}` : step === "ai" ? form.get("SpeechResult") || "ai_turn" : "incoming_call",
    status: "received",
    providerRef: callSid,
    kind: step === "gather" ? "voice_gather" : step === "ai" ? "voice_ai" : "voice_inbound",
  });

  const voice = await import("./voice-receptionist.server");
  if (shop && (step === "status" || step === "relay-end")) {
    return voice.handleVoiceHangup(form, shop);
  }

  if (shop && step === "ai") {
    return voice.handleVoiceAiTurn(form, shop);
  }

  const dialStatus = form.get("DialCallStatus") || form.get("CallStatus") || "";

  if (
    (step === "gather" && digits === "1") ||
    step === "no-input" ||
    (step === "dial-result" && shop?.id)
  ) {
    if (shop?.id && from) {
      const closed = await import("./closed-job.server");
      const offered = await closed
        .handleVoiceMissedOrPress1({
          shopId: shop.id,
          customerPhone: from,
          dialStatus: step === "dial-result" ? dialStatus : step === "no-input" ? "no-answer" : null,
          digits: step === "gather" ? digits : step === "no-input" ? "1" : null,
        })
        .catch(() => false);
      if (offered) {
        await pulse("twilio.voice.booking", "good", `Open windows texted to ${from.slice(-4)}`, shop.id, {
          callSid,
          conversion: true,
          dialStatus,
        });
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We just texted you the next open arrival windows. Reply 1 or 2 to lock a spot. Goodbye.</Say>
  <Hangup/>
</Response>`;
      }
    }
    if (step === "dial-result") {
      return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
    }
  }

  await pulse("twilio.voice.inbound", "good", `Call from ${from.slice(-4)}`, shop?.id, { callSid });
  const mode = shop?.voiceAnswerMode || "immediate";
  if (shop && mode !== "ring_overflow") {
    return voice.startVoiceReceptionist({
      shop,
      from,
      to,
      callSid,
      voiceAnswerMode: shop.voiceAnswerMode,
      voiceDailyCapCents: shop.voiceDailyCapCents,
    });
  }
  return buildTwilioVoiceTwiml({ shopName, dialNumber: shop?.notifyPhone || shop?.ownerPhone });
}

async function _schedulePreArrivalReminder(input: {
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
