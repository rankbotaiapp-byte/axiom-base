import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { notifyBookingParties } from "./notify.server";
import { GEAR_GUARDIAN_BPS, gearGuardianFeeCents } from "./merchant-pricing";

type StripeObject = Record<string, unknown> & {
  error?: { message?: string; code?: string };
  id?: string;
  url?: string | null;
  payment_status?: string;
  status?: string;
  amount_total?: number;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  client_secret?: string;
  amount?: number;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
};

export function stripeConfigured() {
  return Boolean(env("STRIPE_SECRET_KEY"));
}

export function stripePublishableKey() {
  return env("STRIPE_PUBLISHABLE_KEY");
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
  if (!res.ok) {
    const raw = json.error?.message || "Stripe request failed";
    const missing =
      json.error?.code === "resource_missing" ||
      /no such |does not have access to account/i.test(raw);
    const err = new Error(missing ? "Stripe object was not found" : "Stripe request failed");
    if (missing) (err as Error & { stripeMissing?: boolean }).stripeMissing = true;
    throw err;
  }
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
    try {
      await sql`
        update shop_billing
        set stripe_account_id = ${accountId},
            stripe_connect_status = case
              when stripe_charges_enabled then stripe_connect_status
              else 'pending'
            end,
            updated_at = now()
        where shop_id = ${opts.shopId}
      `;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!/stripe_connect_status|does not exist/i.test(message)) throw err;
      await sql`
        update shop_billing
        set stripe_account_id = ${accountId}, updated_at = now()
        where shop_id = ${opts.shopId}
      `;
    }
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
  const chargesEnabled = Boolean(account.charges_enabled);
  await recordConnectStanding(accountId, chargesEnabled);
  return { chargesEnabled };
}

