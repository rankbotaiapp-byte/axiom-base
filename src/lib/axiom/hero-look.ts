export type HeroLook = {
  brackets: boolean;
  glow: boolean;
  overlay: boolean;
};

export const DEFAULT_HERO_LOOK: HeroLook = { brackets: false, glow: false, overlay: true };

export function parseHeroLook(value: unknown): HeroLook {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    brackets: row.brackets === true,
    glow: row.glow === true,
    overlay: row.overlay !== false,
  };
}

/** Look flags stored beside the trade profile's hero brand. */
export function heroLookFromProfile(raw: unknown): HeroLook {
  if (typeof raw === "string") {
    if (!raw.trim()) return DEFAULT_HERO_LOOK;
    try {
      return heroLookFromProfile(JSON.parse(raw));
    } catch {
      return DEFAULT_HERO_LOOK;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_HERO_LOOK;
  const brand = (raw as { heroBrand?: unknown }).heroBrand;
  if (!brand || typeof brand !== "object" || Array.isArray(brand)) return DEFAULT_HERO_LOOK;
  const look = (brand as { look?: unknown }).look;
  if (!look || typeof look !== "object") return DEFAULT_HERO_LOOK;
  return parseHeroLook(look);
}
