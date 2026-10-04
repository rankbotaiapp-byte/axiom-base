import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { toE164 } from "./notify-target";

export type NoticeKind = "booking_request" | "booking_paid" | "inquiry";

type NoticeInput = {
  kind: NoticeKind;
  subject: string;
  body: string;
};

const inquiryHits = new Map<string, number[]>();

export function allowInquiry(shopId: string): boolean {
  const now = Date.now();
  const recent = (inquiryHits.get(shopId) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) {
    inquiryHits.set(shopId, recent);
    return false;
  }
  recent.push(now);
  inquiryHits.set(shopId, recent);
  return true;
}

async function record(
  shopId: string,
  kind: NoticeKind,
  channel: "inbox" | "email" | "sms" | "webhook",
  destination: string,
  subject: string,
  body: string,
  status: "queued" | "sent" | "skipped" | "failed",
  detail: string,
) {
  const sql = await getSql();
  await sql`
    insert into shop_notifications (
      id, shop_id, channel, kind, destination, subject, body, status, detail
    ) values (
      ${newId("ntf")}, ${shopId}, ${channel}, ${kind}, ${destination},
      ${subject}, ${body}, ${status}, ${detail.slice(0, 240)}
    )
  `;
}

async function sendEmail(to: string, subject: string, body: string): Promise<string | null> {
  const key = env("RESEND_API_KEY");
  const from = env("RESEND_FROM");
  if (!key || !from) return "Email provider is not configured";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text: body }),
  });
  if (!res.ok) return "Email provider rejected the message";
  return null;
}

async function sendSms(to: string, body: string): Promise<string | null> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM_NUMBER");
  if (!sid || !token || !from) return "SMS provider is not configured";
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 640) }),
  });
  if (!res.ok) return "SMS provider rejected the message";
  return null;
}

async function sendWebhook(shopId: string, notice: NoticeInput, email: string, phone: string) {
  const url = env("NOTIFY_WEBHOOK_URL");
  if (!url) return;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopId,
      kind: notice.kind,
      subject: notice.subject,
      body: notice.body,
      email,
      phone,
    }),
  });
  await record(
    shopId,
    notice.kind,
    "webhook",
    "hook",
    notice.subject,
    notice.body,
    res.ok ? "sent" : "failed",
    res.ok ? "" : "Webhook returned an error",
  );
}

/** Inbox always. Email and SMS fire only to the shop's own saved contacts. */
export async function notifyShop(shopId: string, notice: NoticeInput) {
  try {
    const sql = await getSql();
    const rows = await sql<{ notify_email: string; notify_phone: string }>`
      select notify_email, notify_phone from shops where id = ${shopId} limit 1
    `;
    const email = rows[0]?.notify_email?.trim() ?? "";
    const phone = rows[0]?.notify_phone?.trim() ?? "";

    await record(shopId, notice.kind, "inbox", "console", notice.subject, notice.body, "sent", "");

    if (email) {
      try {
        const detail = await sendEmail(email, notice.subject, notice.body);
        await record(
          shopId,
          notice.kind,
          "email",
          email,
          notice.subject,
          notice.body,
          detail ? "failed" : "sent",
          detail ?? "",
        );
      } catch {
        await record(shopId, notice.kind, "email", email, notice.subject, notice.body, "failed", "Email request failed");
      }
    }

    const smsTo = phone ? toE164(phone) : null;
    if (smsTo) {
      try {
        const detail = await sendSms(smsTo, `${notice.subject}\n${notice.body}`);
        await record(
          shopId,
          notice.kind,
          "sms",
          smsTo,
          notice.subject,
          notice.body,
          detail ? "failed" : "sent",
          detail ?? "",
        );
      } catch {
        await record(shopId, notice.kind, "sms", smsTo, notice.subject, notice.body, "failed", "SMS request failed");
      }
    }

    try {
      await sendWebhook(shopId, notice, email, phone);
    } catch {
      await record(shopId, notice.kind, "webhook", "hook", notice.subject, notice.body, "failed", "Webhook request failed");
    }
  } catch (err) {
    console.error("notify failed", shopId, notice.kind, err instanceof Error ? err.message : "error");
  }
}
