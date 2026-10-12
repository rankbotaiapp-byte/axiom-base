import type { IntroPreset } from "./intro.ts";
import { isCustomHeroVideo } from "./hero-video.ts";
import { isShopNiche, type ShopNiche } from "./types.ts";

export type HeroTone = "stage" | "site";

export type NicheFilm = {
  heroImageUrl: string;
  heroVideoUrl: string;
  loopLabel: string;
  tone?: HeroTone;
  introPreset: IntroPreset;
  introSpeed: number;
  introIntensity: number;
  heroBlendPercent: number;
  /** Still shown on the page body once the hero is a film. */
  insetImageUrl?: string;
  /** Older loop kept on the page body after a newer hero film replaces it. */
  insetLoopUrl?: string;
};

/** One source for niche stills and looping hero films. Templates and heroes both read this. */
export const NICHE_MEDIA: Record<ShopNiche, NicheFilm> = {
  combat: film("", "/media/heroes/gladiator.mp4", "Round loop · gladiator.mp4", "zoomin", 32, 46, 60),
  fitness: film(
    "/media/tiger-poster.svg",
    "/media/heroes/tiger-deer.mp4",
    "Training loop · tiger-deer.mp4",
    "zoomin",
    36,
    48,
    60,
    undefined,
    { loopUrl: "/media/tiger.mp4" },
  ),
  music: film("/media/music-hero.jpg", "/media/heroes/music-artist.mp4", "Stage loop · music-artist.mp4", "panlr", 24, 62, 68, "stage"),
  creator: film("", "/media/heroes/contentcreator.mp4", "Edit loop · contentcreator.mp4", "panlr", 28, 44, 60),
  landscaper: film(
    "/media/heroes/landscaping.jpg",
    "/media/heroes/landscaper.mp4",
    "Yard loop · landscaper.mp4",
    "pantd",
    26,
    40,
    56,
    "site",
    { imageUrl: "/media/heroes/landscaping.jpg" },
  ),
  foodtruck: film(
    "/media/heroes/food-truck.jpg",
    "/media/heroes/mobile-foodtruck.mp4",
    "Window loop · mobile-foodtruck.mp4",
    "panlr",
    28,
    40,
    58,
    undefined,
    { imageUrl: "/media/heroes/food-truck.jpg" },
  ),
  dogwalk: film(
    "/media/heroes/pets.jpg",
    "/media/heroes/dogwalking.mp4",
    "Walk loop · dogwalking.mp4",
    "panlr",
    28,
    40,
    58,
    "site",
    { imageUrl: "/media/heroes/pets.jpg" },
  ),
  detailer: film(
    "",
    "/media/heroes/mobile-detailer.mp4",
    "Detail loop · mobile-detailer.mp4",
    "panlr",
    28,
    42,
    58,
    "site",
  ),
  entertainer: film("", "/media/heroes/entertainer.mp4", "Stage loop · entertainer.mp4", "kenburns", 30, 48, 62, "stage"),
  contractor: film("/media/heroes/contractor.jpg", "/media/contractor-hero.mp4", "Site loop · contractor-hero.mp4", "zoomin", 30, 38, 56, "site"),
  location: film("/media/barber-hero.jpg", "/media/clipper.mp4", "Barber loop · clipper.mp4", "kenburns", 34, 46, 58),
  tattoo: film(
    "",
    "/media/heroes/tattooshop.mp4",
    "Tattoo loop · tattooshop.mp4",
    "panlr",
    28,
    50,
    58,
    undefined,
    { loopUrl: "/media/tattoo-gun.mp4" },
  ),
  guide: film("/media/rafting-image.png", "/media/heroes/guide.mp4", "River loop · guide.mp4", "panlr", 28, 42, 62),
  field: film("/media/auto-hero.jpg", "/media/auto-hero.mp4", "Field loop · auto-hero.mp4", "panlr", 30, 44, 64, "site"),
  locksmith: film("", "/media/heroes/mobile-locksmith.mp4", "Van loop · mobile-locksmith.mp4", "panlr", 28, 42, 58, "site"),
  firewood: film(
    "/media/heroes/firewood.jpg",
    "/media/heroes/wood.mp4",
    "Wood loop · wood.mp4",
    "kenburns",
    30,
    40,
    58,
    "site",
    { imageUrl: "/media/heroes/firewood.jpg" },
  ),
  studio: film("/media/apps-hero.jpg", "/media/apps-hero.mp4", "Studio loop · apps-hero.mp4", "zoomin", 32, 40, 60),
  salon: film("/media/heroes/salon.jpg", "/media/heroes/salon.mp4", "Salon loop · salon.mp4", "panlr", 32, 40, 58),
  beauty: film(
    "/media/heroes/beauty.jpg",
    "/media/heroes/nails-lashes.mp4",
    "Beauty loop · nails-lashes.mp4",
    "kenburns",
    36,
    42,
    62,
    undefined,
    { imageUrl: "/media/heroes/beauty.jpg" },
  ),
  wellness: film("/media/heroes/wellness.jpg", "/media/heroes/wellness.mp4", "Wellness loop · wellness.mp4", "fade", 24, 36, 70),
  lessons: film(
    "/media/heroes/lessons.jpg",
    "/media/heroes/lessons.mp4",
    "Lessons loop · lessons.mp4",
    "pantd",
    28,
    34,
    60,
    undefined,
    { imageUrl: "/media/heroes/lessons.jpg" },
  ),
  photo: film("", "/media/heroes/photo.mp4", "Photo loop · photo.mp4", "zoomin", 34, 48, 64),
  pets: film(
    "/media/heroes/pets.jpg",
    "/media/heroes/petgroom.mp4",
    "Groom loop · petgroom.mp4",
    "panlr",
    30,
    38,
    58,
    undefined,
    { imageUrl: "/media/heroes/pets.jpg" },
  ),
  clean: film("/media/heroes/clean.jpg", "/media/heroes/clean.mp4", "Clean loop · clean.mp4", "zoomout", 26, 36, 56),
  practice: still("practice", "Practice still", "kenburns", 30, 40, 66, undefined, "jpg"),
  counsel: film("/media/heroes/counsel.jpg", "/media/heroes/counsel.mp4", "Counsel loop · counsel.mp4", "fade", 22, 32, 72),
  events: film("/media/heroes/events.jpg", "/media/heroes/events.mp4", "Events loop · events.mp4", "panlr", 28, 44, 60, "stage"),
  retail: still("retail", "Retail still", "fade", 22, 32, 64, undefined, "svg"),
  trade: film(
    "/media/heroes/trade.jpg",
    "/media/heroes/welding-trade.mp4",
    "Trade loop · welding-trade.mp4",
    "zoomin",
    32,
    40,
    58,
    "site",
    { imageUrl: "/media/heroes/trade.jpg" },
  ),
  security: film("", "/media/heroes/private-security.mp4", "Post loop · private-security.mp4", "kenburns", 30, 42, 60),
};

