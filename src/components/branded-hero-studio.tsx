import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getBearerToken } from "@/lib/auth/client";
import { canvasToJpeg, paintBrandedStill, paintHeroFrame, readBrandInk, type BrandInk } from "@/lib/axiom/brand-paint";
import {
  BRAND_STAGES,
  PROOF_BATCH_LIMIT,
  PROOF_EDGE,
  PROOF_FILE_MAX_BYTES,
  brandStageLabel,
  hasProofDeploy,
  isImageFile,
  markProofDeploy,
  proofCaption,
  proofDeployKey,
  takeBatch,
} from "@/lib/axiom/branded-hero";
import { encodeHeroLoop } from "@/lib/axiom/hero-loop";
import { addPortfolioItem, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

type BrandedStill = {
  id: string;
  caption: string;
  jpeg: string;
};

type Busy = "brand" | "animate" | "deploy" | null;

function mp4Blob(bytes: Uint8Array): Blob {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: "video/mp4" });
}

function waitForPaint(reduced: boolean): Promise<void> {
  if (reduced) return Promise.resolve();
  return new Promise((resolve) => {
    requestAnimationFrame(() => window.setTimeout(resolve, 140));
  });
}

let stillSeq = 0;

export function BrandedHeroStudio({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clipRef = useRef<Uint8Array | null>(null);
  const clipUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<number>(0);
  const [stills, setStills] = useState<BrandedStill[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hot, setHot] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selected = stills.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      window.cancelAnimationFrame(previewRef.current);
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    };
  }, []);

  function rememberClip(url: string | null, bytes: Uint8Array | null) {
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    clipUrlRef.current = url;
    clipRef.current = bytes;
    setClipUrl(url);
  }

  function stopPreview() {
    window.cancelAnimationFrame(previewRef.current);
    previewRef.current = 0;
    setDrawing(false);
  }

  function playPreview(image: HTMLImageElement, ink: BrandInk) {
    setDrawing(true);
    const started = performance.now();
    const tick = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        if (canvas.width !== 640) {
          canvas.width = 640;
          canvas.height = 360;
        }
        paintHeroFrame(ctx, image, image.naturalWidth, image.naturalHeight, ((now - started) / 1000) % 6, ink);
      }
      previewRef.current = requestAnimationFrame(tick);
    };
    previewRef.current = requestAnimationFrame(tick);
  }

  async function brandFiles(list: File[]) {
    if (busy) return;
    const images = list.filter(isImageFile);
    const { kept, overflow } = takeBatch(images);
    if (!kept.length) {
      setError("Drop photos of the work, the truck, or the tools.");
      return;
    }
    const host = frameRef.current;
    if (!host) return;
    setBusy("brand");
    setError(overflow ? `Only the first ${PROOF_BATCH_LIMIT} photos are branded.` : null);
    stopPreview();
    rememberClip(null, null);
    const ink = readBrandInk(host);
    const branded: BrandedStill[] = [];
    for (let index = 0; index < kept.length; index += 1) {
      const file = kept[index]!;
      if (file.size > PROOF_FILE_MAX_BYTES) {
        setError(`${file.name} is over 15 MB.`);
        continue;
      }
      for (let stage = 0; stage < BRAND_STAGES.length; stage += 1) {
        setStatus(`${brandStageLabel(stage)} · ${index + 1} of ${kept.length}`);
        await waitForPaint(Boolean(reduced));
      }
      try {
        const bitmap = await createImageBitmap(file);
        try {
          const canvas = paintBrandedStill(bitmap, shop.name, ink, PROOF_EDGE);
          stillSeq += 1;
          branded.push({
            id: `brand_${stillSeq}`,
            caption: proofCaption(file.name),
            jpeg: canvasToJpeg(canvas),
          });
        } finally {
          bitmap.close();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not brand that photo");
      }
    }
    if (branded.length) {
      setStills((current) => [...branded, ...current].slice(0, PROOF_BATCH_LIMIT));
      setSelectedId(branded[0]!.id);
      setStatus(`${branded.length} branded still${branded.length === 1 ? "" : "s"} ready.`);
    }
    setBusy(null);
  }

  function chooseStill(id: string) {
    if (id === selectedId) return;
    stopPreview();
    rememberClip(null, null);
    setSelectedId(id);
    setStatus("");
    setError(null);
  }

  async function animate() {
    if (!selected || busy) return;
    const host = frameRef.current;
    if (!host) return;
    setBusy("animate");
    setError(null);
    stopPreview();
    rememberClip(null, null);
    const ink = readBrandInk(host);
    const image = new Image();
    image.src = selected.jpeg;
    try {
      await image.decode();
    } catch {
      setError("Could not read the branded still.");
      setBusy(null);
      return;
    }
    if (image.naturalWidth < 2 || image.naturalHeight < 2) {
      setError("Could not read the branded still.");
      setBusy(null);
      return;
    }
    if (typeof VideoEncoder === "undefined") {
      playPreview(image, ink);
      setError("This browser cannot encode the MP4. The loop plays in this frame only.");
      setBusy(null);
      return;
    }
    setDrawing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined))));
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const encoded = await encodeHeroLoop({
        source: image,
        srcW: image.naturalWidth,
        srcH: image.naturalHeight,
        ink,
        preview: canvasRef.current,
        signal: abort.signal,
        onFrame: (done, total) => setStatus(`Frame ${done} of ${total}`),
      });
      rememberClip(URL.createObjectURL(mp4Blob(encoded.bytes)), encoded.bytes);
      setStatus(encoded.hardware ? "Six-second hero is ready." : "Six-second hero is ready. This browser encoded it in software.");
    } catch (err) {
      if (!abort.signal.aborted) {
        setError(err instanceof Error ? err.message : "Could not animate that still");
      }
    } finally {
      setDrawing(false);
      setBusy(null);
    }
  }

  async function deploy() {
    const bytes = clipRef.current;
    if (readonly || !selected || !bytes || busy) return;
    setBusy("deploy");
    setError(null);
    setStatus("Writing the live page…");
    try {
      const token = getBearerToken();
      const res = await fetch(`/api/hero-video/${shop.id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "video/mp4",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: mp4Blob(bytes),
      });
      const json = (await res.json()) as { heroVideoUrl?: string; error?: string };
      if (!res.ok || !json.heroVideoUrl) throw new Error(json.error || "Upload failed");
      await updateShopBrand({
        data: {
          slug: shop.slug,
          markHero: true,
          glowEnabled: true,
          heroImageUrl: selected.jpeg,
        },
      });
      let galleryNote = "";
      for (const item of stills) {
        const key = proofDeployKey(shop.slug, item.jpeg);
        if (hasProofDeploy(key)) continue;
        try {
          await addPortfolioItem({ data: { slug: shop.slug, imageUrl: item.jpeg, caption: item.caption } });
          markProofDeploy(key);
        } catch (err) {
          galleryNote = err instanceof Error ? err.message : "The gallery update stopped";
          break;
        }
      }
      setStatus(galleryNote ? `${json.heroVideoUrl}. ${galleryNote}` : json.heroVideoUrl);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deploy");
      setStatus("");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-label="Smart Branded Hero and Proof of Work Studio"
      data-brand-studio="ready"
      className="pointer-events-auto glass-panel rounded-[28px] p-5 sm:p-6"
    >
      <p className="text-xs uppercase tracking-widest text-muted">Storefront</p>
      <h2 className="mt-1 font-display text-3xl sm:text-4xl">Smart Branded Hero & Proof-of-Work Studio</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Drop raw work photos. The shop name is etched onto each still, then one tap turns the selected frame into a six-second hero.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div className="grid gap-4">
          <label
            className={cn("hero-drop", hot && "is-hot")}
            onDragEnter={(event) => {
              event.preventDefault();
              setHot(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setHot(true);
            }}
            onDragLeave={() => setHot(false)}
            onDrop={(event) => {
              event.preventDefault();
              setHot(false);
              void brandFiles([...(event.dataTransfer.files ?? [])]);
            }}
          >
            <span className="font-display text-2xl text-fg">Drop the raw work</span>
            <span className="text-sm text-muted">Tools, trucks, job sites, equipment. Up to 12 photos.</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={busy !== null}
              onChange={(event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = "";
                void brandFiles(files);
              }}
            />
          </label>

          <div ref={frameRef} className="tactical-hero is-compact" aria-label="Branded hero preview">
            {selected && !drawing && !clipUrl ? <img className="tactical-media" src={selected.jpeg} alt="" /> : null}
            <canvas ref={canvasRef} className="tactical-media" hidden={!drawing} />
            {clipUrl && !drawing ? (
              <video className="tactical-media" src={clipUrl} poster={selected?.jpeg} autoPlay muted loop playsInline />
            ) : null}
            {!selected && !drawing ? <p className="brand-empty">The branded still lands here.</p> : null}
            <div className="tactical-rim" />
            <span className="tactical-corner is-nw" />
            <span className="tactical-corner is-ne" />
            <span className="tactical-corner is-sw" />
            <span className="tactical-corner is-se" />
            <p className="brand-ask" aria-hidden="true">
              Ask about this trade
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-muted">1 · Brand the still</p>
          <p className="text-sm text-muted">
            Each photo is mapped in the frame: a sponsor mark, then the business name etched along the lower edge.
          </p>
          <p className="text-xs uppercase tracking-widest text-muted">2 · Animate</p>
          <Button variant="accent" size="lg" disabled={!selected || busy !== null} onClick={() => void animate()}>
            {busy === "animate" ? "Encoding the hero…" : "Animate to 6s Hero"}
          </Button>
          <p className="text-sm text-muted">
            The loop is an MP4 with an obsidian field, a neon edge, and corner brackets. On the live page the question field stays usable. The frame does not take the click.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={readonly || !clipUrl || !selected || busy !== null}
            onClick={() => void deploy()}
          >
            {busy === "deploy" ? "Writing the live page…" : "Deploy to Customer-Facing Page"}
          </Button>
          <p className="text-sm text-muted">
            {readonly
              ? "Preview only. A shop you own can deploy this to the live page."
              : "Sends the hero film, the poster, and the branded proof stills to this shop."}
          </p>
          <p className="min-h-5 text-sm text-fg" aria-live="polite">
            {status}
          </p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </div>

      {stills.length ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted">Proof of work</p>
          <div className="brand-grid mt-3">
            {stills.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn("brand-card", item.id === selectedId && "is-on")}
                aria-pressed={item.id === selectedId}
                disabled={busy !== null}
                onClick={() => chooseStill(item.id)}
              >
                <img src={item.jpeg} alt={item.caption} />
                <span>{item.caption}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
