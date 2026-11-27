import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";

type SendResult = { ok: boolean; id?: string; detail: string };

async function resendSend(to: string, subject: string, text: string, tags?: string[]): Promise<SendResult> {
  const key = env("RESEND_API_KEY");
  const from = env("RESEND_FROM");
  if (!key || !from) return { ok: false, detail: "Resend is not configured" };
  if (!to.includes("@")) return { ok: false, detail: "Invalid recipient" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: subject.slice(0, 200),
      text,
      tags: (tags ?? []).map((name) => ({ name, value: "axiom" })),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) return { ok: false, detail: json.message || "Resend rejected email" };
  return { ok: true, id: json.id, detail: "sent" };
}

async function logEmail(opts: {
  shopId?: string | null;
  kind: string;
  to: string;
  subject: string;
  body: string;
  result: SendResult;
}) {
  const sql = await getSql();
  try {
    await sql`
      insert into shop_notifications (
        id, shop_id, channel, kind, destination, subject, body, status, detail
      ) values (
        ${newId("ntf")}, ${opts.shopId || "platform"}, ${"email"}, ${opts.kind},
        ${opts.to.slice(0, 160)}, ${opts.subject.slice(0, 200)}, ${opts.body.slice(0, 4000)},
        ${opts.result.ok ? "sent" : "failed"}, ${opts.result.detail.slice(0, 240)}
      )
    `;
  } catch {
    /* soft */
  }
  try {
    const { recordCompanionPulse } = await import("./companion-telemetry.server");
    await recordCompanionPulse({
      status: opts.result.ok ? "good" : "warning",
      eventType: opts.result.ok ? "system.resend.sent" : "system.resend.failed",
      shopId: opts.shopId,
      detail: `${opts.kind} → ${opts.to}`.slice(0, 240),
      payload: { kind: opts.kind, resendId: opts.result.id },
    });
  } catch {
    /* soft */
  }
}

async function ownerEmailForShop(shopId: string): Promise<string | null> {
  const sql = await getSql();
  try {
    const rows = await sql<{ email: string | null; notify_email: string | null }>`
      select u.email, s.notify_email
      from shops s
      left join "user" u on u.id = s.owner_user_id
      where s.id = ${shopId}
      limit 1
    `;
    const row = rows[0];
    const email = (row?.notify_email || row?.email || "").trim();
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

/** Tenant welcome kit after checkout / Connect onboarding. */
export async function sendTenantWelcomeKit(input: {
  shopId?: string;
  shopSlug: string;
  shopName: string;
  ownerEmail: string;
  niche?: string;
}) {
  const origin = (env("NEXT_PUBLIC_APP_URL") || env("BETTER_AUTH_URL") || "https://axiom.shop").replace(
    /\/$/,
    "",
  );
  const subject = `Welcome to Axiom — ${input.shopName} is live`;
  const body = [
    `Welcome, ${input.shopName}.`,
    "",
    `Your 24/7 booking storefront is ready:`,
    `${origin}/${input.shopSlug}`,
    "",
    `Admin desk: ${origin}/${input.shopSlug}/admin`,
    `Billing & Stripe Connect: ${origin}/${input.shopSlug}/admin/billing`,
    `Content creator: ${origin}/content-creator`,
    "",
    input.niche ? `Niche: ${input.niche}` : "",
    "",
    "Next steps (under 3 minutes):",
    "1) Drop your logo + dispatch phone in Niche Customization",
    "2) Connect Stripe Express for payouts",
    "3) Test Book Now from your phone",
    "",
    "— Axiom · Gear Guardian LLC",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await resendSend(input.ownerEmail, subject, body, ["welcome_kit"]);
  await logEmail({
    shopId: input.shopId,
    kind: "welcome_kit",
    to: input.ownerEmail,
    subject,
    body,
    result,
  });
  return result;
}

/** Subscription / Name Your Price receipt. */
export async function sendSubscriptionReceipt(input: {
  shopId?: string;
  shopSlug: string;
  shopName: string;
  ownerEmail: string;
  planId: string;
  amountCents: number;
  stripeSessionId?: string;
}) {
  const dollars = (input.amountCents / 100).toFixed(2);
  const planLabel =
    input.planId === "lifetime"
      ? "Founder's Lifetime Access"
      : input.planId === "trial"
        ? "Name Your Price · Month 1"
        : input.planId;
  const subject = `Receipt · ${input.shopName} · $${dollars}`;
  const body = [
    `Thanks for activating ${input.shopName}.`,
    "",
    `Plan: ${planLabel}`,
    `Amount: $${dollars} USD`,
    input.stripeSessionId ? `Stripe session: ${input.stripeSessionId}` : "",
    `Storefront: /${input.shopSlug}`,
    "",
    "Manage or cancel anytime from Admin → Billing.",
    "",
    "— Axiom · Gear Guardian LLC",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await resendSend(input.ownerEmail, subject, body, ["subscription_receipt"]);
  await logEmail({
    shopId: input.shopId,
    kind: "subscription_receipt",
    to: input.ownerEmail,
    subject,
    body,
    result,
  });
  return result;
}

/** Instant lead alert to the local business owner. */
export async function sendLeadAlertEmail(input: {
  shopId: string;
  shopName: string;
  guestPhone: string;
  guestMessage: string;
  holdUntil?: string;
  ownerEmail?: string;
  guestName?: string;
  guestEmail?: string;
  city?: string;
  service?: string;
}) {
  const to = input.ownerEmail || (await ownerEmailForShop(input.shopId));
  if (!to) return { ok: false, detail: "No owner email on file" } as SendResult;

  const { composeLeadAlertCopy } = await import("./lead-alert");
  const { subject, body } = composeLeadAlertCopy(input);

  const result = await resendSend(to, subject, body, ["lead_alert"]);
  await logEmail({
    shopId: input.shopId,
    kind: "lead_alert",
    to,
    subject,
    body,
    result,
  });
  return result;
}