/** Named trades that share a niche id but need their own still. */
const TRADE_SCENES: { test: RegExp; film: NicheFilm }[] = [
  {
    test: /\b(atv|utv|sports?\s*rentals?)\b/i,
    film: film(
      "",
      "/media/heroes/atv-rental.mp4",
      "Rental loop · atv-rental.mp4",
      "panlr",
      28,
      42,
      60,
    ),
  },
  {
    test: /\bhunting\b/i,
    film: film(
      "/media/heroes/hunting-guide.jpg",
      "/media/heroes/deer-hunting-guide.mp4",
      "Hunt loop · deer-hunting-guide.mp4",
      "panlr",
      28,
      42,
      62,
      undefined,
      { imageUrl: "/media/heroes/hunting-guide.jpg" },
    ),
  },
  {
    test: /\b(firewood|cordwood|fire wood)\b/i,
    film: film(
      "/media/heroes/firewood.jpg",
      "/media/heroes/wood.mp4",
      "Wood loop · wood.mp4",
      "kenburns",
      30,
      40,
      58,
      "site",
      { imageUrl: "/media/heroes/firewood.jpg" },
    ),
  },
  { test: /\b(hvac|furnace|heat pump|air condition\w*)\b/i, film: still("hvac", "HVAC still", "panlr", 30, 42, 58, "site", "jpg") },
  { test: /\b(electric\w*|wiring)\b/i, film: still("electrical", "Electrical still", "kenburns", 34, 46, 60, "site", "jpg") },
  {
    test: /\b(food truck|foodtruck|mobile food|mobile kitchen)\b/i,
    film: film(
      "/media/heroes/food-truck.jpg",
      "/media/heroes/mobile-foodtruck.mp4",
      "Window loop · mobile-foodtruck.mp4",
      "panlr",
      28,
      40,
      58,
      undefined,
      { imageUrl: "/media/heroes/food-truck.jpg" },
    ),
  },
  {
    test: /\b(dog walk\w*|dogwalk\w*)\b/i,
    film: film(
      "/media/heroes/pets.jpg",
      "/media/heroes/dogwalking.mp4",
      "Walk loop · dogwalking.mp4",
      "panlr",
      28,
      40,
      58,
      "site",
      { imageUrl: "/media/heroes/pets.jpg" },
    ),
  },
  {
    test: /\b((?:auto|mobile|car|vehicle)\s+detail\w*|detailers?)\b/i,
    film: film("", "/media/heroes/mobile-detailer.mp4", "Detail loop · mobile-detailer.mp4", "panlr", 28, 42, 58, "site"),
  },
  {
    test: /\b(landscap\w*|lawn|yard)\b/i,
    film: film(
      "/media/heroes/landscaping.jpg",
      "/media/heroes/landscaper.mp4",
      "Yard loop · landscaper.mp4",
      "pantd",
      26,
      40,
      56,
      "site",
      { imageUrl: "/media/heroes/landscaping.jpg" },
    ),
  },
  { test: /\b(roof\w*|shingle|gutter)\b/i, film: still("roofing", "Roofing still", "zoomin", 28, 44, 54, "site", "jpg") },
  { test: /\b(plumb\w*|drain)\b/i, film: still("plumbing", "Plumbing still", "panlr", 30, 40, 58, "site", "jpg") },
];

