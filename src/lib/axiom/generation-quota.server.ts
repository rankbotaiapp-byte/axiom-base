import "server-only";

import { getSql } from "@/lib/db";
import { slugFromStripeObject } from "./provision";

function supabaseAdmin(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key) return null;
  return { url, key };
}

function adminHeaders(key: string, prefer = "return=minimal"): HeadersInit {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    prefer,
  };
}

export type GenerationPlanKey = "trial_1" | "pro_150" | "founder_lifetime";
export type GenerationStripeStatus = "active" | "trialing" | "inactive" | "lifetime";

export function quotaStripeStatusForPlan(
  planKey: GenerationPlanKey,
  billingStatus: "active" | "trialing",
): GenerationStripeStatus {
  if (planKey === "founder_lifetime") return "lifetime";
  return billingStatus;
}

const PLAN_LIMITS: Record<GenerationPlanKey, number> = {
  trial_1: 15,
  pro_150: 250,
  founder_lifetime: 1000,
};

export function resolveGenerationPlanFromStripeMetadata(
  meta: Record<string, string | undefined>,
): { planKey: GenerationPlanKey; limit: number } | null {
  const billingTier = (meta.billing_tier || "").trim().toLowerCase();
  const planId = (meta.plan_id || meta.plan || "").trim().toLowerCase();

  if (billingTier === "founder_lifetime" || planId === "lifetime" || planId === "founder_lifetime") {
    return { planKey: "founder_lifetime", limit: PLAN_LIMITS.founder_lifetime };
  }
  if (
    billingTier === "standard_monthly" ||
    planId === "pro_150" ||
    planId === "pro" ||
    planId === "axiom_pro"
  ) {
    return { planKey: "pro_150", limit: PLAN_LIMITS.pro_150 };
  }
  if (billingTier === "name_your_price" || planId === "trial" || planId === "trial_1" || planId === "starter") {
    return { planKey: "trial_1", limit: PLAN_LIMITS.trial_1 };
  }
  return null;
}

/** Better Auth ids are `text`; reject empty and preview-only `dev-user`. */
export function parseGenerationUserId(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value || value === "dev-user" || value === "local-generation-bypass") return null;
  return value.slice(0, 120);
}

export function stripeUserIdFromMetadata(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta) return null;
  const direct = typeof meta.user_id === "string" ? meta.user_id : "";
  return parseGenerationUserId(direct);
}

export async function resolveStripeOwnerUserId(object: Record<string, unknown>): Promise<string | null> {
  const meta = (object.metadata && typeof object.metadata === "object" ? object.metadata : {}) as Record<
    string,
    unknown
  >;
  const fromMeta = stripeUserIdFromMetadata(meta);
  if (fromMeta) return fromMeta;

  const details = (object.subscription_details && typeof object.subscription_details === "object"
    ? object.subscription_details
    : {}) as Record<string, unknown>;
  const detailMeta = (details.metadata && typeof details.metadata === "object" ? details.metadata : {}) as Record<
    string,
    unknown
  >;
  const fromDetails = stripeUserIdFromMetadata(detailMeta);
  if (fromDetails) return fromDetails;

  const slug = slugFromStripeObject(object);
  if (!slug) return null;
  try {
    const sql = await getSql();
    const rows = await sql<{ owner_user_id: string | null }>`
      select owner_user_id from shops where slug = ${slug} limit 1
    `;
    const owner = rows[0]?.owner_user_id?.trim() || "";
    return parseGenerationUserId(owner);
  } catch {
    return null;
  }
}

