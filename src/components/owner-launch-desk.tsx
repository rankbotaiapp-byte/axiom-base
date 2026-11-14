import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, ImagePlus, Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getBearerToken } from "@/lib/auth/client";
import { canvasToJpeg, paintBrandedStill, readBrandInk } from "@/lib/axiom/brand-paint";
import { PROOF_EDGE } from "@/lib/axiom/branded-hero";
import {
  approveOwnerSocial,
  draftOwnerSocial,
  listOwnerMedia,
  populateOwnerStorefront,
  removeOwnerMedia,
  updateOwnerMedia,
} from "@/lib/axiom/media-pipeline";
import {
  MEDIA_SLOTS,
  MEDIA_SLOT_LABEL,
  SOCIAL_CHANNELS,
  SOCIAL_CHANNEL_LABEL,
  type MediaAssetView,
  type MediaSlot,
  type SocialChannel,
} from "@/lib/axiom/media-slots";
import { shopTradeLabel } from "@/lib/axiom/niches";
import type { Shop } from "@/lib/axiom/types";

type SocialDraft = {
  id: string;
  caption: string;
  imageUrl: string;
  channels: SocialChannel[];
};

async function brandFile(file: File, shopName: string, host: HTMLElement): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = paintBrandedStill(bitmap, shopName, readBrandInk(host), PROOF_EDGE);
  const jpeg = canvasToJpeg(canvas);
  const res = await fetch(jpeg);
  return res.blob();
}

