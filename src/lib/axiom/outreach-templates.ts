/**
 * Niche-specific outreach SMS / email builders.
 * Plumbing campaign templates pin the Emergency Plumbing cinematic + /demo/plumbing storefront.
 */
import {
  demoStorefrontPath,
  outreachNicheHero,
  outreachNicheLabel,
} from "./outreach-niche-batch.ts";
import { renderOutreachMessage } from "./funnel.ts";
import { founderMediaUrls } from "./founder-welcome";

export const PLUMBING_EMERGENCY_HERO = "/media/axio-plumber-hero.mp4";
export const PLUMBING_EMERGENCY_HERO_MOBILE = "/media/axio-plumber-hero-mobile.mp4";
export const PLUMBING_EMERGENCY_POSTER = "/media/axio-plumber-hero.jpg";

export type OutreachTemplateDraft = {
  text: string;
  emailSubject: string;
  emailBody: string;
};

/** Done-for-you + missed-call copy for the Emergency Plumbing batch (20,330 leads). */
export const PLUMBING_OUTREACH_TEMPLATES: OutreachTemplateDraft = {
  text:
    "{owner} — missed calls cost {business} jobs while you're on a callout. $1 trial · 24/7 AI booking · $150/mo autopilot.\nEric's welcome: {founder_video}\nYour {city} page: {url}",
  emailSubject: "{owner} — {business} · $1 trial, AI books 24/7",
  emailBody:
    "Hi {owner},\n\nAfter-hours leak and drain jobs in {county} still ring — and walk if nobody texts back.\n\n$1 trial. Instant AI booking on your page. Autopilot follows up until day 14, then $150/mo.\n\nOpen your preview — Eric's welcome film first, then your trade loop and live booker:\n{url}\n\nWelcome: {founder_video}\nPoster: {founder_poster}\nShop loop: {video}\n\nClaim it before the next emergency walks.",
};

export function outreachTemplatesForNiche(niche: string): OutreachTemplateDraft {
  const id = (niche || "").trim().toLowerCase();
  if (id === "plumbing" || id === "emergency plumbing" || id.includes("plumb")) {
    return PLUMBING_OUTREACH_TEMPLATES;
  }
  return {
    text:
      "{owner} — {business} · $1 trial, AI books 24/7, $150/mo autopilot.\nEric: {founder_video}\nPreview: {url}",
    emailSubject: "{owner} — {business} is live to book jobs",
    emailBody:
      "Hi {owner},\n\n{business} in {city} has a 24/7 booking page with after-hours dispatch.\n\n$1 trial · then $150/mo autopilot.\n\n{url}\n\nEric welcome: {founder_video}\nTrade film: {video}\n",
  };
}

export function plumbingCampaignTokens(input: {
  origin: string;
  businessName: string;
  leadSlug?: string;
  leadId?: string;
  city?: string;
  county?: string;
  phone?: string;
  email?: string;
  owner?: string;
}): {
  business: string;
  owner: string;
  trade: string;
  city: string;
  county: string;
  url: string;
  video: string;
  video_thumb: string;
  founder_video: string;
  founder_poster: string;
  heroPath: string;
} {
  const niche = "plumbing";
  const trade = outreachNicheLabel(niche);
  const heroPath = outreachNicheHero(niche) || PLUMBING_EMERGENCY_HERO;
  const origin = input.origin.replace(/\/$/, "");
  const demoPath = demoStorefrontPath({
    niche,
    businessName: input.businessName,
    leadSlug: input.leadSlug,
    leadId: input.leadId,
    city: input.city,
    county: input.county,
    phone: input.phone,
    email: input.email,
    tradeLabel: trade,
  });
  const url = `${origin}${demoPath}`;
  const video = heroPath.startsWith("http") ? heroPath : `${origin}${heroPath}`;
  const founder = founderMediaUrls(origin);
  return {
    business: input.businessName,
    owner: input.owner || input.businessName,
    trade,
    city: input.city || "",
    county: input.county || "",
    url,
    video,
    video_thumb: `${origin}${PLUMBING_EMERGENCY_POSTER}`,
    founder_video: founder.founder_video,
    founder_poster: founder.founder_poster,
    heroPath,
  };
}

export function renderPlumbingOutreach(
  channel: "sms" | "email",
  tokens: ReturnType<typeof plumbingCampaignTokens>,
): { subject: string; body: string } {
  const draft = PLUMBING_OUTREACH_TEMPLATES;
  if (channel === "sms") {
    return { subject: "", body: renderOutreachMessage(draft.text, tokens) };
  }
  return {
    subject: renderOutreachMessage(draft.emailSubject, tokens).slice(0, 200),
    body: renderOutreachMessage(draft.emailBody, tokens),
  };
}
