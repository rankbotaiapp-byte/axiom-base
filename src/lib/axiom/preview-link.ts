import { RIPPLE_THEMES, type RippleThemeId } from "./brand-studio.ts";
import { classifyTrade, nicheForLead } from "./directory.ts";
import { funnelUrl } from "./funnel.ts";
import { PRESENTATION_STYLES, type PresentationStyle } from "./intro.ts";
import { isPlumbingCampaign, plumberCampaignPath } from "./plumber-outreach.ts";
import { HOME_REGION_COUNTIES } from "./regional-roster.ts";
import { isShopNiche, type ShopNiche } from "./types.ts";

/** First automated nudge after the Day 0 launch. */
export const UNACTIVATED_FOLLOW_UP_HOURS = 72;
export const UNACTIVATED_FOLLOW_UP_MS = UNACTIVATED_FOLLOW_UP_HOURS * 60 * 60 * 1000;

export function isHomePreviewCounty(county: string): boolean {
  const key = county.trim().toLowerCase();
  return HOME_REGION_COUNTIES.some((item) => item.toLowerCase() === key);
}

/**
 * A demo path segment. Exact niche ids win. Film and category slugs such as
 * `auto-repair` resolve to the shop niche that plays that film. Unknown
 * segments stay unmatched so the route can 404.
 */
const RETIRED_DEMO_SLUGS = new Set(["clinic", "practice", "advisor", "counsel", "consulting"]);

function isRetiredDemo(value: string): boolean {
  return RETIRED_DEMO_SLUGS.has(value.trim().toLowerCase());
}

export function resolveDemoNiche(slug: string): ShopNiche | null {
  const key = slug.trim().toLowerCase().replace(/(\.mp4)+$/g, "").replace(/_/g, "-");
  if (!key || isRetiredDemo(key)) return null;
  if (isShopNiche(key)) return key;
  for (const candidate of [key, key.replace(/-/g, " ")]) {
    try {
      const classified = classifyTrade(candidate);
      if (classified.known && isShopNiche(classified.tradeType) && !isRetiredDemo(classified.tradeType)) {
        return classified.tradeType;
      }
    } catch {
      // A blank or generic phrase is not a demo.
    }
  }
  return null;
}

/** Public and internal shop niches both open on `/demo`. Unknown phrases use the open trade template. */
export function previewNicheSlug(tradeType: string, tradeLabel = ""): string {
  const niche = nicheForLead(tradeType, tradeLabel);
  if (isRetiredDemo(niche) || isRetiredDemo(tradeType)) return "contractor";
  return isShopNiche(niche) ? niche : "contractor";
}

export type PreviewLead = {
  businessName: string;
  tradeType: string;
  tradeLabel?: string;
  county: string;
  leadSlug?: string;
  leadId?: string;
  city?: string;
  stopToken?: string;
  greet?: boolean;
  trade?: string;
};

/**
 * Personalized storefront. Plumbing always uses the industrial /t/{slug} campaign
 * (hero + greeting), any county. Other trades stay on the Southern Oregon demo.
 */
