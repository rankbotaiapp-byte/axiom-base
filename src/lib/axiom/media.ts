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
};

/** One source for niche stills and looping hero films. Templates and heroes both read this. */
export const NICHE_MEDIA: Record<ShopNiche, NicheFilm> = {
  fitness: film("/media/tiger-poster.svg", "/media/tiger.mp4", "Training loop · tiger.mp4", "zoomin", 36, 48, 60),
  music: film("/media/music-hero.jpg", "/media/music-hero.mp4", "Stage loop · music-hero.mp4", "panlr", 24, 62, 68, "stage"),
  contractor: film("/media/heroes/contractor.jpg", "/media/contractor-hero.mp4", "Site loop · contractor-hero.mp4", "zoomin", 30, 38, 56, "site"),
  location: film("/media/barber-hero.jpg", "/media/clipper.mp4", "Barber loop · clipper.mp4", "kenburns", 34, 46, 58),
  tattoo: film("", "/media/tattoo-gun.mp4", "Tattoo loop · tattoo-gun.mp4", "panlr", 28, 50, 58),
  guide: film("/media/rafting-image.png", "/media/heroes/guide.mp4", "River loop · guide.mp4", "panlr", 28, 42, 62),
  field: film("/media/auto-hero.jpg", "/media/auto-hero.mp4", "Field loop · auto-hero.mp4", "panlr", 30, 44, 64, "site"),
  studio: film("/media/apps-hero.jpg", "/media/apps-hero.mp4", "Studio loop · apps-hero.mp4", "zoomin", 32, 40, 60),
  salon: still("salon", "Salon still", "panlr", 32, 40, 58, undefined, "jpg"),
  beauty: still("beauty", "Beauty still", "kenburns", 36, 42, 62, undefined, "jpg"),
  wellness: still("wellness", "Wellness still", "fade", 24, 36, 70, undefined, "jpg"),
  lessons: still("lessons", "Lessons still", "pantd", 28, 34, 60, undefined, "jpg"),
  photo: film("", "/media/heroes/photo.mp4", "Photo loop · photo.mp4", "zoomin", 34, 48, 64),
  pets: still("pets", "Pets still", "panlr", 30, 38, 58, undefined, "jpg"),
  clean: still("clean", "Clean still", "zoomout", 26, 36, 56, undefined, "jpg"),
  practice: still("practice", "Practice still", "kenburns", 30, 40, 66, undefined, "jpg"),
  counsel: still("counsel", "Counsel still", "fade", 22, 32, 72, undefined, "jpg"),
  events: still("events", "Events still", "panlr", 28, 44, 60, "stage", "jpg"),
  trade: still("trade", "Trade still", "zoomin", 32, 40, 58, "site", "jpg"),
};

/** Named trades that share a niche id but need their own still. */
const TRADE_SCENES: { test: RegExp; film: NicheFilm }[] = [
  { test: /\bhunting\b/i, film: still("hunting-guide", "Hunting guide still", "panlr", 28, 42, 62, undefined, "jpg") },
  { test: /\b(firewood|cordwood|fire wood)\b/i, film: still("firewood", "Firewood still", "kenburns", 30, 40, 58, "site", "jpg") },
  { test: /\b(hvac|furnace|heat pump|air condition\w*)\b/i, film: still("hvac", "HVAC still", "panlr", 30, 42, 58, "site", "jpg") },
  { test: /\b(electric\w*|wiring)\b/i, film: still("electrical", "Electrical still", "kenburns", 34, 46, 60, "site", "jpg") },
  { test: /\b(food truck|foodtruck|mobile food|mobile kitchen)\b/i, film: still("food-truck", "Food truck still", "panlr", 28, 40, 58, undefined, "jpg") },
  { test: /\b(landscap\w*|lawn|yard)\b/i, film: still("landscaping", "Landscaping still", "pantd", 26, 40, 56, "site", "jpg") },
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
): NicheFilm {
  return { heroImageUrl, heroVideoUrl, loopLabel, introPreset, introSpeed, introIntensity, heroBlendPercent, tone };
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

export function resolveHeroMedia(shop: {
  niche: ShopNiche;
  heroImageUrl: string;
  heroVideoUrl: string | null;
}) {
  const media = NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.location;
  const stillUrl = shop.heroImageUrl ?? "";
  const customStill = stillUrl.startsWith("data:");
  const customVideo = isCustomHeroVideo(shop.heroVideoUrl);
  return {
    imageUrl: stillUrl || media.heroImageUrl,
    videoUrl: customVideo ? shop.heroVideoUrl : customStill ? null : shop.heroVideoUrl || media.heroVideoUrl,
    tone: media.tone ?? null,
    loopLabel: customVideo
      ? "Custom loop · this shop"
      : customStill
        ? "Custom still · niche loop hidden"
        : media.loopLabel,
  };
}