/** Writes active or pending from a Connect account. Missing accounts stay unchanged. */
export async function recordConnectStanding(accountId: string, chargesEnabled: boolean) {
  const standing = chargesEnabled ? "active" : "pending";
  const sql = await getSql();
  try {
    await sql`
      update shop_billing
      set stripe_charges_enabled = ${chargesEnabled},
          stripe_connect_status = ${standing},
          updated_at = now()
      where stripe_account_id = ${accountId}
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/stripe_connect_status|does not exist/i.test(message)) throw err;
    await sql`
      update shop_billing
      set stripe_charges_enabled = ${chargesEnabled}, updated_at = now()
      where stripe_account_id = ${accountId}
    `;
  }
  return { chargesEnabled, standing };
}

export async function createConnectPaymentIntent(opts: {
  destination: string;
  amountCents: number;
  feeCents: number;
  shopId: string;
  appointmentId: string;
}) {
  const params = new URLSearchParams({
    amount: String(opts.amountCents),
    currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    "transfer_data[destination]": opts.destination,
    "metadata[shop_id]": opts.shopId,
    "metadata[appointment_id]": opts.appointmentId,
    "metadata[kind]": "booking",
    "metadata[gear_guardian_bps]": String(GEAR_GUARDIAN_BPS),
    "metadata[gear_guardian_cents]": String(Math.max(0, opts.feeCents)),
  });
  if (opts.feeCents > 0 && opts.feeCents < opts.amountCents) {
    params.set("application_fee_amount", String(opts.feeCents));
  }
  const intent = await stripeFetch("payment_intents", params);
  if (!intent.id || !intent.client_secret) throw new Error("Stripe did not return a payment");
  return { id: intent.id, clientSecret: intent.client_secret };
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
    "payment_intent_data[metadata][shop_id]": opts.shopId,
    "payment_intent_data[metadata][appointment_id]": opts.appointmentId,
    "payment_intent_data[metadata][kind]": "booking",
    "payment_intent_data[metadata][gear_guardian_bps]": String(GEAR_GUARDIAN_BPS),
    "payment_intent_data[metadata][gear_guardian_cents]": String(Math.max(0, opts.feeCents)),
    "metadata[shop_id]": opts.shopId,
    "metadata[appointment_id]": opts.appointmentId,
    "metadata[kind]": "booking",
    "metadata[gear_guardian_bps]": String(GEAR_GUARDIAN_BPS),
    "metadata[gear_guardian_cents]": String(Math.max(0, opts.feeCents)),
  });
  if (opts.feeCents > 0 && opts.feeCents < opts.amountCents) {
    params.set("payment_intent_data[application_fee_amount]", String(opts.feeCents));
  }
  const session = await stripeFetch("checkout/sessions", params);
  if (!session.id || !session.url) throw new Error("Stripe did not return a checkout session");
  return { id: session.id, url: session.url };
}

export async function createTerritoryCheckout(opts: {
  leadSlug: string;
  checkoutId: string;
  planId: string;
  planName: string;
  amountCents: number;
  cadence: "trial" | "month" | "once";
  origin: string;
  userId?: string;
  /** Name Your Price first-month charge (Tier 1). Enforced ≥ $1. */
  namedPriceCents?: number;
}) {
  const { clampNamedPriceCents, STANDARD_MONTHLY_CENTS, FOUNDER_LIFETIME_CENTS } = await import(
    "@/lib/stripe/commercial"
  );
  const success = `${opts.origin}/?b=${encodeURIComponent(opts.leadSlug)}&pitch=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancel = `${opts.origin}/?b=${encodeURIComponent(opts.leadSlug)}&pitch=1`;
  const params = new URLSearchParams({
    success_url: success,
    cancel_url: cancel,
    client_reference_id: opts.checkoutId,
    "metadata[kind]": "territory",
    "metadata[lead_slug]": opts.leadSlug,
    "metadata[plan_id]": opts.planId,
    "metadata[checkout_id]": opts.checkoutId,
  });
  if (opts.userId && opts.userId !== "dev-user") params.set("metadata[user_id]", opts.userId);

  if (opts.cadence === "once") {
    // Tier 2 — Founder's Lifetime Access ($1,500 one-time).
    const amount = opts.amountCents > 0 ? opts.amountCents : FOUNDER_LIFETIME_CENTS;
    params.set("mode", "payment");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(amount));
    params.set(
      "line_items[0][price_data][product_data][name]",
      opts.planName.slice(0, 120) || "Founder's Lifetime Access",
    );
    params.set("metadata[billing_tier]", "founder_lifetime");
  } else if (opts.cadence === "trial") {
    // Tier 1 — Name Your Price Month 1 (≥ $1) + $150/mo starting day 31.
    const named = clampNamedPriceCents(opts.namedPriceCents ?? opts.amountCents);
    params.set("mode", "subscription");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(named));
    params.set(
      "line_items[0][price_data][product_data][name]",
      `Name Your Price · Month 1 ($${((named / 100).toFixed(2))})`.slice(0, 120),
    );
    params.set("line_items[1][quantity]", "1");
    params.set("line_items[1][price_data][currency]", "usd");
    params.set("line_items[1][price_data][unit_amount]", String(STANDARD_MONTHLY_CENTS));
    params.set("line_items[1][price_data][recurring][interval]", "month");
    params.set(
      "line_items[1][price_data][product_data][name]",
      "Axiom storefront · $150/mo after day 31",
    );
    params.set("subscription_data[trial_period_days]", "30");
    params.set("metadata[billing_tier]", "name_your_price");
    params.set("metadata[named_price_cents]", String(named));
    params.set("metadata[renewal_cents]", String(STANDARD_MONTHLY_CENTS));
    params.set("subscription_data[metadata][billing_tier]", "name_your_price");
    params.set("subscription_data[metadata][lead_slug]", opts.leadSlug);
  } else {
    // Legacy / standard monthly.
    params.set("mode", "subscription");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(STANDARD_MONTHLY_CENTS));
    params.set("line_items[0][price_data][recurring][interval]", "month");
    params.set(
      "line_items[0][price_data][product_data][name]",
      opts.planName.slice(0, 120) || "Axiom monthly",
    );
    params.set("metadata[billing_tier]", "standard_monthly");
  }

  const session = await stripeFetch("checkout/sessions", params);
  if (!session.id || !session.url) throw new Error("Stripe did not return a checkout session");
  return { id: session.id, url: session.url };
}

