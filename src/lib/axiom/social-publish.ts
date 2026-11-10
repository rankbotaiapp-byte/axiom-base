/** Pure Graph / GBP payloads, token expiry, and delivery receipts. */

export const PUBLISH_PLATFORMS = ["facebook", "instagram", "gbp"] as const;
export type PublishPlatform = (typeof PUBLISH_PLATFORMS)[number];

export type SocialDelivery = {
  channel: PublishPlatform;
  platformPostId: string;
  deliveredAt: string;
  ok: boolean;
  error?: string;
};

export type GraphFeedPayload = {
  endpoint: string;
  body: Record<string, string>;
};

export type InstagramMediaPayload = {
  createEndpoint: string;
  publishEndpoint: string;
  imageUrl: string;
  caption: string;
};

export type GbpLocalPostPayload = {
  endpoint: string;
  body: {
    languageCode: "en-US";
    topicType: "STANDARD";
    summary: string;
    callToAction: { actionType: "LEARN_MORE" | "CALL"; url: string };
  };
};

export const GRAPH_VERSION = "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GBP_POSTS_BASE = "https://mybusiness.googleapis.com/v4";

const TOKEN_SKEW_MS = 5 * 60 * 1000;
const FACEBOOK_REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isPublishPlatform(value: unknown): value is PublishPlatform {
  return typeof value === "string" && (PUBLISH_PLATFORMS as readonly string[]).includes(value);
}

export function parsePublishPlatforms(value: unknown): PublishPlatform[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? safeJsonList(value) : [];
  const seen = new Set<PublishPlatform>();
  for (const item of raw) {
    if (isPublishPlatform(item)) seen.add(item);
  }
  return PUBLISH_PLATFORMS.filter((platform) => seen.has(platform));
}

export function defaultAutopilotChannels(): PublishPlatform[] {
  return [...PUBLISH_PLATFORMS];
}

export function tokenNeedsRefresh(
  expiresAt: string | Date | null | undefined,
  now = Date.now(),
  skewMs = TOKEN_SKEW_MS,
): boolean {
  if (!expiresAt) return false;
  const when = expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(String(expiresAt));
  if (!Number.isFinite(when)) return false;
  return when - now <= skewMs;
}

/** Facebook long-lived tokens last ~60 days — refresh in the last week. */
export function facebookTokenNeedsRefresh(
  expiresAt: string | Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!expiresAt) return true;
  const when = expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(String(expiresAt));
  if (!Number.isFinite(when)) return true;
  return when - now <= FACEBOOK_REFRESH_WINDOW_MS;
}

export function facebookFeedPayload(input: {
  pageId: string;
  message: string;
  link?: string;
}): GraphFeedPayload {
  const pageId = input.pageId.replace(/[^0-9_]/g, "").slice(0, 32);
  const body: Record<string, string> = { message: input.message.slice(0, 5000) };
  const link = (input.link ?? "").trim();
  if (/^https:\/\//i.test(link)) body.link = link;
  return { endpoint: `${GRAPH_BASE}/${pageId}/feed`, body };
}

export function instagramMediaPayload(input: {
  igUserId: string;
  imageUrl: string;
  caption: string;
}): InstagramMediaPayload {
  const igUserId = input.igUserId.replace(/[^0-9]/g, "").slice(0, 32);
  return {
    createEndpoint: `${GRAPH_BASE}/${igUserId}/media`,
    publishEndpoint: `${GRAPH_BASE}/${igUserId}/media_publish`,
    imageUrl: input.imageUrl,
    caption: input.caption.slice(0, 2200),
  };
}

export function gbpLocalPostPayload(input: {
  accountId: string;
  locationId: string;
  summary: string;
  articleUrl: string;
}): GbpLocalPostPayload {
  const accountId = input.accountId.replace(/[^\w.-]/g, "").slice(0, 80);
  const locationId = input.locationId.replace(/[^\w.-]/g, "").slice(0, 80);
  const url = /^https:\/\//i.test(input.articleUrl) ? input.articleUrl : "https://grok.com";
  return {
    endpoint: `${GBP_POSTS_BASE}/accounts/${accountId}/locations/${locationId}/localPosts`,
    body: {
      languageCode: "en-US",
      topicType: "STANDARD",
      summary: input.summary.slice(0, 1500),
      callToAction: { actionType: "LEARN_MORE", url },
    },
  };
}

export function publicMediaUrl(origin: string, assetPath: string): string {
  const src = (assetPath ?? "").trim();
  if (/^https:\/\//i.test(src)) return src;
  const base = origin.replace(/\/$/, "");
  if (!src) return base;
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

export function parseDeliveredJson(value: unknown): SocialDelivery[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? safeJsonList(value) : [];
  const out: SocialDelivery[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (!isPublishPlatform(row.channel)) continue;
    const platformPostId = String(row.platformPostId ?? "").trim().slice(0, 160);
    const deliveredAt = String(row.deliveredAt ?? "").trim();
    if (!platformPostId || !deliveredAt) continue;
    out.push({
      channel: row.channel,
      platformPostId,
      deliveredAt,
      ok: row.ok !== false,
      error: typeof row.error === "string" ? row.error.slice(0, 240) : undefined,
    });
  }
  return out;
}

export function mergeDeliveries(current: SocialDelivery[], next: SocialDelivery[]): SocialDelivery[] {
  const byChannel = new Map<PublishPlatform, SocialDelivery>();
  for (const row of current) if (row.ok && row.platformPostId) byChannel.set(row.channel, row);
  for (const row of next) {
    if (row.ok && row.platformPostId) byChannel.set(row.channel, row);
  }
  return PUBLISH_PLATFORMS.map((channel) => byChannel.get(channel)).filter(
    (row): row is SocialDelivery => Boolean(row),
  );
}

function safeJsonList(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
