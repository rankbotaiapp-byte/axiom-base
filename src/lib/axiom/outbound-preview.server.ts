import "server-only";

import { getSql } from "@/lib/db";
import { draftOutboundProfile, type OutboundProfile } from "./outbound-preview";
import { resolveStudioMatrixNiche, STUDIO_MATRIX } from "./studio-engine";

type LeadRow = {
  business_name?: string;
  trade_type?: string;
  trade_label?: string;
  city?: string;
  county?: string;
  contact_phone?: string;
  review_score?: number | string | null;
  review_count?: number | string | null;
  lead_slug?: string;
};

function asProfile(row: LeadRow, slug: string, source: OutboundProfile["source"]): OutboundProfile {
  const niche = resolveStudioMatrixNiche(row.trade_label || row.trade_type);
  const score = Number(row.review_score);
  const count = Number(row.review_count);
  return {
    ...draftOutboundProfile({
      slug: row.lead_slug || slug,
      name: row.business_name,
      city: row.city,
      county: row.county,
      niche,
      phone: row.contact_phone,
      tagline: STUDIO_MATRIX[niche].motion,
    }),
    niche,
    nicheLabel: row.trade_label?.trim() || STUDIO_MATRIX[niche].label,
    reviewScore: Number.isFinite(score) && score > 0 ? score : null,
    reviewCount: Number.isFinite(count) && count > 0 ? count : null,
    source,
  };
}

async function leadByKey(key: string): Promise<LeadRow | null> {
  const sql = await getSql();
  try {
    const rows = await sql<LeadRow>`
      select business_name, trade_type, trade_label, city, county, contact_phone, review_score, review_count, lead_slug
      from preloaded_leads
      where lead_slug = ${key} or id = ${key}
      limit 1
    `;
    return rows[0] ?? null;
  } catch {
    try {
      const rows = await sql<LeadRow>`
        select business_name, trade_type, city, county, lead_slug
        from preloaded_leads
        where lead_slug = ${key} or id = ${key}
        limit 1
      `;
      return rows[0] ?? null;
    } catch {
      return null;
    }
  }
}

async function shopBySlug(slug: string): Promise<OutboundProfile | null> {
  try {
    const sql = await getSql();
    const rows = await sql<{ name: string; niche: string; address: string; tagline: string }>`
      select name, niche, address, tagline from shops where slug = ${slug} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const city = row.address?.split(",").slice(-2, -1)[0]?.trim() || row.address || "";
    return {
      ...draftOutboundProfile({
        slug,
        name: row.name,
        city,
        niche: row.niche,
        tagline: row.tagline,
      }),
      source: "shop",
    };
  } catch {
    return null;
  }
}

async function tenantBySlug(slug: string): Promise<OutboundProfile | null> {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return null;
  try {
    const response = await fetch(
      `${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=slug,business_name,phone&limit=1`,
      { headers: { apikey: key, authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as { slug?: string; business_name?: string; phone?: string }[];
    const row = rows[0];
    if (!row?.business_name) return null;
    return {
      ...draftOutboundProfile({
        slug: row.slug || slug,
        name: row.business_name,
        phone: row.phone,
      }),
      source: "tenant",
    };
  } catch {
    return null;
  }
}

export async function resolveOutboundLead(input: {
  slug: string;
  lead?: string;
  name?: string;
  city?: string;
  county?: string;
  niche?: string;
}): Promise<OutboundProfile> {
  const slug = input.slug.trim().toLowerCase();
  const leadKey = (input.lead || "").trim();
  const keyed = leadKey ? await leadByKey(leadKey).catch(() => null) : null;
  const bySlug = keyed ? null : await leadByKey(slug).catch(() => null);
  const found = keyed || bySlug;
  const base = found
    ? asProfile(found, slug, "lead")
    : (await tenantBySlug(slug)) || (await shopBySlug(slug)) || draftOutboundProfile({ slug, lead: leadKey });

  return {
    ...base,
    businessName: input.name?.trim() || base.businessName,
    city: input.city?.trim() || base.city,
    county: input.county?.trim() || base.county,
    ...(input.niche
      ? {
          niche: resolveStudioMatrixNiche(input.niche),
          nicheLabel: STUDIO_MATRIX[resolveStudioMatrixNiche(input.niche)].label,
        }
      : {}),
  };
}
