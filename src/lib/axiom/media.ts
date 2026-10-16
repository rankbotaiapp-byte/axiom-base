import { classifyTrade } from "./directory.ts";
import type { IntroPreset } from "./intro.ts";
import { isCustomHeroVideo } from "./hero-video.ts";
import { isShopNiche, type ShopNiche } from "./types.ts";

export type HeroTone = "stage" | "site" | "backcountry" | "cinema";

/** The same two people on every demo. Portraits are not per niche. */
export const SHARED_STAFF = ["/media/alex-morgan.jpg", "/media/willa-grant.jpg"] as const;

export type NicheFilm = {
  heroImageUrl: string;
  heroVideoUrl: string;
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
  video?: string;
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
  tattoo: { video: "/media/heroes/tattooshop.mp4", label: "Tattoo loop · tattooshop.mp4", preset: "panlr", speed: 28, intensity: 50, blend: 58 },
  photo: { video: "/media/heroes/photo.mp4", label: "Photo loop · photo.mp4", preset: "zoomin", speed: 34, intensity: 48, blend: 64 },
  pets: { video: "/media/heroes/petgroom.mp4", label: "Groom loop · petgroom.mp4", preset: "panlr", speed: 30, intensity: 38, blend: 58 },
  landscaper: { video: "/media/heroes/landscaper.mp4", label: "Yard loop · landscaper.mp4", preset: "pantd", speed: 26, intensity: 40, blend: 56, tone: "site" },
  dogwalk: { video: "/media/heroes/dogwalking.mp4", label: "Walk loop · dogwalking.mp4", preset: "panlr", speed: 28, intensity: 40, blend: 58, tone: "site" },
  detailer: { video: "/media/heroes/mobile-detailer.mp4", label: "Detail loop · mobile-detailer.mp4", preset: "panlr", speed: 28, intensity: 42, blend: 58, tone: "site" },
  therapy: { video: "/media/heroes/physicaltherapist.mp4", label: "Session loop · physicaltherapist.mp4", preset: "kenburns", speed: 30, intensity: 40, blend: 66 },
  contractor: { video: "/media/contractor-hero.mp4", label: "Site loop · contractor-hero.mp4", preset: "zoomin", speed: 30, intensity: 38, blend: 56, tone: "site" },
  clean: { video: "/media/heroes/clean.mp4", label: "Clean loop · clean.mp4", preset: "zoomout", speed: 26, intensity: 36, blend: 56 },
  field: { video: "/media/auto-hero.mp4", label: "Field loop · auto-hero.mp4", preset: "panlr", speed: 30, intensity: 44, blend: 64, tone: "site" },
  locksmith: { video: "/media/heroes/mobile-locksmith.mp4", label: "Van loop · mobile-locksmith.mp4", preset: "panlr", speed: 28, intensity: 42, blend: 58, tone: "site" },
  firewood: { video: "/media/heroes/wood.mp4", label: "Wood loop · wood.mp4", preset: "kenburns", speed: 30, intensity: 40, blend: 58, tone: "site" },
  security: { video: "/media/heroes/private-security.mp4", label: "Post loop · private-security.mp4", preset: "kenburns", speed: 30, intensity: 42, blend: 60 },
  practice: { image: "/media/heroes/practice.jpg", label: "Practice still", preset: "kenburns", speed: 30, intensity: 40, blend: 66 },
  counsel: { video: "/media/heroes/counsel.mp4", label: "Counsel loop · counsel.mp4", preset: "fade", speed: 22, intensity: 32, blend: 72 },
  location: { video: "/media/barber-hero.mp4", label: "Barber loop · barber-hero.mp4", preset: "kenburns", speed: 34, intensity: 46, blend: 58 },
  hunting: { video: "/media/heroes/charging-bear.mp4", label: "Backcountry loop · charging-bear.mp4", preset: "zoomin", speed: 28, intensity: 42, blend: 64, tone: "backcountry" },
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
  return {
    heroImageUrl: spec.image ?? "",
    heroVideoUrl: spec.video ?? "",
    loopLabel: spec.label,
    introPreset: spec.preset,
    introSpeed: spec.speed,
    introIntensity: spec.intensity,
    heroBlendPercent: spec.blend,
    tone: spec.tone,
    staff: SHARED_STAFF,
  };
}

