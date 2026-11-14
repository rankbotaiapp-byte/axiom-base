import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { DefaultAssetDropzone } from "@/components/default-asset-placeholder";
import { getNicheActions } from "@/config/niche-actions";
import { getBearerToken } from "@/lib/auth/client";
import {
  countDefaultPlaceholders,
  DEFAULT_SERVICE_SLOTS,
  isCustomProof,
  padProofFrames,
} from "@/lib/axiom/gallery";
import { MEDIA_FILE_MAX_BYTES } from "@/lib/axiom/media-slots";
import { cleanStillUrl } from "@/lib/axiom/hero-studio-state";
import { addPortfolioItem, listShopPortfolio, revalidateStorefront, saveTradeProfile } from "@/lib/axiom/server";
import { defaultTradeProfile } from "@/lib/axiom/trade-layout";
import type { Shop } from "@/lib/axiom/types";

const STILL_MB = Math.round(MEDIA_FILE_MAX_BYTES / (1024 * 1024));

export function DefaultAssetStudioPanel({
  shop,
  readonly,
}: {
  shop: Shop;
  readonly: boolean;
}) {
  const router = useRouter();
  const [proofItems, setProofItems] = useState<{ id: string; imageUrl: string; caption: string }[]>([]);
  const [serviceThumbs, setServiceThumbs] = useState(shop.tradeProfile?.serviceThumbs ?? ["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const serviceCards = getNicheActions(shop.niche)?.services ?? [];
  const defaults = countDefaultPlaceholders({
    proofUrls: proofItems.map((item) => item.imageUrl),
    serviceUrls: serviceThumbs,
  });

  useEffect(() => {
    let cancelled = false;
    void listShopPortfolio({ data: shop.slug })
      .then((rows) => {
        if (!cancelled) setProofItems(rows.filter((row) => isCustomProof(row.imageUrl)));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [shop.slug]);

  async function uploadStill(file: File, slot: "gallery" | "service", purpose: string) {
    const token = getBearerToken();
    const body = new FormData();
    body.set("shopId", shop.id);
    body.set("image", file);
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

  async function replaceProof(file: File) {
    if (readonly || busy) return;
    if (file.size > MEDIA_FILE_MAX_BYTES) {
      setError(`Images must be ${STILL_MB} MB or smaller.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = await uploadStill(file, "gallery", "Proof of work");
      await addPortfolioItem({ data: { slug: shop.slug, imageUrl: url, caption: "Proof of work" } });
      const rows = await listShopPortfolio({ data: shop.slug });
      setProofItems(rows.filter((row) => isCustomProof(row.imageUrl)));
      await revalidateStorefront({ data: shop.slug });
      await router.invalidate();
      setStatus("Proof plate is live on the storefront.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not replace that plate");
    } finally {
      setBusy(false);
    }
  }

  async function replaceService(index: number, file: File) {
    if (readonly || busy) return;
    if (file.size > MEDIA_FILE_MAX_BYTES) {
      setError(`Images must be ${STILL_MB} MB or smaller.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = await uploadStill(file, "service", `Service plate ${index + 1}`);
      const next = serviceThumbs.map((thumb, slot) => (slot === index ? url : thumb));
      while (next.length < DEFAULT_SERVICE_SLOTS) next.push("");
      await saveTradeProfile({
        data: {
          slug: shop.slug,
          profile: { ...(shop.tradeProfile ?? defaultTradeProfile(shop.niche)), serviceThumbs: next },
        },
      });
      setServiceThumbs(next);
      await revalidateStorefront({ data: shop.slug });
      await router.invalidate();
      setStatus("Service plate is live on the storefront.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not replace that plate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio-default-panel">
      <p className={defaults.total ? "studio-default-count is-live" : "studio-default-count"} aria-live="polite">
        {defaults.total
          ? `${defaults.total} default ${defaults.total === 1 ? "placeholder" : "placeholders"} on the storefront`
          : "All proof and service plates are custom."}
      </p>
      <div className="studio-default-grid">
        {padProofFrames(proofItems.map((item) => ({ src: item.imageUrl, caption: item.caption, kind: "image" as const }))).map(
          (frame, index) => (
            <DefaultAssetDropzone
              key={`proof-${index}`}
              src={frame.src}
              caption={frame.placeholder ? `Proof ${index + 1}` : frame.caption || `Proof ${index + 1}`}
              disabled={readonly || busy}
              onFile={(file) => void replaceProof(file)}
            />
          ),
        )}
        {Array.from({ length: DEFAULT_SERVICE_SLOTS }, (_, index) => (
          <DefaultAssetDropzone
            key={`service-${index}`}
            src={serviceThumbs[index]}
            compact
            caption={serviceCards[index]?.title || `Service ${index + 1}`}
            disabled={readonly || busy}
            onFile={(file) => void replaceService(index, file)}
          />
        ))}
      </div>
      {error ? <p className="motion-error">{error}</p> : null}
      {status ? <p className="motion-status">{status}</p> : null}
    </div>
  );
}