/**
 * Landing-page launch plan, sold inside the slide-up drawer with Stripe Embedded Checkout.
 * redirect_on_completion=never keeps the buyer on the page so the drawer can run the success state.
 */
export async function createLaunchCheckout(opts: {
  planId: string;
  planName: string;
  mode: "subscription" | "payment";
  dueTodayCents: number;
  monthlyCents: number | null;
  trialDays: number;
  userId?: string;
}) {
  const params = new URLSearchParams({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    mode: opts.mode,
    "metadata[kind]": "launch_plan",
    "metadata[plan_id]": opts.planId,
  });
  if (opts.userId && opts.userId !== "dev-user") params.set("metadata[user_id]", opts.userId);
  let line = 0;
  if (opts.mode === "subscription" && opts.monthlyCents) {
    params.set(`line_items[${line}][quantity]`, "1");
    params.set(`line_items[${line}][price_data][currency]`, "usd");
    params.set(`line_items[${line}][price_data][product_data][name]`, `Axiom ${opts.planName} · monthly`);
    params.set(`line_items[${line}][price_data][unit_amount]`, String(opts.monthlyCents));
    params.set(`line_items[${line}][price_data][recurring][interval]`, "month");
    line += 1;
    if (opts.trialDays > 0) params.set("subscription_data[trial_period_days]", String(opts.trialDays));
    params.set("subscription_data[metadata][plan_id]", opts.planId);
  }
  if (opts.dueTodayCents > 0) {
    params.set(`line_items[${line}][quantity]`, "1");
    params.set(`line_items[${line}][price_data][currency]`, "usd");
    params.set(
      `line_items[${line}][price_data][product_data][name]`,
      opts.mode === "subscription" ? `Axiom ${opts.planName} · activation` : `Axiom ${opts.planName}`,
    );
    params.set(`line_items[${line}][price_data][unit_amount]`, String(opts.dueTodayCents));
  }
  const session = await stripeFetch("checkout/sessions", params);
  if (!session.id || !session.client_secret) throw new Error("Stripe did not return a checkout session");
  return { id: session.id, clientSecret: session.client_secret };
}

export async function readLaunchSession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) throw new Error("Invalid session");
  const session = await stripeFetch(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.metadata?.kind !== "launch_plan") throw new Error("This payment is not a launch plan");
  return {
    planId: session.metadata.plan_id ?? "",
    status: session.status,
    paymentStatus: session.payment_status,
    amountTotal: Number(session.amount_total),
  };
}

