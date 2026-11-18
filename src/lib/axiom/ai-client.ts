/**
 * Server-only Axiom Studio media client.
 * Flux.1 stills and Veo / Kling loops stay behind REPLICATE_API_TOKEN.
 * **All Replicate calls must run behind `authorizeAndConsumeGeneration`**
 * (`/api/studio/render`, `/api/studio/still`, `/api/studio/slot-generate` only).
 * Public chat/companion/orb routes use xAI text/TTS + `companionAllowed` rate limits — never Replicate.
 * Finished files are copied into Supabase Storage and linked on the shop row
 * that `/[shopSlug]` plays.
 */

import "server-only";

import { revalidatePath } from "next/cache";
import { getSql } from "@/lib/db";
import {
  composeNeuralPrompt,
  decomposeStudioLayers,
  serializeStudioLayerPacket,
  studioMatrixEntry,
  type StudioLayerPacket,
  type StudioRenderLayer,
} from "./studio-engine";
import { buildProofTouchupPrompt, buildSlotBrandedPrompt } from "./storefront-themes";
import { withAxiomVisualLock } from "./visual-design";

const FLUX_MODEL = "black-forest-labs/flux-1.1-pro";
const FLUX_2_PRO = "black-forest-labs/flux-2-pro";
const FLUX_KONTEXT_MODEL = "black-forest-labs/flux-kontext-pro";
const VEO_MODEL = "google/veo-3.1";
const IMAGE_WAIT_MS = 120_000;
const VIDEO_WAIT_MS = 280_000;
const MAX_IMAGE_BYTES = 12_000_000;
const MAX_VIDEO_BYTES = 48_000_000;

export type StudioLayerAsset = {
  index: 0 | 1 | 2;
  storageKey: StudioRenderLayer["storageKey"];
  prompt: string;
  imageUrl: string;
};

export type StudioHeroRender = {
  shopSlug: string;
  niche: string;
  imageUrl: string;
  videoUrl: string;
  layers: StudioLayerAsset[];
};

type Prediction = {
  id?: string;
  status?: string;
  output?: unknown;
  error?: unknown;
  urls?: { get?: string };
};

function replicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
  return token;
}

function clipPrompt(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 4000);
}

function outputUrl(output: unknown): string {
  if (typeof output === "string" && /^https:\/\//.test(output)) return output;
  if (Array.isArray(output)) {
    const hit = output.find((item) => typeof item === "string" && /^https:\/\//.test(item));
    if (typeof hit === "string") return hit;
  }
  throw new Error("The model did not return an image or video URL");
}

function predictionError(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error.trim().slice(0, 280);
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "").slice(0, 280);
  }
  return "The render failed";
}