export function tenantPreviewUrl(origin: string, lead: PreviewLead): string | null {
  const business = lead.businessName.trim().slice(0, 80);
  if (!business) return null;
  const base = origin.trim().replace(/\/$/, "");
  if (!base) return null;
  const tradeHint = `${lead.tradeType} ${lead.tradeLabel ?? ""} ${lead.trade ?? ""}`;
  if (isPlumbingCampaign(tradeHint) || isPlumbingCampaign(lead.tradeType)) {
    const slug = (lead.leadSlug ?? "").trim() || "accurate-plumbing";
    const url = new URL(plumberCampaignPath(slug, { greet: true }), `${base}/`);
    const leadId = (lead.leadId ?? "").trim();
    if (leadId) url.searchParams.set("lead", leadId);
    const county = lead.county.trim();
    if (county) url.searchParams.set("county", county);
    const city = (lead.city ?? "").trim().slice(0, 80);
    if (city) url.searchParams.set("city", city);
    if (lead.stopToken) url.searchParams.set("t", lead.stopToken);
    return url.toString();
  }
  if (!isHomePreviewCounty(lead.county)) return null;
  const niche = previewNicheSlug(lead.tradeType, lead.tradeLabel ?? "");
  const url = new URL(`/demo/${niche}`, `${base}/`);
  url.searchParams.set("preview", "true");
  url.searchParams.set("business", business);
  if (lead.leadSlug) url.searchParams.set("b", lead.leadSlug);
  const leadId = (lead.leadId ?? "").trim();
  if (leadId) url.searchParams.set("lead", leadId);
  const county = lead.county.trim();
  if (county) url.searchParams.set("county", county);
  const city = (lead.city ?? "").trim().slice(0, 80);
  if (city) url.searchParams.set("city", city);
  if (lead.stopToken) url.searchParams.set("t", lead.stopToken);
  return url.toString();
}

/** The link that goes in `{url}` for email and SMS. Home counties get the demo preview. */
export function outreachDestination(origin: string, lead: PreviewLead & { leadSlug: string }): string {
  return (
    tenantPreviewUrl(origin, lead) ??
    funnelUrl(origin, {
      leadSlug: lead.leadSlug,
      leadId: lead.leadId,
      county: lead.county,
      stopToken: lead.stopToken,
      greet: lead.greet,
      businessName: lead.businessName,
      trade: lead.trade,
      city: lead.city,
    })
  );
}

export function bodyHasPreviewLink(body: string): boolean {
  return (
    (body.includes("/demo/") && body.includes("preview=true")) ||
    /\/t\/[a-z0-9-]+\?[^ \n]*niche=plumbing/.test(body)
  );
}

/** Adds the preview link once. A body that already carries one is left as written. */
export function appendPreviewLink(body: string, url: string): string {
  const link = url.trim();
  if (!link || bodyHasPreviewLink(body) || body.includes(link)) return body;
  const base = body.trimEnd();
  if (!base) return link;
  const noticeAt = noticeStart(base);
  if (noticeAt > 0) {
    const lead = base.slice(0, noticeAt).trimEnd();
    const notice = base.slice(noticeAt).trimStart();
    return `${lead}\n${link}\n\n${notice}`;
  }
  return `${base}\n${link}`;
}

function noticeStart(body: string): number {
  const sms = body.search(/\nReply STOP to opt out/i);
  const email = body.search(/\nThis is a business-to-business message/i);
  if (sms >= 0 && email >= 0) return Math.min(sms, email);
  return sms >= 0 ? sms : email;
}

/** Follow-ups halt the moment a lead replies, books, claims, or opens the page. */
export function shouldSendUnactivatedFollowUp(input: {
  step: number;
  claimed: boolean;
  clicked: boolean;
  booked?: boolean;
  replied?: boolean;
}): boolean {
  if (input.clicked || input.claimed || input.booked || input.replied) return false;
  return input.step === 3 || input.step === 7;
}

export function unactivatedFollowUpAt(from: Date): string {
  return new Date(from.getTime() + UNACTIVATED_FOLLOW_UP_MS).toISOString();
}

function nameCode(value: string): number {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

/** Stable theme so the same business name always opens the same glass and ring. */
export function previewThemeId(businessName: string): RippleThemeId {
  const theme = RIPPLE_THEMES[nameCode(businessName) % RIPPLE_THEMES.length];
  return theme?.id ?? "electric-blue";
}

/** Stable hero presentation, offset from the theme so the two choices are not locked together. */
export function previewStyleId(businessName: string): PresentationStyle {
  const style = PRESENTATION_STYLES[(nameCode(businessName) + 3) % PRESENTATION_STYLES.length];
  return style?.id ?? "cinematic-pan";
}
