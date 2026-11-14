import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  CATALOG,
  EXTRA_HERO_LOOPS,
  NICHE_HERO_FILENAME,
  catalogFilmPath,
  catalogFilmUrl,
} from "../../config/catalog.ts";
import { heroPresets, type HeroPreset } from "./hero-studio-state.ts";

/** Niche folder loops first, then extra pins still sitting in the media root. */
export function readHeroAnimationPresets(directory = join(process.cwd(), "public", "media")): HeroPreset[] {
  try {
    const rows: HeroPreset[] = [];
    for (const row of CATALOG) {
      const dedicated = join(directory, row.id, NICHE_HERO_FILENAME);
      rows.push({
        id: row.id,
        label: row.label,
        url: existsSync(dedicated) ? `/media/${row.id}/${NICHE_HERO_FILENAME}` : catalogFilmUrl(row.id),
      });
    }
    for (const extra of EXTRA_HERO_LOOPS) {
      if (!existsSync(join(directory, extra.file))) continue;
      rows.push({ id: extra.id, label: extra.label, url: catalogFilmPath(extra.file) });
    }
    return rows.length > 0 ? rows : heroPresets();
  } catch {
    return heroPresets();
  }
}