export async function upsertTenantGenerationQuota(input: {
  userId: string;
  stripeStatus: GenerationStripeStatus;
  planKey: GenerationPlanKey;
  generationLimit: number;
  resetUsage?: boolean;
}): Promise<void> {
  const userId = parseGenerationUserId(input.userId);
  if (!userId) {
    console.warn("[generation-quota] skipped upsert — user id missing");
    return;
  }
  const supabase = supabaseAdmin();
  if (!supabase) {
    console.warn("[generation-quota] SUPABASE not configured; quota not persisted");
    return;
  }

  const body = {
    user_id: userId,
    stripe_status: input.stripeStatus,
    plan_tier: input.planKey,
    generation_limit: Math.max(0, Math.floor(input.generationLimit)),
    ...(input.resetUsage !== false ? { generations_used: 0 } : {}),
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(
    `${supabase.url}/rest/v1/tenant_generation_quotas?on_conflict=user_id`,
    {
      method: "POST",
      headers: adminHeaders(supabase.key, "resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[generation-quota] upsert failed", res.status, detail.slice(0, 240));
  }
}

export async function deactivateTenantGenerationQuota(userId: string): Promise<void> {
  const id = parseGenerationUserId(userId);
  if (!id) return;
  const supabase = supabaseAdmin();
  if (!supabase) return;

  const res = await fetch(`${supabase.url}/rest/v1/tenant_generation_quotas?user_id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: adminHeaders(supabase.key),
    body: JSON.stringify({
      stripe_status: "inactive",
      plan_tier: "none",
      generation_limit: 0,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[generation-quota] deactivate failed", res.status, detail.slice(0, 240));
  }
}

export async function consumeGenerationCreditRpc(userId: string): Promise<{
  ok: boolean;
  code?: "ACTIVE_TRIAL_REQUIRED" | "QUOTA_EXCEEDED";
  remaining?: number;
}> {
  const id = parseGenerationUserId(userId);
  if (!id) return { ok: false, code: "ACTIVE_TRIAL_REQUIRED" };
  const supabase = supabaseAdmin();
  if (!supabase) return { ok: false, code: "ACTIVE_TRIAL_REQUIRED" };

  const res = await fetch(`${supabase.url}/rest/v1/rpc/consume_generation_credit`, {
    method: "POST",
    headers: adminHeaders(supabase.key),
    body: JSON.stringify({ p_user_id: id }),
  });
  if (!res.ok) {
    console.error("[generation-quota] consume rpc http", res.status);
    return { ok: false, code: "ACTIVE_TRIAL_REQUIRED" };
  }
  const raw = await res.json().catch(() => null);
  const row = (Array.isArray(raw) ? raw[0] : raw) as
    | { allowed?: boolean; remaining?: number; reason?: string }
    | null;
  if (row?.allowed) {
    return {
      ok: true,
      remaining: typeof row.remaining === "number" ? Math.max(0, row.remaining) : undefined,
    };
  }
  const code = row?.reason === "QUOTA_EXCEEDED" ? "QUOTA_EXCEEDED" : "ACTIVE_TRIAL_REQUIRED";
  return { ok: false, code };
}

export async function refundGenerationCreditRpc(userId: string): Promise<void> {
  const id = parseGenerationUserId(userId);
  if (!id) return;
  const supabase = supabaseAdmin();
  if (!supabase) return;
  await fetch(`${supabase.url}/rest/v1/rpc/refund_generation_credit`, {
    method: "POST",
    headers: adminHeaders(supabase.key),
    body: JSON.stringify({ p_user_id: id }),
  }).catch(() => undefined);
}

type CheckoutSnapshot = {
  payment_status?: string;
  metadata?: Record<string, string>;
  customer?: string | { id?: string } | null;
};

async function fetchStripeCheckoutSession(sessionId: string): Promise<CheckoutSnapshot | null> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !sessionId.startsWith("cs_")) return null;
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { authorization: `Bearer ${key}` } },
  );
  if (!response.ok) return null;
  return (await response.json()) as CheckoutSnapshot;
}

function checkoutBillingStatus(object: CheckoutSnapshot): "active" | "trialing" {
  const paid = object.payment_status === "paid" || object.payment_status === "no_payment_required";
  return paid ? "active" : "trialing";
}

/** Grant quota after a guest-paid shop is claimed; replays Stripe session when available. */
export async function syncGenerationQuotaForClaimedShopOwner(userId: string, shopSlug: string): Promise<void> {
  const ownerId = parseGenerationUserId(userId);
  const slug = shopSlug.trim().toLowerCase();
  if (!ownerId || !slug) return;

  try {
    const sql = await getSql();
    const activations = await sql<{ payment_ref: string | null; plan_id: string | null }>`
      select payment_ref, plan_id
      from territory_activations
      where lead_slug = ${slug}
      order by created_at desc
      limit 1
    `;
    const sessionId = activations[0]?.payment_ref?.trim() || "";
    if (sessionId.startsWith("cs_")) {
      const session = await fetchStripeCheckoutSession(sessionId);
      const billing = session ? checkoutBillingStatus(session) : null;
      if (session && (billing === "active" || billing === "trialing")) {
        const meta = { ...(session.metadata ?? {}), user_id: ownerId };
        const plan = resolveGenerationPlanFromStripeMetadata(meta);
        if (plan) {
          await upsertTenantGenerationQuota({
            userId: ownerId,
            stripeStatus: quotaStripeStatusForPlan(plan.planKey, billing),
            planKey: plan.planKey,
            generationLimit: plan.limit,
            resetUsage: true,
          });
          return;
        }
      }
    }

    const billingRows = await sql<{ status: string | null; plan: string | null }>`
      select b.status, b.plan
      from shops s
      left join shop_billing b on b.shop_id = s.id
      where s.slug = ${slug}
      limit 1
    `;
    const row = billingRows[0];
    const shopBillingStatus: "active" | "trialing" =
      row?.status === "active" || row?.status === "trialing" ? row.status : "trialing";
    const planId = (row?.plan || "axiom_pro").toLowerCase();
    const fromPlan =
      planId.includes("lifetime")
        ? resolveGenerationPlanFromStripeMetadata({ plan_id: "lifetime", billing_tier: "founder_lifetime" })
        : planId.includes("pro")
          ? resolveGenerationPlanFromStripeMetadata({ plan_id: "pro", billing_tier: "standard_monthly" })
          : resolveGenerationPlanFromStripeMetadata({ plan_id: "trial", billing_tier: "name_your_price" });
    if (!fromPlan) return;
    await upsertTenantGenerationQuota({
      userId: ownerId,
      stripeStatus: quotaStripeStatusForPlan(fromPlan.planKey, shopBillingStatus),
      planKey: fromPlan.planKey,
      generationLimit: fromPlan.limit,
      resetUsage: true,
    });
  } catch (err) {
    console.error(
      "[generation-quota] claim sync failed",
      err instanceof Error ? err.message.slice(0, 200) : err,
    );
  }
}

export async function syncGenerationQuotaFromCheckoutSession(
  object: Record<string, unknown>,
  billingStatus: "active" | "trialing",
): Promise<void> {
  const metaRaw = (object.metadata && typeof object.metadata === "object" ? object.metadata : {}) as Record<
    string,
    string
  >;
  const plan = resolveGenerationPlanFromStripeMetadata(metaRaw);
  const userId = await resolveStripeOwnerUserId(object);
  if (!plan || !userId) return;

  await upsertTenantGenerationQuota({
    userId,
    stripeStatus: quotaStripeStatusForPlan(plan.planKey, billingStatus),
    planKey: plan.planKey,
    generationLimit: plan.limit,
    resetUsage: true,
  });
}