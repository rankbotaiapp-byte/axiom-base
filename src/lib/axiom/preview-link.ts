import { RIPPLE_THEMES, type RippleThemeId } from "./brand-studio.ts";
import { classifyTrade, nicheForLead } from "./directory.ts";
import { funnelUrl } from "./funnel.ts";
import { PRESENTATION_STYLES, type PresentationStyle } from "./intro.ts";
import { HOME_REGION_COUNTIES } from "./regional-roster.ts";
import { isShopNiche, type ShopNiche } from "./types.ts";

/** Unactivated accounts get the next note two days after the launch touch. */
export const UNACTIVATED_FOLLOW_UP_HOURS = 48;
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
export function resolveDemoNiche(slug: string): ShopNiche | null {
  const key = slug.trim().toLowerCase().replace(/(\.mp4)+$/g, "").replace(/_/g, "-");
  if (!key) return null;
  if (isShopNiche(key)) return key;
  for (const candidate of [key, key.replace(/-/g, " ")]) {
    try {
      const classified = classifyTrade(candidate);
      if (classified.known && isShopNiche(classified.tradeType)) return classified.tradeType;
    } catch {
      // A blank or generic phrase is not a demo.
    }
  }
  return null;
}

/** Public and internal shop niches both open on `/demo`. Unknown phrases use the open trade template. */
export function previewNicheSlug(tradeType: string, tradeLabel = ""): string {
  const niche = nicheForLead(tradeType, tradeLabel);
  return isShopNiche(niche) ? niche : "trade";
}

export type PreviewLead = {
  businessName: string;
  tradeType: string;
  tradeLabel?: string;
  county: string;
  leadSlug?: string;
  city?: string;
  stopToken?: string;
  greet?: boolean;
  trade?: string;
};

/**
 * Personalized storefront for Jackson, Josephine, and Douglas leads.
 * Other counties stay on the homepage funnel.
 */
export function tenantPreviewUrl(origin: string, lead: PreviewLead): string | null {
  if (!isHomePreviewCounty(lead.county)) return null;
  const business = lead.businessName.trim().slice(0, 80);
  if (!business) return null;
  const niche = previewNicheSlug(lead.tradeType, lead.tradeLabel ?? "");
  const base = origin.trim().replace(/\/$/, "") || "http://localhost";
  const url = new URL(`/demo/${niche}`, `${base}/`);
  url.searchParams.set("preview", "true");
  url.searchParams.set("business", business);
  if (lead.leadSlug) url.searchParams.set("b", lead.leadSlug);
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
  return body.includes("/demo/") && body.includes("preview=true");
}

/** Adds the preview link once. A body that already carries one is left as written. */
export function appendPreviewLink(body: string, url: string): string {
  const link = url.trim();
  if (!link || bodyHasPreviewLink(body) || body.includes(link)) return body;
  const base = body.trimEnd();
  return base ? `${base}\n${link}` : link;
}

/** Day 2 fires only when the account has not been claimed and has not opened the page. */
export function shouldSendUnactivatedFollowUp(input: {
  step: number;
  claimed: boolean;
  clicked: boolean;
}): boolean {
  if (input.clicked) return false;
  if (input.step !== 2) return true;
  return !input.claimed;
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
