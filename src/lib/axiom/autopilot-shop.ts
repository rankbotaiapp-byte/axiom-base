import { resolveCatalogNiche } from "@/config/catalog";
import { DEFAULT_DASHBOARD } from "./dashboard.ts";
import { resolveHeroMedia } from "./media.ts";
import { parseLayout, parseThemeProfile } from "./storefront.ts";
import { defaultTradeProfile } from "./trade-layout.ts";
import { isShopNiche, type Employee, type Service, type Shop, type ShopNiche, type ShopPublic } from "./types.ts";
import type { ClientStorefront } from "./autopilot.ts";
import { storefrontFromFields } from "./autopilot.ts";

export type ShopWithAutopilot = ShopPublic & { autopilot: ClientStorefront };

const WEEK = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false };

export function nicheForDataset(label: string): ShopNiche {
  const hay = label.toLowerCase();
  if (hay.includes("tattoo") || hay.includes("taxidermy")) return "taxidermy";
  if (hay.includes("weld") || hay.includes("machin")) return "machining";
  if (hay.includes("wild") || hay.includes("hunt") || hay.includes("forest")) return "forestry";
  if (hay.includes("fish") || hay.includes("river") || hay.includes("water")) return "water-systems";
  if (hay.includes("plumb")) return "plumbing";
  if (hay.includes("electric")) return "electrical";
  if (hay.includes("barber") || hay.includes("salon")) return "barber";
  if (hay.includes("auto") || hay.includes("mechanic") || hay.includes("cyber")) return "auto";
  if (isShopNiche(hay)) return hay;
  return resolveCatalogNiche(hay);
}

export function storefrontForShop(data: ShopPublic): ClientStorefront {
  const hero = resolveHeroMedia(data.shop);
  const film = hero.videoUrl || "/media/orb-explosion-hero-animation.mp4";
  return storefrontFromFields({
    shopSlug: data.shop.slug,
    name: data.shop.name,
    tagline: data.shop.tagline,
    niche: data.shop.customNiche || data.shop.niche,
    accent: data.shop.neonAccent || data.shop.ringColor,
    heroVideoUrl: film,
    address: data.shop.address,
    services: (data.services ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceCents: service.priceCents,
      group: service.group,
      videoUrl: film,
    })),
  });
}

/** A dataset row with no database shop still has a book, a crew, and a film. */
export function materializeDatasetShop(dataset: ClientStorefront): ShopWithAutopilot {
  const niche = nicheForDataset(dataset.niche);
  const shopId = `dataset_${dataset.shopSlug}`;
  const services: Service[] = dataset.shards.map((shard) => ({
    id: `${dataset.shopSlug}-${shard.id}`,
    shopId,
    name: shard.label,
    description: shard.blurb,
    durationMin: 60,
    priceCents: shard.priceCents ?? 0,
    sortOrder: 0,
    group: shard.meta,
    priceUnit: "flat" as const,
    active: true,
  }));
  const shop: Shop = {
    id: shopId,
    slug: dataset.shopSlug,
    name: dataset.name,
    niche,
    customNiche: dataset.niche,
    tagline: dataset.tagline,
    description: dataset.tagline,
    ringColor: dataset.accent,
    heroImageUrl: "",
    heroVideoUrl: dataset.heroVideoUrl,
    heroBlendPercent: 48,
    heroEffectType: "smoke",
    heroBrandingTagline: "",
    heroPrompt: "",
    morphDurationSec: 4.5,
    introPreset: "kenburns",
    introSpeed: 36,
    introIntensity: 42,
    primaryServiceId: services[0]?.id ?? null,
    ownerUserId: null,
    isShowcase: true,
    onboardingStep: "complete",
    onboarding: { hero: true, service: true, employee: true, testBooked: true },
    hours: {
      mon: "08:00-18:00",
      tue: "08:00-18:00",
      wed: "08:00-18:00",
      thu: "08:00-18:00",
      fri: "08:00-18:00",
      sat: "09:00-13:00",
      sun: "closed",
    },
    address: dataset.address,
    acceptsCard: false,
    worksAlone: false,
    dashboardOverride: false,
    dashboardConfig: DEFAULT_DASHBOARD,
    themeProfile: parseThemeProfile(undefined, niche),
    neonAccent: dataset.accent,
    glowEnabled: true,
    layout: parseLayout(undefined),
    tradeProfile: defaultTradeProfile(niche),
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const employees: Employee[] = [
    {
      id: `${shopId}-lead`,
      shopId,
      displayName: "Lead",
      title: dataset.niche,
      bio: dataset.tagline,
      phone: "",
      avatarUrl: "",
      inviteStatus: "claimed",
      serviceIds: services.map((service) => service.id),
      dashboardConfig: DEFAULT_DASHBOARD,
    },
  ];
  return { shop, services, employees, autopilot: dataset };
}
