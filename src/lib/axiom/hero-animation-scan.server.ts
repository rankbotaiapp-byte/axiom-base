import { readdirSync } from "node:fs";
import { join } from "node:path";
import { heroAnimationsFromNames, heroPresets, type HeroPreset } from "./hero-studio-state.ts";

/** Reads `public/media` and keeps only `*-hero-animation.mp4`. */
export function readHeroAnimationPresets(directory = join(process.cwd(), "public", "media")): HeroPreset[] {
  try {
    const names = readdirSync(directory).filter((name) => !name.includes("/") && !name.includes("\\"));
    const found = heroAnimationsFromNames(names);
    return found.length > 0 ? found : heroPresets();
  } catch {
    return heroPresets();
  }
}
