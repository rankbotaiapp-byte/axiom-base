import "server-only";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { notifyShop } from "./notify.server";
import {
  simulatedTestAlert,
  TRUST_WINDOW_HOURS,
  parseApprovalCadence,
  decideFirstLeadActivation,
  axiomProPriceIdFromEnv,
  type ApprovalCadence,
  type FirstLeadActivationDecision,
} from "./lifecycle";

type Sql = Awaited<ReturnType<typeof getSql>>;

function missingColumn(err: unknown, column: string): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return new RegExp(column, "i").test(message);
}

export async function markAwaitingFirstRealLead(input: {
  shopId: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
}): Promise<void> {
  const sql = await getSql();
  try {
    await sql`
      update shop_billing
      set awaiting_first_real_lead = true,
          stripe_customer_id = case
            when ${input.stripeCustomerId || ""} = '' then stripe_customer_id
            else ${input.stripeCustomerId || ""}
          end,
          stripe_payment_method_id = case
            when ${input.stripePaymentMethodId || ""} = '' then stripe_payment_method_id
            else ${input.stripePaymentMethodId || ""}
          end,
          updated_at = now()
      where shop_id = ${input.shopId}
    `;
  } catch (err) {
    if (!missingColumn(err, "awaiting_first_real_lead")) throw err;
  }
}

export async function sendSimulatedReadyAlert(shopId: string, shopName: string): Promise<void> {
  const copy = simulatedTestAlert(shopName);
  await notifyShop(shopId, { kind: "inquiry", subject: copy.subject, body: copy.body });
}

export async function recordIntakeLead(input: {
  shopId: string | null;
  slug: string;
  name: string;
  phone: string;
  mode: string;
  answers: Record<string, string>;
  sourceRoute: string;
  isSimulated: boolean;
}): Promise<{ id: string; isSimulated: boolean }> {
  const sql = await getSql();
  const city = (input.answers.city || input.slug).slice(0, 80);
  const meta = JSON.stringify({
    source: "storefront-intake",
    slug: input.slug,
    mode: input.mode,
    answers: input.answers,
    sourceRoute: input.sourceRoute,
    is_simulated: input.isSimulated,
  });
  try {
    const rows = await sql<{ id: string }>`
      insert into consumer_leads (
        niche, city, county, contact_name, contact_phone, contact_meta,
        shop_id, is_simulated, trust_window_expires_at
      )
      values (
        ${input.mode},
        ${city},
        ${""},
        ${input.name},
        ${input.phone},
        ${meta}::jsonb,
        ${input.shopId},
        ${input.isSimulated},
        now() + (${TRUST_WINDOW_HOURS} || ' hours')::interval
      )
      returning id::text
    `;
    return { id: rows[0]?.id || "", isSimulated: input.isSimulated };
  } catch (err) {
    if (!missingColumn(err, "is_simulated") && !missingColumn(err, "shop_id")) throw err;
    const rows = await sql<{ id: string }>`
      insert into consumer_leads (niche, city, county, contact_name, contact_phone, contact_meta)
      values (${input.mode}, ${city}, ${""}, ${input.name}, ${input.phone}, ${meta}::jsonb)
      returning id::text
    `;
    return { id: rows[0]?.id || "", isSimulated: input.isSimulated };
  }
}

export async function alertOwnerForRealLead(input: {
  shopId: string;
  shopName: string;
  guestName: string;
  guestPhone: string;
}): Promise<void> {
  await notifyShop(input.shopId, {
    kind: "booking_request",
    subject: `Emergency job — ${input.shopName}`,
    body: `${input.guestName} needs a dispatcher. Phone ${input.guestPhone}. 24-hour trust window is open. is_simulated=false`,
  });
}

type BillingActivationRow = {
  awaiting_first_real_lead: boolean | null;
  plan: string | null;
  status: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  stripe_subscription_id: string | null;
};

