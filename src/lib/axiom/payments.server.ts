import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { notifyShop } from "./notify.server";

type StripeObject = Record<string, unknown> & {
  error?: { message?: string };
  id?: string;
  url?: string | null;
  payment_status?: string;
  status?: string;
  amount_total?: number;
  charges_enabled?: boolean;
  metadata?: Record<string, string> | null;
};

export function stripeConfigured() {
  return Boolean(env("STRIPE_SECRET_KEY"));
}

export function requestOrigin() {
  const explicit = env("BETTER_AUTH_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const request = getRequest();
  return new URL(request.url).origin;
}

async function stripeFetch(path: string, body?: URLSearchParams) {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Card payments are not configured");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const json = (await res.json()) as StripeObject;
  if (!res.ok) throw new Error(json.error?.message || "Stripe request failed");
  return json;
}

export async function beginConnect(opts: {
  shopId: string;
  slug: string;
  accountId: string | null;
  origin: string;
}) {
  let accountId = opts.accountId;
  if (!accountId) {
    const account = await stripeFetch(
      "accounts",
      new URLSearchParams({
        type: "express",
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
        "metadata[shop_id]": opts.shopId,
      }),
    );
    if (!account.id) throw new Error("Stripe did not return an account");
    accountId = account.id;
    const sql = await getSql();
    await sql`
      update shop_billing
      set stripe_account_id = ${accountId}, updated_at = now()
      where shop_id = ${opts.shopId}
    `;
  }
  const link = await stripeFetch(
    "account_links",
    new URLSearchParams({
      account: accountId,
      refresh_url: `${opts.origin}/${opts.slug}/admin?stripe=refresh`,
      return_url: `${opts.origin}/${opts.slug}/admin?stripe=return`,
      type: "account_onboarding",
    }),
  );
  if (!link.url) throw new Error("Stripe did not return an onboarding link");
  return { url: link.url };
}

export async function syncConnectAccount(accountId: string) {
  const account = await stripeFetch(`accounts/${encodeURIComponent(accountId)}`);
  return { chargesEnabled: Boolean(account.charges_enabled) };
}

export async function createConnectCheckout(opts: {
  destination: string;
  amountCents: number;
  feeCents: number;
  serviceName: string;
  shopId: string;
  appointmentId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const params = new URLSearchParams({
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.appointmentId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(opts.amountCents),
    "line_items[0][price_data][product_data][name]": opts.serviceName.slice(0, 120),
    "payment_intent_data[transfer_data][destination]": opts.destination,
    "metadata[shop_id]": opts.shopId,
    "metadata[appointment_id]": opts.appointmentId,
  });
  if (opts.feeCents > 0 && opts.feeCents < opts.amountCents) {
    params.set("payment_intent_data[application_fee_amount]", String(opts.feeCents));
  }
  const session = await stripeFetch("checkout/sessions", params);
  if (!session.id || !session.url) throw new Error("Stripe did not return a checkout session");
  return { id: session.id, url: session.url };
}

export async function settlePaidSession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) throw new Error("Invalid session");
  const session = await stripeFetch(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.payment_status !== "paid") throw new Error("Payment is not complete");
  const appointmentId = session.metadata?.appointment_id;
  const shopId = session.metadata?.shop_id;
  if (!appointmentId || !shopId) throw new Error("Payment is missing booking details");
  if (Number(session.amount_total) <= 0) throw new Error("Payment amount is invalid");

  const sql = await getSql();
  const rows = await sql<{
    id: string;
    shop_id: string;
    payment_cents: number;
    payment_status: string;
    customer_name: string;
  }>`
    select id, shop_id, payment_cents, payment_status, customer_name
    from appointments
    where id = ${appointmentId} and payment_ref = ${sessionId}
    limit 1
  `;
  const row = rows[0];
  if (!row || row.shop_id !== shopId) throw new Error("Booking not found for this payment");
  if (Number(session.amount_total) !== Number(row.payment_cents)) {
    throw new Error("Paid amount does not match the service price");
  }
  if (row.payment_status === "paid") {
    return { appointmentId: row.id, shopId, already: true };
  }

  const updated = await sql<{ id: string }>`
    update appointments
    set payment_status = 'paid'
    where id = ${row.id} and shop_id = ${shopId} and payment_status = 'processing'
    returning id
  `;
  if (!updated[0]) return { appointmentId: row.id, shopId, already: true };

  await sql`
    insert into shop_events (id, shop_id, type, appointment_id)
    values (${newId("evt")}, ${shopId}, 'booking_request', ${row.id})
  `;
  await notifyShop(shopId, {
    kind: "booking_paid",
    subject: `Paid booking · ${row.customer_name}`,
    body: `${row.customer_name} paid ${formatDollars(Number(row.payment_cents))} for a booking.`,
  });
  return { appointmentId: row.id, shopId, already: false };
}

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => {
    const idx = part.indexOf("=");
    return [part.slice(0, idx), part.slice(idx + 1)] as const;
  });
  const timestamp = parts.find((p) => p[0] === "t")?.[1];
  const signatures = parts.filter((p) => p[0] === "v1").map((p) => p[1]);
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  return signatures.some((sig) => {
    if (sig.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(sig), expectedBuf);
  });
}

export async function handleStripeWebhook(request: Request) {
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!secret) return Response.json({ error: "Webhook secret is not configured" }, { status: 503 });
  const payload = await request.text();
  const header = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, header, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: { type?: string; data?: { object?: { id?: string } } };
  try {
    event = JSON.parse(payload) as { type?: string; data?: { object?: { id?: string } } };
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" && event.data?.object?.id) {
    await settlePaidSession(event.data.object.id);
  }
  return Response.json({ received: true });
}
