/** Slots a branded still can occupy on the public shop. */

export const MEDIA_SLOTS = ["hero", "gallery", "logo", "staff", "service", "outreach"] as const;
export type MediaSlot = (typeof MEDIA_SLOTS)[number];

export const MEDIA_SLOT_LABEL: Record<MediaSlot, string> = {
  hero: "Hero still",
  gallery: "Proof of work",
  logo: "Shop mark",
  staff: "Crew portrait",
  service: "Service plate",
  outreach: "Social post",
};

export const SOCIAL_CHANNELS = ["facebook", "instagram", "x", "youtube"] as const;
export type SocialChannel = (typeof SOCIAL_CHANNELS)[number];

export const SOCIAL_CHANNEL_LABEL: Record<SocialChannel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
};

export const MEDIA_ASSET_LIMIT = 24;
export const MEDIA_FILE_MAX_BYTES = 8 * 1024 * 1024;

export type MediaAssetView = {
  id: string;
  shopId: string;
  slot: MediaSlot;
  purpose: string;
  caption: string;
  url: string;
  isHero: boolean;
  createdAt: string;
};

export function isMediaSlot(value: unknown): value is MediaSlot {
  return typeof value === "string" && (MEDIA_SLOTS as readonly string[]).includes(value);
}

export function parseMediaSlot(value: unknown, fallback: MediaSlot = "gallery"): MediaSlot {
  return isMediaSlot(value) ? value : fallback;
}

export function shopMediaPath(assetId: string, version = 0): string {
  if (!/^med_[a-zA-Z0-9]+$/.test(assetId)) throw new Error("That still stays on this shop");
  const path = `/api/shop-media/${assetId}?v=${Math.max(0, Math.floor(version))}`;
  if (path.includes("/media/heroes")) throw new Error("Shop stills stay on this shop");
  return path;
}

export function assetIdFromMediaPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "shop-media") return null;
  const id = parts[2] ?? "";
  return /^med_[a-zA-Z0-9]+$/.test(id) ? id : null;
}

export function clipMediaPurpose(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

/** Map leftover stills onto storefront blocks once the hero is chosen. */
export function placeBrandedAssets(assets: Array<{ id: string; slot: MediaSlot; isHero: boolean }>): {
  heroId: string | null;
  galleryIds: string[];
  logoId: string | null;
  staffId: string | null;
  serviceId: string | null;
} {
  const hero = assets.find((item) => item.isHero) ?? assets.find((item) => item.slot === "hero") ?? null;
  const rest = assets.filter((item) => item.id !== hero?.id);
  return {
    heroId: hero?.id ?? null,
    galleryIds: rest.filter((item) => item.slot === "gallery").map((item) => item.id).slice(0, 12),
    logoId: rest.find((item) => item.slot === "logo")?.id ?? null,
    staffId: rest.find((item) => item.slot === "staff")?.id ?? null,
    serviceId: rest.find((item) => item.slot === "service")?.id ?? null,
  };
}

export function parseSocialChannels(value: unknown): SocialChannel[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? safeJsonList(value) : [];
  const seen = new Set<SocialChannel>();
  for (const item of raw) {
    if ((SOCIAL_CHANNELS as readonly string[]).includes(String(item))) {
      seen.add(item as SocialChannel);
    }
  }
  return SOCIAL_CHANNELS.filter((channel) => seen.has(channel));
}

function safeJsonList(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function socialCaptionDraft(input: {
  shopName: string;
  trade: string;
  city: string;
  pageUrl: string;
}): { caption: string; hashtags: string } {
  const name = input.shopName.trim().replace(/\s+/g, " ").slice(0, 42) || "This shop";
  const trade = input.trade.trim().replace(/\s+/g, " ").slice(0, 40) || "the book";
  const city = input.city.trim().replace(/\s+/g, " ").slice(0, 40) || "town";
  const caption = `${name} is on the book in ${city}. ${trade}. Claim the time before the week fills.`;
  return {
    caption: caption.slice(0, 240),
    hashtags: ["#Axiom", `#${city.replace(/\s+/g, "")}`, `#${trade.replace(/\s+/g, "")}`]
      .filter((tag) => tag.length > 2)
      .slice(0, 4)
      .join(" "),
  };
}
