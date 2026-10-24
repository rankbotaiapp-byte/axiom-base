import { classifyTrade } from "./directory.ts";
import { filmMatchingText, heroVideoList, isCatalogHeroUrl, resolveNicheFilm, UNIVERSAL_FALLBACK } from "./hero-films.ts";
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
  /** One film, or a rotation. Photography and wildlife share three reels. */
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

/** Wildlife, studio, and outdoor photography, in rotation order. */
export const PHOTO_REELS = [
  "/media/heroes/wildlife-photographer.mp4",
  "/media/heroes/photographer.mp4",
  "/media/heroes/outdoor-master.mp4",
] as const;

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

/** One asset per curated niche. Video when a film is the strongest file on disk. */
const CURATED_HERO: Partial<Record<ShopNiche, HeroSpec>> = {
  fitness: { video: "/media/heroes/tiger-deer.mp4", label: "Training loop · tiger-deer.mp4", preset: "zoomin", speed: 36, intensity: 48, blend: 60 },
  wellness: { video: "/media/heroes/wellness.mp4", label: "Wellness loop · wellness.mp4", preset: "fade", speed: 24, intensity: 36, blend: 70 },
  lessons: { video: "/media/heroes/lessons.mp4", label: "Lessons loop · lessons.mp4", preset: "pantd", speed: 28, intensity: 34, blend: 60 },
  salon: { video: "/media/heroes/salon.mp4", label: "Salon loop · salon.mp4", preset: "panlr", speed: 32, intensity: 40, blend: 58 },
  beauty: { video: "/media/heroes/nails-lashes.mp4", label: "Beauty loop · nails-lashes.mp4", preset: "kenburns", speed: 36, intensity: 42, blend: 62 },
  tattoo: { video: "/media/heroes/tattoo-hero.mp4", label: "Tattoo loop · tattoo-hero.mp4", preset: "panlr", speed: 28, intensity: 50, blend: 58 },
  photo: { video: PHOTO_REELS, label: "Photo reel · wildlife, photographer, outdoor", preset: "zoomin", speed: 34, intensity: 48, blend: 64 },
  pets: { video: "/media/heroes/petgroom.mp4", label: "Groom loop · petgroom.mp4", preset: "panlr", speed: 30, intensity: 38, blend: 58 },
  landscaper: { video: "/media/heroes/landscaper.mp4", label: "Yard loop · landscaper.mp4", preset: "pantd", speed: 26, intensity: 40, blend: 56, tone: "site" },
  dogwalk: { video: "/media/heroes/dogwalking.mp4", label: "Walk loop · dogwalking.mp4", preset: "panlr", speed: 28, intensity: 40, blend: 58, tone: "site" },
  detailer: { video: "/media/heroes/mobile-detailer.mp4", label: "Detail loop · mobile-detailer.mp4", preset: "panlr", speed: 28, intensity: 42, blend: 58, tone: "site" },
  therapy: { video: "/media/heroes/physicaltherapist.mp4", label: "Session loop · physicaltherapist.mp4", preset: "kenburns", speed: 30, intensity: 40, blend: 66 },
  contractor: { video: "/media/heroes/trades-hero.mp4", label: "Site loop · trades-hero.mp4", preset: "zoomin", speed: 30, intensity: 38, blend: 56, tone: "site" },
  clean: { video: "/media/heroes/clean.mp4", label: "Clean loop · clean.mp4", preset: "zoomout", speed: 26, intensity: 36, blend: 56 },
  field: { video: "/media/heroes/auto-hero.mp4", label: "Field loop · auto-hero.mp4", preset: "panlr", speed: 30, intensity: 44, blend: 64, tone: "site" },
  locksmith: { video: "/media/heroes/mobile-locksmith.mp4", label: "Van loop · mobile-locksmith.mp4", preset: "panlr", speed: 28, intensity: 42, blend: 58, tone: "site" },
  firewood: { video: "/media/heroes/wood.mp4", label: "Wood loop · wood.mp4", preset: "kenburns", speed: 30, intensity: 40, blend: 58, tone: "site" },
  security: { video: "/media/heroes/private-security.mp4", label: "Post loop · private-security.mp4", preset: "kenburns", speed: 30, intensity: 42, blend: 60 },
  practice: { image: "/media/heroes/practice.jpg", label: "Practice still", preset: "kenburns", speed: 30, intensity: 40, blend: 66 },
  counsel: { video: "/media/heroes/counsel.mp4", label: "Counsel loop · counsel.mp4", preset: "fade", speed: 22, intensity: 32, blend: 72 },
  location: { video: "/media/heroes/barber-hero.mp4", label: "Barber loop · barber-hero.mp4", preset: "kenburns", speed: 34, intensity: 46, blend: 58 },
  events: { image: "/media/heroes/events.jpg", label: "Events still · events.jpg", preset: "kenburns", speed: 28, intensity: 42, blend: 62 },
  hunting: { video: "/media/heroes/hunting-guide.mp4", label: "Verified · hunting-guide.mp4", preset: "zoomin", speed: 28, intensity: 42, blend: 64, tone: "backcountry" },
  creator: { video: "/media/heroes/leopard.mp4", label: "Cinema loop · leopard.mp4", preset: "kenburns", speed: 34, intensity: 46, blend: 62, tone: "cinema" },
};