export async function settleTerritorySession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) throw new Error("Invalid session");
  const session = await stripeFetch(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.metadata?.kind !== "territory") throw new Error("This payment is not a territory plan");
  if (session.status !== "complete") throw new Error("Payment is not complete");
  const leadSlug = session.metadata.lead_slug ?? "";
  const planId = session.metadata.plan_id ?? "";
  const checkoutId = session.metadata.checkout_id ?? "";
  const { territoryPlan, territorySessionSettled } = await import("./pricing");
  const { clampNamedPriceCents, FOUNDER_LIFETIME_CENTS, STANDARD_MONTHLY_CENTS } = await import(
    "@/lib/stripe/commercial"
  );
  const plan = territoryPlan(planId);
  if (!plan) throw new Error("Unknown plan");
  if (!territorySessionSettled(plan, session.payment_status)) throw new Error("Payment is not complete");
  const paid = Number(session.amount_total);
  let settledAmount: number = Number(plan.amountCents);
  if (plan.cadence === "trial") {
    const named = clampNamedPriceCents(session.metadata?.named_price_cents ?? plan.amountCents);
    // Checkout charges the named Month-1 amount now; recurring $150 starts after the 30-day trial window.
    if (!Number.isFinite(paid) || paid < named) {
      throw new Error("Paid amount does not match the Name Your Price bid");
    }
    settledAmount = named;
  } else if (plan.cadence === "once") {
    const expected = Number(plan.amountCents) || FOUNDER_LIFETIME_CENTS;
    if (paid !== expected) throw new Error("Paid amount does not match the plan");
    settledAmount = expected;
  } else if (Number(plan.amountCents) <= 0) {
    if (Number.isFinite(paid) && paid > 0) throw new Error("Paid amount does not match the plan");
  } else if (paid !== Number(plan.amountCents) && paid !== STANDARD_MONTHLY_CENTS) {
    throw new Error("Paid amount does not match the plan");
  }
  const { activateTerritory } = await import("./territory.server");
  const activation = await activateTerritory({
    leadSlug,
    planId,
    paymentRef: sessionId,
    checkoutId: checkoutId || undefined,
    amountCents: settledAmount,
  });
  // Stripe subscription checkout completed — freeze remaining SMS/email drip touches.
  if (leadSlug) {
    try {
      const sql = await getSql();
      const { haltLeadDrip } = await import("./funnel-guard.server");
      const { smsDripHaltReason } = await import("./sms-drip");
      await haltLeadDrip(sql, leadSlug, smsDripHaltReason("stripe_checkout"));
    } catch (err) {
      console.error("[stripe] drip halt after checkout failed", err instanceof Error ? err.message : err);
    }
  }
  const ownerId = await territoryOwnerId(session);
  if (!ownerId) return { ...activation, shop: null };
  const { provisionTerritoryForPayer } = await import("./shop-server.server");
  const shop = await provisionTerritoryForPayer({ leadSlug, userId: ownerId });
  return { ...activation, shop };
}

/** The account that paid. Metadata is the signed-in buyer. Email matches an existing account. */
async function territoryOwnerId(session: StripeObject): Promise<string | null> {
  const metaId = (session.metadata?.user_id ?? "").trim();
  const detailEmail =
    session.customer_details && typeof session.customer_details.email === "string"
      ? session.customer_details.email
      : "";
  const email = (detailEmail || session.customer_email || "").trim().toLowerCase();
  const sql = await getSql();
  if (metaId && metaId !== "dev-user") {
    const rows = await sql<{ id: string }>`select id from "user" where id = ${metaId} limit 1`;
    if (rows[0]) return rows[0].id;
  }
  if (email && !email.endsWith("@example.com") && !email.endsWith(".example")) {
    const rows = await sql<{ id: string }>`select id from "user" where lower("email") = ${email} limit 1`;
    if (rows[0]) return rows[0].id;
  }
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const current = await getSessionUser();
    if (!current || current.id === "dev-user") return null;
    if (metaId && current.id === metaId) return current.id;
    if (email && current.email?.toLowerCase() === email) return current.id;
  } catch {
    return null;
  }
  return null;
}

