/** Storefront cinematic grade: global theme default, optional per-photo override. */
export function resolveCinemaGrade(global?: boolean | null, local?: boolean | null): boolean {
  if (typeof local === "boolean") return local;
  return global !== false;
}

export const CINEMATIC_GRADE_FILTER = "contrast(1.06) saturate(1.08) brightness(0.97)";
export const CINEMATIC_GRAIN_OPACITY = 0.035;
export const CINEMATIC_CYAN = "#00ffcc";
export const CINEMATIC_GOLD = "#FFE500";
export const CINEMATIC_OBSIDIAN = "#050507";
