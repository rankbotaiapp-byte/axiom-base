import { createHmac, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { resolveStripeKeys } from "@/lib/stripe/keys";
import { stampCheckoutSessionShare } from "@/lib/stripe/connect-fee";
import { newId } from "@/lib/utils";
import { territoryCheckoutSuccessUrl } from "./onboard-success";
import { GEAR_GUARDIAN_BPS, gearGuardianFeeCents } from "./merchant-pricing";
import {
  mapSubscriptionStatus,
  parseGearGuardianMetadata,
  provisionTenant,
  settleTerritorySession,
  slugFromStripeObject,
  syncCheckoutTenantToSupabase,
  syncTenantSubscriptionStatus,
  type TenantBillingStatus,
} from "./provision";
import { provisionTerritoryForPayer } from "./shop-server.server";
import { activateTerritory } from "./territory.server";
import { grantStudioTrialFromEvent } from "./studio-stripe-webhook.server";
import {
  deactivateTenantGenerationQuota,
  resolveStripeOwnerUserId,
  syncGenerationQuotaFromCheckoutSession,
} from "./generation-quota.server";

export const HANDLED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "payment_intent.payment_failed",
  "payment_intent.succeeded",
  "account.updated",
] as const;

type StripeObject = Record<string, unknown> & {
  error?: { message?: string; code?: string };
  id?: string;
  url?: string | null;
  payment_status?: string;
  status?: string;
  amount_total?: number;
  amount?: number;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  client_secret?: string;
  customer?: string | { id?: string } | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
  client_reference_id?: string;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: StripeObject };
};

function stripeCustomerIdFromSession(object: StripeObject): string {
  const customer = object.customer;
  if (typeof customer === "string") return customer.trim();
  if (customer && typeof customer === "object" && typeof customer.id === "string") {
    return customer.id.trim();
  }
  return "";
}

function checkoutBillingStatus(object: StripeObject): TenantBillingStatus {
  const paid = object.payment_status === "paid" || object.payment_status === "no_payment_required";
  return paid ? "active" : "trialing";
}

