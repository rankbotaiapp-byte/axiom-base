import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { DefaultAssetDropzone } from "@/components/default-asset-placeholder";
import { getBearerToken } from "@/lib/auth/client";
import { isCustomStorefrontAsset } from "@/lib/axiom/gallery";
import { MEDIA_FILE_MAX_BYTES } from "@/lib/axiom/media-slots";
import { cleanStillUrl } from "@/lib/axiom/hero-studio-state";
import {
  addPortfolioItem,
  listShopPortfolio,
  revalidateStorefront,
  saveTradeProfile,
  setAutopilotActive,
  updateShopBrand,
} from "@/lib/axiom/server";
import { defaultTradeProfile } from "@/lib/axiom/trade-layout";
import type { Shop } from "@/lib/axiom/types";

const STILL_MB = Math.round(MEDIA_FILE_MAX_BYTES / (1024 * 1024));

async function compressStill(file: File): Promise<File> {
  if (file.size <= 400_000) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

export function MakeItMineWizard({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload?: () => void;
}) {
  const router = useRouter();
  const [jobSrc, setJobSrc] = useState("");
  const [shopSrc, setShopSrc] = useState(shop.heroImageUrl);
  const [armed, setArmed] = useState(Boolean(shop.autopilotActive || shop.aiContentAutopilot));
  const [busy, setBusy] = useState<"job" | "shop" | "arm" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listShopPortfolio({ data: shop.slug })
      .then((rows) => {
        if (cancelled) return;
        const custom = rows.find((row) => isCustomStorefrontAsset(row.imageUrl));
        setJobSrc(custom?.imageUrl ?? "");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [shop.slug]);

  async function uploadStill(file: File, slot: "gallery" | "hero", purpose: string) {
    const compact = await compressStill(file);
    if (compact.size > MEDIA_FILE_MAX_BYTES) throw new Error(`Images must be ${STILL_MB} MB or smaller.`);
    const token = getBearerToken();
    const body = new FormData();
    body.set("shopId", shop.id);
    body.set("image", compact);
    body.set("slot", slot);
    body.set("purpose", purpose);
    const res = await fetch("/api/admin/media/upload", {
      method: "POST",
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body,
    });
    const json = (await res.json()) as { asset?: { url?: string }; error?: string };
    const url = cleanStillUrl(json.asset?.url);
    if (!url) throw new Error(json.error || "That image could not be saved");
    return url;
  }

  async function refreshPublic() {
    await revalidateStorefront({ data: shop.slug });
    await router.invalidate();
    onReload?.();
  }

  async function dropJob(file: File) {
    if (readonly || busy) return;
    setBusy("job");
    setError(null);
    try {
      const url = await uploadStill(file, "gallery", "Job photo");
      await addPortfolioItem({ data: { slug: shop.slug, imageUrl: url, caption: "On the job" } });
      setJobSrc(url);
      await refreshPublic();
      setStatus("Job photo is live on Proof of work.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save that job photo");
    } finally {
      setBusy(null);
    }
  }

  async function dropShop(file: File) {
    if (readonly || busy) return;
    setBusy("shop");
    setError(null);
    try {
      const url = await uploadStill(file, "hero", "Truck / shop photo");
      const thumbs = [...(shop.tradeProfile?.serviceThumbs ?? ["", "", ""])];
      while (thumbs.length < 3) thumbs.push("");
      thumbs[0] = url;
      await updateShopBrand({ data: { slug: shop.slug, heroImageUrl: url, markHero: true } });
      await saveTradeProfile({
        data: {
          slug: shop.slug,
          profile: { ...(shop.tradeProfile ?? defaultTradeProfile(shop.niche)), serviceThumbs: thumbs },
        },
      });
      setShopSrc(url);
      await refreshPublic();
      setStatus("Truck / shop photo is on the film and the first service plate.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save that shop photo");
    } finally {
      setBusy(null);
    }
  }

  async function arm() {
    if (readonly || busy) return;
    const next = !armed;
    setBusy("arm");
    setError(null);
    try {
      const result = await setAutopilotActive({ data: { slug: shop.slug, active: next } });
      setArmed(result.active);
      await refreshPublic();
      setStatus(result.detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save Autopilot");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="make-mine" aria-label="Make it mine">
      <p className="make-mine-kicker">Make it mine</p>
      <h2 className="make-mine-title">Three drops. Then Autopilot runs the page.</h2>
      <p className="make-mine-help">
        Job photo fills Proof of work. Truck or shop photo grounds the film. Arm writes the server flag so
        cron can refresh stills and notices without opening the desk.
      </p>
      <div className="make-mine-grid">
        <div className="make-mine-step">
          <p className="make-mine-step-label">1 · Job photo</p>
          <DefaultAssetDropzone
            src={jobSrc}
            caption="Drop a finished job"
            disabled={readonly || busy !== null}
            onFile={(file) => void dropJob(file)}
          />
        </div>
        <div className="make-mine-step">
          <p className="make-mine-step-label">2 · Truck / shop</p>
          <DefaultAssetDropzone
            src={shopSrc}
            caption="Drop the truck or the bay"
            disabled={readonly || busy !== null}
            onFile={(file) => void dropShop(file)}
          />
        </div>
        <div className="make-mine-step">
          <p className="make-mine-step-label">3 · Arm</p>
          <button
            type="button"
            role="switch"
            aria-checked={armed}
            disabled={readonly || busy !== null}
            className={armed ? "make-mine-arm is-on" : "make-mine-arm"}
            onClick={() => void arm()}
          >
            <span>{busy === "arm" ? "Saving" : armed ? "Autopilot armed" : "Arm Autopilot"}</span>
            <span className="mission-knob" aria-hidden />
          </button>
        </div>
      </div>
      {error ? <p className="motion-error">{error}</p> : null}
      {status ? <p className="motion-status">{status}</p> : null}
    </section>
  );
}
