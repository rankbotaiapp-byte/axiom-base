import { deskPreviewPath, isLeadSlug } from "./funnel.ts";
import { sanitizeAccent, sanitizeContactLine, sanitizeLogoUrl } from "./prospect-brand.ts";

/** Default page for a business list. Never raise this without a matching cap. */
export const BUSINESS_PAGE_DEFAULT = 50;

/** Hard cap for a page or an id batch. */
export const BUSINESS_PAGE_CAP = 100;

const BUSINESS_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const SLUG_PREFIX = /^[a-z0-9]+(?:-[a-z0-9]+)*-?$/;

/**
 * Fields the niche template can paint. Logo and accent stay null when the
 * business row has no such column. Accent is six-digit hex or null.
 */
export type BusinessBrandRecord = {
  id: string;
  slug: string;
  businessName: string;
  category: string;
  categoryLabel: string;
  city: string;
  county: string;
  nicheSlug: string;
  location: string;
  phone: string;
  email: string;
  contactName: string;
  logoUrl: string | null;
  accent: string | null;
};

/** Props the demo template already accepts. Accent is hex or null — never raw CSS. */
export type TemplateBrandProps = {
  businessName: string;
  logoUrl: string;
  accent: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  category: string;
  categoryLabel: string;
  city: string;
  county: string;
  location: string;
};

export type BusinessRef = { id: string } | { slug: string };

export type PageOrder = "id" | "slug";

export type PageCursor = { kind: PageOrder; value: string };

/** Hex only. Anything else, including CSS, is dropped. */
export function normalizeAccent(value: unknown): string | null {
  const hex = sanitizeAccent(value);
  return hex || null;
}

export function parseBusinessId(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!BUSINESS_ID.test(raw)) return "";
  return raw;
}

export function clampPageLimit(value: unknown): number {
  if (value == null || value === "") return BUSINESS_PAGE_DEFAULT;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return BUSINESS_PAGE_DEFAULT;
  const whole = Math.floor(n);
  if (whole < 1) return 1;
  if (whole > BUSINESS_PAGE_CAP) return BUSINESS_PAGE_CAP;
  return whole;
}

/** Left-anchored slug range so a btree on lead_slug can serve the search. */
export function slugPrefixBounds(prefix: string): { start: string; end: string } | null {
  const raw = prefix.trim().toLowerCase();
  if (!raw || raw.length > 64 || !SLUG_PREFIX.test(raw)) return null;
  const last = raw.charCodeAt(raw.length - 1);
  const end = `${raw.slice(0, -1)}${String.fromCharCode(last + 1)}`;
  return { start: raw, end };
}

export function encodePageCursor(kind: PageOrder, value: string): string {
  return `${kind}:${value}`;
}

/** Null when the cursor is for a different order or is not a safe key. */
export function decodePageCursor(value: unknown, kind: PageOrder): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const split = raw.indexOf(":");
  if (split < 1) return null;
  const cursorKind = raw.slice(0, split);
  const key = raw.slice(split + 1);
  if (cursorKind !== kind) return null;
  if (kind === "id") return parseBusinessId(key) || null;
  return isLeadSlug(key) ? key : null;
}

export function parseBusinessRef(input: unknown): BusinessRef {
  if (typeof input === "string") {
    const slug = input.trim().toLowerCase();
    if (!isLeadSlug(slug)) throw new Error("Unknown business");
    return { slug };
  }
  const source = input && typeof input === "object" ? (input as { id?: unknown; slug?: unknown }) : {};
  const id = parseBusinessId(source.id);
  const slugRaw = String(source.slug ?? "").trim().toLowerCase();
  const slug = slugRaw && isLeadSlug(slugRaw) ? slugRaw : "";
  if (slugRaw && !slug) throw new Error("Unknown business");
  if (id && slug) throw new Error("Pass a business id or a slug");
  if (id) return { id };
  if (slug) return { slug };
  throw new Error("Pass a business id or a slug");
}

export function parseKeyList(value: unknown, kind: "id" | "slug"): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(kind === "id" ? "Batch must be a list of ids" : "Batch must be a list of slugs");
  if (value.length > BUSINESS_PAGE_CAP) throw new Error(`Batch is capped at ${BUSINESS_PAGE_CAP}`);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const raw = String(item ?? "").trim();
    if (!raw) continue;
    const key = kind === "slug" ? raw.toLowerCase() : parseBusinessId(raw);
    if (!key || (kind === "slug" && !isLeadSlug(key))) throw new Error("Unknown business");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function mapBusinessToTemplateBrand(record: BusinessBrandRecord): TemplateBrandProps {
  const city = sanitizeContactLine(record.city, 80);
  const county = sanitizeContactLine(record.county, 80);
  const category = sanitizeContactLine(record.category, 80);
  const categoryLabel = sanitizeContactLine(record.categoryLabel, 80) || category;
  return {
    businessName: sanitizeContactLine(record.businessName, 80),
    logoUrl: sanitizeLogoUrl(record.logoUrl),
    accent: normalizeAccent(record.accent),
    contactName: sanitizeContactLine(record.contactName, 80),
    contactPhone: sanitizeContactLine(record.phone, 40),
    contactEmail: sanitizeContactLine(record.email, 120),
    category,
    categoryLabel,
    city,
    county,
    location: [city, county].filter(Boolean).join(" · "),
  };
}

/** Absolute preview URL. Matches deskPreviewPath: `/?b=<slug>&utm_source=desk`. */
export function previewUrlForBusiness(
  origin: string,
  record: Pick<BusinessBrandRecord, "slug" | "county" | "city" | "businessName" | "categoryLabel" | "category">,
): string {
  const path = deskPreviewPath({
    leadSlug: record.slug,
    leadId: record.id,
    county: record.county,
    city: record.city,
    businessName: record.businessName,
    trade: record.categoryLabel || record.category,
  });
  const base = origin.trim().replace(/\/$/, "") || "http://localhost";
  return new URL(path, `${base}/`).toString();
}

export function pageWindow<T extends { id: string; slug: string }>(
  rows: T[],
  limit: number,
  order: PageOrder,
): { rows: T[]; nextCursor: string | null } {
  const capped = clampPageLimit(limit);
  const page = rows.slice(0, capped);
  const last = page[page.length - 1];
  const nextCursor = rows.length > capped && last ? encodePageCursor(order, order === "id" ? last.id : last.slug) : null;
  return { rows: page, nextCursor };
}
