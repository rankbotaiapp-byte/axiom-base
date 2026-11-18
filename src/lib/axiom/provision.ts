import { randomBytes } from "node:crypto";
import { CATALOG_NICHES } from "@/config/catalog";
import { getSql } from "@/lib/db";
import { STANDARD_MONTHLY_CENTS } from "@/lib/stripe/commercial";
import { GEAR_GUARDIAN_BPS } from "./merchant-pricing";
import { activateTerritory } from "./territory.server";

/** Fee recipient for the 150 bps platform split. */
export const GEAR_GUARDIAN_LLC = "Gear Guardian LLC";

export type TenantBillingStatus = "trialing" | "active" | "canceled";

export type GearGuardianStamp = {
  gear_guardian_bps: number;
  gear_guardian_issuer: string;
  gear_guardian_sig: string;
};

export type ProvisionTenantInput = {
  slug: string;
  shopName?: string;
  niche?: string;
  userId?: string;
  status?: TenantBillingStatus;
  plan?: string;
  accent?: string;
  gear?: Partial<GearGuardianStamp>;
  stripeCustomerId?: string;
  stripeSessionId?: string;
};

export type SupabaseTenantCheckoutSync = {
  slug: string;
  status: TenantBillingStatus;
  shopName?: string;
  plan?: string;
  stripeCustomerId?: string;
  stripeSessionId?: string;
  niche?: string;
};

export type ProvisionedTenant = {
  shopId: string;
  slug: string;
  status: TenantBillingStatus;
  gear_guardian_bps: number;
  gear_guardian_issuer: string;
  skipped?: boolean;
};

const NICHE_IDS = new Set<string>(CATALOG_NICHES);

function cleanSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function titleFromSlug(slug: string): string {
  const label = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return (label || slug).slice(0, 80);
}

function catalogNiche(value: string | undefined): string {
  const niche = (value || "").trim().toLowerCase();
  return NICHE_IDS.has(niche) ? niche : "contractor";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Reads Gear Guardian issuer, signature, and basis points off Stripe metadata. */
export function parseGearGuardianMetadata(meta: Record<string, string>): GearGuardianStamp {
  const parsed = Number(meta.gear_guardian_bps);
  const issuer = text(meta.gear_guardian_issuer) || GEAR_GUARDIAN_LLC;
  return {
    gear_guardian_bps: parsed === GEAR_GUARDIAN_BPS ? GEAR_GUARDIAN_BPS : 150,
    gear_guardian_issuer: issuer,
    gear_guardian_sig: text(meta.gear_guardian_sig),
  };
}

export function mapSubscriptionStatus(raw: string, deleted: boolean): TenantBillingStatus {
  if (deleted) return "canceled";
  if (raw === "trialing") return "trialing";
  if (raw === "active") return "active";
  if (raw === "canceled" || raw === "unpaid" || raw === "incomplete_expired") return "canceled";
  return "active";
}

export function slugFromStripeObject(object: Record<string, unknown>): string {
  const direct = metadataSlug(asRecord(object.metadata));
  if (direct) return direct;
  const details = asRecord(object.subscription_details);
  const fromDetails = metadataSlug(asRecord(details.metadata));
  if (fromDetails) return fromDetails;
  const parent = asRecord(asRecord(object.parent).subscription_details);
  return metadataSlug(asRecord(parent.metadata)) || text(object.client_reference_id);
}

function metadataSlug(meta: Record<string, unknown>): string {
  return cleanSlug(text(meta.shop_slug) || text(meta.lead_slug) || text(meta.slug) || text(meta.tenant_slug));
}

function supabaseAdmin(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key) return null;
  return { url, key };
}

function supabaseHeaders(key: string, prefer: string) {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    prefer,
  };
}

/**
 * Best-effort PATCH of public.tenants after Stripe checkout / subscription sync.
 * Tries several column shapes (schema.sql vs landing migrations) and never throws —
 * webhook handlers must still ack Stripe on transient Supabase failures.
 */
