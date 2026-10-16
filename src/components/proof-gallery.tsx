import { useEffect, useState } from "react";
import { HoloCard } from "@/components/holo-card";
import { Reveal } from "@/components/reveal";
import { StatusPill, StatusRow, toneAt } from "@/components/status-pill";
import { defaultProof, GALLERY_LIMIT, isCustomProof, type ProofFrame } from "@/lib/axiom/gallery";
import { addPortfolioItem, listShopPortfolio, removePortfolioItem } from "@/lib/axiom/server";
import type { ShopNiche } from "@/lib/axiom/types";
import { Input, Label } from "@/components/ui/input";

export function ProofGallery({
  heading,
  frames,
  note,
  removeIds,
  onRemove,
  busy,
  embedded,
  signal = false,
}: {
  heading: string;
  frames: ProofFrame[];
  note?: string;
  removeIds?: string[];
  onRemove?: (id: string) => void;
  busy?: boolean;
  embedded?: boolean;
  /** Live pills and tilt for the public gallery. Admin embeds leave this off. */
  signal?: boolean;
}) {
  if (frames.length === 0) return null;
  const header = (
    <>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Proof of work</p>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl">{heading}</h2>
      {signal ? <StatusRow /> : null}
      {note ? <p className="mt-3 max-w-xl text-sm text-muted">{note}</p> : null}
    </>
  );
  const grid = (
    <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {frames.map((frame, index) => {
        const removeId = removeIds?.[index];
        const figure = (
          <figure>
            <FrameMedia frame={frame} />
            <figcaption className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm text-muted">{frame.caption || "Untitled"}</span>
                {signal ? <StatusPill tone={toneAt(index)} className="mt-2" /> : null}
              </span>
              {removeId && onRemove ? (
                <button
                  type="button"
                  className="h-11 shrink-0 rounded-xl px-3 text-sm text-muted hover:text-fg"
                  disabled={busy}
                  onClick={() => onRemove(removeId)}
                >
                  Remove
                </button>
              ) : null}
            </figcaption>
          </figure>
        );
        return (
          <li key={removeId ?? `${frame.kind}:${frame.src}:${frame.caption}`} className="min-w-0">
            {signal ? (
              <HoloCard className="h-full overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
                {figure}
              </HoloCard>
            ) : (
              <div className="overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">{figure}</div>
            )}
          </li>
        );
      })}
    </ul>
  );

  if (!signal || embedded) {
    return (
      <section className={embedded ? "py-2" : "mx-auto max-w-5xl px-5 py-16 sm:px-10"}>
        {header}
        {grid}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:px-10">
      <Reveal>{header}</Reveal>
      <Reveal stagger className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {frames.map((frame, index) => (
          <div key={`${frame.kind}:${frame.src}:${frame.caption}`} className="min-w-0">
            <HoloCard className="h-full overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
              <figure>
                <FrameMedia frame={frame} />
                <figcaption className="px-4 py-3">
                  <span className="block truncate text-sm text-muted">{frame.caption || "Untitled"}</span>
                  <StatusPill tone={toneAt(index)} className="mt-2" />
                </figcaption>
              </figure>
            </HoloCard>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

function FrameMedia({ frame }: { frame: ProofFrame }) {
  if (frame.kind === "video") {
    return (
      <video
        src={frame.src}
        className="aspect-[4/3] w-full object-cover"
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
      />
    );
  }
  return <img src={frame.src} alt={frame.caption} className="aspect-[4/3] w-full object-cover" />;
}

export function ShopProofGallery({
  slug,
  niche,
  heading,
}: {
  slug: string;
  niche: ShopNiche;
  heading: string;
}) {
  const defaults = defaultProof(niche);
  const [frames, setFrames] = useState<ProofFrame[]>(defaults);

  useEffect(() => {
    let stop = false;
    const load = () => {
      void listShopPortfolio({ data: slug })
        .then((items) => {
          if (stop) return;
          const custom = items.filter((item) => isCustomProof(item.imageUrl));
          setFrames(
            custom.length > 0
              ? custom.map((item) => ({ src: item.imageUrl, caption: item.caption, kind: "image" as const }))
              : defaultProof(niche),
          );
        })
        .catch(() => {
          if (!stop) setFrames(defaultProof(niche));
        });
    };
    load();
    const id = window.setInterval(load, 12000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      stop = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [slug, niche]);

  return <ProofGallery heading={heading} frames={frames} signal />;
}

export function ProofGalleryManager({
  slug,
  niche,
  heading,
  readonly,
}: {
  slug: string;
  niche: ShopNiche;
  heading: string;
  readonly: boolean;
}) {
  const [items, setItems] = useState<{ id: string; imageUrl: string; caption: string }[]>([]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const next = await listShopPortfolio({ data: slug });
    setItems(next.filter((item) => isCustomProof(item.imageUrl)));
  }

  useEffect(() => {
    let stop = false;
    void listShopPortfolio({ data: slug })
      .then((next) => {
        if (!stop) setItems(next.filter((item) => isCustomProof(item.imageUrl)));
      })
      .catch(() => {
        if (!stop) setError("Could not load the gallery");
      });
    return () => {
      stop = true;
    };
  }, [slug]);

  const custom = items.map((item) => ({ src: item.imageUrl, caption: item.caption, kind: "image" as const }));
  const showingDefaults = custom.length === 0;

  async function onFile(file: File | undefined) {
    if (!file || readonly) return;
    setBusy(true);
    setError(null);
    try {
      const imageUrl = await compressGalleryPhoto(file);
      await addPortfolioItem({ data: { slug, imageUrl, caption } });
      setCaption("");
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not upload");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    if (readonly) return;
    setBusy(true);
    setError(null);
    try {
      await removePortfolioItem({ data: { slug, id } });
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ProofGallery
        heading={heading}
        frames={showingDefaults ? defaultProof(niche) : custom}
        note={
          showingDefaults
            ? "The public page is showing this trade’s sample album. Upload your own photos and they replace it."
            : "These photos are live on your public page, in place of the sample album."
        }
        removeIds={showingDefaults || readonly ? undefined : items.map((item) => item.id)}
        onRemove={(id) => void onRemove(id)}
        busy={busy}
        embedded
      />
      <div className="pb-4">
        <form className="max-w-sm" onSubmit={(event) => event.preventDefault()}>
          <Label htmlFor="proof-caption">Caption</Label>
          <Input
            id="proof-caption"
            value={caption}
            maxLength={80}
            placeholder="A finished job"
            disabled={readonly || busy}
            onChange={(event) => setCaption(event.target.value)}
          />
          <label className="mt-3 flex h-12 cursor-pointer items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg">
            {busy ? "Working…" : items.length >= GALLERY_LIMIT ? "Gallery is full" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={readonly || busy || items.length >= GALLERY_LIMIT}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void onFile(file);
              }}
            />
          </label>
          <p className="mt-2 text-xs text-muted">
            {readonly
              ? "Preview only on a showcase shop."
              : `${items.length} of ${GALLERY_LIMIT} photos. Uploads show on the public page right away.`}
          </p>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

async function compressGalleryPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", 0.8);
  if (url.length > 1_200_000) throw new Error("Image is too large");
  return url;
}