export function stripeConfigured() {
  try {
    resolveStripeKeys();
    return true;
  } catch {
    return Boolean(process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
}

export function stripePublishableKey() {
  try {
    return resolveStripeKeys().publishable;
  } catch {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || "";
  }
}

export function requestOrigin() {
  return (
    env("BETTER_AUTH_URL") ||
    env("NEXT_PUBLIC_APP_URL") ||
    (env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "") ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function stripeSecret(): Promise<string> {
  try {
    return resolveStripeKeys().secret;
  } catch {
    const key = env("STRIPE_SECRET_KEY");
    if (!key) throw new Error("Card payments are not configured");
    return key;
  }
}

async function stripeFetch(path: string, body?: URLSearchParams) {
  const key = await stripeSecret();
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
    const err = new Error(missing ? "Stripe object was not found" : raw);
    if (missing) (err as Error & { stripeMissing?: boolean }).stripeMissing = true;
    throw err;
  }
  return json;
}

function cleanShopSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function shopBillingBySlug(slug: string): Promise<{
  shopId: string;
  slug: string;
  name: string;
  accountId: string | null;
  chargesEnabled: boolean;
  connectStatus: string;
} | null> {
  const key = cleanShopSlug(slug);
  if (!key) return null;
  const sql = await getSql();
  const rows = await sql<{
    shop_id: string;
    slug: string;
    name: string;
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean | null;
    stripe_connect_status: string | null;
  }>`
    select s.id as shop_id, s.slug, s.name,
      b.stripe_account_id, b.stripe_charges_enabled, b.stripe_connect_status
    from shops s
    left join shop_billing b on b.shop_id = s.id
    where s.slug = ${key}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    shopId: row.shop_id,
    slug: row.slug,
    name: row.name,
    accountId: row.stripe_account_id || null,
    chargesEnabled: Boolean(row.stripe_charges_enabled),
    connectStatus: row.stripe_connect_status || (row.stripe_account_id ? "pending" : "none"),
  };
}

/** Ensure shop_billing row exists before Connect writes. */
async function ensureShopBilling(shopId: string) {
  const sql = await getSql();
  await sql`
    insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps)
    values (${shopId}, 'axiom_pro', 'trialing', 15000, ${GEAR_GUARDIAN_BPS})
    on conflict (shop_id) do nothing
  `;
}

export async function beginConnect(opts: {
  shopId: string;
  slug: string;
  accountId: string | null;
  origin: string;
  email?: string | null;
}) {
  let accountId = opts.accountId;
  if (!accountId) {
    const params = new URLSearchParams({
      type: "express",
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
      "business_profile[name]": opts.slug.slice(0, 100),
      "metadata[shop_id]": opts.shopId,
      "metadata[shop_slug]": opts.slug,
    });
    if (opts.email) params.set("email", opts.email);
    const account = await stripeFetch("accounts", params);
    if (!account.id) throw new Error("Stripe did not return an account");
    accountId = account.id;
    const sql = await getSql();
    await ensureShopBilling(opts.shopId);
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
      refresh_url: `${opts.origin}/${opts.slug}/admin/billing?stripe=refresh`,
      return_url: `${opts.origin}/${opts.slug}/admin/billing?stripe=return`,
      type: "account_onboarding",
    }),
  );
  if (!link.url) throw new Error("Stripe did not return an onboarding link");
  return { url: link.url, accountId };
}

export async function createConnectLoginLink(accountId: string) {
  const link = await stripeFetch(
    `accounts/${encodeURIComponent(accountId)}/login_links`,
    new URLSearchParams(),
  );
  if (!link.url) throw new Error("Stripe did not return a dashboard link");
  return { url: link.url };
}

export async function syncConnectAccount(accountId: string) {
  const account = await stripeFetch(`accounts/${encodeURIComponent(accountId)}`);
  const chargesEnabled = Boolean(account.charges_enabled);
  await recordConnectStanding(accountId, chargesEnabled);
  return {
    chargesEnabled,
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
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

export async function readConnectStatus(shopSlug: string) {
  const shop = await shopBillingBySlug(shopSlug);
  if (!shop) {
    return {
      shopSlug: cleanShopSlug(shopSlug),
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      connectStatus: "none" as const,
      accountId: null as string | null,
      transactions: [] as Array<{ id: string; amountCents: number; created: number; description: string }>,
    };
  }
  let payoutsEnabled = false;
  let detailsSubmitted = false;
  let chargesEnabled = shop.chargesEnabled;
  if (shop.accountId && stripeConfigured()) {
    try {
      const live = await syncConnectAccount(shop.accountId);
      chargesEnabled = live.chargesEnabled;
      payoutsEnabled = live.payoutsEnabled;
      detailsSubmitted = live.detailsSubmitted;
    } catch {
      /* keep DB snapshot */
    }
  }
  const transactions = shop.accountId ? await listConnectTransactions(shop.accountId) : [];
  return {
    shopSlug: shop.slug,
    connected: Boolean(shop.accountId),
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    connectStatus: chargesEnabled ? "active" : shop.accountId ? "pending" : "none",
    accountId: shop.accountId,
    transactions,
  };
}

async function listConnectTransactions(accountId: string) {
  try {
    const key = await stripeSecret();
    const res = await fetch(
      `https://api.stripe.com/v1/charges?limit=12`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Stripe-Account": accountId,
        },
      },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: Array<{ id?: string; amount?: number; created?: number; description?: string | null }>;
    };
    return (json.data ?? [])
      .filter((row) => row.id)
      .map((row) => ({
        id: row.id!,
        amountCents: Number(row.amount) || 0,
        created: Number(row.created) || 0,
        description: (row.description || "Booking charge").slice(0, 120),
      }));
  } catch {
    return [];
  }
}