function film(
  heroImageUrl: string,
  heroVideoUrl: string,
  loopLabel: string,
  introPreset: IntroPreset,
  introSpeed: number,
  introIntensity: number,
  heroBlendPercent: number,
  tone?: HeroTone,
  inset?: { imageUrl?: string; loopUrl?: string },
): NicheFilm {
  return {
    heroImageUrl,
    heroVideoUrl,
    loopLabel,
    introPreset,
    introSpeed,
    introIntensity,
    heroBlendPercent,
    tone,
    insetImageUrl: inset?.imageUrl,
    insetLoopUrl: inset?.loopUrl,
  };
}

function still(
  name: string,
  loopLabel: string,
  introPreset: IntroPreset,
  introSpeed: number,
  introIntensity: number,
  heroBlendPercent: number,
  tone?: HeroTone,
  ext = "svg",
): NicheFilm {
  return film(`/media/heroes/${name}.${ext}`, "", loopLabel, introPreset, introSpeed, introIntensity, heroBlendPercent, tone);
}

export function matchTradeScene(businessName: string): NicheFilm | null {
  const name = businessName.trim();
  if (!name) return null;
  return TRADE_SCENES.find((scene) => scene.test.test(name))?.film ?? null;
}

/** Preview pages (?b=slug) and new shops read the same film, pan, and blend. */
export function leadHeroFor(tradeType: string, businessName: string, category = ""): NicheFilm {
  const named =
    matchTradeScene(businessName) ??
    matchTradeScene(category) ??
    matchTradeScene(tradeType.replace(/-/g, " "));
  if (named) return named;
  return NICHE_MEDIA[isShopNiche(tradeType) ? tradeType : "trade"];
}

/** Films that used to be the niche hero. A saved shop still pointing at one follows the new film. */
const PREVIOUS_NICHE_VIDEOS: Partial<Record<ShopNiche, readonly string[]>> = {
  tattoo: ["/media/tattoo-gun.mp4"],
  music: ["/media/music-hero.mp4"],
  creator: ["/media/heroes/content-creator.mp4"],
};

export function resolveHeroMedia(shop: {
  niche: ShopNiche;
  heroImageUrl: string;
  heroVideoUrl: string | null;
}) {
  const media = NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.location;
  const stillUrl = shop.heroImageUrl ?? "";
  const customStill = stillUrl.startsWith("data:");
  const customVideo = isCustomHeroVideo(shop.heroVideoUrl);
  const stored = shop.heroVideoUrl ?? "";
  const replaced = (PREVIOUS_NICHE_VIDEOS[shop.niche] ?? []).includes(stored);
  const nicheVideo = replaced ? media.heroVideoUrl : stored || media.heroVideoUrl;
  return {
    imageUrl: stillUrl || media.heroImageUrl,
    videoUrl: customVideo ? shop.heroVideoUrl : customStill ? null : nicheVideo,
    tone: media.tone ?? null,
    loopLabel: customVideo
      ? "Custom loop · this shop"
      : customStill
        ? "Custom still · niche loop hidden"
        : media.loopLabel,
  };
}
