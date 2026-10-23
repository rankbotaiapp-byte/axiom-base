import { HeroMotionStudio, type HeroMotionPublish, type HeroMotionResult } from "@/components/hero-motion-studio";
import { getBearerToken } from "@/lib/auth/client";
import { saveTradeProfile, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

async function fileToDataUrl(file: File, maxEdge: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function HeroMotionDesk({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  async function onSetLive(action: HeroMotionPublish): Promise<HeroMotionResult> {
    const { plan, file } = action;
    let path = plan.mediaPath;
    if (plan.uploadVideo) {
      if (!file) throw new Error("Choose a video to upload");
      const token = getBearerToken();
      const res = await fetch(`/api/hero-video/${shop.id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "video/mp4",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      const json = (await res.json()) as { heroVideoUrl?: string; error?: string };
      if (!res.ok || !json.heroVideoUrl) throw new Error(json.error || "Upload failed");
      path = json.heroVideoUrl;
    }
    const uploadedStill = plan.heroImageUrl === "upload";
    const heroImageUrl = uploadedStill && file ? await fileToDataUrl(file, 900) : uploadedStill ? undefined : plan.heroImageUrl;
    await updateShopBrand({
      data: {
        slug: shop.slug,
        markHero: true,
        glowEnabled: plan.glowEnabled,
        ...(plan.introPreset ? { introPreset: plan.introPreset } : {}),
        ...(plan.catalogFilm ? { catalogFilm: plan.catalogFilm } : {}),
        ...(heroImageUrl ? { heroImageUrl } : {}),
      },
    });
    let warning: string | undefined;
    try {
      await saveTradeProfile({
        data: {
          slug: shop.slug,
          profile: {
            ...shop.tradeProfile,
            studio: { ...shop.tradeProfile.studio, motion: plan.motion },
          },
        },
      });
    } catch (err) {
      warning = err instanceof Error ? `${err.message} The hero path is already ${path}.` : `The hero path is already ${path}.`;
    }
    onReload();
    return { path, warning };
  }

  return <HeroMotionStudio shop={shop} readonly={readonly} onSetLive={onSetLive} />;
}
