import { isLeadSlug } from "./funnel.ts";

export type TerritoryLeadSeed = {
  leadSlug: string;
  businessName: string;
  city: string;
  county: string;
  phone: string;
  tradeType: string;
  tradeLabel: string;
  niche: string;
  state: string;
};

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 80);
}

/** Bind a public tenant slug (Accurate Plumbing, etc.) to a Stripe territory lead. */
export function territoryLeadSeedForSlug(slug: string): TerritoryLeadSeed | null {
  const leadSlug = slug.trim().toLowerCase();
  if (!isLeadSlug(leadSlug)) return null;
  if (leadSlug === "accurate-plumbing" || leadSlug.includes("plumb")) {
    return {
      leadSlug,
      businessName: leadSlug === "accurate-plumbing" ? "Accurate Plumbing" : titleFromSlug(leadSlug),
      city: "Medford",
      county: "Jackson County",
      phone: leadSlug === "accurate-plumbing" ? "(541) 555-0100" : "",
      tradeType: "plumbing",
      tradeLabel: "Plumbing",
      niche: "plumbing",
      state: "OR",
    };
  }
  return {
    leadSlug,
    businessName: titleFromSlug(leadSlug),
    city: "",
    county: "",
    phone: "",
    tradeType: "contractor",
    tradeLabel: "Local trade",
    niche: "contractor",
    state: "",
  };
}
