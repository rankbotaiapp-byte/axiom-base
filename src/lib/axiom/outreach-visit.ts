import { CATALOG_BY_ID, resolveCatalogNiche, type CatalogNiche } from "../../config/catalog.ts";
import type { BusinessBrandRecord } from "./business-brand.ts";
import { leadGlassCopy } from "./funnel-glass.ts";
import { parseLeadId, type FunnelSearch } from "./funnel.ts";

/** A custom outreach or preview link — not the public catalog homepage. */
export function isOutreachVisit(search: FunnelSearch): boolean {
  return Boolean(
    search.b ||
      search.lead_slug ||
      search.lead ||
      search.preview ||
      search.greet ||
      search.business ||
      search.biz,
  );
}

export type OutreachProspect = {
  name: string;
  owner: string;
  trade: string;
  niche: CatalogNiche;
  city: string;
  county: string;
  place: string;
  phone: string;
  email: string;
  leadSlug: string;
};

export function resolveOutreachProspect(
  search: FunnelSearch,
  row: BusinessBrandRecord | null,
): OutreachProspect {
  const glass = leadGlassCopy(row);
  const name = (glass.armed ? glass.businessName : search.business || search.biz || "").trim();
  const city = (glass.city || search.city || row?.city || "").trim();
  const county = (glass.county || search.county || row?.county || "").trim();
  const tradeHint = (row?.categoryLabel || row?.category || search.trade || glass.hint || "").trim();
  const niche = resolveCatalogNiche(row?.nicheSlug || row?.category || search.trade || "");
  const trade = tradeHint || CATALOG_BY_ID[niche].label;
  return {
    name: name || CATALOG_BY_ID[niche].defaultName,
    owner: (row?.contactName || "").trim() || name || "there",
    trade,
    niche,
    city,
    county,
    place: [city, county].filter(Boolean).join(" · "),
    phone: (row?.phone || search.phone || "").trim(),
    email: (row?.email || search.email || "").trim(),
    leadSlug: (row?.slug || search.b || search.lead_slug || "").trim(),
  };
}

/** Master-desk prospect preview: `/{leadSlug}` with live lookup query keys. */
export function prospectViewPath(lead: {
  leadSlug: string;
  leadId?: string;
  county?: string;
  city?: string;
  businessName?: string;
  trade?: string;
}): string {
  const slug = lead.leadSlug.trim().toLowerCase();
  const params = new URLSearchParams({
    preview: "true",
    greet: "1",
    b: slug,
    utm_source: "desk",
  });
  const leadId = parseLeadId(lead.leadId);
  if (leadId) params.set("lead", leadId);
  const county = (lead.county ?? "").trim();
  const city = (lead.city ?? "").trim();
  const business = (lead.businessName ?? "").trim();
  const trade = (lead.trade ?? "").trim();
  if (county) params.set("county", county);
  if (city) params.set("city", city);
  if (business) params.set("biz", business);
  if (trade) params.set("trade", trade);
  return `/${slug}?${params.toString()}`;
}

export function isProspectShopId(id: string): boolean {
  return id.startsWith("prospect_");
}
