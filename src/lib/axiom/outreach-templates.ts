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

export const PLUMBING_EMERGENCY_HERO = "/media/axiom-plumber-hero.mp4";
export const PLUMBING_EMERGENCY_HERO_MOBILE = "/media/axiom-plumber-hero-mobile.mp4";
export const PLUMBING_EMERGENCY_POSTER = "/media/axiom-plumber-hero.jpg";

export type OutreachTemplateDraft = {
  text: string;
  emailSubject: string;
  emailBody: string;
};

/** Done-for-you + missed-call copy for the Emergency Plumbing batch (20,330 leads). */
export const PLUMBING_OUTREACH_TEMPLATES: OutreachTemplateDraft = {
  text:
    "{owner} — emergency calls to {business} go quiet while you're on a job. Your 24/7 plumbing page in {city} opens with Eric's face-to-camera greeting, then your shop loop.\nPreview: {url}\nShop loop: {video}",
  emailSubject: "{owner}, {business} — your emergency plumbing page is live",
  emailBody:
    "Hi {owner},\n\nWhile {business} is on a callout, after-hours leak and drain jobs in {county} still ring — and walk if nobody texts back.\n\nYour Emergency Plumbing storefront is pre-built. Open the link and Eric greets you face-to-camera first, then your niche cinematic and live missed-call recovery:\n{url}\n\nShop loop after the greeting:\n{video}\nPoster: {video_thumb}\n\nClaim the page and keep the next emergency booking on your desk.",
};

export function outreachTemplatesForNiche(niche: string): OutreachTemplateDraft {
  const id = (niche || "").trim().toLowerCase();
  if (id === "plumbing" || id === "emergency plumbing" || id.includes("plumb")) {
    return PLUMBING_OUTREACH_TEMPLATES;
  }
  return {
    text: "{owner} — {business} has a booking page ready.\nPreview: {url}\n{video}",
    emailSubject: "{owner}, the {business} page is ready",
    emailBody:
      "Hi {owner},\n\n{business} has a storefront ready for {city} / {county}.\n\nPreview:\n{url}\n\nFilm:\n{video}\n",
  };
}

export function plumbingCampaignTokens(input: {
  origin: string;
  businessName: string;
  leadSlug?: string;
  leadId?: string;
  city?: string;
  county?: string;
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
    tradeLabel: trade,
  });
  const url = `${origin}${demoPath}`;
  const video = heroPath.startsWith("http") ? heroPath : `${origin}${heroPath}`;
  return {
    business: input.businessName,
    owner: input.owner || input.businessName,
    trade,
    city: input.city || "",
    county: input.county || "",
    url,
    video,
    video_thumb: `${origin}${PLUMBING_EMERGENCY_POSTER}`,
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
