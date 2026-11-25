import {
  FOUNDER_OFFER_THUMB_PATH,
  FOUNDER_OFFER_VIDEO_PATH,
} from "@/lib/stripe/commercial";

/** Canonical founder intro assets for outreach + tenant welcome. */
export const FOUNDER_WELCOME_VIDEO = FOUNDER_OFFER_VIDEO_PATH;
export const FOUNDER_WELCOME_POSTER = FOUNDER_OFFER_THUMB_PATH;

export const AXIOM_CRO_OFFER_LINE =
  "$1 trial · 24/7 AI booking on your page · Autopilot pipeline, then $150/mo.";

export function founderMediaUrls(origin: string): { founder_video: string; founder_poster: string } {
  const base = origin.replace(/\/$/, "");
  return {
    founder_video: `${base}/videos/axiom-intro.mp4`,
    founder_poster: `${base}/videos/axiom-intro-poster.jpg`,
  };
}