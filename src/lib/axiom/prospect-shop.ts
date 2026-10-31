import { catalogFilmUrl, resolveCatalogNiche } from "../../config/catalog.ts";
import type { BusinessBrandRecord } from "./business-brand.ts";
import { DEFAULT_DASHBOARD } from "./dashboard.ts";
import { NICHES, DEFAULT_HOURS } from "./niches.ts";
import { parseLayout, parseThemeProfile } from "./storefront.ts";
import { defaultTradeProfile } from "./trade-layout.ts";
import type { ShopPublic } from "./types.ts";

/** Unclaimed lead slug still needs a shop-shaped payload so `/$shopSlug` can render. */
export function materializeProspectShop(row: BusinessBrandRecord): ShopPublic {
  const niche = resolveCatalogNiche(row.nicheSlug);
  const template = NICHES[niche];
  const shopId = `prospect_${row.slug}`;
  return {
    shop: {
      id: shopId,
      slug: row.slug,
      name: row.businessName || template.defaultName,
      niche,
      customNiche: row.categoryLabel || row.category,
      tagline: template.tagline,
      description: template.description,
      ringColor: template.ringColor,
      heroImageUrl: "",
      heroVideoUrl: catalogFilmUrl(niche),
      heroBlendPercent: 60,
      heroEffectType: "smoke",
      heroBrandingTagline: "",
      heroPrompt: "",
      morphDurationSec: 4.5,
      introPreset: "kenburns",
      introSpeed: 40,
      introIntensity: 45,
      primaryServiceId: null,
      ownerUserId: null,
      isShowcase: true,
      onboardingStep: "complete",
      onboarding: { hero: true, service: true, employee: true, testBooked: true },
      hours: { ...DEFAULT_HOURS },
      address: [row.city, row.county].filter(Boolean).join(" · "),
      acceptsCard: false,
      worksAlone: true,
      dashboardOverride: false,
      dashboardConfig: DEFAULT_DASHBOARD,
      themeProfile: parseThemeProfile(undefined, niche),
      neonAccent: template.ringColor,
      glowEnabled: true,
      layout: parseLayout(undefined),
      tradeProfile: defaultTradeProfile(niche),
      createdAt: new Date(0).toISOString(),
    },
    services: [],
    employees: [],
  };
}