const TRADE_HERO: HeroSpec = {
  video: "/media/heroes/welding-trade.mp4",
  label: "Trade loop · welding-trade.mp4",
  preset: "zoomin",
  speed: 32,
  intensity: 40,
  blend: 58,
  tone: "site",
};

function filmFrom(spec: HeroSpec): NicheFilm {
  const videos = heroVideoList(spec.video);
  return {
    heroImageUrl: spec.image ?? "",
    heroVideoUrl: videos[0] ?? "",
    heroVideos: videos,
    loopLabel: spec.label,
    introPreset: spec.preset,
    introSpeed: spec.speed,
    introIntensity: spec.intensity,
    heroBlendPercent: spec.blend,
    tone: spec.tone,
    staff: SHARED_STAFF,
  };
}

function filmFor(niche: ShopNiche): NicheFilm {
  const spec = niche === "trade" ? TRADE_HERO : CURATED_HERO[niche];
  const base = spec ?? TRADE_HERO;
  const listed = heroVideoList(spec?.video);
  if (listed.length > 1) {
    const ready = listed.filter((url) => isCatalogHeroUrl(url));
    const videos = ready.length > 0 ? ready : [UNIVERSAL_FALLBACK];
    return filmFrom({
      ...base,
      image: spec?.image,
      video: videos,
      label: spec && ready.length === listed.length ? spec.label : base.label,
    });
  }
  const resolved = resolveNicheFilm(niche, listed[0] ?? "");
  const video = resolved || (spec ? (listed[0] ?? "") : (heroVideoList(TRADE_HERO.video)[0] ?? ""));
  const file = video.split("/").pop() ?? "";
  const label =
    spec && (spec.video ?? "") === video
      ? spec.label
      : file
        ? `${file.replace(/(\.mp4)+$/i, "").replace(/-/g, " ")} film`
        : base.label;
  return filmFrom({
    ...base,
    image: spec?.image,
    video,
    label,
  });
}

/** One source for niche stills and looping hero films. Templates and heroes both read this. */
export const NICHE_MEDIA: Record<ShopNiche, NicheFilm> = {
  guide: filmFor("guide"),
  fitness: filmFor("fitness"),
  combat: filmFor("combat"),
  wellness: filmFor("wellness"),
  lessons: filmFor("lessons"),
  salon: filmFor("salon"),
  beauty: filmFor("beauty"),
  tattoo: filmFor("tattoo"),
  photo: filmFor("photo"),
  pets: filmFor("pets"),
  music: filmFor("music"),
  creator: filmFor("creator"),
  prompt: filmFor("prompt"),
  entertainer: filmFor("entertainer"),
  events: filmFor("events"),
  landscaper: filmFor("landscaper"),
  foodtruck: filmFor("foodtruck"),
  dogwalk: filmFor("dogwalk"),
  detailer: filmFor("detailer"),
  hunting: filmFor("hunting"),
  therapy: filmFor("therapy"),
  bowtech: filmFor("bowtech"),
  contractor: filmFor("contractor"),
  clean: filmFor("clean"),
  field: filmFor("field"),
  locksmith: filmFor("locksmith"),
  firewood: filmFor("firewood"),
  security: filmFor("security"),
  practice: filmFor("practice"),
  counsel: filmFor("counsel"),
  location: filmFor("location"),
  studio: filmFor("studio"),
  retail: filmFor("retail"),
  trade: filmFor("trade"),
};

export function nicheFilmCatalog() {
  return SHOP_NICHES.map((niche) => {
    const film = NICHE_MEDIA[niche];
    return {
      niche,
      videoUrl: film.heroVideoUrl,
      file: film.heroVideoUrl.split("/").pop() || "still",
      label: film.loopLabel,
    };
  });
}

