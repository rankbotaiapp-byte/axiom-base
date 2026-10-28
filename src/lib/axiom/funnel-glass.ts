import { isShopNiche, type ShopNiche } from "./types.ts";

export type FunnelShard = {
  id: string;
  title: string;
  line: string;
};

function clip(value: string, max = 48): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

const TRADE_LINE: Partial<Record<ShopNiche, string>> = {
  landscaper: "Yard and tree work",
  contractor: "Home work",
  firewood: "Cord and drop",
  counsel: "The books",
  practice: "The visit",
  studio: "The build",
  photo: "The session",
  field: "The bay",
};

/** Campaign extras that sit next to the trade's own services. */
export function funnelOfferings(niche: ShopNiche): string[] {
  const extras = ["AI lead capture"];
  if (niche === "landscaper" || niche === "contractor" || niche === "firewood") {
    extras.unshift("Defensible space");
  }
  if (niche === "counsel" || niche === "practice" || niche === "studio") extras.push("Billing pipelines");
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

/** Glass stays off for missing, junk, or unmatched `?lead=` values. */
export function glassArmedForLead(row: LeadGlassRecord | null | undefined): boolean {
  return isVerifiedLeadRecord(row);
}

/** Overlay copy comes from the verified row, or stays blank on the public template. */
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
    businessName: row.businessName,
    city: (row.city ?? "").trim(),
    county: (row.county ?? "").trim(),
    hint: (row.categoryLabel || row.category || "").trim(),
  };
}

/** Shard copy for the breaking-glass landing. Empty names stay off the pane. */
export function funnelShards(input: {
  businessName: string;
  city?: string;
  county?: string;
  niche: string;
}): FunnelShard[] {
  const niche = isShopNiche(input.niche) ? input.niche : "trade";
  const shards: FunnelShard[] = [];
  const business = clip(input.businessName, 56);
  if (business) shards.push({ id: "name", title: business, line: TRADE_LINE[niche] || "Local book" });
  const city = clip(input.city ?? "", 40);
  if (city) shards.push({ id: "city", title: city, line: "Local book" });
  const county = clip(input.county ?? "", 40);
  if (county && county !== city) shards.push({ id: "county", title: county, line: "Territory" });
  for (const [index, extra] of funnelOfferings(niche).entries()) {
    shards.push({ id: `offer-${index}`, title: extra, line: TRADE_LINE[niche] || "The book" });
  }
  return shards.slice(0, 12);
}