async function recordPlatformFee(opts: {
  shopId: string;
  appointmentId: string;
  dueNowCents: number;
  stripeRef: string;
  feeCents?: number;
}) {
  const amount = opts.feeCents ?? gearGuardianFeeCents(opts.dueNowCents);
  if (amount <= 0 || !opts.stripeRef) return;
  const sql = await getSql();
  try {
    await sql`
      insert into platform_fees (id, shop_id, appointment_id, amount_cents, bps, stripe_ref)
      values (${newId("fee")}, ${opts.shopId}, ${opts.appointmentId}, ${amount}, ${GEAR_GUARDIAN_BPS}, ${opts.stripeRef})
      on conflict (stripe_ref) do nothing
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/platform_fees/i.test(message)) throw err;
  }
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
    employee_id: string;
    payment_cents: number;
    payment_status: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    starts_at: string;
    shop_name: string;
    service_name: string;
    employee_name: string;
  }>`
    select a.id, a.shop_id, a.employee_id, a.payment_cents, a.payment_status,
      a.customer_name, a.customer_phone, a.customer_email, a.starts_at,
      sh.name as shop_name, s.name as service_name, e.display_name as employee_name
    from appointments a
    join shops sh on sh.id = a.shop_id
    join services s on s.id = a.service_id
    join employees e on e.id = a.employee_id
    where a.id = ${appointmentId} and a.payment_ref = ${sessionId}
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
    insert into shop_events (id, shop_id, type, appointment_id, payload)
    values (${newId("evt")}, ${shopId}, 'payment_received', ${row.id}, ${`Paid · ${row.service_name}`})
  `;
  await recordPlatformFee({
    shopId,
    appointmentId: row.id,
    dueNowCents: Number(row.payment_cents),
    stripeRef: sessionId,
    feeCents: Number(session.metadata?.gear_guardian_cents) || gearGuardianFeeCents(Number(row.payment_cents)),
  });
  await notifyBookingParties({
    shopId,
    shopName: row.shop_name,
    employeeId: row.employee_id,
    guestName: row.customer_name,
    guestPhone: row.customer_phone ?? "",
    guestEmail: row.customer_email ?? "",
    serviceName: row.service_name,
    employeeName: row.employee_name,
    startsAt: String(row.starts_at),
    phase: "paid",
  });
  return { appointmentId: row.id, shopId, already: false };
}

export async function settlePaidIntent(paymentIntentId: string) {
  if (!paymentIntentId.startsWith("pi_")) throw new Error("Invalid payment");
  const intent = await stripeFetch(`payment_intents/${encodeURIComponent(paymentIntentId)}`);
  if (intent.status !== "succeeded") throw new Error("Payment is not complete");
  const appointmentId = intent.metadata?.appointment_id;
  const shopId = intent.metadata?.shop_id;
  if (!appointmentId || !shopId) throw new Error("Payment is missing booking details");
  const paid = Number(intent.amount);
  if (!Number.isFinite(paid) || paid <= 0) throw new Error("Payment amount is invalid");

  const sql = await getSql();
  const rows = await sql<{
    id: string;
    shop_id: string;
    employee_id: string;
    payment_cents: number;
    payment_status: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    starts_at: string;
    shop_name: string;
    service_name: string;
    employee_name: string;
  }>`
    select a.id, a.shop_id, a.employee_id, a.payment_cents, a.payment_status,
      a.customer_name, a.customer_phone, a.customer_email, a.starts_at,
      sh.name as shop_name, s.name as service_name, e.display_name as employee_name
    from appointments a
    join shops sh on sh.id = a.shop_id
    join services s on s.id = a.service_id
    join employees e on e.id = a.employee_id
    where a.id = ${appointmentId} and a.payment_ref = ${paymentIntentId}
    limit 1
  `;
  const row = rows[0];
  if (!row || row.shop_id !== shopId) throw new Error("Booking not found for this payment");
  if (paid !== Number(row.payment_cents)) throw new Error("Paid amount does not match the service price");
  if (row.payment_status === "paid") return { appointmentId: row.id, shopId, already: true };

  const updated = await sql<{ id: string }>`
    update appointments
    set payment_status = 'paid'
    where id = ${row.id} and shop_id = ${shopId} and payment_status = 'processing'
    returning id
  `;
  if (!updated[0]) return { appointmentId: row.id, shopId, already: true };

  await sql`
    insert into shop_events (id, shop_id, type, appointment_id, payload)
    values (${newId("evt")}, ${shopId}, 'payment_received', ${row.id}, ${`Paid · ${row.service_name}`})
  `;
  await recordPlatformFee({
    shopId,
    appointmentId: row.id,
    dueNowCents: Number(row.payment_cents),
    stripeRef: paymentIntentId,
    feeCents: Number(intent.metadata?.gear_guardian_cents) || gearGuardianFeeCents(Number(row.payment_cents)),
  });
  await notifyBookingParties({
    shopId,
    shopName: row.shop_name,
    employeeId: row.employee_id,
    guestName: row.customer_name,
    guestPhone: row.customer_phone ?? "",
    guestEmail: row.customer_email ?? "",
    serviceName: row.service_name,
    employeeName: row.employee_name,
    startsAt: String(row.starts_at),
    phase: "paid",
  });
  return { appointmentId: row.id, shopId, already: false };
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

/**
 * Stripe webhook entry. Signature verification is the node-crypto equivalent of
 * `stripe.webhooks.constructEvent(payload, header, secret)` — HMAC-SHA256 over
 * `${timestamp}.${payload}` with a 5-minute skew window. Production and every
 * non-dev deploy refuse unsigned or forged events.
 */
export async function handleStripeWebhook(request: Request) {
  const secret = env("STRIPE_WEBHOOK_SECRET");
  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (!secret) {
    return Response.json(
      { error: isProd ? "Unauthorized" : "Webhook secret is not configured" },
      { status: isProd ? 401 : 503 },
    );
  }
  const payload = await request.text();
  const header = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, header, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: {
    type?: string;
    data?: {
      object?: {
        id?: string;
        payment_status?: string;
        charges_enabled?: boolean;
        metadata?: Record<string, string>;
        client_reference_id?: string;
        amount_total?: number;
      };
    };
  };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const object = event.data?.object;
  try {
    if (event.type === "account.updated" && object?.id?.startsWith("acct_")) {
      const sql = await getSql();
      const known = await sql<{ shop_id: string }>`
        select shop_id from shop_billing where stripe_account_id = ${object.id} limit 1
      `;
      if (known[0]) await syncConnectAccount(object.id);
    }
    if (event.type === "payment_intent.succeeded" && object?.id?.startsWith("pi_")) {
      await settlePaidIntent(object.id);
    }
    if (event.type === "checkout.session.completed" && object?.id) {
      const meta = object.metadata ?? {};
      const territory = meta.kind === "territory";
      const status = object.payment_status;
      if (territory && (status === "paid" || status === "no_payment_required")) {
        // Re-fetches the session from Stripe, marks the territory live, then opens the shop.
        await settleTerritorySession(object.id);
      } else if (meta.kind === "ai_credits" && (status === "paid" || status === "no_payment_required")) {
        const { settleAiCreditSession } = await import("./hero-motion-studio.server");
        await settleAiCreditSession(object.id);
      } else if (!territory && status === "paid" && meta.appointment_id && meta.shop_id) {
        await settlePaidSession(object.id);
      } else if (
        object.client_reference_id &&
        /^[0-9a-f-]{36}$/i.test(object.client_reference_id) &&
        (status === "paid" || status === "no_payment_required")
      ) {
        const { getTenantById, updateTenant } = await import("@/lib/axiom-landing/tenants/store");
        const tenant = await getTenantById(object.client_reference_id, { fresh: true });
        if (tenant && tenant.status !== "active") {
          await updateTenant(tenant.id, {
            status: "active",
            stripe_session_id: object.id,
            amount_paid_cents: object.amount_total ?? null,
            activated_at: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const missing = Boolean((err as { stripeMissing?: boolean }).stripeMissing);
    const unmatched =
      missing ||
      message === "Stripe object was not found" ||
      message === "Payment is missing booking details" ||
      message === "Booking not found for this payment";
    if (unmatched) return Response.json({ received: true });
    // Never leak Stripe/DB internals to the webhook caller.
    console.error("[stripe-webhook]", message.slice(0, 200));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
  return Response.json({ received: true });
}
