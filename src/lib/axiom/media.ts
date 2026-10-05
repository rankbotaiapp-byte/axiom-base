import { isCustomHeroVideo } from "./hero-video.ts";
import type { ShopNiche } from "./types";

export type HeroTone = "stage" | "site";

/** One source for niche stills and looping hero films. Templates and heroes both read this. */
export const NICHE_MEDIA: Record<
  ShopNiche,
  { heroImageUrl: string; heroVideoUrl: string; loopLabel: string; tone?: HeroTone }
> = {
  fitness: {
    heroImageUrl: "/media/tiger-poster.svg",
    heroVideoUrl: "/media/tiger.mp4",
    loopLabel: "Training loop · tiger.mp4",
  },
  music: {
    heroImageUrl: "/media/music-hero.jpg",
    heroVideoUrl: "/media/music-hero.mp4",
    loopLabel: "Stage loop · music-hero.mp4",
    tone: "stage",
  },
  contractor: {
    heroImageUrl: "/media/contractor-hero.jpg",
    heroVideoUrl: "/media/contractor-hero.mp4",
    loopLabel: "Site loop · contractor-hero.mp4",
    tone: "site",
  },
  location: {
    heroImageUrl: "/media/barber-hero.jpg",
    heroVideoUrl: "/media/clipper.mp4",
    loopLabel: "Barber loop · clipper.mp4",
  },
  tattoo: {
    heroImageUrl: "",
    heroVideoUrl: "/media/tattoo-gun.mp4",
    loopLabel: "Tattoo loop · tattoo-gun.mp4",
  },
  field: {
    heroImageUrl: "/media/auto-hero.jpg",
    heroVideoUrl: "/media/auto-hero.mp4",
    loopLabel: "Field loop · auto-hero.mp4",
  },
  studio: {
    heroImageUrl: "/media/apps-hero.jpg",
    heroVideoUrl: "/media/apps-hero.mp4",
    loopLabel: "Studio loop · apps-hero.mp4",
  },
};

export function resolveHeroMedia(shop: {
  niche: ShopNiche;
  heroImageUrl: string;
  heroVideoUrl: string | null;
}) {
  const media = NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.location;
  const still = shop.heroImageUrl ?? "";
  const customStill = still.startsWith("data:");
  const customVideo = isCustomHeroVideo(shop.heroVideoUrl);
  return {
    imageUrl: still || media.heroImageUrl,
    videoUrl: customVideo ? shop.heroVideoUrl : customStill ? null : shop.heroVideoUrl || media.heroVideoUrl,
    tone: media.tone ?? null,
    loopLabel: customVideo
      ? "Custom loop · this shop"
      : customStill
        ? "Custom still · niche loop hidden"
        : media.loopLabel,
  };
}
