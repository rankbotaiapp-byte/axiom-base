import "server-only";

import { getSql } from "@/lib/db";
import { STUDIO_TRIAL_PROMPT, StudioTrialRequiredError, TRIAL_CREDIT_POOL, TRIAL_DAYS } from "./studio-credits";

export type StudioAccess = {
  slug: string;
  isActive: boolean;
  credits: number;
};

function cleanSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function supabaseAdmin(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key) return null;
  return { url, key };
}

export async function readStudioAccess(slug: string): Promise<StudioAccess> {
  const key = cleanSlug(slug);
  const empty = { slug: key, isActive: false, credits: 0 };
  if (!key) return empty;
  try {
    const sql = await getSql();
    const rows = await sql<{ is_active: boolean; credits: number }>`
      select is_active, credits from studio_trial_credits where slug = ${key} limit 1
    `;
    const row = rows[0];
    if (!row) return empty;
    return { slug: key, isActive: Boolean(row.is_active), credits: Math.max(0, Number(row.credits) || 0) };
  } catch {
    return empty;
  }
}

export async function assertStudioGeneration(slug: string, units: number): Promise<void> {
  const need = Math.max(1, Math.floor(units));
  const access = await readStudioAccess(slug);
  if (!access.isActive || access.credits < need) throw new StudioTrialRequiredError(STUDIO_TRIAL_PROMPT);
}

export async function spendStudioCredits(slug: string, units: number): Promise<void> {
  const need = Math.max(1, Math.floor(units));
  const key = cleanSlug(slug);
  const sql = await getSql();
  const rows = await sql<{ credits: number }>`
    update studio_trial_credits
    set credits = credits - ${need}, updated_at = now()
    where slug = ${key} and is_active = true and credits >= ${need}
    returning credits
  `;
  if (!rows[0]) throw new StudioTrialRequiredError(STUDIO_TRIAL_PROMPT);
}

/** First qualifying Stripe event turns the tenant on and grants the pool once. */
export async function grantTrialStudioAccess(input: {
  slug: string;
  eventId: string;
  customerId?: string;
}): Promise<StudioAccess> {
  const slug = cleanSlug(input.slug);
  const eventId = input.eventId.trim().slice(0, 120);
  if (!slug || !eventId) throw new Error("Missing tenant slug");
  const sql = await getSql();
  const inserted = await sql<{ event_id: string }>`
    insert into studio_trial_events (event_id, slug)
    values (${eventId}, ${slug})
    on conflict (event_id) do nothing
    returning event_id
  `;
  if (!inserted[0]) return readStudioAccess(slug);
  const customer = (input.customerId || "").slice(0, 120);
  await sql`
    insert into studio_trial_credits (slug, is_active, credits, trial_ends_at, stripe_customer_id, granted_event_id, updated_at)
    values (
      ${slug},
      true,
      ${TRIAL_CREDIT_POOL},
      now() + make_interval(days => ${TRIAL_DAYS}),
      ${customer},
      ${eventId},
      now()
    )
    on conflict (slug) do update
    set is_active = true,
        credits = case
          when studio_trial_credits.granted_event_id = '' then ${TRIAL_CREDIT_POOL}
          else studio_trial_credits.credits
        end,
        granted_event_id = case
          when studio_trial_credits.granted_event_id = '' then ${eventId}
          else studio_trial_credits.granted_event_id
        end,
        stripe_customer_id = case
          when ${customer} <> '' then ${customer}
          else studio_trial_credits.stripe_customer_id
        end,
        trial_ends_at = coalesce(studio_trial_credits.trial_ends_at, now() + make_interval(days => ${TRIAL_DAYS})),
        updated_at = now()
  `;
  const access = await readStudioAccess(slug);
  await markSupabaseTenantActive(slug, access.credits);
  return access;
}

async function markSupabaseTenantActive(slug: string, credits: number) {
  const supabase = supabaseAdmin();
  if (!supabase) return;
  const headers = {
    apikey: supabase.key,
    authorization: `Bearer ${supabase.key}`,
    "content-type": "application/json",
    prefer: "return=minimal",
  };
  const full = await fetch(`${supabase.url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      status: "active",
      is_active: true,
      ai_credits: credits,
      activated_at: new Date().toISOString(),
    }),
  });
  if (full.ok) return;
  await fetch(`${supabase.url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "active", activated_at: new Date().toISOString() }),
  });
}
