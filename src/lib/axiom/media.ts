import { CATALOG, catalogFilmUrl, isCatalogNiche, resolveCatalogNiche } from "@/config/catalog";
import { classifyTrade } from "./directory.ts";
import {
  animationForNiche,
  filmMatchingText,
  heroVideoList,
  isCatalogHeroUrl,
  resolveNicheFilm,
  UNIVERSAL_FALLBACK,
} from "./hero-films.ts";
import type { IntroPreset } from "./intro.ts";
import { isCustomHeroVideo } from "./hero-video.ts";
import { isShopNiche, SHOP_NICHES, type ShopNiche } from "./types.ts";

export type HeroTone = "stage" | "site" | "backcountry" | "cinema";

/** The same two people on every demo. Portraits are not per niche. */
export const SHARED_STAFF = ["/media/alex-morgan.jpg", "/media/willa-grant.jpg"] as const;

export type NicheFilm = {
  heroImageUrl: string;
  /** First reel. Single-film niches keep this as their only URL. */
  heroVideoUrl: string;
  /** One film, or a rotation. */
  heroVideos: readonly string[];
  loopLabel: string;
  tone?: HeroTone;
  introPreset: IntroPreset;
  introSpeed: number;
  introIntensity: number;
  heroBlendPercent: number;
  /** Universal staff portraits, in lead then crew order. */
  staff: readonly [string, string];
};

type HeroSpec = {
  image?: string;
  video?: string | readonly string[];
  label: string;
  preset: IntroPreset;
  speed: number;
  intensity: number;
  blend: number;
  tone?: HeroTone;
};

const SITE_NICHES = new Set<ShopNiche>([
  "auto",
  "contractor",
  "electrical",
  "fabrication",
  "forestry",
  "hvac",
  "landscaping",
  "machining",
  "plumbing",
  "roofing",
  "stone-masonry",
  "tool-repair",
  "water-systems",
  "woodworking",
]);

function toneFor(niche: ShopNiche): HeroTone | undefined {
  if (niche === "forestry" || niche === "stone-masonry" || niche === "taxidermy") return "backcountry";
  if (niche === "glasswork" || niche === "fabrication") return "cinema";
  if (SITE_NICHES.has(niche)) return "site";
  return undefined;
}

function filmFor(niche: ShopNiche): NicheFilm {
  const url = catalogFilmUrl(niche);
  const file = CATALOG.find((row) => row.id === niche)?.file ?? "loop";
  return {
    heroImageUrl: "",
    heroVideoUrl: url,
    heroVideos: [url],
    loopLabel: `${niche} loop · ${file}`,
    tone: toneFor(niche),
    introPreset: "kenburns",
    introSpeed: 34,
    introIntensity: 42,
    heroBlendPercent: 60,
    staff: SHARED_STAFF,
  };
}

/** One source for niche stills and looping hero films. Templates and heroes both read this. */
export const NICHE_MEDIA: Record<ShopNiche, NicheFilm> = Object.fromEntries(
  SHOP_NICHES.map((niche) => [niche, filmFor(niche)]),
) as Record<ShopNiche, NicheFilm>;

function withSpecificFilm(base: NicheFilm, text: string): NicheFilm {
  const matched = filmMatchingText(text, base.heroVideoUrl);
  if (!matched || matched === base.heroVideoUrl) return base;
  return {
    ...base,
    heroVideoUrl: matched,
    heroVideos: [matched],
    heroImageUrl: "",
    loopLabel: matched.split("/").pop()?.replace(/-/g, " ") ?? base.loopLabel,
  };
}

export function heroForCustomNiche(label: string): NicheFilm {
  if (label.length < 2) return NICHE_MEDIA.contractor;
  try {
    const classified = classifyTrade(label);
    if (classified.known && isShopNiche(classified.tradeType)) {
      return withSpecificFilm(NICHE_MEDIA[classified.tradeType], label);
    }
  } catch {
    /* fall through */
  }
  return withSpecificFilm(NICHE_MEDIA.contractor, label);
}

const OUTDOOR_GUIDE_KEYS = new Set(["hunting-guide", "outdoor-expeditions", "guide", "forestry"]);

