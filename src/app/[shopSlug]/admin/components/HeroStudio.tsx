import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { HERO_VIDEO_MAX_BYTES } from "@/lib/axiom/hero-video";
import {
  boundHeroAnimation,
  cleanHeroUrl,
  heroAnimationLabel,
  heroPresets,
  isHeroAnimationFile,
  isHeroAnimationUrl,
  persistHeroToSupabase,
  readHeroDraft,
  writeHeroDraft,
  type HeroPreset,
} from "@/lib/axiom/hero-studio-state";
import { listHeroAnimations, revalidateStorefront, updateShopBrand, updateShopProfile } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

const SAVED = "Hero animation updated and live cache revalidated.";
const MAX_MB = Math.round(HERO_VIDEO_MAX_BYTES / (1024 * 1024));

function startingFilm(shop: Shop, storedUrl: string | undefined): string {
  if (isHeroAnimationUrl(storedUrl) && cleanHeroUrl(storedUrl) === storedUrl) return storedUrl ?? "";
  if (isHeroAnimationUrl(shop.heroVideoUrl) && cleanHeroUrl(shop.heroVideoUrl) === shop.heroVideoUrl) {
    return shop.heroVideoUrl ?? "";
  }
  return boundHeroAnimation(shop.niche, shop.customNiche) || heroPresets()[0]?.url || "";
}

export function HeroStudio({ shop, readonly }: { shop: Shop; readonly: boolean }) {
  const router = useRouter();
  const stored = readHeroDraft(shop.slug);
  const [library, setLibrary] = useState<HeroPreset[]>(heroPresets());
  const [tagline, setTagline] = useState(stored?.tagline ?? shop.tagline);
  const [video, setVideo] = useState(startingFilm(shop, stored?.hero_video_url));
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileName = video.split("/").pop() || "";

  useEffect(() => {
    let cancelled = false;
    void listHeroAnimations()
      .then((rows) => {
        if (cancelled || !rows?.length) return;
        setLibrary(rows.filter((row) => isHeroAnimationUrl(row.url) && cleanHeroUrl(row.url) === row.url));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(url: string, nextTagline = tagline) {
    const file = url.split("/").pop() ?? "";
    if (!isHeroAnimationFile(file) || !isHeroAnimationUrl(url) || cleanHeroUrl(url) !== url) {
      setError("Choose a single .mp4 named like auto-hero-animation.mp4.");
      return;
    }
    setVideo(url);
    setBusy(true);
    setError(null);
    setStatus("");
    try {
      const draft = writeHeroDraft(shop.slug, { hero_video_url: url, tagline: nextTagline });
      setTagline(draft.tagline);
      if (!readonly) {
        await updateShopProfile({
          data: {
            slug: shop.slug,
            name: shop.name,
            tagline: draft.tagline,
            description: shop.description,
            address: shop.address,
          },
        });
        await updateShopBrand({ data: { slug: shop.slug, catalogFilm: draft.hero_video_url } });
      }
      await persistHeroToSupabase(shop.slug, draft);
      await revalidateStorefront({ data: shop.slug });
      await router.invalidate();
      setStatus(SAVED);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  function takeFile(next: File | undefined) {
    if (!next) return;
    const name = next.name.toLowerCase();
    if (!isHeroAnimationFile(name)) {
      setError("New loops must be named prefix-hero-animation.mp4. Doubled .mp4.mp4 files are not accepted.");
      return;
    }
    if (next.size > HERO_VIDEO_MAX_BYTES) {
      setError(`Video must be ${MAX_MB} MB or smaller.`);
      return;
    }
    const match = library.find((item) => item.url.endsWith(`/${name}`));
    if (!match) {
      setError("That name matches the convention, but the file is not in public/media yet.");
      return;
    }
    void handleSave(match.url);
  }

  return (
    <main className="motion-studio">
      <section className="motion-frame">
        <span className="motion-tick" aria-hidden />
        <p className="motion-kicker">// HERO MOTION STUDIO</p>
        <p className="motion-help">
          {`Upload, tag, and publish a *-hero-animation.mp4 loop. New loops must use that name and a single .mp4, up to ${MAX_MB} MB.`}
        </p>

        <div className="motion-preview">
          {video ? <video key={video} src={video} autoPlay muted loop playsInline /> : null}
        </div>
        <p className="motion-caption">{fileName ? `PREVIEW: ${fileName}` : "PREVIEW: PENDING"}</p>

        <label className="motion-label" htmlFor="hero-library">
          Designated hero loops
        </label>
        <select
          id="hero-library"
          className="film-select"
          disabled={busy}
          value={library.some((item) => item.url === video) ? video : ""}
          onChange={(event) => {
            const url = event.target.value;
            if (!url) return;
            void handleSave(url);
          }}
        >
          <option value="">Select a loop</option>
          {library.map((item) => {
            const name = item.url.split("/").pop() ?? item.label;
            return (
              <option key={item.id} value={item.url}>
                {`${item.label} — ${name}`}
              </option>
            );
          })}
        </select>

        <label className="motion-label" htmlFor="hero-tagline">
          Tag
        </label>
        <input
          id="hero-tagline"
          className="motion-tag"
          value={tagline}
          maxLength={160}
          onChange={(event) => setTagline(event.target.value)}
          onBlur={() => {
            if (isHeroAnimationUrl(video)) void handleSave(video, tagline);
          }}
        />

        <div
          className={drag ? "hero-drop is-hot" : "hero-drop"}
          onDragEnter={(event) => {
            event.preventDefault();
            setDrag(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDrag(false);
            takeFile(event.dataTransfer.files?.[0]);
          }}
        >
          <p className="motion-help">Drop a named hero animation to select it.</p>
          <input
            type="file"
            accept=".mp4,video/mp4"
            className="motion-file"
            onChange={(event) => {
              takeFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        {error ? <p className="motion-error">{error}</p> : null}
        {status ? <p className="motion-status">{status}</p> : null}
      </section>
    </main>
  );
}
