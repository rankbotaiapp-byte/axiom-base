import { randomBytes } from "node:crypto";
import { resolveCatalogNiche } from "@/config/catalog";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { validateForPublish } from "@/lib/schemas/publishGate";
import { TenantStorefrontSchema, type TenantStorefrontConfig } from "@/lib/schemas/tenant";
import {
  cleanShopSlug,
  deskPhase,
  hydrateLeadStorefront,
  isUuid,
  type UnlockPhase,
} from "./hydrate-storefront";
import {
  evaluatePublishGate,
  type PlanStatus,
  type PublishDecision,
  type PublishStatus,
  type TenantPublishState,
  type UnlockStatus,
} from "./publish-gate";

export type UnlockSettlement = {
  already: boolean;
  shopSlug: string;
  shopId: string;
  tenantId: string | null;
  phase: UnlockPhase;
};

export type StorefrontDesk = {
  slug: string;
  shopId: string;
  businessName: string;
  niche: string;
  ownerUserId: string;
  config: TenantStorefrontConfig | null;
  unlockStatus: UnlockStatus;
  publishStatus: PublishStatus;
  planStatus: PlanStatus;
  stripeSubscriptionId: string | null;
  phase: UnlockPhase;
  decision: PublishDecision;
};

type DeskRow = {
  shop_id: string;
  name: string | null;
  niche: string | null;
  owner_user_id: string | null;
  config: unknown;
  unlock_status: string | null;
  publish_status: string | null;
  plan_status: string | null;
  billing_status: string | null;
  billing_plan: string | null;
  claim_status: string | null;
  tenant_id: string | null;
  stripe_subscription_id: string | null;
};

const PLAN_STATUSES = new Set<PlanStatus>(["none", "trialing", "active", "past_due", "canceled"]);

function toPlanStatus(row: Pick<DeskRow, "plan_status" | "billing_status" | "billing_plan">): PlanStatus {
  const stored = (row.plan_status || "").toLowerCase();
  if (PLAN_STATUSES.has(stored as PlanStatus)) return stored as PlanStatus;
  if (stored === "lifetime") return "active";
  const billing = (row.billing_status || "").toLowerCase();
  if (billing === "active" || billing === "trialing" || billing === "past_due" || billing === "canceled") return billing;
  if ((row.billing_plan || "").toLowerCase() === "lifetime") return "active";
  return "none";
}