export async function syncCheckoutTenantToSupabase(input: SupabaseTenantCheckoutSync): Promise<boolean> {
  const slug = cleanSlug(input.slug);
  if (!slug) return false;
  const supabase = supabaseAdmin();
  if (!supabase) {
    console.warn("[stripe-webhook] Supabase tenants sync skipped: SUPABASE_URL / service role not set");
    return false;
  }

  const shopName = (input.shopName || titleFromSlug(slug)).trim().slice(0, 80);
  const plan = (input.plan || "axiom_pro").trim().slice(0, 64);
  const customerId = (input.stripeCustomerId || "").trim();
  const sessionId = (input.stripeSessionId || "").trim();
  const niche = catalogNiche(input.niche);
  const billingStatus = input.status;
  const remoteStatus =
    billingStatus === "canceled" ? "suspended" : billingStatus === "trialing" ? "pending_review" : "active";
  const isActive = billingStatus !== "canceled";

  const bodies: Record<string, unknown>[] = [
    {
      status: billingStatus === "active" || billingStatus === "trialing" ? billingStatus : remoteStatus,
      is_active: isActive,
      business_name: shopName,
      plan,
      trade: niche,
      stripe_customer_id: customerId || undefined,
      stripe_session_id: sessionId || undefined,
      activated_at: billingStatus === "active" ? new Date().toISOString() : undefined,
    },
    {
      status: remoteStatus,
      is_active: isActive,
      business_name: shopName,
      plan,
      stripe_customer_id: customerId || undefined,
      stripe_session_id: sessionId || undefined,
    },
    {
      status: remoteStatus,
      is_active: isActive,
      stripe_customer_id: customerId || undefined,
    },
    { status: remoteStatus, is_active: isActive, business_name: shopName },
    { status: remoteStatus },
  ].map((body) => {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== "") next[key] = value;
    }
    return next;
  });

  const headers = supabaseHeaders(supabase.key, "return=minimal");
  const url = `${supabase.url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}`;

  try {
    for (const body of bodies) {
      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      }).catch((err) => {
        console.error(
          "[stripe-webhook] Supabase tenants PATCH network error",
          slug,
          err instanceof Error ? err.message.slice(0, 160) : err,
        );
        return null;
      });
      if (!response) continue;
      if (response.ok) {
        console.info("[stripe-webhook] Supabase tenants updated", {
          slug,
          status: body.status,
          hasCustomer: Boolean(customerId),
          plan,
        });
        return true;
      }
      const detail = await response.text().catch(() => "");
      console.warn(
        "[stripe-webhook] Supabase tenants PATCH rejected",
        slug,
        response.status,
        detail.slice(0, 180),
      );
    }
  } catch (err) {
    console.error(
      "[stripe-webhook] Supabase tenants sync failed",
      slug,
      err instanceof Error ? err.message.slice(0, 200) : err,
    );
  }
  return false;
}

async function patchSupabaseTenant(slug: string, status: TenantBillingStatus, shopName: string) {
  await syncCheckoutTenantToSupabase({ slug, status, shopName });
}

async function upsertStorefront(slug: string, shopName: string, status: TenantBillingStatus) {
  const supabase = supabaseAdmin();
  if (!supabase) return;
  const headers = supabaseHeaders(supabase.key, "resolution=merge-duplicates,return=minimal");
  const url = `${supabase.url}/rest/v1/client_storefronts?on_conflict=shop_slug`;
  const full = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ shop_slug: slug, business_name: shopName, status }),
  }).catch(() => null);
  if (full?.ok) return;
  await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ shop_slug: slug, business_name: shopName }),
  }).catch(() => undefined);
}

/**
 * Opens or updates the tenant shop and seeds the Gear Guardian LLC 1.5% fee split.
 * New checkouts land in `trialing` until a later subscription event marks them active.
 */
