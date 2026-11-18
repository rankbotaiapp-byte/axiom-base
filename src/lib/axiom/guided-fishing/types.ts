/**
 * Guided-fishing niche module — tenant config contract.
 * Every string a buyer can see on the storefront lives here, so the whole
 * site can be rebranded from the Axiom studio without touching code.
 */

export interface PricingTier {
  id: string;
  name: string;
  /** Whole dollars. */
  price: number;
  /** e.g. "+" for "from" pricing. */
  priceSuffix?: string;
  duration: string;
  blurb: string;
  includes: string[];
  featured?: boolean;
  /** Optional Stripe Payment Link (or any checkout URL) shown after the lead is captured. */
  depositUrl?: string;
}

export interface Stat {
  label: string;
  value: string;
}

export interface ImageBlock {
  eyebrow: string;
  heading: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
}

export interface GuidedFishingConfig {
  tenantId: string;
  business: {
    name: string;
    tagline: string;
    /** Display format, e.g. "(541) 555-0142". */
    phone: string;
    email: string;
    /** Short chips, e.g. "Jackson County". */
    locationTags: string[];
    serviceArea: string;
    /** Guide registration / insurance line shown in the footer. */
    licenseLine: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    videoSrc: string;
    posterSrc: string;
    primaryCta: string;
    secondaryCta: string;
  };
  stats: Stat[];
  pricing: {
    eyebrow: string;
    heading: string;
    subhead: string;
    tiers: PricingTier[];
    maxAnglers: number;
    reserveCta: string;
    finePrint: string;
  };
  guide: Omit<ImageBlock, 'body'> & { name: string; bio: string[] };
  fleet: ImageBlock;
  gear: ImageBlock & { items: string[] };
  success: ImageBlock;
  lead: {
    eyebrow: string;
    heading: string;
    subhead: string;
    submitLabel: string;
    /** Shown next to the SMS opt-in checkbox. Keep it explicit — this is your consent record. */
    smsConsentText: string;
    successTitle: string;
    successBody: string;
    /** API route that forwards to the Axiom outbound engine. */
    endpoint: string;
  };
  seo: {
    title: string;
    description: string;
  };
}

export type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export interface TripSelection {
  tierId: string;
  date: string;
  anglers: number;
}
