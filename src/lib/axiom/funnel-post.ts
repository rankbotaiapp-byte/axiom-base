import { presetForShopNiche } from "../../config/nichePresets.ts";

export type FunnelPostInput = {
  niche: string;
  city: string;
  pageUrl: string;
};

export type FunnelPost = {
  post: string;
  hashtags: string;
};

const POST_LIMIT = 280;

function clip(value: string, max = 80): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function hashtag(value: string): string {
  const parts = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return parts.length ? `#${parts.join("")}` : "";
}

/** One public post for a shop. The live link is not counted in the 280. */
export function buildFunnelPost(input: FunnelPostInput): FunnelPost {
  const pageUrl = clip(input.pageUrl, 300);
  if (pageUrl.includes(" ")) throw new Error("Page link is too long");
  const preset = presetForShopNiche(clip(input.niche, 80));
  const city = clip(input.city) || "Your city";
  const niche = preset.label || "Local service";
  const line = `${city}. ${niche}. ${preset.tagline}`.replace(/\s+/g, " ").trim();
  const post = line.length <= POST_LIMIT ? line : `${line.slice(0, POST_LIMIT - 1).trimEnd()}…`;
  const tags = [hashtag(city), hashtag(niche), ...preset.keywords.map(hashtag)].filter(Boolean);
  const hashtags = [...new Set(tags)].slice(0, 5).join(" ");
  return { post, hashtags };
}