export async function provisionTenant(input: ProvisionTenantInput): Promise<ProvisionedTenant> {
  const slug = cleanSlug(input.slug);
  const status = input.status ?? "trialing";
  const plan = input.plan || "axiom_pro";
  const gear = {
    gear_guardian_bps: 150,
    gear_guardian_issuer: input.gear?.gear_guardian_issuer || GEAR_GUARDIAN_LLC,
    gear_guardian_sig: input.gear?.gear_guardian_sig || "",
  };
  if (!slug) {
    return { shopId: "", slug, status, ...gear, skipped: true };
  }
  const shopName = (input.shopName || titleFromSlug(slug)).trim().slice(0, 80) || titleFromSlug(slug);
  const niche = catalogNiche(input.niche);
  const ownerId = (input.userId || "").trim();
  const sql = await getSql();
  const existing = await sql<{ id: string }>`select id from shops where slug = ${slug} limit 1`;
  let shopId = existing[0]?.id ?? "";
  if (!shopId) {
    shopId = `shop_${randomBytes(8).toString("hex")}`;
    const inserted = await sql<{ id: string }>`
      insert into shops (id, slug, name, niche, owner_user_id)
      values (${shopId}, ${slug}, ${shopName}, ${niche}, ${ownerId || null})
      on conflict (slug) do update set
        owner_user_id = coalesce(shops.owner_user_id, excluded.owner_user_id)
      returning id
    `;
    shopId = inserted[0]?.id || shopId;
  } else if (ownerId) {
    await sql`
      update shops
      set owner_user_id = coalesce(owner_user_id, ${ownerId})
      where id = ${shopId}
    `;
  }
  if (ownerId) {
    await sql`
      insert into shop_members (shop_id, user_id, role)
      values (${shopId}, ${ownerId}, 'owner')
      on conflict (shop_id, user_id) do nothing
    `;
  }
  const accent = (input.accent || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(accent)) {
    try {
      await sql`
        update shops
        set neon_accent = ${accent}, ring_color = ${accent}
        where id = ${shopId}
      `;
    } catch (err) {
      console.error("[storefront] accent save failed", err instanceof Error ? err.message : err);
    }
  }
  await sql`
    insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps)
    values (${shopId}, ${plan}, ${status}, ${STANDARD_MONTHLY_CENTS}, ${gear.gear_guardian_bps})
    on conflict (shop_id) do update set
      plan = excluded.plan,
      status = excluded.status,
      price_cents = excluded.price_cents,
      gear_guardian_bps = excluded.gear_guardian_bps,
      updated_at = now()
  `;
  await Promise.all([
    syncCheckoutTenantToSupabase({
      slug,
      status,
      shopName,
      plan,
      niche,
      stripeCustomerId: input.stripeCustomerId,
      stripeSessionId: input.stripeSessionId,
    }),
    upsertStorefront(slug, shopName, status),
  ]);
  return { shopId, slug, status, ...gear };
}

export async function syncTenantSubscriptionStatus(slug: string, status: TenantBillingStatus) {
  const key = cleanSlug(slug);
  if (!key) return { slug: key, status, updated: false };
  try {
    const sql = await getSql();
    await sql`
      update shop_billing as billing
      set status = ${status}, updated_at = now()
      from shops
      where shops.id = billing.shop_id and shops.slug = ${key}
    `;
  } catch (err) {
    console.error("[axiom] billing status sync failed", err instanceof Error ? err.message : err);
  }
  await patchSupabaseTenant(key, status, titleFromSlug(key));
  return { slug: key, status, updated: true };
}

type CheckoutSnapshot = {
  id?: string;
  payment_status?: string;
  amount_total?: number;
  metadata?: Record<string, string>;
};

async function fetchCheckoutSession(sessionId: string): Promise<CheckoutSnapshot | null> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { authorization: `Bearer ${key}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as CheckoutSnapshot;
}

/**
 * Marks a paid territory checkout live and opens the payer's shop.
 * Stripe is re-read when a secret is configured; the signed webhook snapshot is the fallback.
 */
export async function settleTerritorySession(sessionId: string, snapshot?: CheckoutSnapshot) {
  if (!sessionId.startsWith("cs_")) throw new Error("Invalid session");
  const session = (await fetchCheckoutSession(sessionId)) ?? snapshot;
  if (!session) throw new Error("Stripe object was not found");
  const meta = session.metadata ?? {};
  if (meta.kind && meta.kind !== "territory") throw new Error("This payment is not a territory plan");
  const paymentStatus = session.payment_status || snapshot?.payment_status || "";
  if (paymentStatus && paymentStatus !== "paid" && paymentStatus !== "no_payment_required") {
    throw new Error("Payment is not complete");
  }
  const leadSlug = meta.lead_slug || meta.shop_slug || meta.slug || "";
  const planId = meta.plan_id || "trial";
  let already = false;
  try {
    const activation = await activateTerritory({
      leadSlug,
      planId,
      paymentRef: sessionId,
      checkoutId: meta.checkout_id || undefined,
      amountCents: Number(session.amount_total ?? snapshot?.amount_total) || undefined,
    });
    already = Boolean(activation.already);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/unknown business|unknown plan|already live/i.test(message)) throw err;
  }
  const { provisionTerritoryForPayer } = await import("./shop-server.server");
  const shop = await provisionTerritoryForPayer({ leadSlug, userId: meta.user_id ?? "" });
  return { already, shop, leadSlug };
}