async function replicatePredict(model: string, input: Record<string, unknown>, timeoutMs: number): Promise<string> {
  const token = replicateToken();
  const started = Date.now();
  const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ input }),
  });
  const created = (await response.json().catch(() => ({}))) as Prediction;
  if (!response.ok) throw new Error(predictionError(created.error) || `Replicate rejected the render (${response.status})`);
  let prediction = created;
  while (prediction.status !== "succeeded") {
    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(predictionError(prediction.error));
    }
    if (!prediction.urls?.get) throw new Error("Replicate did not return a prediction to poll");
    if (Date.now() - started > timeoutMs) throw new Error("The render timed out");
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const poll = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${token}` },
    });
    prediction = (await poll.json().catch(() => ({}))) as Prediction;
    if (!poll.ok) throw new Error(predictionError(prediction.error) || `Replicate poll failed (${poll.status})`);
  }
  return outputUrl(prediction.output);
}

/**
 * Flux.1 still. The 8-layer neural matrix is the prompt sent to Replicate.
 * A caller prompt that is not already locked is folded in as the scene hint.
 */
export async function generateStudioHeroImage(prompt: string, niche: string, shopSlug: string): Promise<string> {
  const hint = prompt.replace(/\s+/g, " ").trim();
  const matrix =
    hint.includes("#00f2fe") && /crosshair/i.test(hint)
      ? hint
      : composeNeuralPrompt({ niche, sceneHint: hint, medium: "image" });
  const url = await replicatePredict(
    process.env.REPLICATE_FLUX_MODEL?.trim() || FLUX_MODEL,
    {
      prompt: clipPrompt(matrix),
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 95,
      safety_tolerance: 2,
      prompt_upsampling: false,
    },
    IMAGE_WAIT_MS,
  );
  return url;
}

/**
 * 6-second cinematic loop. Google Veo 3.1 takes the still as `image`.
 * A Kling model id in REPLICATE_VIDEO_MODEL uses `start_image` instead.
 */
export async function generateHeroVideoLoop(imageUrl: string, niche: string, shopSlug: string): Promise<string> {
  const still = imageUrl.trim();
  if (!/^https:\/\//.test(still)) throw new Error("The hero image URL is not public");
  const entry = studioMatrixEntry(niche);
  const prompt = clipPrompt(
    withAxiomVisualLock(
      `Seamless 6-second cinematic background loop of ${entry.label}. ${entry.motion} ${entry.environment} ${entry.fluid} Slow parallax, volumetric smoke, neon-red structural edge light #ff2a3d on obsidian #050507. End on the same frame so the loop is seamless. No spoken words. No on-film captions. No extra people.`,
    ),
  );
  const model = process.env.REPLICATE_VIDEO_MODEL?.trim() || VEO_MODEL;
  const kling = /kling/i.test(model);
  const videoUrl = await replicatePredict(
    model,
    kling
      ? { prompt, start_image: still, duration: 5 }
      : {
          prompt,
          image: still,
          duration: 6,
          aspect_ratio: "16:9",
          resolution: "1080p",
          generate_audio: false,
        },
    VIDEO_WAIT_MS,
  );
  return videoUrl;
}

function shopKey(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function supabaseAdmin(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  return { url, key };
}

async function downloadAsset(sourceUrl: string, maxBytes: number): Promise<{ bytes: Uint8Array; mime: string }> {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error("The generated file could not be downloaded");
  const mime = (response.headers.get("content-type") || "").split(";")[0]?.trim() || "application/octet-stream";
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.byteLength || bytes.byteLength > maxBytes) throw new Error("The generated file is empty or too large");
  return { bytes, mime };
}

async function uploadToMedia(slug: string, fileName: string, bytes: Uint8Array, mime: string): Promise<string> {
  const supabase = supabaseAdmin();
  if (!supabase) throw new Error("Supabase storage is not configured");
  const objectPath = `${shopKey(slug)}/studio/${fileName}`;
  const response = await fetch(`${supabase.url}/storage/v1/object/media/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: supabase.key,
      authorization: `Bearer ${supabase.key}`,
      "content-type": mime,
      "x-upsert": "true",
    },
    body: bytes as BodyInit,
  });
  if (!response.ok) throw new Error("Supabase storage rejected the studio file");
  return `${supabase.url}/storage/v1/object/public/media/${objectPath}`;
}

async function linkStorefront(input: {
  shopSlug: string;
  imageUrl: string;
  videoUrl: string;
  tagline: string;
  layers: Record<string, unknown>;
}) {
  const slug = shopKey(input.shopSlug);
  const layersJson = JSON.stringify(input.layers);
  try {
    const sql = await getSql();
    const rows = await sql<{ id: string; trade_profile: unknown }>`
      select id, trade_profile from shops where slug = ${slug} limit 1
    `;
    const row = rows[0];
    if (row) {
      let profile: Record<string, unknown> = {};
      const raw = row.trade_profile;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) profile = { ...(raw as Record<string, unknown>) };
      else if (typeof raw === "string" && raw.trim()) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) profile = parsed as Record<string, unknown>;
        } catch {
          profile = {};
        }
      }
      profile.studioLayers = input.layers;
      const write = async (includeLoop: boolean, includeProfile: boolean) => {
        if (includeLoop && includeProfile) {
          await sql`
            update shops
            set hero_image_url = ${input.imageUrl},
                hero_video_url = ${input.videoUrl},
                hero_background_loop = ${input.videoUrl},
                trade_profile = ${JSON.stringify(profile)}
            where id = ${row.id}
          `;
          return;
        }
        if (includeProfile) {
          await sql`
            update shops
            set hero_image_url = ${input.imageUrl},
                hero_video_url = ${input.videoUrl},
                trade_profile = ${JSON.stringify(profile)}
            where id = ${row.id}
          `;
          return;
        }
        await sql`
          update shops
          set hero_image_url = ${input.imageUrl},
              hero_video_url = ${input.videoUrl}
          where id = ${row.id}
        `;
      };
      try {
        await write(true, true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (/hero_background_loop/i.test(message)) await write(false, true);
        else if (/trade_profile/i.test(message)) await write(false, false);
        else throw err;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/shops|hero_image_url|getaddrinfo|ECONNREFUSED|database/i.test(message)) throw err;
  }

  const supabase = supabaseAdmin();
  if (!supabase) return;
  const headers = {
    apikey: supabase.key,
    authorization: `Bearer ${supabase.key}`,
    "content-type": "application/json",
    prefer: "resolution=merge-duplicates,return=minimal",
  };
  const payload = {
    shop_slug: slug,
    hero_image_url: input.imageUrl,
    hero_video_url: input.videoUrl,
    background_video_url: input.videoUrl,
    hero_background_loop: input.videoUrl,
    tagline: input.tagline.slice(0, 160),
    studio_layers: layersJson,
  };
  const upsert = await fetch(`${supabase.url}/rest/v1/client_storefronts?on_conflict=shop_slug`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (upsert.ok) return;
  await fetch(`${supabase.url}/rest/v1/client_storefronts?shop_slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { ...headers, prefer: "return=minimal" },
    body: JSON.stringify({
      hero_image_url: input.imageUrl,
      hero_video_url: input.videoUrl,
      background_video_url: input.videoUrl,
      hero_background_loop: input.videoUrl,
      tagline: input.tagline.slice(0, 160),
    }),
  });
}

