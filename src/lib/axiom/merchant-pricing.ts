/** Merchant price lines and Stripe Connect verification. Pure helpers, no database. */

export const PRICING_TYPES = ["flat", "deposit", "package", "tiered"] as const;
export type MerchantPricingType = (typeof PRICING_TYPES)[number];
export const COLLECTION_MODES = ["online", "in_person"] as const;
export type CollectionMode = (typeof COLLECTION_MODES)[number];
export type ConnectStanding = "none" | "pending" | "active";

export type MerchantPrice = {
  id: string;
  shopSlug: string;
  serviceName: string;
  pricingType: MerchantPricingType;
  priceAmount: number;
  activeDealsBanner: string;
  collectionMode: CollectionMode;
  updatedAt: string;
};

export function isPricingType(value: string): value is MerchantPricingType {
  return (PRICING_TYPES as readonly string[]).includes(value);
}

export function isCollectionMode(value: string): value is CollectionMode {
  return (COLLECTION_MODES as readonly string[]).includes(value);
}

/** Active means Stripe can charge the connected account. An account id without that is pending. */
export function connectStanding(input: {
  accountId: string | null;
  chargesEnabled: boolean;
}): ConnectStanding {
  if (!input.accountId) return "none";
  return input.chargesEnabled ? "active" : "pending";
}

export function centsFromAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

export function priceForService(rows: readonly MerchantPrice[], serviceName: string): MerchantPrice | null {
  const key = serviceName.trim().toLowerCase();
  return rows.find((row) => row.serviceName.trim().toLowerCase() === key) ?? null;
}

/**
 * What the guest is asked to pay on this visit.
 * In-person lines collect nothing online. A deposit line charges price_amount now.
 * Flat and package lines charge price_amount when collection is online.
 */
export function dueNowCents(row: MerchantPrice | null, serviceCents: number): number {
  if (!row) return Math.max(0, serviceCents);
  if (row.collectionMode === "in_person") return 0;
  return centsFromAmount(row.priceAmount);
}

export function listPriceCents(row: MerchantPrice | null, serviceCents: number): number {
  if (!row) return Math.max(0, serviceCents);
  return centsFromAmount(row.priceAmount);
}

export function pricingLabel(type: MerchantPricingType): string {
  if (type === "deposit") return "Deposit";
  if (type === "package" || type === "tiered") return "Package";
  return "Flat rate";
}
