import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import {
  bookingNoticeCopy,
  formatBookingWhen,
  type BookingPhase,
  type NoticeKind,
} from "./booking-notice";
import { toE164 } from "./notify-target";
import { resolveShopLeadAlerts, type ShopNotifyPrefs } from "./notify-prefs";
import { twilioSmsFailureDetail } from "./notify-twilio";
import { resolvePublicAppOrigin } from "./public-app-url";

export { twilioSmsFailureDetail } from "./notify-twilio";

export type { NoticeKind } from "./booking-notice";

type NoticeInput = {
  kind: NoticeKind;
  subject: string;
  body: string;
};

type SendResult = { status: "sent" | "skipped" | "failed"; detail: string };

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
  employeeId: string | null,
) {
  const sql = await getSql();
  const note = detail.slice(0, 240);
  try {
    await sql`
      insert into shop_notifications (
        id, shop_id, channel, kind, destination, subject, body, status, detail, employee_id
      ) values (
        ${newId("ntf")}, ${shopId}, ${channel}, ${kind}, ${destination},
        ${subject}, ${body}, ${status}, ${note}, ${employeeId}
      )
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/employee_id/i.test(message)) throw err;
    await sql`
      insert into shop_notifications (
        id, shop_id, channel, kind, destination, subject, body, status, detail
      ) values (
        ${newId("ntf")}, ${shopId}, ${channel}, ${kind}, ${destination},
        ${subject}, ${body}, ${status}, ${note}
      )
    `;
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<SendResult> {
  const key = env("RESEND_API_KEY");
  const from = env("RESEND_FROM");
  if (!key || !from) return { status: "skipped", detail: "Email provider is not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text: body }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { status: "failed", detail: "Email provider rejected the message" };
    try {
      const payload = (await res.json()) as { id?: string };
      const { persistTelemetryEvent } = await import("./self-correction.server");
      await persistTelemetryEvent({
        provider: "resend",
        channel: "email",
        eventType: "sent",
        errorCode: "",
        identity: from,
        destination: to.slice(0, 160),
        messageSid: String(payload.id ?? ""),
      });
    } catch {
      /* telemetry table may be missing */
    }
    return { status: "sent", detail: "" };
  } catch {
    return { status: "failed", detail: "Email request failed" };
  }
}

const OUTREACH_CREDENTIALS = [
  "RESEND_API_KEY",
  "RESEND_FROM",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
] as const;

/** Names of the Resend and Twilio settings a live outreach batch requires. Empty means ready. */
export function missingOutreachCredentials(): string[] {
  const missing = OUTREACH_CREDENTIALS.filter((key) => {
    if (key === "TWILIO_FROM_NUMBER") {
      return !(env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER"));
    }
    return !env(key);
  });
  return missing;
}

function twilioFromNumber(): string | undefined {
  return env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER") || env("TWILIO_FROM_NUMBER_BACKUP");
}

async function resolveSmsFrom(): Promise<string | undefined> {
  try {
    const { resolveActiveSmsIdentity } = await import("./self-correction.server");
    const active = await resolveActiveSmsIdentity();
    if (active) return active;
  } catch {
    /* identity table may be missing on a fresh snapshot */
  }
  return twilioFromNumber();
}

function telemetryCallbackUrl(): string | undefined {
  try {
    const origin = resolvePublicAppOrigin();
    return origin ? `${origin.replace(/\/$/, "")}/api/webhooks/telemetry` : undefined;
  } catch {
    return undefined;
  }
}

/** Provider send used only by the live outreach queue. Simulation must not call this. */
export async function deliverOutreachMessage(input: {
  channel: "email" | "sms";
  to: string;
  subject: string;
  body: string;
}): Promise<SendResult> {
  if (input.channel === "email") return sendEmail(input.to, input.subject, input.body);
  return sendSms(input.to, input.body);
}

async function sendSms(to: string, body: string): Promise<SendResult> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = await resolveSmsFrom();
  if (!sid || !token || !from) return { status: "skipped", detail: "SMS provider is not configured" };
  const dest = toE164(to) || to.trim();
  if (!dest || dest.length < 8) return { status: "failed", detail: "Invalid destination phone number" };
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: dest, From: from, Body: body.slice(0, 640) });
    const callback = telemetryCallbackUrl();
    if (callback) params.set("StatusCallback", callback);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      return { status: "failed", detail: twilioSmsFailureDetail(res.status, payload) };
    }
    try {
      const payload = (await res.json()) as { sid?: string };
      const { persistTelemetryEvent } = await import("./self-correction.server");
      await persistTelemetryEvent({
        provider: "twilio",
        channel: "sms",
        eventType: "sent",
        errorCode: "",
        identity: from,
        destination: dest.slice(0, 40),
        messageSid: String(payload.sid ?? ""),
      });
    } catch {
      /* telemetry table may be missing */
    }
    return { status: "sent", detail: "" };
  } catch {
    return { status: "failed", detail: "SMS request failed" };
  }
}

export async function sendTwilioSms(to: string, body: string): Promise<SendResult> {
  return sendSms(to, body);
}

function logSkip(channel: string, detail: string) {
  if (detail) console.info(`notify ${channel} skipped: ${detail}`);
}

async function sendWebhook(shopId: string, notice: NoticeInput, email: string, phone: string) {
  const url = env("NOTIFY_WEBHOOK_URL");
  if (!url) return;
  try {
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
      null,
    );
  } catch {
    await record(shopId, notice.kind, "webhook", "hook", notice.subject, notice.body, "failed", "Webhook request failed", null);
  }
}

async function reach(opts: {
  shopId: string;
  employeeId: string | null;
  destination: string;
  email: string;
  phone: string;
  notice: NoticeInput;
  inboxDetail: string;
  skipEmail: boolean;
  skipSms: boolean;
  skipEmailDetail?: string;
  skipSmsDetail?: string;
}) {
  await record(
    opts.shopId,
    opts.notice.kind,
    "inbox",
    opts.destination,
    opts.notice.subject,
    opts.notice.body,
    "sent",
    opts.inboxDetail,
    opts.employeeId,
  );

  const email = opts.email.trim();
  if (opts.skipEmail && opts.skipEmailDetail) {
    logSkip("email", opts.skipEmailDetail);
    await record(
      opts.shopId,
      opts.notice.kind,
      "email",
      email || "unset",
      opts.notice.subject,
      opts.notice.body,
      "skipped",
      opts.skipEmailDetail,
      opts.employeeId,
    );
  } else if (email && !opts.skipEmail) {
    const result = await sendEmail(email, opts.notice.subject, opts.notice.body);
    if (result.status === "skipped") logSkip("email", result.detail);
    await record(
      opts.shopId,
      opts.notice.kind,
      "email",
      email,
      opts.notice.subject,
      opts.notice.body,
      result.status,
      result.detail,
      opts.employeeId,
    );
  }

  const smsTo = opts.phone.trim() ? toE164(opts.phone) : null;
  if (opts.skipSms && opts.skipSmsDetail) {
    logSkip("sms", opts.skipSmsDetail);
    await record(
      opts.shopId,
      opts.notice.kind,
      "sms",
      smsTo || opts.phone.trim().slice(0, 20) || "unset",
      opts.notice.subject,
      opts.notice.body,
      "skipped",
      opts.skipSmsDetail,
      opts.employeeId,
    );
  } else if (opts.phone.trim() && !smsTo && !opts.skipSms) {
    await record(
      opts.shopId,
      opts.notice.kind,
      "sms",
      opts.phone.trim().slice(0, 20),
      opts.notice.subject,
      opts.notice.body,
      "skipped",
      "Phone is not a mobile number we can text",
      opts.employeeId,
    );
  } else if (smsTo && !opts.skipSms) {
    const result = await sendSms(smsTo, `${opts.notice.subject}\n${opts.notice.body}`);
    if (result.status === "skipped") logSkip("sms", result.detail);
    await record(
      opts.shopId,
      opts.notice.kind,
      "sms",
      smsTo,
      opts.notice.subject,
      opts.notice.body,
      result.status,
      result.detail,
      opts.employeeId,
    );
  }
}

async function loadShopLeadAlerts(shopId: string) {
  const sql = await getSql();
  try {
    const rows = await sql<ShopNotifyPrefs>`
      select notify_email, notify_phone, notify_sms_enabled, notification_phone,
             notify_email_enabled, notification_email
      from shops where id = ${shopId} limit 1
    `;
    return resolveShopLeadAlerts(rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/notify_sms_enabled|notification_phone|notify_email_enabled|notification_email/i.test(message)) throw err;
    const rows = await sql<{ notify_email: string; notify_phone: string }>`
      select notify_email, notify_phone from shops where id = ${shopId} limit 1
    `;
    return resolveShopLeadAlerts(rows[0]);
  }
}

/** Inbox always. Twilio / Resend follow tenant notification preferences. */
export async function notifyShop(shopId: string, notice: NoticeInput) {
  try {
    const alerts = await loadShopLeadAlerts(shopId);
    await reach({
      shopId,
      employeeId: null,
      destination: "console",
      email: alerts.email,
      phone: alerts.phone,
      notice,
      inboxDetail: "",
      skipEmail: alerts.skipEmail,
      skipSms: alerts.skipSms,
      skipEmailDetail: alerts.emailSkipDetail,
      skipSmsDetail: alerts.smsSkipDetail,
    });
    await sendWebhook(shopId, notice, alerts.email, alerts.phone);
  } catch (err) {
    console.error("notify failed", shopId, notice.kind, err instanceof Error ? err.message : "error");
  }
}

type StaffContact = { name: string; email: string; phone: string };

async function loadStaffContact(shopId: string, employeeId: string): Promise<StaffContact | null> {
  const sql = await getSql();
  const rows = await sql<{ display_name: string; phone: string; email: string | null }>`
    select e.display_name, e.phone,
      coalesce(
        nullif(u.email, ''),
        case when s.works_alone then owner.email else '' end
      ) as email
    from employees e
    join shops s on s.id = e.shop_id
    left join "user" u on u.id = e.claimed_user_id
    left join "user" owner on owner.id = s.owner_user_id
    where e.id = ${employeeId} and e.shop_id = ${shopId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    name: row.display_name,
    email: row.email?.trim().toLowerCase() ?? "",
    phone: row.phone?.trim() ?? "",
  };
}

export type BookingNoticeInput = {
  shopId: string;
  shopName: string;
  employeeId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  serviceName: string;
  employeeName: string;
  startsAt: string;
  phase: BookingPhase;
};

/**
 * Shop inbox, the assigned station's inbox, and the guest.
 * Missing email or SMS keys are recorded as skipped. This never throws.
 */
export async function notifyBookingParties(input: BookingNoticeInput) {
  try {
    const when = formatBookingWhen(input.startsAt);
    const copy = bookingNoticeCopy({
      phase: input.phase,
      shopName: input.shopName,
      guestName: input.guestName,
      serviceName: input.serviceName,
      employeeName: input.employeeName,
      when,
    });
    const phoneNote = input.guestPhone ? ` Phone: ${input.guestPhone}` : "";
    const emailNote = input.guestEmail ? ` Email: ${input.guestEmail}` : "";
    await notifyShop(input.shopId, {
      kind: copy.kind,
      subject: copy.owner.subject,
      body: `${copy.owner.body}${phoneNote}${emailNote}`,
    });

    const alerts = await loadShopLeadAlerts(input.shopId);
    const shopEmail = alerts.email.trim().toLowerCase();
    const shopPhone = alerts.phone ? toE164(alerts.phone) : null;
    const staff = await loadStaffContact(input.shopId, input.employeeId);
    const staffPhone = staff?.phone ? toE164(staff.phone) : null;
    if (staff) {
      await reach({
        shopId: input.shopId,
        employeeId: input.employeeId,
        destination: staff.name,
        email: staff.email,
        phone: staff.phone,
        notice: { kind: copy.kind, subject: copy.staff.subject, body: copy.staff.body },
        inboxDetail: "",
        skipEmail: !staff.email || staff.email === shopEmail,
        skipSms: !staffPhone || staffPhone === shopPhone,
      });
    }

    const guestDest = input.guestEmail || input.guestPhone || "guest";
    await reach({
      shopId: input.shopId,
      employeeId: null,
      destination: guestDest,
      email: input.guestEmail,
      phone: input.guestPhone,
      notice: { kind: copy.kind, subject: copy.guest.subject, body: copy.guest.body },
      inboxDetail: input.guestEmail || input.guestPhone ? "" : "Guest left no email or phone",
      skipEmail: false,
      skipSms: false,
    });
  } catch (err) {
    console.error(
      "booking notify failed",
      input.shopId,
      input.phase,
      err instanceof Error ? err.message : "error",
    );
  }
}