async function hostAsset(slug: string, fileName: string, remoteUrl: string, kind: "image" | "video"): Promise<string> {
  const file = await downloadAsset(remoteUrl, kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES);
  const mime = kind === "video" ? "video/mp4" : file.mime.startsWith("image/") ? file.mime : "image/webp";
  return uploadToMedia(slug, fileName, file.bytes, mime);
}

function fluxImg2ImgModel(): string {
  return process.env.REPLICATE_FLUX_IMG2IMG_MODEL?.trim() || FLUX_KONTEXT_MODEL;
}

/** Proof slot touch-up: image-to-image preserving the tenant's real job photo. */
export async function generateProofTouchupSlot(input: {
  shopSlug: string;
  sourceImageUrl: string;
  slotLabel?: string;
  niche?: string;
  themeId?: string;
}): Promise<{ imageUrl: string; prompt: string; mode: "proof_touchup" }> {
  const shopSlug = shopKey(input.shopSlug);
  if (!shopSlug) throw new Error("Unknown shop");
  const still = input.sourceImageUrl.trim();
  if (!/^https:\/\//.test(still)) throw new Error("The source image URL must be public https");
  const prompt = clipPrompt(
    buildProofTouchupPrompt({ slotLabel: input.slotLabel, niche: input.niche, themeId: input.themeId }),
  );
  const remote = await replicatePredict(
    fluxImg2ImgModel(),
    {
      prompt,
      input_image: still,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 92,
      safety_tolerance: 2,
    },
    IMAGE_WAIT_MS,
  );
  try {
    const imageUrl = await hostAsset(shopSlug, `${Date.now()}-proof-touchup.webp`, remote, "image");
    return { imageUrl, prompt, mode: "proof_touchup" };
  } catch {
    return { imageUrl: remote, prompt, mode: "proof_touchup" };
  }
}

/** Slot-aware branded still for layout stack assignment. */
export async function generateAiBrandedSlot(input: {
  shopSlug: string;
  slotLabel: string;
  niche: string;
  brandColor?: string;
  themeId?: string;
  templateSkin?: string;
  userPrompt?: string;
  shopName?: string;
}): Promise<{ imageUrl: string; prompt: string; mode: "ai_branded" }> {
  const shopSlug = shopKey(input.shopSlug);
  if (!shopSlug) throw new Error("Unknown shop");
  const prompt = clipPrompt(
    buildSlotBrandedPrompt({
      slotLabel: input.slotLabel,
      niche: input.niche,
      brandColor: input.brandColor,
      themeId: input.themeId || input.templateSkin,
      templateSkin: input.templateSkin,
      userPrompt: input.userPrompt,
      shopName: input.shopName,
    }),
  );
  const remote = await replicatePredict(
    process.env.REPLICATE_FLUX_BRANDED_MODEL?.trim() ||
      process.env.REPLICATE_FLUX_MODEL?.trim() ||
      FLUX_2_PRO,
    {
      prompt,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 95,
      safety_tolerance: 2,
      prompt_upsampling: false,
    },
    IMAGE_WAIT_MS,
  );
  try {
    const imageUrl = await hostAsset(shopSlug, `${Date.now()}-slot-branded.webp`, remote, "image");
    return { imageUrl, prompt, mode: "ai_branded" };
  } catch {
    return { imageUrl: remote, prompt, mode: "ai_branded" };
  }
}

/** One Flux still for outreach previews and proof slots. Storage is used when it is configured. */
export async function generateStudioStill(input: {
  shopSlug: string;
  niche: string;
  shopName?: string;
  tagline?: string;
  prompt?: string;
}): Promise<{ imageUrl: string; prompt: string }> {
  const shopSlug = shopKey(input.shopSlug);
  if (!shopSlug) throw new Error("Unknown shop");
  const niche = input.niche || "plumbing";
  const packet = decomposeStudioLayers({ niche, shopName: input.shopName, tagline: input.tagline });
  const prompt = input.prompt?.trim() || packet.prompt;
  const remote = await generateStudioHeroImage(prompt, niche, shopSlug);
  try {
    const imageUrl = await hostAsset(shopSlug, `${Date.now()}-still.webp`, remote, "image");
    return { imageUrl, prompt };
  } catch {
    return { imageUrl: remote, prompt };
  }
}

/** Generate the hero still, the three layer plates, and the loop, then publish them. */
export async function renderAndSyncStudioHero(input: {
  shopSlug: string;
  niche: string;
  shopName?: string;
  tagline?: string;
  prompt?: string;
}): Promise<StudioHeroRender> {
  const shopSlug = shopKey(input.shopSlug);
  if (!shopSlug) throw new Error("Unknown shop");
  const niche = input.niche || "plumbing";
  const packet: StudioLayerPacket = decomposeStudioLayers({
    niche,
    shopName: input.shopName,
    tagline: input.tagline,
  });
  const stamp = Date.now();
  const heroRemote = await generateStudioHeroImage(input.prompt || packet.prompt, niche, shopSlug);
  const [videoRemote, layerRemotes] = await Promise.all([
    generateHeroVideoLoop(heroRemote, niche, shopSlug),
    Promise.all(
      packet.layers.map(async (layer) => {
        try {
          return await generateStudioHeroImage(layer.prompt, niche, shopSlug);
        } catch (err) {
          if (err instanceof Error && err.name === "StudioTrialRequiredError") throw err;
          return heroRemote;
        }
      }),
    ),
  ]);

  const [imageUrl, videoUrl, ...layerUrls] = await Promise.all([
    hostAsset(shopSlug, `${stamp}-hero.webp`, heroRemote, "image"),
    hostAsset(shopSlug, `${stamp}-loop.mp4`, videoRemote, "video"),
    ...layerRemotes.map((remote, index) => hostAsset(shopSlug, `${stamp}-layer-${index}.webp`, remote, "image")),
  ]);

  const layers: StudioLayerAsset[] = packet.layers.map((layer, index) => ({
    index: layer.index,
    storageKey: layer.storageKey,
    prompt: layer.prompt,
    imageUrl: layerUrls[index] || imageUrl,
  }));
  const record = {
    ...serializeStudioLayerPacket(packet),
    imageUrl,
    videoUrl,
    layers: layers.map((layer) => ({
      index: layer.index,
      storageKey: layer.storageKey,
      prompt: layer.prompt,
      imageUrl: layer.imageUrl,
    })),
  };
  await linkStorefront({
    shopSlug,
    imageUrl,
    videoUrl,
    tagline: input.tagline || packet.tagline,
    layers: record,
  });
  try {
    revalidatePath(`/${shopSlug}`);
  } catch {
    /* The shop row is already updated for the next request. */
  }
  return { shopSlug, niche: packet.niche, imageUrl, videoUrl, layers };
}