export function cleanCustomNiche(value: string): string {
  return value
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function withSpecificFilm(film: NicheFilm, text: string): NicheFilm {
  const match = filmMatchingText(text, film.heroVideoUrl);
  if (!match || film.heroVideos.includes(match)) return film;
  const file = match.split("/").pop() ?? "film";
  return {
    ...film,
    heroVideoUrl: match,
    heroVideos: [match],
    loopLabel: `${file.replace(/(\.mp4)+$/i, "").replace(/-/g, " ")} film`,
  };
}

/** A typed niche uses its curated film when it has one, otherwise the stock trade film. */
export function heroForCustomNiche(title: string): NicheFilm {
  const label = cleanCustomNiche(title);
  if (label.length < 2) return NICHE_MEDIA.trade;
  try {
    const classified = classifyTrade(label);
    if (classified.known && isShopNiche(classified.tradeType)) {
      return withSpecificFilm(NICHE_MEDIA[classified.tradeType], label);
    }
  } catch {
    // A short or unnamed title keeps the stock film.
  }
  return withSpecificFilm(NICHE_MEDIA.trade, label);
}

const OUTDOOR_GUIDE_KEYS = new Set(["hunting", "hunting-guide", "outdoor-expeditions"]);

/** Hunting, hunting-guide, and outdoor-expeditions share the Sasquatch film. */
export function isOutdoorGuideNiche(value: string): boolean {
  const key = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (OUTDOOR_GUIDE_KEYS.has(key)) return true;
  return /\b(hunting[-\s]?guides?|outdoor[-\s]?expeditions?)\b/i.test(value);
}

/** Preview pages and new shops read the niche film, or the trade film when the key is legacy. */
export function leadHeroFor(tradeType: string, businessName: string, category = ""): NicheFilm {
  const named = [businessName, category].filter((part) => part && part.trim()).join(" ");
  const text = named || tradeType.replace(/-/g, " ");
  if (isOutdoorGuideNiche(tradeType) || isOutdoorGuideNiche(category)) return NICHE_MEDIA.hunting;
  const fromName = classifyQuiet(businessName);
  if (fromName && fromName !== "trade") return withSpecificFilm(NICHE_MEDIA[fromName], text);
  const fromCategory = classifyQuiet(category) ?? classifyQuiet(tradeType.replace(/-/g, " "));
  if (fromCategory) return withSpecificFilm(NICHE_MEDIA[fromCategory], text);
  if (isShopNiche(tradeType)) return withSpecificFilm(NICHE_MEDIA[tradeType], text);
  return withSpecificFilm(NICHE_MEDIA.trade, text);
}

function classifyQuiet(label: string): ShopNiche | null {
  const clean = cleanCustomNiche(label);
  if (clean.length < 2) return null;
  try {
    const classified = classifyTrade(clean);
    if (classified.known && isShopNiche(classified.tradeType)) return classified.tradeType;
  } catch {
    return null;
  }
  return null;
}

function isPinnedCatalog(url: string | null, niche: ShopNiche): boolean {
  if (!isCatalogHeroUrl(url) || !url) return false;
  const media = NICHE_MEDIA[niche];
  if (media?.heroVideos.includes(url) || url === NICHE_MEDIA.trade.heroVideoUrl) return false;
  const spec = niche === "trade" ? TRADE_HERO : CURATED_HERO[niche];
  if (heroVideoList(spec?.video).includes(url)) return false;
  return true;
}

export function resolveHeroMedia(shop: {
  niche: ShopNiche;
  heroImageUrl: string;
  heroVideoUrl: string | null;
  customNiche?: string;
}) {
  const customTitle = cleanCustomNiche(shop.customNiche ?? "");
  const media = customTitle ? heroForCustomNiche(customTitle) : (NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.trade);
  const stillUrl = shop.heroImageUrl ?? "";
  const customStill = stillUrl.startsWith("data:") || stillUrl.startsWith("/api/hero/brand/");
  const customVideo = isCustomHeroVideo(shop.heroVideoUrl);
  if (customVideo) {
    return {
      imageUrl: customStill ? stillUrl : media.heroImageUrl,
      videoUrl: shop.heroVideoUrl,
      videos: heroVideoList(shop.heroVideoUrl),
      tone: media.tone ?? null,
      loopLabel: "Custom loop · this shop",
    };
  }
  if (customStill) {
    return {
      imageUrl: stillUrl,
      videoUrl: null,
      videos: [],
      tone: media.tone ?? null,
      loopLabel: "Custom still · niche loop hidden",
    };
  }
  if (isPinnedCatalog(shop.heroVideoUrl, shop.niche)) {
    const file = String(shop.heroVideoUrl).split("/").pop() ?? "film";
    return {
      imageUrl: media.heroImageUrl,
      videoUrl: shop.heroVideoUrl,
      videos: heroVideoList(shop.heroVideoUrl),
      tone: media.tone ?? null,
      loopLabel: `Catalog film · ${file}`,
    };
  }
  return {
    imageUrl: media.heroImageUrl,
    videoUrl: media.heroVideoUrl || null,
    videos: media.heroVideos,
    tone: media.tone ?? null,
    loopLabel: media.loopLabel,
  };
}