export async function startConnectOnboarding(shopSlug: string, origin?: string) {
  const shop = await shopBillingBySlug(shopSlug);
  if (!shop) throw new Error("Unknown shop");
  await ensureShopBilling(shop.shopId);
  let email: string | null = null;
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = await getSessionUser();
    email = user?.email ?? null;
  } catch {
    /* unsigned */
  }
  return beginConnect({
    shopId: shop.shopId,
    slug: shop.slug,
    accountId: shop.accountId,
    origin: (origin || requestOrigin()).replace(/\/$/, ""),
    email,
  });
}

export async function createConnectPaymentIntent(opts: {
  destination: string;
  amountCents: number;
  feeCents?: number;
  shopId: string;
  appointmentId: string;
  shopSlug?: string;
}) {
  const feeCents = resolveApplicationFee(opts.amountCents, opts.feeCents);
  const params = new URLSearchParams({
    amount: String(opts.amountCents),
    currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    "transfer_data[destination]": opts.destination,
    "metadata[shop_id]": opts.shopId,
    "metadata[appointment_id]": opts.appointmentId,
    "metadata[kind]": "booking",
    "metadata[shop_slug]": opts.shopSlug || "",
    "metadata[gear_guardian_bps]": String(GEAR_GUARDIAN_BPS),
    "metadata[gear_guardian_cents]": String(feeCents),
  });
  if (feeCents > 0 && feeCents < opts.amountCents) {
    params.set("application_fee_amount", String(feeCents));
  }
  const intent = await stripeFetch("payment_intents", params);
  if (!intent.id || !intent.client_secret) throw new Error("Stripe did not return a payment");
  return { id: intent.id, clientSecret: intent.client_secret, feeCents };
}

function resolveApplicationFee(amountCents: number, feeCents?: number) {
  const due = Math.max(0, Math.round(amountCents));
  const computed = gearGuardianFeeCents(due);
  const requested = feeCents == null ? computed : Math.max(0, Math.round(feeCents));
  const fee = requested > 0 ? requested : computed;
  if (fee <= 0) return 0;
  if (fee >= due) return Math.max(0, due - 1);
  return fee;
}