export async function activateAfterFirstRealLead(
  shopId: string,
  opts?: { isSimulated?: boolean },
): Promise<{ outcome: "skipped" | "recorded" | "subscribed" | "held"; reason: string }> {
  if (opts?.isSimulated === true) {
    return { outcome: "skipped", reason: "simulated_lead" };
  }
  const sql = await getSql();
  let row: BillingActivationRow | undefined;
  let planStatus = "";
  try {
    const rows = await sql<BillingActivationRow>`
      select awaiting_first_real_lead, plan, status, stripe_customer_id, stripe_payment_method_id,
             stripe_subscription_id
      from shop_billing
      where shop_id = ${shopId}
      limit 1
    `;
    row = rows[0];
  } catch (err) {
    if (missingColumn(err, "awaiting_first_real_lead")) return { outcome: "skipped", reason: "schema_missing" };
    throw err;
  }
  if (!row) return { outcome: "skipped", reason: "no_billing_row" };
  try {
    const tenants = await sql<{ plan_status: string | null }>`
      select plan_status from tenants where shop_id = ${shopId} limit 1
    `;
    planStatus = tenants[0]?.plan_status || "";
  } catch {
    planStatus = "";
  }

  const decision = decideFirstLeadActivation({
    isSimulated: false,
    awaitingFirstRealLead: row.awaiting_first_real_lead === true,
    plan: row.plan || "",
    planStatus,
    billingStatus: row.status || "",
    stripeCustomerId: row.stripe_customer_id || "",
    stripePaymentMethodId: row.stripe_payment_method_id || "",
    stripeSubscriptionId: row.stripe_subscription_id || "",
    stripePriceId: axiomProPriceIdFromEnv(),
  });

  if (decision.action === "skip" && !decision.clearAwaiting) {
    return { outcome: "skipped", reason: decision.reason };
  }

  let stripeSubscriptionId = row.stripe_subscription_id || "";
  let reason = decision.reason;
  let billingStatus = decision.billingStatus;
  let outcome: "skipped" | "recorded" | "subscribed" | "held" =
    decision.action === "subscribe" ? "subscribed" : decision.action === "record_pro" ? "recorded" : "skipped";

  if (decision.action === "subscribe") {
    const charged = await createAxiomProSubscription({
      customerId: row.stripe_customer_id || "",
      paymentMethodId: row.stripe_payment_method_id || "",
      priceId: axiomProPriceIdFromEnv(),
      shopId,
    });
    if (charged.ok) {
      stripeSubscriptionId = charged.subscriptionId;
      billingStatus = "active";
      reason = "charge_axiom_pro_monthly";
      outcome = "subscribed";
    } else {
      billingStatus = "trialing";
      reason = charged.reason;
      outcome = "held";
    }
  }

  await persistFirstLeadBilling(sql, shopId, decision, {
    stripeSubscriptionId,
    reason,
    billingStatus,
    planStatus,
    clearAwaiting: outcome === "held" ? false : decision.clearAwaiting,
  });
  return { outcome, reason };
}

async function persistFirstLeadBilling(
  sql: Sql,
  shopId: string,
  decision: FirstLeadActivationDecision,
  applied: {
    stripeSubscriptionId: string;
    reason: string;
    billingStatus: string;
    planStatus: string;
    clearAwaiting: boolean;
  },
): Promise<void> {
  const plan = decision.preserveLifetime ? "lifetime" : decision.plan;
  const priceCents = decision.preserveLifetime ? 0 : decision.priceCents;
  try {
    await sql`
      update shop_billing
      set awaiting_first_real_lead = ${applied.clearAwaiting ? false : true},
          status = ${applied.billingStatus || decision.billingStatus},
          plan = ${plan},
          price_cents = case
            when ${decision.preserveLifetime} then price_cents
            when ${priceCents} > 0 then ${priceCents}
            else price_cents
          end,
          stripe_subscription_id = case
            when ${applied.stripeSubscriptionId} = '' then stripe_subscription_id
            else ${applied.stripeSubscriptionId}
          end,
          first_lead_activation_reason = ${applied.reason},
          updated_at = now()
      where shop_id = ${shopId}
    `;
  } catch (err) {
    if (!missingColumn(err, "awaiting_first_real_lead") && !missingColumn(err, "first_lead_activation_reason")) {
      throw err;
    }
    await sql`
      update shop_billing
      set status = ${applied.billingStatus || decision.billingStatus},
          plan = ${plan},
          updated_at = now()
      where shop_id = ${shopId}
    `.catch(() => undefined);
  }
  if (decision.preserveLifetime) return;
  await sql`
    update tenants
    set plan_status = case
      when plan_status = 'lifetime' then plan_status
      else ${applied.billingStatus === "active" ? "active" : "trialing"}
    end
    where shop_id = ${shopId}
  `.catch(() => undefined);
}

