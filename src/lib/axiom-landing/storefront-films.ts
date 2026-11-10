/**
 * Storefront film hierarchy. Greeting never lives in the hero feed or
 * showcase tabs — it belongs only in About Builder / Founder Story.
 */
export const HEART_GEARS_SRC = "/media/axioms-heart.mp4";
export const HEART_GEARS_POSTER = "/media/axioms-heart-poster.jpg";
/** Alias some briefs use; the shipped file is axioms-heart.mp4. */
export const HEART_GEARS_ALIAS = "/media/heart-gears-animation.mp4";

export const LIQUID_WRENCH_SRC = "/media/gemini_generated_video_5d59539e.mp4";
export const LIQUID_WRENCH_ALIAS = "/media/liquid-wrench-transformation.mp4";
export const ELECTRICAL_METER_SRC = "/media/electrician-hero-animation.mp4";
export const PLUMBERS_DRAIN_SRC = "/media/plumbers-outreach-hero-animation.mp4";
export const PLUMBING_DIAGNOSTIC_SRC = "/media/plumbing-diagnostic-telemetry.mp4";
export const PLUMBING_DIAGNOSTIC_SRC_FALLBACK = "/media/plumbing-diagnostic-telemetry.mp4.mp4";
export const PLUMBING_FIELD_OPS_SRC = "/media/plumber-field-operations.mp4";
export const PLUMBING_FIELD_OPS_SRC_FALLBACK = "/media/plumber-field-operations.mp4.mp4";
export const FOUNDER_GREETING_SRC = "/media/axiom-greeting.mp4";
export const FOUNDER_GREETING_POSTER = "/media/axiom-greeting-poster.jpg";

export type StorefrontFilmTab = {
  id: string;
  src: string;
  poster?: string;
  label: string;
  kicker: string;
  telemetry: boolean;
};

/** Primary landing hero reel — heart + liquid/meter morphs. No greeting. */
export const HERO_FEED: readonly StorefrontFilmTab[] = [
  {
    id: "heart",
    src: HEART_GEARS_SRC,
    poster: HEART_GEARS_POSTER,
    label: "Heart & gears",
    kicker: "Axiom engine",
    telemetry: false,
  },
  {
    id: "liquid",
    src: LIQUID_WRENCH_SRC,
    label: "Liquid to wrench",
    kicker: "Trade morph",
    telemetry: false,
  },
  {
    id: "meter",
    src: ELECTRICAL_METER_SRC,
    label: "Electrical meter",
    kicker: "Meter morph",
    telemetry: false,
  },
];

/** Public landing showcase — mechanical films only. Drain stays off this page. */
export const SHOWCASE_TABS: readonly StorefrontFilmTab[] = [...HERO_FEED];

export function isFounderGreetingFilm(src: string | undefined | null): boolean {
  if (!src) return false;
  return /axiom-greeting(\.mp4)+$/i.test(src.split("?")[0] ?? "");
}

export function heroFeedSources(): readonly string[] {
  return HERO_FEED.map((tab) => tab.src);
}

export function showcaseSources(): readonly string[] {
  return SHOWCASE_TABS.map((tab) => tab.src);
}
