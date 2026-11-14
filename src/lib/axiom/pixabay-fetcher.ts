/**
 * Pixabay video client — commercially cleared MP4s by trade keywords.
 * Docs: https://pixabay.com/api/videos/
 */

import { env } from "../env.server.ts";
import {
  daySeedFromDate,
  pickTradeKeyword,
  tradeKeywordsForNiche,
  type StockMediaAsset,
} from "./autopilot-content.ts";

const PIXABAY_VIDEOS_URL = "https://pixabay.com/api/videos/";

export type PixabayVideoSize = {
  url: string;
  width: number;
  height: number;
  size: number;
  thumbnail?: string;
};

export type PixabayVideoHit = {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  picture_id: string;
  videos: {
    large?: PixabayVideoSize;
    medium?: PixabayVideoSize;
    small?: PixabayVideoSize;
    tiny?: PixabayVideoSize;
  };
  views: number;
  downloads: number;
  likes: number;
  user: string;
  user_id: number;
};

export type PixabayVideosResponse = {
  total: number;
  totalHits: number;
  hits: PixabayVideoHit[];
};

export type PixabayFetchOptions = {
  niche?: string | null;
  /** Explicit search string; defaults to a rotating trade keyword for the niche. */
  query?: string;
  page?: number;
  perPage?: number;
  seed?: number;
  /** Prefer portrait / landscape / all. Pixabay has no orientation filter for video — used as post-pick hint. */
  preferPortrait?: boolean;
};

export function pixabayApiKey(): string | undefined {
  return env("PIXABAY_API_KEY") || env("PIXABAY_KEY");
}

/** Prefer HD MP4 under ~1080p; fall back through medium → small → large → tiny. */
export function pickPixabayMp4(hit: PixabayVideoHit, preferPortrait = false): PixabayVideoSize | null {
  const order: (keyof PixabayVideoHit["videos"])[] = ["medium", "large", "small", "tiny"];
  const candidates = order
    .map((key) => hit.videos[key])
    .filter((file): file is PixabayVideoSize => Boolean(file?.url && /\.mp4($|\?)/i.test(file.url)));

  if (!candidates.length) return null;

  if (preferPortrait) {
    const portrait = candidates.find((f) => f.height > f.width && f.width >= 480);
    if (portrait) return portrait;
  }

  const hd = candidates.find((f) => f.width >= 720 && f.width <= 1280);
  return hd || candidates[0] || null;
}

export function pixabayHitToStockAsset(hit: PixabayVideoHit, query: string, preferPortrait = false): StockMediaAsset | null {
  const file = pickPixabayMp4(hit, preferPortrait);
  if (!file) return null;
  const preview =
    hit.videos.tiny?.thumbnail ||
    hit.videos.small?.thumbnail ||
    hit.videos.medium?.thumbnail ||
    (hit.picture_id
      ? `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg`
      : undefined);
  return {
    id: `pixabay-vid-${hit.id}`,
    kind: "video",
    src: file.url,
    previewSrc: preview,
    width: file.width,
    height: file.height,
    query,
    license: {
      provider: "pixabay",
      license: "pixabay",
      attribution: `Video by ${hit.user || "Pixabay"} on Pixabay`,
      photographer: hit.user,
      pageUrl: hit.pageURL,
    },
  };
}

async function fetchPixabayJson(url: string): Promise<PixabayVideosResponse | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as PixabayVideosResponse;
  } catch {
    return null;
  }
}

/**
 * Query Pixabay Videos API for commercially cleared MP4 assets
 * matching the tenant's trade category keywords.
 */
export async function fetchPixabayTradeVideos(options: PixabayFetchOptions = {}): Promise<StockMediaAsset[]> {
  const key = pixabayApiKey();
  if (!key) return [];

  const seed = options.seed ?? daySeedFromDate();
  const query = (options.query ?? pickTradeKeyword(options.niche, seed)).trim().slice(0, 100);
  if (!query) return [];

  const page = Math.max(1, options.page ?? (seed % 5) + 1);
  const perPage = Math.min(20, Math.max(3, options.perPage ?? 8));
  const params = new URLSearchParams({
    key,
    q: query,
    video_type: "film",
    safesearch: "true",
    page: String(page),
    per_page: String(perPage),
  });

  const body = await fetchPixabayJson(`${PIXABAY_VIDEOS_URL}?${params.toString()}`);
  const hits = body?.hits ?? [];
  const preferPortrait = options.preferPortrait ?? true;
  const assets: StockMediaAsset[] = [];
  for (const hit of hits) {
    const asset = pixabayHitToStockAsset(hit, query, preferPortrait);
    if (asset) assets.push(asset);
  }

  // Retry once with a sibling trade keyword if the first query is dry.
  if (!assets.length) {
    const alts = tradeKeywordsForNiche(options.niche).filter((k) => k !== query);
    const alt = alts[(seed + 1) % Math.max(1, alts.length)];
    if (alt) {
      const retry = new URLSearchParams(params);
      retry.set("q", alt);
      retry.set("page", "1");
      const again = await fetchPixabayJson(`${PIXABAY_VIDEOS_URL}?${retry.toString()}`);
      for (const hit of again?.hits ?? []) {
        const asset = pixabayHitToStockAsset(hit, alt, preferPortrait);
        if (asset) assets.push(asset);
      }
    }
  }

  return assets;
}

/** Single best Pixabay MP4 for a niche (daily-rotated). */
export async function fetchPixabayTradeVideo(options: PixabayFetchOptions = {}): Promise<StockMediaAsset | null> {
  const list = await fetchPixabayTradeVideos(options);
  if (!list.length) return null;
  const seed = options.seed ?? daySeedFromDate();
  return list[seed % list.length] ?? list[0] ?? null;
}