export async function createConnectCheckout(opts: {
  destination: string;
  amountCents: number;
  feeCents?: number;
  serviceName: string;
  shopId: string;
  appointmentId: string;
  shopSlug?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const feeCents = resolveApplicationFee(opts.amountCents, opts.feeCents);
  const params = new URLSearchParams({
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.appointmentId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(opts.amountCents),
    "line_items[0][price_data][product_data][name]": opts.serviceName.slice(0, 120),
    "metadata[shop_id]": opts.shopId,
    "metadata[appointment_id]": opts.appointmentId,
    "metadata[kind]": "booking",
    "metadata[shop_slug]": opts.shopSlug || "",
  });
  stampCheckoutSessionShare(params, {
    destination: opts.destination,
    amountCents: opts.amountCents,
    feeCents,
  });
  const session = await stripeFetch("checkout/sessions", params);
  if (!session.id || !session.url) throw new Error("Stripe did not return a checkout session");
  return { id: session.id, url: session.url, feeCents };
}

/**
 * Platform SaaS checkout: Name Your Price (month 1 → $150/mo) or Founder's Lifetime.
 * Metadata always carries shopSlug + user_id for post-payment provisioning.
 */
export async function createTerritoryCheckout(opts: {
  leadSlug: string;
  checkoutId: string;
  planId: string;
  planName: string;
  amountCents: number;
  cadence: "trial" | "month" | "once";
  origin: string;
  userId?: string;
  namedPriceCents?: number;
  embedded?: boolean;
  businessName?: string;
  niche?: string;
}) {
  const { clampNamedPriceCents, STANDARD_MONTHLY_CENTS, FOUNDER_LIFETIME_CENTS } = await import(
    "@/lib/stripe/commercial"
  );
  const shopSlug = cleanShopSlug(opts.leadSlug);
  const success = territoryCheckoutSuccessUrl(opts.origin);
  const cancel = `${opts.origin.replace(/\/$/, "")}/?b=${encodeURIComponent(shopSlug)}&pitch=1`;
  const params = new URLSearchParams({
    ...(opts.embedded
      ? { ui_mode: "embedded", redirect_on_completion: "never" }
      : { success_url: success, cancel_url: cancel }),
    client_reference_id: opts.checkoutId,
    "metadata[kind]": "territory",
    "metadata[lead_slug]": shopSlug,
    "metadata[shop_slug]": shopSlug,
    "metadata[slug]": shopSlug,
    "metadata[plan_id]": opts.planId,
    "metadata[checkout_id]": opts.checkoutId,
  });
  if (opts.userId && opts.userId !== "dev-user") {
    params.set("metadata[user_id]", opts.userId);
  }
  if (opts.businessName) params.set("metadata[business_name]", opts.businessName.slice(0, 80));
  if (opts.niche) params.set("metadata[niche]", opts.niche.slice(0, 40));

  if (opts.cadence === "once") {
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
    const named = clampNamedPriceCents(opts.namedPriceCents ?? opts.amountCents);
    params.set("mode", "subscription");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(named));
    params.set(
      "line_items[0][price_data][product_data][name]",
      `Name Your Price · Month 1 ($${(named / 100).toFixed(2)})`.slice(0, 120),
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
    params.set("subscription_data[metadata][shop_slug]", shopSlug);
    params.set("subscription_data[metadata][lead_slug]", shopSlug);
    if (opts.userId && opts.userId !== "dev-user") {
      params.set("subscription_data[metadata][user_id]", opts.userId);
    }
  } else {
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
    params.set("subscription_data[metadata][shop_slug]", shopSlug);
    params.set("subscription_data[metadata][lead_slug]", shopSlug);
    if (opts.userId && opts.userId !== "dev-user") {
      params.set("subscription_data[metadata][user_id]", opts.userId);
    }
  }

  const session = await stripeFetch("checkout/sessions", params);
  if (opts.embedded) {
    if (!session.id || !session.client_secret) throw new Error("Stripe did not return a checkout session");
    return { id: session.id, url: "", clientSecret: session.client_secret };
  }
  if (!session.id || !session.url) throw new Error("Stripe did not return a checkout session");
  return { id: session.id, url: session.url, clientSecret: "" };
}

export async function createTenantLicenseCheckout(opts: {
  slug: string;
  origin: string;
  planId?: string;
  namedPriceCents?: number;
  businessName?: string;
  niche?: string;
  logoUrl?: string;
  userId?: string;
}) {
  const { clampNamedPriceCents, NAME_YOUR_PRICE_MIN_CENTS } = await import("@/lib/stripe/commercial");
  const planId = opts.planId === "lifetime" ? "lifetime" : "trial";
  const cadence = planId === "lifetime" ? "once" : "trial";
  const named =
    cadence === "trial"
      ? clampNamedPriceCents(opts.namedPriceCents ?? NAME_YOUR_PRICE_MIN_CENTS)
      : undefined;
  let userId = opts.userId || "";
  if (!userId) {
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const buyer = await getSessionUser();
      if (buyer?.id && buyer.id !== "dev-user") userId = buyer.id;
    } catch {
      /* guest checkout */
    }
  }
  const checkoutId = newId("tco");
  return createTerritoryCheckout({
    leadSlug: opts.slug,
    checkoutId,
    planId,
    planName: planId === "lifetime" ? "Founder's Lifetime Access" : "Name Your Price · Month 1",
    amountCents: named ?? 0,
    cadence,
    origin: opts.origin,
    userId,
    namedPriceCents: named,
    businessName: opts.businessName,
    niche: opts.niche,
  });
}

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
  return {
    id: session.id,
    clientSecret: session.client_secret,
    url: "/pricing",
    publishableKey: stripePublishableKey(),
  };
}

export async function readLaunchSession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) throw new Error("Invalid session");
  const session = await stripeFetch(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.metadata?.kind !== "launch_plan") throw new Error("This payment is not a launch plan");
  return {
    id: sessionId,
    planId: session.metadata.plan_id ?? "",
    status: session.status,
    payment_status: session.payment_status,
    paymentStatus: session.payment_status,
    amountTotal: Number(session.amount_total),
  };
}

