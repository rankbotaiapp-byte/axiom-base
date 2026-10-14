import type { ShopNiche } from "./types.ts";

/** A frame in the proof-of-work album. Custom uploads are always stills. */
export type ProofFrame = {
  src: string;
  caption: string;
  kind: "image" | "video";
};

export const GALLERY_LIMIT = 12;

const photo = (src: string, caption: string): ProofFrame => ({ src, caption, kind: "image" });
const film = (src: string, caption: string): ProofFrame => ({ src, caption, kind: "video" });

/**
 * Sample albums built only from files already in public/media.
 * A shop with owner uploads replaces this set on the public page.
 */
const ALBUM: Record<ShopNiche, ProofFrame[]> = {
  guide: [photo("/media/rafting-image.png", "The line")],
  fitness: [photo("/media/tiger-poster.svg", "The floor"), film("/media/heroes/tiger-deer.mp4", "A session")],
  combat: [film("/media/heroes/gladiator.mp4", "A round")],
  wellness: [photo("/media/heroes/wellness.jpg", "The table")],
  lessons: [photo("/media/heroes/lessons.jpg", "The hour")],
  salon: [photo("/media/heroes/salon.jpg", "A finished style")],
  beauty: [photo("/media/heroes/beauty.jpg", "The set")],
  tattoo: [film("/media/heroes/tattooshop.mp4", "A session"), film("/media/tattoo-gun.mp4", "The machine")],
  photo: [film("/media/heroes/photo.mp4", "A shoot")],
  pets: [photo("/media/heroes/pets.jpg", "A groom")],
  music: [
    photo("/media/music-work-1.jpg", "In the booth"),
    photo("/media/music-work-2.jpg", "The session"),
    photo("/media/music-hero.jpg", "The room"),
  ],
  creator: [film("/media/heroes/contentcreator.mp4", "The cut")],
  prompt: [film("/media/heroes/ai-prompt.mp4", "The prompt")],
  entertainer: [film("/media/heroes/entertainer.mp4", "A set")],
  events: [photo("/media/heroes/events.jpg", "The room")],
  landscaper: [photo("/media/heroes/landscaping.jpg", "A finished yard")],
  foodtruck: [photo("/media/heroes/food-truck.jpg", "The window")],
  dogwalk: [photo("/media/heroes/pets.jpg", "A walk")],
  detailer: [film("/media/heroes/mobile-detailer.mp4", "The driveway")],
  hunting: [photo("/media/heroes/hunting-guide.jpg", "The ground")],
  therapy: [photo("/media/heroes/practice.jpg", "The room")],
  bowtech: [film("/media/heroes/custom-bow-tech.mp4", "The bench")],
  contractor: [
    photo("/media/contractor-work-1.jpg", "A finished install"),
    photo("/media/contractor-work-2.jpg", "The job in progress"),
    photo("/media/contractor-crew.jpg", "Crew on site"),
    photo("/media/heroes/contractor.jpg", "The front of the job"),
    photo("/media/heroes/roofing.jpg", "A roof"),
    photo("/media/heroes/plumbing.jpg", "A rough-in"),
  ],
  clean: [photo("/media/heroes/clean.jpg", "A turned room")],
  field: [photo("/media/gallery/field-service.svg", "The van")],
  locksmith: [film("/media/heroes/mobile-locksmith.mp4", "The van")],
  firewood: [photo("/media/heroes/firewood.jpg", "A delivered cord")],
  security: [film("/media/heroes/private-security.mp4", "The post")],
  practice: [photo("/media/heroes/practice.jpg", "The room")],
  counsel: [photo("/media/heroes/counsel.jpg", "The consult")],
  location: [photo("/media/heroes/salon.jpg", "A finished cut"), film("/media/clipper.mp4", "The chair")],
  studio: [photo("/media/gallery/app-studio.svg", "A launched book")],
  retail: [film("/media/heroes/retail.mp4", "The shelf")],
  trade: [photo("/media/heroes/trade.jpg", "A weld")],
};

export function defaultProof(niche: ShopNiche): ProofFrame[] {
  return ALBUM[niche];
}

export function isCustomProof(imageUrl: string): boolean {
  return imageUrl.startsWith("data:image/");
}
