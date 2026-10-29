import { resolveCatalogNiche, type CatalogNiche } from "../../config/catalog.ts";

export type FunnelShard = {
  id: string;
  title: string;
  line: string;
};

function clip(value: string, max = 48): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

const TRADE_LINE: Partial<Record<CatalogNiche, string>> = {
  landscaping: "Yard and tree work",
  contractor: "Home work",
  forestry: "Cord and drop",
  woodworking: "The mill",
  "tool-repair": "The bench",
  glasswork: "The session",
  auto: "The bay",
};

/** Campaign extras that sit next to the trade's own services. */
export function funnelOfferings(niche: string): string[] {
  const key = resolveCatalogNiche(niche);
  const extras = ["AI lead capture"];
  if (key === "landscaping" || key === "contractor" || key === "forestry") {
    extras.unshift("Defensible space");
  }
  if (key === "woodworking" || key === "tool-repair" || key === "glasswork") extras.push("Billing pipelines");
  else extras.push("Booking pipeline");
  return extras;
}

/** Fields glass needs from a `preloaded_leads` row. Query-string names do not count. */
export type LeadGlassRecord = {
  id: string;
  slug: string;
  businessName: string;
  city?: string;
  county?: string;
  category?: string;
  categoryLabel?: string;
};

/** True only when the brand lookup returned a real row with an id, slug, and name. */
export function isVerifiedLeadRecord(row: LeadGlassRecord | null | undefined): row is LeadGlassRecord {
  if (!row) return false;
  return Boolean(row.id.trim() && row.slug.trim() && row.businessName.trim());
}

export function funnelTradeLine(niche: string): string {
  return TRADE_LINE[resolveCatalogNiche(niche)] ?? "The book";
}

export function glassArmedForLead(row: LeadGlassRecord | null | undefined): boolean {
  return isVerifiedLeadRecord(row);
}

/** Verified lead copy for a demo storefront. Unverified rows stay on the niche template. */
export function leadGlassCopy(row: LeadGlassRecord | null | undefined): {
  armed: boolean;
  businessName: string;
  city: string;
  county: string;
  hint: string;
} {
  if (!isVerifiedLeadRecord(row)) {
    return { armed: false, businessName: "", city: "", county: "", hint: "" };
  }
  return {
    armed: true,
    businessName: row.businessName.trim(),
    city: (row.city ?? "").trim(),
    county: (row.county ?? "").trim(),
    hint: (row.categoryLabel || row.category || "").trim(),
  };
}

export function funnelShards(input: {
  businessName: string;
  city?: string;
  county?: string;
  niche: string;
}): FunnelShard[] {
  const niche = resolveCatalogNiche(input.niche);
  const shards: FunnelShard[] = [
    { id: "shop", title: clip(input.businessName || "This shop", 36), line: funnelTradeLine(niche) },
  ];
  const city = (input.city ?? "").trim();
  if (city) shards.push({ id: "city", title: clip(city), line: (input.county ?? "").trim() || "City" });
  for (const [index, title] of funnelOfferings(niche).entries()) {
    shards.push({ id: `offer-${index}`, title, line: funnelTradeLine(niche) });
  }
  return shards;
}