export async function processStripePayment(data: Record<string, unknown>) {
  return { success: true, chargeId: `ch_${Date.now()}`, ...data };
}

export async function getStripeSubscriptionStatus(_tenantId: string) {
  return { status: "active", tier: "growth", feeSplit: 0.015 };
}

export { settleTerritorySession };

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
    payment_cents: number;
    payment_status: string;
    service_name: string;
  }>`
    select a.id, a.shop_id, a.payment_cents, a.payment_status, s.name as service_name
    from appointments a
    join services s on s.id = a.service_id
    where a.id = ${appointmentId} and a.payment_ref = ${sessionId}
    limit 1
  `;
  const row = rows[0];
  if (!row || row.shop_id !== shopId) throw new Error("Booking not found for this payment");
  if (row.payment_status === "paid") {
    return { appointmentId: row.id, shopId, already: true };
  }
  await sql`
    update appointments
    set payment_status = 'paid'
    where id = ${row.id} and shop_id = ${shopId}
  `;
  await recordPlatformFee({
    shopId,
    appointmentId: row.id,
    dueNowCents: Number(row.payment_cents),
    stripeRef: sessionId,
    feeCents: Number(session.metadata?.gear_guardian_cents) || gearGuardianFeeCents(Number(row.payment_cents)),
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
    payment_cents: number;
    payment_status: string;
  }>`
    select a.id, a.shop_id, a.payment_cents, a.payment_status
    from appointments a
    where a.id = ${appointmentId} and a.payment_ref = ${paymentIntentId}
    limit 1
  `;
  const row = rows[0];
  if (!row || row.shop_id !== shopId) throw new Error("Booking not found for this payment");
  if (row.payment_status === "paid") return { appointmentId: row.id, shopId, already: true };
  await sql`
    update appointments
    set payment_status = 'paid'
    where id = ${row.id} and shop_id = ${shopId}
  `;
  await recordPlatformFee({
    shopId,
    appointmentId: row.id,
    dueNowCents: Number(row.payment_cents),
    stripeRef: paymentIntentId,
    feeCents: Number(intent.metadata?.gear_guardian_cents) || gearGuardianFeeCents(Number(row.payment_cents)),
  });
  return { appointmentId: row.id, shopId, already: false };
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => {
    const idx = part.indexOf("=");
    return [part.slice(0, idx), part.slice(idx + 1)] as const;
  });
  const timestamp = parts.find((part) => part[0] === "t")?.[1];
  const signatures = parts.filter((part) => part[0] === "v1").map((part) => part[1]);
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

function benignCheckoutError(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  return /unknown business|unknown plan|already live|invalid session|not complete|not a territory|not found|Stripe object was not found|Payment is missing booking details|Booking not found/i.test(
    message,
  );
}

/**
 * Verified Stripe webhook. Territory checkouts settle and open the payer's shop.
 * Connect account updates sync payout standing. Booking charges record platform fees.
 * Subscription + invoice events sync tenant status in Supabase.
 */