async function uploadBranded(shopId: string, blob: Blob, slot: MediaSlot, purpose: string, isHero: boolean) {
  const token = getBearerToken();
  const body = new FormData();
  body.append("shopId", shopId);
  body.append("image", blob, "branded.jpg");
  body.append("slot", slot);
  body.append("purpose", purpose);
  body.append("caption", purpose);
  if (isHero) body.append("isHero", "1");
  const res = await fetch("/api/admin/media/upload", {
    method: "POST",
    credentials: "include",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const data = (await res.json()) as { asset?: MediaAssetView; error?: string };
  if (!res.ok || !data.asset) throw new Error(data.error || "That photo could not be saved");
  return data.asset;
}

async function postIntro(body: FormData) {
  const token = getBearerToken();
  const res = await fetch("/api/admin/hero-studio/generate", {
    method: "POST",
    credentials: "include",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const data = (await res.json()) as { success?: boolean; pending?: boolean; requestId?: string; heroVideoUrl?: string; error?: string };
  if (!res.ok || data.success === false) throw new Error(data.error || "The intro could not be made");
  return data;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function OwnerLaunchDesk({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const hostRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<MediaAssetView[]>([]);
  const [slot, setSlot] = useState<MediaSlot>("gallery");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState<"upload" | "animate" | "social" | "approve" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<SocialDraft | null>(null);
  const [channels, setChannels] = useState<SocialChannel[]>(["facebook", "instagram", "x"]);
  const [copied, setCopied] = useState(false);
  const hero = assets.find((item) => item.isHero) ?? assets.find((item) => item.slot === "hero") ?? null;
  const trade = shopTradeLabel(shop);

  useEffect(() => {
    let cancelled = false;
    void listOwnerMedia({ data: { shopId: shop.id } })
      .then((rows) => {
        if (!cancelled) setAssets(rows);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [shop.id]);

  async function refresh() {
    const rows = await listOwnerMedia({ data: { shopId: shop.id } });
    setAssets(rows);
  }

  async function takeFiles(list: FileList | null) {
    if (!list || readonly || busy) return;
    const host = hostRef.current ?? document.documentElement;
    const files = Array.from(list).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;
    setBusy("upload");
    setError(null);
    setStatus("Etching the shop onto each still…");
    try {
      for (const [index, file] of files.entries()) {
        const branded = await brandFile(file, shop.name, host);
        const nextHero = !hero && index === 0 && (slot === "hero" || files.length === 1);
        await uploadBranded(shop.id, branded, slot, purpose || file.name.replace(/\.[^.]+$/, ""), nextHero);
      }
      await refresh();
      setStatus("Branded stills are on the book.");
      setPurpose("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Those photos could not be branded");
      setStatus("");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function markHero(assetId: string) {
    if (readonly || busy) return;
    setAssets(await updateOwnerMedia({ data: { shopId: shop.id, assetId, slot: "hero", isHero: true } }));
  }

  async function changeSlot(assetId: string, next: MediaSlot) {
    if (readonly || busy) return;
    setAssets(await updateOwnerMedia({ data: { shopId: shop.id, assetId, slot: next } }));
  }

  async function changePurpose(assetId: string, next: string) {
    if (readonly || busy) return;
    setAssets(await updateOwnerMedia({ data: { shopId: shop.id, assetId, purpose: next, caption: next } }));
  }

  async function dropAsset(assetId: string) {
    if (readonly || busy) return;
    setAssets(await removeOwnerMedia({ data: { shopId: shop.id, assetId } }));
  }

  async function animateHero() {
    if (!hero || readonly || busy) return;
    setBusy("animate");
    setError(null);
    setStatus("Rendering the hero loop…");
    try {
      const still = await fetch(hero.url);
      if (!still.ok) throw new Error("The hero still could not be read");
      const blob = await still.blob();
      const form = new FormData();
      form.append("shopId", shop.id);
      form.append("image", blob, "hero.jpg");
      form.append("preset", "obsidian_carbon");
      form.append("tagline", shop.tagline || shop.name);
      let data = await postIntro(form);
      for (let attempt = 0; attempt < 24 && data.pending && data.requestId; attempt += 1) {
        await wait(4000);
        const poll = new FormData();
        poll.append("shopId", shop.id);
        poll.append("requestId", data.requestId);
        poll.append("preset", "obsidian_carbon");
        poll.append("tagline", shop.tagline || shop.name);
        data = await postIntro(poll);
      }
      if (!data.heroVideoUrl) throw new Error("The intro is still rendering. Try again in a moment.");
      await populateOwnerStorefront({ data: { shopId: shop.id } });
      setStatus("The film is behind the glass. The rest of the stills are on the shop.");
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The hero could not be animated");
      setStatus("");
    } finally {
      setBusy(null);
    }
  }

  async function writePost() {
    if (readonly || busy) return;
    setBusy("social");
    setError(null);
    setCopied(false);
    try {
      const outreach = assets.find((item) => item.slot === "outreach") ?? hero ?? assets[0];
      const next = await draftOwnerSocial({
        data: { shopId: shop.id, assetId: outreach?.id, channels },
      });
      setDraft({ id: next.id, caption: next.caption, imageUrl: next.imageUrl, channels: next.channels });
      setStatus("Caption is ready. Approve to send it to the connected pages.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The post could not be written");
    } finally {
      setBusy(null);
    }
  }

  async function approvePost() {
    if (!draft || readonly || busy) return;
    setBusy("approve");
    setError(null);
    try {
      const result = await approveOwnerSocial({ data: { shopId: shop.id, postId: draft.id } });
      await navigator.clipboard.writeText(result.caption || draft.caption);
      setCopied(true);
      const waiting = result.pending.map((channel) => SOCIAL_CHANNEL_LABEL[channel]).join(", ");
      setStatus(
        waiting
          ? `Approved and copied. ${waiting} will take the post once those pages are linked.`
          : "Approved and copied.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "That post could not be approved");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section ref={hostRef} className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Launch desk</p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl">Stamp, animate, go live.</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Drop the shop photos. Each one is etched with {shop.name}. Pick the hero, animate it, and the rest fill the
            public page.
          </p>
        </div>
        <Link
          to="/$shopSlug"
          params={{ shopSlug: shop.slug }}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-fg px-5 text-sm font-medium text-bg"
        >
          <Eye className="size-4" aria-hidden />
          View Customer-Facing Site
        </Link>
      </header>

      <div className="grid gap-6 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Label htmlFor="launch-slot">This photo is for</Label>
            <select
              id="launch-slot"
              className="mt-2 h-12 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
              value={slot}
              disabled={readonly || Boolean(busy)}
              onChange={(event) => setSlot(event.target.value as MediaSlot)}
            >
              {MEDIA_SLOTS.map((item) => (
                <option key={item} value={item}>
                  {MEDIA_SLOT_LABEL[item]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="launch-purpose">What to call it</Label>
            <Input
              id="launch-purpose"
              className="mt-2"
              value={purpose}
              disabled={readonly || Boolean(busy)}
              placeholder="Van at dusk, crew, lockout…"
              onChange={(event) => setPurpose(event.target.value)}
            />
          </div>
        </div>
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-surface-2 px-4 text-center">
          <ImagePlus className="size-6 text-accent" aria-hidden />
          <span className="text-sm text-fg">Drop any number of photos</span>
          <span className="text-xs text-muted">JPEG, PNG, or WebP. The studio stamps every frame.</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={readonly || Boolean(busy)}
            onChange={(event) => void takeFiles(event.target.files)}
          />
        </label>
      </div>

      {assets.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <li key={asset.id} className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
              <img src={asset.url} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="grid gap-3 p-4">
                <select
                  className="h-11 rounded-xl bg-surface-2 px-3 text-sm text-fg"
                  value={asset.slot}
                  disabled={readonly || Boolean(busy)}
                  onChange={(event) => void changeSlot(asset.id, event.target.value as MediaSlot)}
                >
                  {MEDIA_SLOTS.map((item) => (
                    <option key={item} value={item}>
                      {MEDIA_SLOT_LABEL[item]}
                    </option>
                  ))}
                </select>
                <Input
                  defaultValue={asset.purpose || asset.caption}
                  disabled={readonly || Boolean(busy)}
                  onBlur={(event) => {
                    const next = event.target.value.trim();
                    if (next && next !== (asset.purpose || asset.caption)) void changePurpose(asset.id, next);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={asset.isHero ? "accent" : "secondary"}
                    disabled={readonly || Boolean(busy)}
                    onClick={() => void markHero(asset.id)}
                  >
                    {asset.isHero ? "Hero still" : "Use as hero"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={readonly || Boolean(busy)} onClick={() => void dropAsset(asset.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No branded stills yet. The public page keeps the niche template until you add them.</p>
      )}

      <div className="grid gap-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Hero animation</p>
        <h3 className="font-display text-2xl">One click. The glass gets the film.</h3>
        <p className="text-sm text-muted">
          {hero
            ? `${hero.caption || "The chosen still"} becomes the cinematic loop behind the obsidian shards. Gallery, mark, and crew stills slot themselves.`
            : "Pick a hero still first."}
        </p>
        <Button type="button" variant="accent" disabled={readonly || !hero || Boolean(busy)} onClick={() => void animateHero()}>
          <Play className="size-4" aria-hidden />
          {busy === "animate" ? "Animating hero" : "Animate Hero"}
        </Button>
      </div>

      <div className="grid gap-4 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Social outreach</p>
        <h3 className="font-display text-2xl">Stamp a post. Approve the send.</h3>
        <p className="text-sm text-muted">
          Uses a branded outreach still, or the hero if you have not tagged one. {trade} copy is written for the connected
          pages.
        </p>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_CHANNELS.map((channel) => {
            const on = channels.includes(channel);
            return (
              <button
                key={channel}
                type="button"
                aria-pressed={on}
                disabled={readonly || Boolean(busy)}
                className={`h-11 rounded-xl px-3 text-sm ${on ? "bg-fg text-bg" : "bg-surface-2 text-fg"}`}
                onClick={() =>
                  setChannels((current) =>
                    on ? current.filter((item) => item !== channel) : [...current, channel],
                  )
                }
              >
                {SOCIAL_CHANNEL_LABEL[channel]}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={readonly || assets.length === 0 || Boolean(busy)} onClick={() => void writePost()}>
            <Share2 className="size-4" aria-hidden />
            {busy === "social" ? "Writing" : "Write the post"}
          </Button>
          <Button type="button" variant="accent" disabled={!draft || readonly || Boolean(busy)} onClick={() => void approvePost()}>
            {copied ? "Approved · copied" : "Approve & push"}
          </Button>
        </div>
        {draft ? (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            {draft.imageUrl ? <img src={draft.imageUrl} alt="" className="aspect-square w-full rounded-xl object-cover" /> : null}
            <p className="whitespace-pre-wrap text-sm text-fg">{draft.caption}</p>
          </div>
        ) : null}
      </div>

      {status ? <p className="text-sm text-ok">{status}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}
