import { HERO_LIBRARY, heroLibraryEntryByUrl, type HeroLibraryEntry } from "../../config/HeroLibrary.ts";
import { LOOP_TAIL_TRIM_SEC } from "./loop-trim.ts";

export type HeroLibraryItem = {
  id: string;
  name: string;
  src: string;
  thumbnail: string;
  kind: "master-default" | "library" | "legacy" | string;
  category: HeroLibraryEntry["category"];
  collection: HeroLibraryEntry["collection"];
  loopTailTrimSec: number;
};

export const HERO_LIBRARY_TRIM_SEC = LOOP_TAIL_TRIM_SEC;

function kindFor(entry: HeroLibraryEntry): HeroLibraryItem["kind"] {
  if (entry.videoUrl.includes("/master-defaults/")) return "master-default";
  if (entry.videoUrl.includes("/heroes/")) return "legacy";
  return "library";
}

export function heroLibraryItems(): HeroLibraryItem[] {
  return HERO_LIBRARY.map((item) => ({
    id: item.id,
    name: item.name,
    src: item.videoUrl,
    thumbnail: item.thumbnail,
    kind: kindFor(item),
    category: item.category,
    collection: item.collection,
    loopTailTrimSec: item.loopTailTrimSec ?? HERO_LIBRARY_TRIM_SEC,
  }));
}

export function heroLibraryBySrc(url: string | null | undefined): HeroLibraryItem | undefined {
  const entry = heroLibraryEntryByUrl(url);
  if (!entry) return undefined;
  return heroLibraryItems().find((item) => item.src === entry.videoUrl);
}

export function isHeroLibrarySrc(url: string | null | undefined): boolean {
  return Boolean(heroLibraryEntryByUrl(url));
}