export async function handleStripeWebhook(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "Stripe webhook secret is not set" }, { status: 500 });
  }
  const payload = await request.text();
  const header = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, header, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const object = event.data?.object;
  try {
    const { recordStripeCompanionPulse } = await import("./companion-telemetry.server");
    const eventType = event.type ?? "unknown";
    void recordStripeCompanionPulse(eventType, eventType);

    if (event.type === "account.updated" && object?.id?.startsWith("acct_")) {
      const sql = await getSql();
      const known = await sql<{ shop_id: string }>`
        select shop_id from shop_billing where stripe_account_id = ${object.id} limit 1
      `;
      if (known[0]) {
        await syncConnectAccount(object.id);
        return Response.json({ received: true, kind: "connect", accountId: object.id });
      }
    }

    if (event.type === "payment_intent.succeeded" && object?.id?.startsWith("pi_")) {
      try {
        await settlePaidIntent(object.id);
      } catch (err) {
        if (!benignCheckoutError(err)) throw err;
      }
      return Response.json({ received: true, kind: "booking_intent" });
    }

    if (event.type === "invoice.payment_failed" || event.type === "payment_intent.payment_failed") {
      const slug = slugFromStripeObject(object ?? {});
      if (slug) await syncTenantSubscriptionStatus(slug, "canceled");
      if (event.type === "invoice.payment_failed" && object) {
        const ownerId = await resolveStripeOwnerUserId(object);
        if (ownerId) await deactivateTenantGenerationQuota(ownerId);
      }
      return Response.json({ received: true, companion: "alert" });
    }

    if (event.type === "invoice.payment_succeeded") {
      const slug = slugFromStripeObject(object ?? {});
      if (slug) {
        await syncTenantSubscriptionStatus(slug, "active");
        return Response.json({ received: true, kind: "invoice", status: "active", shopSlug: slug });
      }
    }

    if (event.type === "checkout.session.completed" && object?.id) {
      const meta = object.metadata ?? {};
      const gear = parseGearGuardianMetadata({
        ...meta,
        gear_guardian_bps: meta.gear_guardian_bps || String(GEAR_GUARDIAN_BPS),
        gear_guardian_issuer: meta.gear_guardian_issuer || "Gear Guardian LLC",
        gear_guardian_sig: meta.gear_guardian_sig || "",
      });
      const customerId = stripeCustomerIdFromSession(object);
      const billingStatus = checkoutBillingStatus(object);
      const plan = meta.plan_id || meta.plan || "axiom_pro";

      if (meta.kind === "booking" && object.payment_status === "paid") {
        try {
          await settlePaidSession(object.id);
        } catch (err) {
          if (!benignCheckoutError(err)) throw err;
        }
        return Response.json({
          received: true,
          kind: "booking",
          application_fee_cents: Number(meta.gear_guardian_cents) || gearGuardianFeeCents(Number(object.amount_total) || 0),
        });
      }

      if (meta.kind === "territory" && (object.payment_status === "paid" || object.payment_status === "no_payment_required")) {
        const leadSlug = meta.lead_slug || meta.shop_slug || meta.slug || "";
        const ownerId = meta.user_id || undefined;
        let already = false;
        try {
          const settled = await settleTerritorySession(object.id, {
            id: object.id,
            payment_status: object.payment_status,
            amount_total: object.amount_total,
            metadata: meta,
          });
          already = settled.already;
        } catch (err) {
          if (!benignCheckoutError(err)) throw err;
        }
        try {
          await activateTerritory({
            leadSlug,
            planId: meta.plan_id || "trial",
            paymentRef: object.id,
            checkoutId: meta.checkout_id || undefined,
            amountCents: Number(object.amount_total) || undefined,
          });
        } catch (err) {
          if (!benignCheckoutError(err)) throw err;
        }
        const shop = await provisionTerritoryForPayer({ leadSlug, userId: ownerId ?? "" });
        if (!ownerId && "claimToken" in shop && shop.unowned) {
          try {
            const { getSql } = await import("@/lib/db");
            const sql = await getSql();
            await sql`
              insert into shop_events (id, shop_id, type, payload)
              values (
                ${`checkout_${(object.id || "").slice(-16)}`},
                ${shop.shopId},
                'checkout_pending_quota',
                ${JSON.stringify({ sessionId: object.id, slug: shop.slug || leadSlug })}
              )
              on conflict (id) do nothing
            `;
          } catch {
            /* best-effort breadcrumb for claim-time quota replay */
          }
        }
        try {
          await syncCheckoutTenantToSupabase({
            slug: shop.slug || leadSlug,
            status: "active",
            shopName: meta.business_name || meta.shop_name,
            plan,
            niche: meta.niche || meta.trade_type,
            stripeCustomerId: customerId,
            stripeSessionId: object.id,
          });
        } catch (err) {
          console.error(
            "[stripe-webhook] territory tenants sync threw",
            err instanceof Error ? err.message.slice(0, 200) : err,
          );
        }
        // Resend welcome kit + subscription receipt (best-effort)
        try {
          const { sendTenantWelcomeKit, sendSubscriptionReceipt } = await import(
            "./resend-loops.server"
          );
          const ownerEmail =
            (typeof object.customer_details === "object" &&
              object.customer_details &&
              typeof object.customer_details.email === "string" &&
              object.customer_details.email) ||
            (typeof object.customer_email === "string" ? object.customer_email : "") ||
            "";
          if (ownerEmail.includes("@")) {
            const shopName = meta.business_name || meta.shop_name || shop.slug || leadSlug;
            const slug = shop.slug || leadSlug;
            await sendTenantWelcomeKit({
              shopId: shop.shopId,
              shopSlug: slug,
              shopName,
              ownerEmail,
              niche: meta.niche || meta.trade_type,
            });
            await sendSubscriptionReceipt({
              shopId: shop.shopId,
              shopSlug: slug,
              shopName,
              ownerEmail,
              planId: meta.plan_id || "trial",
              amountCents: Number(object.amount_total) || 0,
              stripeSessionId: object.id,
            });
          }
        } catch (err) {
          console.error(
            "[stripe-webhook] resend loops threw",
            err instanceof Error ? err.message.slice(0, 200) : err,
          );
        }
        if (billingStatus === "active" || billingStatus === "trialing") {
          try {
            await syncGenerationQuotaFromCheckoutSession(object, billingStatus);
          } catch (quotaErr) {
            console.error(
              "[stripe-webhook] generation quota sync threw",
              quotaErr instanceof Error ? quotaErr.message.slice(0, 200) : quotaErr,
            );
          }
        }
        return Response.json({
          received: true,
          kind: "territory",
          gear_guardian_bps: gear.gear_guardian_bps,
          gear_guardian_issuer: gear.gear_guardian_issuer,
          shopSlug: shop.slug,
          stripeCustomerId: customerId || undefined,
          already,
        });
      }

      const slug = meta.shop_slug || meta.lead_slug || meta.slug || object.client_reference_id || "";
      const shop = await provisionTenant({
        slug,
        shopName: meta.business_name || meta.shop_name,
        niche: meta.niche,
        userId: meta.user_id,
        status: billingStatus,
        plan,
        gear,
        stripeCustomerId: customerId,
        stripeSessionId: object.id,
      });
      try {
        await syncCheckoutTenantToSupabase({
          slug: shop.slug || slug,
          status: shop.status,
          shopName: meta.business_name || meta.shop_name,
          plan,
          niche: meta.niche,
          stripeCustomerId: customerId,
          stripeSessionId: object.id,
        });
      } catch (err) {
        console.error(
          "[stripe-webhook] shop tenants sync threw",
          err instanceof Error ? err.message.slice(0, 200) : err,
        );
      }
      if (billingStatus === "active" || billingStatus === "trialing") {
        try {
          await syncGenerationQuotaFromCheckoutSession(object, billingStatus);
        } catch (quotaErr) {
          console.error(
            "[stripe-webhook] generation quota sync threw",
            quotaErr instanceof Error ? quotaErr.message.slice(0, 200) : quotaErr,
          );
        }
      }
      return Response.json({
        received: true,
        kind: "shop",
        slug: shop.slug,
        status: shop.status,
        stripeCustomerId: customerId || undefined,
        gear_guardian_bps: gear.gear_guardian_bps,
      });
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.created"
    ) {
      const slug = slugFromStripeObject(object ?? {});
      const status = mapSubscriptionStatus(
        typeof object?.status === "string" ? object.status : "",
        event.type === "customer.subscription.deleted",
      );
      await syncTenantSubscriptionStatus(slug, status);
      if (event.type === "customer.subscription.deleted" && object) {
        const ownerId = await resolveStripeOwnerUserId(object);
        if (ownerId) await deactivateTenantGenerationQuota(ownerId);
      }
      if (event.type !== "customer.subscription.created") {
        return Response.json({ received: true, status, shopSlug: slug });
      }
    }

    const trial = await grantStudioTrialFromEvent(event);
    if (trial) return trial;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (benignCheckoutError(err)) return Response.json({ received: true });
    console.error("[stripe-webhook]", message.slice(0, 200));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json({ received: true });
}

export default processStripePayment;
