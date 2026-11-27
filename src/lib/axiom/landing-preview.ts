import { isPlumbingCampaign } from "./plumber-outreach.ts";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEAD_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;

function parseLeadId(value: unknown): string {
  const raw = String(value ?? "").trim();
  return LEAD_ID.test(raw) ? raw : "";
}

function isLeadSlug(value: string): boolean {
  return SLUG.test(value);
}

/** Neutral trust chips when a named plumber is not license-verified. */
export const LANDING_NEUTRAL_BADGE = "Fast Local Dispatch · Upfront Pricing";
export const LANDING_NEUTRAL_TRUST = ["Fast Local Dispatch", "Upfront Pricing"] as const;
export const LANDING_VERIFIED_TRUST = ["Licensed & insured", "24/7 live dispatch"] as const;

export type LandingPreviewInput = {
  leadId?: string;
  leadSlug?: string;
  businessName?: string;
  phone?: string;
  city?: string;
  email?: string;
  trade?: string;
};

/** Personalized plumber storefront on the production landing carousel. */
export function landingPreviewPath(lead: LandingPreviewInput): string {
  const params = new URLSearchParams();
  const leadId = parseLeadId(lead.leadId);
  if (leadId) params.set("lead_id", leadId);
  const business = (lead.businessName ?? "").trim().slice(0, 80);
  const slug = (lead.leadSlug ?? "").trim().slice(0, 64);
  if (business) params.set("b", business);
  else if (slug) params.set("b", slug);
  const phone = (lead.phone ?? "").trim().slice(0, 40);
  if (phone) params.set("phone", phone);
  const city = (lead.city ?? "").trim().slice(0, 80);
  if (city) params.set("city", city);
  const email = (lead.email ?? "").trim().slice(0, 120);
  if (email) params.set("email", email);
  params.set("trade", "plumbing");
  return `/?${params.toString()}`;
}

export function landingPreviewUrl(origin: string, lead: LandingPreviewInput): string {
  const base = origin.replace(/\/$/, "") || "http://localhost";
  return new URL(landingPreviewPath(lead), `${base}/`).toString();
}

export function shouldUseLandingPreview(trade?: string | null): boolean {
  return isPlumbingCampaign(trade);
}

export function plumbingTrustLabels(licenseVerified: boolean): readonly string[] {
  return licenseVerified ? LANDING_VERIFIED_TRUST : LANDING_NEUTRAL_TRUST;
}

export function plumbingHeroBadge(licenseVerified: boolean): string {
  return licenseVerified ? "24/7 Emergency · Instant dispatch" : LANDING_NEUTRAL_BADGE;
}

export function parseLandingLeadQuery(source: Record<string, unknown>): {
  leadId: string;
  slug: string;
} {
  const leadId = parseLeadId(source.lead_id) || parseLeadId(source.lead) || parseLeadId(source.id);
  const slugRaw = String(source.slug ?? "").trim().toLowerCase();
  const slug = isLeadSlug(slugRaw) ? slugRaw : "";
  return { leadId, slug };
}