function localAuthBypass(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.AXIOM_LOCAL_AUTH === "true";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function asConfig(value: unknown): TenantStorefrontConfig | null {
  const parsed = TenantStorefrontSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function readDesk(slug: string): Promise<DeskRow | null> {
  const key = cleanShopSlug(slug);
  if (!key) return null;
  const sql = await getSql();
  const rows = await sql<DeskRow>`
    select
      s.id as shop_id,
      s.name,
      s.niche,
      s.owner_user_id,
      c.config,
      t.unlock_status,
      t.publish_status,
      t.plan_status,
      t.id::text as tenant_id,
      b.status as billing_status,
      b.plan as billing_plan,
      t.stripe_subscription_id,
      cus.status as claim_status
    from shops s
    left join storefront_configs c on c.slug = s.slug
    left join shop_billing b on b.shop_id = s.id
    left join tenants t on t.shop_id = s.id
    left join lateral (
      select status
      from claim_unlock_sessions
      where shop_slug = s.slug
      order by unlocked_at desc nulls last, created_at desc
      limit 1
    ) cus on true
    where s.slug = ${key}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function readStorefrontDesk(slug: string): Promise<StorefrontDesk | null> {
  const key = cleanShopSlug(slug);
  if (!key) return null;
  try {
    const row = await readDesk(key);
    if (!row) return null;
    const unlockStatus: UnlockStatus = row.unlock_status === "unlocked" || row.claim_status === "unlocked" ? "unlocked" : "locked";
    const publishStatus: PublishStatus = row.publish_status === "published" ? "published" : "draft";
    const state: TenantPublishState = {
      unlockStatus,
      publishStatus,
      planStatus: toPlanStatus(row),
      stripeSubscriptionId: row.stripe_subscription_id,
    };
    return {
      slug: key,
      shopId: row.shop_id,
      businessName: row.name?.trim() || key,
      niche: row.niche?.trim() || "contractor",
      ownerUserId: row.owner_user_id?.trim() || "",
      config: asConfig(row.config),
      unlockStatus,
      publishStatus,
      planStatus: state.planStatus,
      stripeSubscriptionId: row.stripe_subscription_id,
      phase: deskPhase({ unlockStatus, publishStatus }),
      decision: evaluatePublishGate(state),
    };
  } catch (err) {
    console.error("[storefront-unlock] desk read failed", err instanceof Error ? err.message.slice(0, 200) : err);
    return null;
  }
}

export async function assertStorefrontOwner(slug: string, request: Request): Promise<StorefrontDesk> {
  return assertOwner(slug, request);
}

async function assertOwner(slug: string, request: Request): Promise<StorefrontDesk> {
  const desk = await readStorefrontDesk(slug);
  if (!desk) {
    const error = new Error("Unknown shop");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
  if (localAuthBypass()) return desk;
  const user = await getSessionUser(undefined, request.headers);
  if (!user || user.id === "dev-user") {
    const error = new Error("Sign in to edit this shop.");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
  if (!desk.ownerUserId || desk.ownerUserId !== user.id) {
    const error = new Error("This desk belongs to another shop.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
  return desk;
}

export function httpStatus(err: unknown): number {
  if (err && typeof err === "object" && "status" in err && typeof err.status === "number") return err.status;
  return 500;
}

async function patchSupabaseTenant(slug: string, body: Record<string, unknown>): Promise<void> {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key || !slug) return;
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    prefer: "return=minimal",
  };
  await fetch(`${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error("[storefront-unlock] supabase patch failed", err instanceof Error ? err.message.slice(0, 160) : err);
  });
}

export async function settleStorefrontUnlock(input: {
  sessionId: string;
  paymentIntentId: string;
  leadId: string;
  slug: string;
  niche: string;
  businessName: string;
  userId: string;
  phone?: string;
  email?: string;
  city?: string;
}): Promise<UnlockSettlement> {
  const slug = cleanShopSlug(input.slug);
  if (!slug || !input.sessionId.startsWith("cs_")) throw new Error("Invalid unlock session");
  const sql = await getSql();
  const existing = await sql<{ status: string }>`
    select status from claim_unlock_sessions where stripe_checkout_session_id = ${input.sessionId} limit 1
  `;
  if (existing[0]?.status === "unlocked") {
    const desk = await readDesk(slug);
    const phone = (input.phone || "").trim();
    if (desk?.shop_id && phone) {
      await sql`
        update shops
        set owner_phone = coalesce(nullif(btrim(owner_phone), ''), ${phone}),
            notify_phone = coalesce(nullif(btrim(notify_phone), ''), ${phone}),
            notification_phone = coalesce(nullif(btrim(notification_phone), ''), ${phone})
        where id = ${desk.shop_id}
      `.catch(() => undefined);
    }
    return {
      already: true,
      shopSlug: slug,
      shopId: desk?.shop_id || "",
      tenantId: desk?.tenant_id || null,
      phase: "draft",
    };
  }

  const businessName = input.businessName.replace(/\s+/g, " ").trim().slice(0, 80) || slug;
  const niche = resolveCatalogNiche(input.niche);
  const leadId = (input.leadId || slug).trim().slice(0, 80);
  const ownerId = input.userId.trim();
  const found = await sql<{ id: string }>`select id from shops where slug = ${slug} limit 1`;
  let shopId = found[0]?.id ?? "";
  const ownerPhone = (input.phone || "").trim();
  if (!shopId) {
    shopId = `shop_${randomBytes(8).toString("hex")}`;
    const inserted = await sql<{ id: string }>`
      insert into shops (id, slug, name, niche, owner_user_id, owner_phone, notify_phone, notification_phone)
      values (${shopId}, ${slug}, ${businessName}, ${niche}, ${ownerId || null}, ${ownerPhone}, ${ownerPhone}, ${ownerPhone})
      on conflict (slug) do update set
        name = excluded.name,
        owner_user_id = coalesce(shops.owner_user_id, excluded.owner_user_id),
        owner_phone = coalesce(nullif(btrim(shops.owner_phone), ''), excluded.owner_phone),
        notify_phone = coalesce(nullif(btrim(shops.notify_phone), ''), excluded.notify_phone),
        notification_phone = coalesce(nullif(btrim(shops.notification_phone), ''), excluded.notification_phone)
      returning id
    `.catch(() =>
      sql<{ id: string }>`
        insert into shops (id, slug, name, niche, owner_user_id)
        values (${shopId}, ${slug}, ${businessName}, ${niche}, ${ownerId || null})
        on conflict (slug) do update set
          name = excluded.name,
          owner_user_id = coalesce(shops.owner_user_id, excluded.owner_user_id)
        returning id
      `,
    );
    shopId = inserted[0]?.id || shopId;
  } else {
    await sql`
      update shops
      set owner_user_id = coalesce(owner_user_id, ${ownerId || null}),
          name = case when name = '' then ${businessName} else name end,
          owner_phone = coalesce(nullif(btrim(owner_phone), ''), ${ownerPhone}),
          notify_phone = coalesce(nullif(btrim(notify_phone), ''), ${ownerPhone}),
          notification_phone = coalesce(nullif(btrim(notification_phone), ''), ${ownerPhone})
      where id = ${shopId}
    `.catch(() => undefined);
  }
  if (ownerId) {
    await sql`
      insert into shop_members (shop_id, user_id, role)
      values (${shopId}, ${ownerId}, 'owner')
      on conflict (shop_id, user_id) do nothing
    `;
  }
  await sql`
    insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps)
    values (${shopId}, 'unlock', 'unlocked', 100, 150)
    on conflict (shop_id) do update set
      plan = case when shop_billing.status in ('active', 'trialing') then shop_billing.plan else 'unlock' end,
      status = case when shop_billing.status in ('active', 'trialing') then shop_billing.status else 'unlocked' end,
      price_cents = case when shop_billing.status in ('active', 'trialing') then shop_billing.price_cents else 100 end,
      updated_at = now()
  `;
  try {
    const { seedTradePriceBook } = await import("./price-book.server");
    await seedTradePriceBook(shopId, niche);
  } catch (err) {
    console.error("[storefront-unlock] price book seed failed", err instanceof Error ? err.message : err);
  }

  const config = hydrateLeadStorefront({
    slug,
    businessName,
    niche,
    phone: input.phone,
    email: input.email,
    city: input.city,
    leadId,
  });
  const saved = JSON.stringify(config);
  await sql`
    insert into storefront_configs (slug, config, updated_at)
    values (${slug}, ${saved}::jsonb, now())
    on conflict (slug) do update set
      config = case
        when storefront_configs.config = '{}'::jsonb then excluded.config
        else storefront_configs.config
      end,
      updated_at = now()
  `;

  let tenantId: string | null = null;
  if (isUuid(ownerId)) {
    const email = (input.email || "").trim().slice(0, 120);
    const rows = await sql<{ id: string }>`
      insert into tenants (
        user_id, email, shop_id, owner_user_id,
        unlock_status, unlocked_at, unlock_payment_intent_id,
        publish_status, plan_status, source_lead_id
      )
      values (
        ${ownerId}::uuid,
        ${email},
        ${shopId},
        ${ownerId}::uuid,
        'unlocked',
        now(),
        ${input.paymentIntentId || null},
        'draft',
        'none',
        ${leadId}
      )
      on conflict (user_id) do update set
        shop_id = case
          when tenants.publish_status = 'published' then tenants.shop_id
          else excluded.shop_id
        end,
        owner_user_id = coalesce(tenants.owner_user_id, excluded.owner_user_id),
        unlock_status = 'unlocked',
        unlocked_at = coalesce(tenants.unlocked_at, now()),
        unlock_payment_intent_id = coalesce(tenants.unlock_payment_intent_id, excluded.unlock_payment_intent_id),
        publish_status = case when tenants.publish_status = 'published' then 'published' else 'draft' end,
        plan_status = case
          when tenants.plan_status in ('active', 'trialing', 'lifetime') then tenants.plan_status
          else 'none'
        end,
        source_lead_id = coalesce(tenants.source_lead_id, excluded.source_lead_id)
      returning id::text
    `;
    tenantId = rows[0]?.id ?? null;
  }

  await sql`
    insert into claim_unlock_sessions (
      lead_id, shop_slug, niche_key, stripe_checkout_session_id,
      stripe_payment_intent_id, amount_cents, status, tenant_id, unlocked_at
    )
    values (
      ${leadId},
      ${slug},
      ${niche},
      ${input.sessionId},
      ${input.paymentIntentId || null},
      100,
      'unlocked',
      ${tenantId}::uuid,
      now()
    )
    on conflict (stripe_checkout_session_id) do update set
      status = 'unlocked',
      tenant_id = coalesce(claim_unlock_sessions.tenant_id, excluded.tenant_id),
      stripe_payment_intent_id = coalesce(claim_unlock_sessions.stripe_payment_intent_id, excluded.stripe_payment_intent_id),
      unlocked_at = coalesce(claim_unlock_sessions.unlocked_at, now())
  `;

  await patchSupabaseTenant(slug, {
    unlock_status: "unlocked",
    unlocked_at: new Date().toISOString(),
    unlock_payment_intent_id: input.paymentIntentId || undefined,
    publish_status: "draft",
    plan_status: "none",
    source_lead_id: leadId,
    business_name: businessName,
  });

  return { already: false, shopSlug: slug, shopId, tenantId, phase: "draft" };
}

export async function notePlanAndPublish(input: {
  slug: string;
  planStatus: "active" | "trialing";
  stripeSubscriptionId?: string;
}): Promise<void> {
  const slug = cleanShopSlug(input.slug);
  if (!slug) return;
  const sql = await getSql();
  const sub = (input.stripeSubscriptionId || "").trim();
  await sql`
    update tenants
    set plan_status = ${input.planStatus},
        publish_status = 'published',
        stripe_subscription_id = coalesce(${sub || null}, stripe_subscription_id)
    from shops
    where tenants.shop_id = shops.id and shops.slug = ${slug}
  `;
  const shop = await sql<{ id: string }>`select id from shops where slug = ${slug} limit 1`;
  if (shop[0]) {
    await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${`publish_${slug}`.slice(0, 80)}, ${shop[0].id}, 'storefront_published', ${JSON.stringify({ planStatus: input.planStatus })})
      on conflict (id) do update set payload = excluded.payload
    `;
  }
  await patchSupabaseTenant(slug, {
    plan_status: input.planStatus,
    publish_status: "published",
    stripe_subscription_id: sub || undefined,
    status: "active",
  });
}

export async function saveStorefrontDraft(request: Request, slug: string, raw: unknown): Promise<TenantStorefrontConfig> {
  const desk = await assertOwner(slug, request);
  if (desk.decision.requiresUnlockFirst) {
    const error = new Error("Unlock the page before editing.");
    (error as Error & { status: number }).status = 402;
    throw error;
  }
  const record = asRecord(raw);
  const tenantId = typeof record.tenantId === "string" && record.tenantId.trim() ? record.tenantId : `tenant_${desk.slug}`;
  const parsed = TenantStorefrontSchema.safeParse({ ...record, slug: desk.slug, tenantId });
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message || "Storefront config is invalid.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const sql = await getSql();
  await sql`
    insert into storefront_configs (slug, config, updated_at)
    values (${desk.slug}, ${JSON.stringify(parsed.data)}::jsonb, now())
    on conflict (slug) do update set config = excluded.config, updated_at = now()
  `;
  return parsed.data;
}

export async function publishStorefront(
  request: Request,
  slug: string,
): Promise<{ published: true } | { published: false; decision: PublishDecision }> {
  const desk = await assertOwner(slug, request);
  const decision = evaluatePublishGate({
    unlockStatus: desk.unlockStatus,
    publishStatus: desk.publishStatus,
    planStatus: desk.planStatus,
    stripeSubscriptionId: desk.stripeSubscriptionId,
  });
  if (!decision.canPublishImmediately) return { published: false, decision };
  const gate = validateForPublish(desk.config);
  if (!gate.ok) {
    const error = new Error(gate.issues[0] || "This page is not ready to publish.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  await notePlanAndPublish({
    slug: desk.slug,
    planStatus: desk.planStatus === "trialing" ? "trialing" : "active",
    stripeSubscriptionId: desk.stripeSubscriptionId ?? undefined,
  });
  return { published: true };
}

export async function readGoogleReviewUrl(slug: string): Promise<string> {
  const key = cleanShopSlug(slug);
  if (!key) return "";
  const sql = await getSql();
  const rows = await sql<{ google_review_url: string | null }>`
    select google_review_url from shops where slug = ${key} limit 1
  `.catch(() => [] as { google_review_url: string | null }[]);
  return (rows[0]?.google_review_url || "").trim();
}

export async function saveGoogleReviewUrl(request: Request, slug: string, raw: unknown): Promise<{ url: string }> {
  const desk = await assertOwner(slug, request);
  const { sanitizeGoogleReviewUrl } = await import("./google-review-request");
  const url = sanitizeGoogleReviewUrl(String(raw ?? ""));
  if (String(raw ?? "").trim() && !url) {
    const error = new Error("Use an https Google review or Maps link.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const sql = await getSql();
  await sql`
    update shops set google_review_url = ${url} where slug = ${desk.slug}
  `;
  return { url };
}
