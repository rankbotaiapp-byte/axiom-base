import { getSql } from "@/lib/db";
import { assertCanModifyShopById } from "./shop-server.server";
import { userIdFromUpload } from "./hero-video.server";
import { isMp4, shopHeroVideoPath } from "./hero-video";
import { sniffHeroAsset } from "./hero-brand";
import { demoNicheById, heroIntroPlan } from "./demoNiches";
import { withHeroBrandFallback, parseHeroEffect } from "./hero-brand";
import { HERO_ANIMATOR_IMAGE_MAX_BYTES, HERO_ANIMATOR_MODEL, clipHeroTagline } from "./hero-animator";

const START_URL = "https://api.x.ai/v1/videos/generations";

function mimeFor(kind: "jpeg" | "png" | "webp") {
  if (kind === "png") return "image/png";
  if (kind === "webp") return "image/webp";
  return "image/jpeg";
}

function dataUri(bytes: Uint8Array, mime: string) {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function xai(path: string, init?: RequestInit) {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) throw new Error("AI is not available in this environment");
  const res = await fetch(path.startsWith("http") ? path : `https://api.x.ai${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await res.json().catch(() => ({}))) as {
    request_id?: string;
    status?: string;
    error?: string | { message?: string };
    video?: { url?: string };
  };
  if (!res.ok) {
    const message = typeof payload.error === "string" ? payload.error : payload.error?.message;
    throw new Error(message || `The intro could not start (${res.status})`);
  }
  return payload;
}

export async function startHeroIntro(
  userId: string,
  shopId: string,
  preset: string,
  bytes: Uint8Array,
  nicheId = "",
) {
  const plan = heroIntroPlan(preset, nicheId);
  if (!plan) throw new Error(nicheId ? "Choose a showcase" : "Choose a cinematic style");
  if (bytes.byteLength > HERO_ANIMATOR_IMAGE_MAX_BYTES) {
    throw new Error("Use a photo 8 MB or smaller");
  }
  const kind = sniffHeroAsset(bytes);
  if (kind !== "jpeg" && kind !== "png" && kind !== "webp") throw new Error("Upload a JPEG, PNG, or WebP");
  await assertCanModifyShopById(shopId, userId);
  const started = await xai(START_URL, {
    method: "POST",
    body: JSON.stringify({
      model: HERO_ANIMATOR_MODEL,
      prompt: plan.prompt,
      image: { url: dataUri(bytes, mimeFor(kind)) },
      duration: plan.durationSec,
      resolution: plan.resolution,
    }),
  });
  if (!started.request_id) throw new Error("The intro did not start");
  return { requestId: started.request_id, plan };
}

function withHeroMarked(raw: string): string {
  let parsed: Partial<{ hero: boolean; service: boolean; employee: boolean; testBooked: boolean }> = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    parsed = {};
  }
  return JSON.stringify({
    hero: true,
    service: Boolean(parsed.service),
    employee: Boolean(parsed.employee),
    testBooked: Boolean(parsed.testBooked),
  });
}

async function stampIntro(
  row: { id: string; hero_effect_type?: string | null; trade_profile?: unknown },
  brand: { tagline: string; prompt: string; durationSec: number },
) {
  if (!brand.tagline && !brand.prompt) return;
  const sql = await getSql();
  const prompt = brand.prompt.slice(0, 180);
  try {
    await sql`
      update shops
      set hero_branding_tagline = ${brand.tagline},
          hero_prompt = ${prompt}
      where id = ${row.id}
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/hero_branding_tagline|hero_prompt/i.test(message)) throw err;
    try {
      await sql`
        update shops
        set trade_profile = ${withHeroBrandFallback(row.trade_profile, {
          effect: parseHeroEffect(row.hero_effect_type),
          tagline: brand.tagline,
          prompt,
          morphDurationSec: brand.durationSec,
        })}
        where id = ${row.id}
      `;
    } catch (profileErr) {
      const profileMessage = profileErr instanceof Error ? profileErr.message : "";
      if (!/trade_profile/i.test(profileMessage)) throw profileErr;
    }
  }
}

export async function finishHeroIntro(
  userId: string,
  shopId: string,
  requestId: string,
  meta: { nicheId?: string; preset?: string; tagline?: string } = {},
) {
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(requestId)) throw new Error("That render could not be found");
  const row = await assertCanModifyShopById(shopId, userId);
  const result = await xai(`/v1/videos/${requestId}`);
  if (result.status === "failed" || result.status === "expired") {
    throw new Error("The intro did not finish");
  }
  if (result.status !== "done" || !result.video?.url) {
    return { pending: true as const, requestId };
  }
  const apiKey = process.env.XAI_API_KEY?.trim();
  let videoRes = await fetch(result.video.url);
  if (!videoRes.ok && apiKey) {
    videoRes = await fetch(result.video.url, { headers: { Authorization: `Bearer ${apiKey}` } });
  }
  if (!videoRes.ok) throw new Error("The finished intro could not be saved");
  const bytes = new Uint8Array(await videoRes.arrayBuffer());
  if (!isMp4(bytes)) throw new Error("The intro is larger than 12 MB or is not a playable film");
  const sql = await getSql();
  await sql.query(
    `insert into shop_hero_videos (shop_id, mime, data, updated_at)
     values ($1, 'video/mp4', $2, now())
     on conflict (shop_id) do update
       set mime = 'video/mp4', data = excluded.data, updated_at = now()`,
    [shopId, Buffer.from(bytes)],
  );
  const heroVideoUrl = shopHeroVideoPath(shopId, Date.now());
  await sql`
    update shops
    set hero_video_url = ${heroVideoUrl},
        onboarding_json = ${withHeroMarked(row.onboarding_json)}
    where id = ${shopId}
  `;
  const niche = demoNicheById(meta.nicheId ?? "");
  const plan = heroIntroPlan(meta.preset ?? "", meta.nicheId ?? "");
  const tagline = clipHeroTagline(meta.tagline) || niche?.tagline || "";
  const prompt = plan?.prompt ?? "";
  await stampIntro(row, {
    tagline,
    prompt,
    durationSec: plan?.durationSec ?? niche?.motion.durationSec ?? 4.5,
  });
  return {
    pending: false as const,
    heroVideoUrl,
    previewUrl: heroVideoUrl,
    niche: niche?.id ?? "",
    substance: plan?.substance ?? niche?.substance ?? "",
    tagline,
  };
}

export async function userFromHeroRequest(request: Request) {
  return userIdFromUpload(request);
}
