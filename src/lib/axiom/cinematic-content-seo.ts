/**
 * Autonomous content + local SEO helpers for the cinematic landing experience.
 *
 * Frontend metadata and posting plans share this module so storefronts climb
 * local SERPs while the Autopilot content engine publishes branded clips.
 */

import { composeAutopilotClip, tradeCopyForNiche } from "../../config/AutopilotContentEngine.ts";
import { tradeKeywordsForNiche } from "./autopilot-content.ts";

export const CINEMATIC_HERO_VIDEO = "/media/underwater-leapord-hero-animation.mp4";
export const CINEMATIC_HERO_POSTER = "/media/leopard-hero-animation.mp4";

export type AutonomousPostChannel = "web" | "instagram" | "facebook" | "tiktok" | "youtube_shorts";

export type AutonomousPost = {
  channel: AutonomousPostChannel;
  cadence: string;
  caption: string;
  assetHint: string;
  assetUrl: string;
};

export type AutonomousContentPlan = {
  niche: string;
  city: string;
  tradeLabel: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  posts: AutonomousPost[];
  localBusinessJsonLd: Record<string, unknown>;
  breadcrumbJsonLd: Record<string, unknown>;
};

const CHANNELS: AutonomousPostChannel[] = ["web", "instagram", "facebook", "tiktok", "youtube_shorts"];

const CADENCE: Record<AutonomousPostChannel, string> = {
  web: "daily site refresh",
  instagram: "3× weekly reel",
  facebook: "3× weekly post",
  tiktok: "daily short",
  youtube_shorts: "daily short",
};

/** Build a multi-platform posting plan + LocalBusiness JSON-LD for a niche market. */
export function buildAutonomousContentPlan(input: {
  niche: string;
  city?: string;
  businessName?: string;
  origin?: string;
  bookPath?: string;
}): AutonomousContentPlan {
  const niche = (input.niche || "contractor").trim().toLowerCase() || "contractor";
  const city = (input.city || "your city").trim() || "your city";
  const business = (input.businessName || "Axiom").trim() || "Axiom";
  const { tradeLabel, tradeLine } = tradeCopyForNiche(niche);
  const origin = (input.origin || "https://axiom.shop").replace(/\/$/, "");
  const bookUrl = `${origin}${input.bookPath || "/onboard"}`;
  const seoTitle = `${tradeLabel} in ${city} · 24/7 booking powered by Axiom`;
  const seoDescription = `${business} runs automated booking, missed-call text-back, and branded content for ${tradeLabel.toLowerCase()} crews in ${city}. Live in minutes — no coding.`;
  const tradeKeys = tradeKeywordsForNiche(niche);
  const keywords = [
    `${tradeLabel.toLowerCase()} ${city}`,
    `best ${tradeLabel.toLowerCase()} near me`,
    `${city} ${tradeLabel.toLowerCase()} booking`,
    "24/7 service booking",
    "missed call text back",
    "local SEO storefront",
    ...tradeKeys.slice(0, 4),
  ];

  const clip = composeAutopilotClip({
    loopUrl: CINEMATIC_HERO_VIDEO,
    shopName: business,
    city,
    bookUrl,
    niche,
  });

  const posts = CHANNELS.map((channel) => ({
    channel,
    cadence: CADENCE[channel],
    caption: clip.caption,
    assetHint: channel === "web" ? "hero loop + LocalBusiness schema" : "branded autopilot clip + city overlay",
    assetUrl: channel === "web" ? CINEMATIC_HERO_VIDEO : clip.loopUrl || CINEMATIC_HERO_VIDEO,
  }));

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: business,
    description: seoDescription,
    areaServed: city,
    url: origin,
    image: `${origin}${CINEMATIC_HERO_VIDEO}`,
    priceRange: "$$",
    slogan: tradeLine,
    knowsAbout: keywords.slice(0, 6),
    makesOffer: {
      "@type": "Offer",
      name: "24/7 automated booking storefront",
      description: tradeLine,
      url: bookUrl,
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: bookUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Axiom", item: origin },
      { "@type": "ListItem", position: 2, name: tradeLabel, item: `${origin}/onboard?niche=${encodeURIComponent(niche)}` },
      { "@type": "ListItem", position: 3, name: city },
    ],
  };

  return {
    niche,
    city,
    tradeLabel,
    seoTitle,
    seoDescription,
    keywords,
    posts,
    localBusinessJsonLd,
    breadcrumbJsonLd,
  };
}

/** Head meta tags for the cinematic landing (TanStack `head` / document meta). */
export function cinematicLandingMeta(plan: AutonomousContentPlan) {
  return [
    { title: plan.seoTitle },
    { name: "description", content: plan.seoDescription },
    { name: "keywords", content: plan.keywords.join(", ") },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { name: "geo.placename", content: plan.city },
    { property: "og:title", content: plan.seoTitle },
    { property: "og:description", content: plan.seoDescription },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: plan.seoTitle },
    { name: "twitter:description", content: plan.seoDescription },
  ] as const;
}
