import type { ShopNiche } from "./types";

/** One source for niche stills and looping hero films. Templates and heroes both read this. */
export const NICHE_MEDIA: Record<
  ShopNiche,
  { heroImageUrl: string; heroVideoUrl: string; loopLabel: string }
> = {
  location: {
    heroImageUrl: "/media/barber-hero.jpg",
    heroVideoUrl: "/media/barber-hero.mp4",
    loopLabel: "Storefront loop · barber-hero.mp4",
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
  const customStill = shop.heroImageUrl.startsWith("data:");
  return {
    imageUrl: shop.heroImageUrl || media.heroImageUrl,
    videoUrl: customStill ? null : shop.heroVideoUrl || media.heroVideoUrl,
    loopLabel: customStill ? "Custom still · niche loop hidden" : media.loopLabel,
  };
}
