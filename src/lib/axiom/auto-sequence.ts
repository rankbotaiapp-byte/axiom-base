/** Portal opener, then the single auto-hero film, then the live desk. */
export const AUTO_HERO_SRC = "/media/heroes/auto-hero.mp4";
export const AUTO_REPAIR_SRC = "/media/heroes/auto-repair.mp4.mp4";

/** The timed reel stays on auto-hero. If that file is absent, play the auto-repair film. */
export function swapMissingAutoHero(video: HTMLVideoElement) {
  if (video.dataset.repairFallback === "1") return;
  const src = video.currentSrc || video.src;
  if (!src.includes("auto-hero.mp4")) return;
  video.dataset.repairFallback = "1";
  video.src = AUTO_REPAIR_SRC;
  void video.play().catch(() => {});
}
/** The finished film opens on the portal, so the opener and the cockpit share one file. */
export const AUTO_PORTAL_SRC = AUTO_HERO_SRC;
export const AUTO_HERO_POSTER = "/media/auto-hero.jpg";

export const AUTO_SEQUENCE = {
  /** How long the portal stays up before the cut into the mechanic. */
  portalMs: 2400,
  /** auto-hero.mp4 is inside the car and the head unit is on. */
  headUnitSec: 11.2,
  /** Last clear head-unit frame. The file goes dark after this. */
  dashboardSec: 21.6,
} as const;

export type AutoBeat = "portal" | "mechanic" | "headunit" | "dashboard";

/** Beat inside auto-hero.mp4. The portal is timed separately, before this film starts. */
export function autoBeatFromFilm(filmSec: number): Exclude<AutoBeat, "portal"> {
  if (filmSec >= AUTO_SEQUENCE.dashboardSec) return "dashboard";
  if (filmSec >= AUTO_SEQUENCE.headUnitSec) return "headunit";
  return "mechanic";
}