const tradeFilm = filmFrom(TRADE_HERO);

function filmFor(niche: ShopNiche): NicheFilm {
  return filmFrom(CURATED_HERO[niche] ?? TRADE_HERO);
}

/** One source for niche stills and looping hero films. Templates and heroes both read this. */
export const NICHE_MEDIA: Record<ShopNiche, NicheFilm> = {
  guide: tradeFilm,
  fitness: filmFor("fitness"),
  combat: tradeFilm,
  wellness: filmFor("wellness"),
  lessons: filmFor("lessons"),
  salon: filmFor("salon"),
  beauty: filmFor("beauty"),
  tattoo: filmFor("tattoo"),
  photo: filmFor("photo"),
  pets: filmFor("pets"),
  music: tradeFilm,
  creator: filmFor("creator"),
  prompt: tradeFilm,
  entertainer: tradeFilm,
  events: tradeFilm,
  landscaper: filmFor("landscaper"),
  foodtruck: tradeFilm,
  dogwalk: filmFor("dogwalk"),
  detailer: filmFor("detailer"),
  hunting: filmFor("hunting"),
  therapy: filmFor("therapy"),
  bowtech: tradeFilm,
  contractor: filmFor("contractor"),
  clean: filmFor("clean"),
  field: filmFor("field"),
  locksmith: filmFor("locksmith"),
  firewood: filmFor("firewood"),
  security: filmFor("security"),
  practice: filmFor("practice"),
  counsel: filmFor("counsel"),
  location: filmFor("location"),
  studio: tradeFilm,
  retail: tradeFilm,
  trade: tradeFilm,
};

export function cleanCustomNiche(value: string): string {
  return value
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

/** A typed niche uses its curated film when it has one, otherwise the stock trade film. */
export function heroForCustomNiche(title: string): NicheFilm {
  const label = cleanCustomNiche(title);
  if (label.length < 2) return NICHE_MEDIA.trade;
  try {
    const classified = classifyTrade(label);
    if (classified.known && isShopNiche(classified.tradeType)) {
      return NICHE_MEDIA[classified.tradeType];
    }
  } catch {
    // A short or unnamed title keeps the stock film.
  }
  return NICHE_MEDIA.trade;
}

/** Preview pages and new shops read the niche film, or the trade film when the key is legacy. */
export function leadHeroFor(tradeType: string, businessName: string, category = ""): NicheFilm {
  const fromName = classifyQuiet(businessName);
  if (fromName && fromName !== "trade") return NICHE_MEDIA[fromName];
  const fromCategory = classifyQuiet(category) ?? classifyQuiet(tradeType.replace(/-/g, " "));
  if (fromCategory) return NICHE_MEDIA[fromCategory];
  if (isShopNiche(tradeType)) return NICHE_MEDIA[tradeType];
  return NICHE_MEDIA.trade;
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

export function resolveHeroMedia(shop: {
  niche: ShopNiche;
  heroImageUrl: string;
  heroVideoUrl: string | null;
  customNiche?: string;
}) {
  const customTitle = cleanCustomNiche(shop.customNiche ?? "");
  const media = customTitle ? heroForCustomNiche(customTitle) : (NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.trade);
  const stillUrl = shop.heroImageUrl ?? "";
  const customStill = stillUrl.startsWith("data:");
  const customVideo = isCustomHeroVideo(shop.heroVideoUrl);
  if (customVideo) {
    return {
      imageUrl: customStill ? stillUrl : media.heroImageUrl,
      videoUrl: shop.heroVideoUrl,
      tone: media.tone ?? null,
      loopLabel: "Custom loop · this shop",
    };
  }
  if (customStill) {
    return {
      imageUrl: stillUrl,
      videoUrl: null,
      tone: media.tone ?? null,
      loopLabel: "Custom still · niche loop hidden",
    };
  }
  return {
    imageUrl: media.heroImageUrl,
    videoUrl: media.heroVideoUrl || null,
    tone: media.tone ?? null,
    loopLabel: media.loopLabel,
  };
}
