import { getSql } from "@/lib/db";
import { TRIAL_MONTHLY_CENTS } from "./studio-credits";

export type BillingHubState = "trialing" | "active" | "canceled" | "none";

export type BillingHub = {
  slug: string;
  shopName: string;
  status: BillingHubState;
  headline: string;
  canCancel: boolean;
};

type BillingRow = {
  shop_name: string | null;
  billing_status: string | null;
  trial_ends_at: string | Date | null;
  is_active: boolean | null;
  stripe_customer_id: string | null;
};

function cleanSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function renewalDate(value: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function present(row: BillingRow | undefined, slug: string): BillingHub {
  const shopName = row?.shop_name?.trim() || slug;
  const billingStatus = (row?.billing_status || "").toLowerCase();
  const trialLive = Boolean(row?.is_active) && billingStatus !== "canceled";
  const renewsOn = renewalDate(row?.trial_ends_at ?? null);
  const trialStillOpen = !row?.trial_ends_at || new Date(row.trial_ends_at).getTime() > Date.now();

  if (billingStatus === "canceled" || (row && row.is_active === false && billingStatus !== "active" && billingStatus !== "trialing")) {
    return {
      slug,
      shopName,
      status: "canceled",
      headline: "Canceled — this subscription will not renew at $150/mo.",
      canCancel: false,
    };
  }
  if (trialLive && trialStillOpen) {
    return {
      slug,
      shopName,
      status: "trialing",
      headline: renewsOn
        ? `14-Day Trial Active — Renews on ${renewsOn} for $150/mo`
        : "14-Day Trial Active — Renews at $150/mo when the 14 days end",
      canCancel: true,
    };
  }
  if (trialLive || billingStatus === "active" || billingStatus === "trialing") {
    return {
      slug,
      shopName,
      status: "active",
      headline: "Active — $150/mo until canceled",
      canCancel: true,
    };
  }
  return {
    slug,
    shopName,
    status: "none",
    headline: "No subscription on file",
    canCancel: false,
  };
}

async function readRow(slug: string): Promise<BillingRow | undefined> {
  const sql = await getSql();
  const rows = await sql<BillingRow>`
    select
      shops.name as shop_name,
      billing.status as billing_status,
      trial.trial_ends_at,
      trial.is_active,
      trial.stripe_customer_id
    from (select ${slug}::text as slug) as key
    left join shops on shops.slug = key.slug
    left join shop_billing as billing on billing.shop_id = shops.id
    left join studio_trial_credits as trial on trial.slug = key.slug
    limit 1
  `;
  const row = rows[0];
  if (!row?.shop_name && !row?.billing_status && row?.is_active == null && !row?.trial_ends_at) return undefined;
  return row;
}

export async function readBillingHub(slugInput: string): Promise<BillingHub> {
  const slug = cleanSlug(slugInput);
  if (!slug) {
    return { slug: "", shopName: "", status: "none", headline: "No subscription on file", canCancel: false };
  }
  try {
    return present(await readRow(slug), slug);
  } catch {
    return { slug, shopName: slug, status: "none", headline: "No subscription on file", canCancel: false };
  }
}

async function cancelStripeCustomer(customerId: string): Promise<"canceled" | "skipped" | "unavailable"> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !customerId.startsWith("cus_")) return "skipped";
  const listed = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=20`,
    { headers: { authorization: `Bearer ${key}` } },
  );
  if (!listed.ok) return "unavailable";
  const body = (await listed.json()) as { data?: { id?: string; status?: string }[] };
  const open = (body.data ?? []).filter((item) => item.id && item.status !== "canceled");
  for (const item of open) {
    const canceled = await fetch(`https://api.stripe.com/v1/subscriptions/${item.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${key}` },
    });
    if (!canceled.ok) return "unavailable";
  }
  return "canceled";
}

export async function cancelBillingSubscription(slugInput: string): Promise<BillingHub & { stripe: string }> {
  const slug = cleanSlug(slugInput);
  const current = await readBillingHub(slug);
  if (!slug || current.status === "none") {
    return { ...current, stripe: "skipped" };
  }
  const row = await readRow(slug).catch(() => undefined);
  let stripe: "canceled" | "skipped" | "unavailable" = "skipped";
  if (row?.stripe_customer_id) {
    try {
      stripe = await cancelStripeCustomer(row.stripe_customer_id);
    } catch {
      stripe = "unavailable";
    }
  }
  const sql = await getSql();
  await sql`
    update shop_billing as billing
    set status = 'canceled', price_cents = ${TRIAL_MONTHLY_CENTS}, updated_at = now()
    from shops
    where shops.id = billing.shop_id and shops.slug = ${slug}
  `;
  await sql`
    update studio_trial_credits
    set is_active = false, updated_at = now()
    where slug = ${slug}
  `;
  const next = await readBillingHub(slug);
  return {
    ...next,
    status: "canceled",
    headline: "Canceled — this subscription will not renew at $150/mo.",
    canCancel: false,
    stripe,
  };
}