export function isOutdoorGuideNiche(value: string): boolean {
  const key = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (OUTDOOR_GUIDE_KEYS.has(key)) return true;
  return /\b(hunting[-\s]?guides?|outdoor[-\s]?expeditions?|forestry)\b/i.test(value);
}

/** Preview pages and new shops read the niche film, or contractor when the key is legacy. */
export function leadHeroFor(tradeType: string, businessName: string, category = ""): NicheFilm {
  const named = [businessName, category].filter((part) => part && part.trim()).join(" ");
  const text = named || tradeType.replace(/-/g, " ");
  if (isOutdoorGuideNiche(tradeType) || isOutdoorGuideNiche(category)) {
    return withSpecificFilm(NICHE_MEDIA.forestry, text);
  }
  const fromName = classifyQuiet(businessName);
  if (fromName) return withSpecificFilm(NICHE_MEDIA[fromName], text);
  const fromCategory = classifyQuiet(category) ?? classifyQuiet(tradeType.replace(/-/g, " "));
  if (fromCategory) return withSpecificFilm(NICHE_MEDIA[fromCategory], text);
  const niche = resolveCatalogNiche(tradeType);
  return withSpecificFilm(NICHE_MEDIA[niche], text);
}

function classifyQuiet(label: string): ShopNiche | null {
  const clean = label.trim();
  if (clean.length < 2) return null;
  try {
    const classified = classifyTrade(clean);
    if (classified.known && isShopNiche(classified.tradeType)) return classified.tradeType;
  } catch {
    return null;
  }
  return null;
}

export function resolveHeroMedia(shop: {
  niche: string;
  customNiche?: string;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
}): {
  imageUrl: string;
  videoUrl: string;
  tone: HeroTone | null;
  blendPercent: number;
  introPreset: IntroPreset;
  introSpeed: number;
  introIntensity: number;
} {
  const niche = resolveCatalogNiche(shop.niche);
  const media = NICHE_MEDIA[niche];
  const custom = (shop.customNiche ?? "").trim();
  const fromCustom = custom.length >= 2 ? heroForCustomNiche(custom) : null;
  const upload = shop.heroVideoUrl && isCustomHeroVideo(shop.heroVideoUrl) ? shop.heroVideoUrl : "";
  const pinned =
    shop.heroVideoUrl && isCatalogHeroUrl(shop.heroVideoUrl) ? shop.heroVideoUrl.split("?")[0] : "";
  const videoUrl = upload || pinned || fromCustom?.heroVideoUrl || media.heroVideoUrl || UNIVERSAL_FALLBACK;
  const still = (shop.heroImageUrl ?? "").trim();
  const imageUrl = videoUrl ? "" : still || fromCustom?.heroImageUrl || media.heroImageUrl || "";
  return {
    imageUrl,
    videoUrl,
    tone: fromCustom?.tone ?? media.tone ?? null,
    blendPercent: fromCustom?.heroBlendPercent ?? media.heroBlendPercent,
    introPreset: fromCustom?.introPreset ?? media.introPreset,
    introSpeed: fromCustom?.introSpeed ?? media.introSpeed,
    introIntensity: fromCustom?.introIntensity ?? media.introIntensity,
  };
}

export function animationForShopNiche(niche: string): string {
  return isCatalogNiche(niche) ? animationForNiche(niche) : UNIVERSAL_FALLBACK;
}

export function resolveNicheFilmUrl(niche: ShopNiche, curated = ""): string {
  return resolveNicheFilm(niche, curated);
}

/** Photography / wildlife reel used by older UI that still asks for a rotation. */
export const PHOTO_REELS = [
  catalogFilmUrl("glasswork"),
  catalogFilmUrl("forestry"),
  catalogFilmUrl("security"),
] as const;

/** Master desk film picker — every verified catalog loop. */
export function nicheFilmCatalog(): { niche: ShopNiche; url: string; label: string }[] {
  return CATALOG.map((row) => ({
    niche: row.id,
    url: catalogFilmUrl(row.id),
    label: row.label,
  }));
}
