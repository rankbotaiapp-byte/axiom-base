/**
 * Full historical hero-loop archive for paid-tenant Hero Studio.
 * Combines HeroLibrary entries, ROOT_HERO_ANIMATION_FILES, and staged-experience media.
 */
import { HERO_LIBRARY, heroLibraryEntryByUrl, type HeroLibraryEntry } from "../../config/HeroLibrary.ts";
import { EXTRA_HERO_LOOPS, ROOT_HERO_ANIMATION_FILES } from "../../config/catalog.ts";
import { mediaLibraryLoops, mediaThemeLabel } from "../../config/mediaLibrary.ts";
import { STAGED_EXPERIENCES } from "./staged-experiences.ts";
import { LOOP_TAIL_TRIM_SEC } from "./loop-trim.ts";

export type HistoricalHeroAsset = {
  id: string;
  name: string;
  src: string;
  thumbnail: string;
  collection: string;
  tags: string[];
};

function labelFromFile(file: string): string {
  return file
    .replace(/^.*\//, "")
    .replace(/\.mp4$/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function pushUnique(
  seen: Set<string>,
  rows: HistoricalHeroAsset[],
  asset: HistoricalHeroAsset,
) {
  const key = asset.src.split("?")[0] ?? asset.src;
  if (seen.has(key) || key.includes("..")) return;
  seen.add(key);
  rows.push({ ...asset, src: key, thumbnail: asset.thumbnail || key });
}

/** Every verified background loop available to tenant Hero Studio. */
export function historicalHeroArchive(): HistoricalHeroAsset[] {
  const seen = new Set<string>();
  const rows: HistoricalHeroAsset[] = [];

  for (const asset of mediaLibraryLoops()) {
    const named = heroLibraryEntryByUrl(asset.url);
    pushUnique(seen, rows, {
      id: asset.id,
      name: named?.name ?? asset.label,
      src: asset.url,
      thumbnail: asset.thumbnail,
      collection: named?.collection ?? mediaThemeLabel(asset.theme),
      tags: [asset.theme, ...asset.niches, "library"],
    });
  }

  for (const item of HERO_LIBRARY as readonly HeroLibraryEntry[]) {
    pushUnique(seen, rows, {
      id: item.id,
      name: item.name,
      src: item.videoUrl,
      thumbnail: item.thumbnail,
      collection: item.collection,
      tags: [item.category, item.collection, "library"],
    });
  }

  for (const file of ROOT_HERO_ANIMATION_FILES) {
    const src = `/media/${file}`;
    pushUnique(seen, rows, {
      id: file.replace(/\.mp4$/i, ""),
      name: labelFromFile(file),
      src,
      thumbnail: src,
      collection: "Historical",
      tags: ["hero-animation", "archive"],
    });
  }

  for (const loop of EXTRA_HERO_LOOPS) {
    const src = `/media/${loop.file}`;
    pushUnique(seen, rows, {
      id: `extra-${loop.id}`,
      name: loop.label,
      src,
      thumbnail: src,
      collection: "Extras",
      tags: ["extra", loop.id],
    });
  }

  for (const exp of STAGED_EXPERIENCES) {
    for (const media of exp.media) {
      if (!/\.mp4(?:$|\?)/i.test(media)) continue;
      pushUnique(seen, rows, {
        id: `${exp.slug}-${media.replace(/^\/media\//, "").replace(/\.mp4$/i, "")}`,
        name: `${exp.title} · ${labelFromFile(media)}`,
        src: media,
        thumbnail: media,
        collection: "Staged",
        tags: [exp.slug, "staged", "module"],
      });
    }
  }

  // Tactical / cinematic loops that are not named `*-hero-animation.mp4`.
  for (const file of [
    "garage-loop.mp4",
    "drone-loop.mp4",
    "land-clearing-loop.mp4",
    "cyber-augment-loop.mp4",
    "cyber-stinger-loop.mp4",
    "cyber-stinger-portrait.mp4",
    "otter-adventures-loop.mp4",
    "abyssal-sanctuary-loop.mp4",
    "obsidian-crystal-orbit.mp4",
    "obsidian-zero-point-core.mp4",
    "silver-orb-hero-animation.mp4",
    "leopard-hero-path.mp4",
  ] as const) {
    const src = `/media/${file}`;
    pushUnique(seen, rows, {
      id: `tactical-${file.replace(/\.mp4$/i, "")}`,
      name: labelFromFile(file),
      src,
      thumbnail: src,
      collection: "Tactical",
      tags: ["tactical", "loop", "archive"],
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name) || a.src.localeCompare(b.src));
}

export function filterHistoricalHeroArchive(
  query: string,
  collection?: string,
): HistoricalHeroAsset[] {
  const q = query.trim().toLowerCase();
  const all = historicalHeroArchive();
  return all.filter((row) => {
    if (collection && collection !== "all" && row.collection !== collection) return false;
    if (!q) return true;
    const hay = `${row.name} ${row.collection} ${row.tags.join(" ")} ${row.src}`.toLowerCase();
    return hay.includes(q);
  });
}

export function historicalArchiveCollections(): string[] {
  const set = new Set(historicalHeroArchive().map((r) => r.collection));
  return ["all", ...[...set].sort((a, b) => a.localeCompare(b))];
}

export { LOOP_TAIL_TRIM_SEC };
