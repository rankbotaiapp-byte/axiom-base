import { resolveStudioMatrixNiche, STUDIO_MATRIX, type StudioMatrixNiche } from "./studio-engine";

export type OutboundProfile = {
  slug: string;
  businessName: string;
  city: string;
  county: string;
  niche: StudioMatrixNiche;
  nicheLabel: string;
  phone: string;
  tagline: string;
  reviewScore: number | null;
  reviewCount: number | null;
  source: "lead" | "tenant" | "shop" | "draft";
};

export function firstQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 120);
}

export function titleFromSlug(slug: string): string {
  const words = slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return words.join(" ") || "Local shop";
}

export function draftOutboundProfile(input: {
  slug: string;
  lead?: string;
  name?: string;
  city?: string;
  county?: string;
  niche?: string;
  phone?: string;
  tagline?: string;
}): OutboundProfile {
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "preview";
  const niche = resolveStudioMatrixNiche(input.niche);
  const entry = STUDIO_MATRIX[niche];
  return {
    slug,
    businessName: input.name?.trim() || titleFromSlug(input.lead || slug),
    city: input.city?.trim() || "Your city",
    county: input.county?.trim() || "",
    niche,
    nicheLabel: entry.label,
    phone: input.phone?.trim() || "",
    tagline: input.tagline?.trim() || entry.motion,
    reviewScore: null,
    reviewCount: null,
    source: "draft",
  };
}