async function createAxiomProSubscription(input: {
  customerId: string;
  paymentMethodId: string;
  priceId: string;
  shopId: string;
}): Promise<{ ok: true; subscriptionId: string } | { ok: false; reason: string }> {
  try {
    const { resolveStripeKeys } = await import("@/lib/stripe/keys");
    const key = resolveStripeKeys().secret;
    const body = new URLSearchParams();
    body.set("customer", input.customerId);
    body.set("default_payment_method", input.paymentMethodId);
    body.set("items[0][price]", input.priceId);
    body.set("off_session", "true");
    body.set("payment_behavior", "error_if_incomplete");
    body.set("metadata[shop_id]", input.shopId);
    body.set("metadata[plan]", "axiom_pro");
    const res = await fetch("https://api.stripe.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `first-lead-sub-${input.shopId}`,
      },
      body,
    });
    const json = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok || !json.id) {
      return { ok: false, reason: `stripe_create_failed:${(json.error?.message || "unknown").slice(0, 120)}` };
    }
    return { ok: true, subscriptionId: json.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "stripe_unavailable";
    return { ok: false, reason: `stripe_create_failed:${message.slice(0, 120)}` };
  }
}

/** Closes expired real-job windows only. Never activates billing. Simulated rows stay untouched. */
export async function sweepExpiredTrustWindows(sql?: Sql): Promise<number> {
  const db = sql ?? (await getSql());
  try {
    const rows = await db<{ n: number }>`
      with closed as (
        update consumer_leads
        set active = false
        where active = true
          and is_simulated = false
          and trust_window_expires_at is not null
          and trust_window_expires_at < now()
        returning 1
      )
      select count(*)::int as n from closed
    `;
    return Number(rows[0]?.n ?? 0) || 0;
  } catch (err) {
    if (missingColumn(err, "trust_window_expires_at") || missingColumn(err, "is_simulated")) return 0;
    throw err;
  }
}

export async function bumpDailyCounter(channel: "sms" | "email"): Promise<number> {
  const sql = await getSql();
  const id = `ctr_${channel}`;
  try {
    const rows = await sql<{ sent: number }>`
      insert into outreach_daily_counters (id, day_key, channel, sent, updated_at)
      values (${id}, (timezone('America/Los_Angeles', now()))::date, ${channel}, 1, now())
      on conflict (day_key, channel) do update set
        sent = outreach_daily_counters.sent + 1,
        updated_at = now()
      returning sent
    `;
    return Number(rows[0]?.sent ?? 0) || 0;
  } catch {
    return 0;
  }
}

export async function isSuppressed(email: string, phone: string): Promise<boolean> {
  const sql = await getSql();
  const mail = email.trim().toLowerCase();
  const digits = phone.replace(/\D/g, "").slice(-10);
  try {
    const rows = await sql<{ n: number }>`
      select count(*)::int as n from outreach_suppressions
      where (${mail} <> '' and lower(email) = ${mail})
         or (${digits} <> '' and right(regexp_replace(phone, '\\D', '', 'g'), 10) = ${digits})
    `;
    return Number(rows[0]?.n ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function suppressContact(input: { email?: string; phone?: string; reason: string }): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into outreach_suppressions (id, email, phone, reason)
    values (
      ${newId("unsub")},
      ${(input.email || "").trim().toLowerCase()},
      ${(input.phone || "").trim()},
      ${input.reason.slice(0, 80)}
    )
  `.catch(() => undefined);
}

export async function readApprovalCadence(shopId: string): Promise<ApprovalCadence> {
  const sql = await getSql();
  try {
    const rows = await sql<{ approval_cadence: string | null }>`
      select approval_cadence from shop_billing where shop_id = ${shopId} limit 1
    `;
    return parseApprovalCadence(rows[0]?.approval_cadence);
  } catch {
    return "every_item";
  }
}

export async function resolveShopIdBySlug(slug: string): Promise<{ id: string; name: string } | null> {
  const sql = await getSql();
  const rows = await sql<{ id: string; name: string }>`
    select id, name from shops where lower(slug) = lower(${slug}) limit 1
  `;
  return rows[0] ?? null;
}
