"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AiContentAutopilotToggle } from "@/components/admin/ai-content-autopilot";
import { HeroButtonStudio } from "@/components/admin/hero-button-studio";
import { HeroMotionStudio } from "@/components/admin/hero-motion-studio";
import { DefaultAssetStudioPanel } from "@/components/admin/default-asset-studio";
import { HeroOtterInteractive } from "@/components/HeroOtterInteractive";
import { HeroSharkInteractive } from "@/components/HeroSharkInteractive";
import { HeroCustomizer } from "@/components/admin/HeroCustomizer";
import { CyberCompanionHud } from "@/components/CyberCompanionHud";
import { TemplateAssetTracker } from "@/components/funnel/TemplateAssetTracker";
import { defaultNicheFilm } from "@/config/catalog";
import { isOtterHeroFilm, isSharkHeroFilm } from "@/lib/axiom/hero-films";
import { HeroLoopVideo } from "@/components/loop-video";
import { getBearerToken } from "@/lib/auth/client";
import { HERO_CLIP_MAX_SECONDS, HERO_VIDEO_MAX_BYTES, heroClipTooLong } from "@/lib/axiom/hero-video";
import { MEDIA_FILE_MAX_BYTES } from "@/lib/axiom/media-slots";
import {
  DEFAULT_HERO_LOOK,
  boundHeroAnimation,
  cleanHeroUrl,
  cleanStillUrl,
  heroPresets,
  isPlayableHeroFilm,
  persistHeroToSupabase,
  parseHeroLook,
  readHeroDraft,
  uploadHeroToStorage,
  writeHeroDraft,
  type HeroLook,
} from "@/lib/axiom/hero-studio-state";
import { revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

const MAX_MB = Math.round(HERO_VIDEO_MAX_BYTES / (1024 * 1024));
const STILL_MB = Math.round(MEDIA_FILE_MAX_BYTES / (1024 * 1024));

const PRESETS: { key: "brackets" | "glow" | "overlay"; label: string; detail: string }[] = [
  { key: "brackets", label: "Corner brackets", detail: "Cinematic frame marks on the film." },
  { key: "glow", label: "Edge ring", detail: "A glowing ring around the storefront." },
  { key: "overlay", label: "Text overlay", detail: "Shop name, line, and city on the film." },
];

function startingFilm(shop: Shop, storedUrl: string | undefined): string {
  const stored = cleanHeroUrl(storedUrl);
  if (stored && isPlayableHeroFilm(stored)) return stored;
  const live = cleanHeroUrl(shop.heroVideoUrl);
  if (live && isPlayableHeroFilm(live)) return live;
  return boundHeroAnimation(shop.niche, shop.customNiche) || heroPresets()[0]?.url || "";
}

function clipSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => done(video.duration);
    video.onerror = () => done(Number.NaN);
    video.src = url;
  });
}

export function HeroStudio({ shop, readonly }: { shop: Shop; readonly: boolean }) {
  const router = useRouter();
  const stored = readHeroDraft(shop.slug);
  const [tagline, setTagline] = useState(stored?.tagline ?? shop.tagline);
  const [video, setVideo] = useState(startingFilm(shop, stored?.hero_video_url));
  const [still, setStill] = useState(stored?.hero_image_url || cleanStillUrl(shop.heroImageUrl));
  const [look, setLook] = useState<HeroLook>(
    parseHeroLook({
      ...(shop.heroLook ?? DEFAULT_HERO_LOOK),
      ...(stored?.look ?? {}),
      glow: stored?.look?.glow ?? shop.heroLook?.glow ?? shop.glowEnabled,
    }),
  );
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function publish(next: { video?: string; still?: string; look?: HeroLook; tagline?: string }) {
    const loop = cleanHeroUrl(next.video ?? video);
    const plate = cleanStillUrl(next.still ?? still);
    const frame = next.look ?? look;
    const line = next.tagline ?? tagline;
    if (!loop || !isPlayableHeroFilm(loop)) {
      setError("Choose a background loop before publishing.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("");
    try {
      const draft = writeHeroDraft(shop.slug, {
        hero_video_url: loop,
        hero_image_url: plate,
        tagline: line,
        look: frame,
      });
      setVideo(draft.hero_video_url);
      setStill(draft.hero_image_url ?? "");
      setTagline(draft.tagline);
      if (draft.look) setLook(draft.look);
      if (!readonly) {
        await updateShopBrand({
          data: {
            slug: shop.slug,
            tagline: draft.tagline,
            ...(plate ? { heroImageUrl: plate } : {}),
            heroFilm: draft.hero_video_url,
            glowEnabled: frame.glow,
            heroLook: frame,
            markHero: true,
          },
        });
      }
      const book = await persistHeroToSupabase(shop.slug, draft);
      await revalidateStorefront({ data: shop.slug });
      router.refresh();
      setStatus(
        book === "saved"
          ? "Hero background loop is live on the storefront (shops.hero_background_loop)."
          : "Hero loop is pinned on this desk. The hosted book did not confirm the pin.",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  async function takeFile(next: File | undefined) {
    if (!next || readonly || busy) return;
    const name = next.name.toLowerCase();
    const image = next.type.startsWith("image/") || /\.(jpe?g|png|webp)$/.test(name);
    const videoFile = next.type === "video/mp4" || name.endsWith(".mp4");
    if (!image && !videoFile) {
      setError("Drop a JPEG, PNG, WebP, or a short MP4.");
      return;
    }
    if (image && next.size > MEDIA_FILE_MAX_BYTES) {
      setError(`Images must be ${STILL_MB} MB or smaller.`);
      return;
    }
    if (videoFile && next.size > HERO_VIDEO_MAX_BYTES) {
      setError(`Video must be ${MAX_MB} MB or smaller.`);
      return;
    }
    if (videoFile) {
      const seconds = await clipSeconds(next);
      if (heroClipTooLong(seconds)) {
        setError(`Keep the clip under ${HERO_CLIP_MAX_SECONDS} seconds.`);
        return;
      }
    }
    setBusy(true);
    setError(null);
    setStatus("");
    try {
      const token = getBearerToken();
      const authHeaders: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
      if (image) {
        const body = new FormData();
        body.set("shopId", shop.id);
        body.set("image", next);
        body.set("slot", "hero");
        body.set("isHero", "1");
        body.set("purpose", "Hero still");
        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          credentials: "include",
          headers: authHeaders,
          body,
        });
        const json = (await res.json()) as { asset?: { url?: string }; error?: string };
        const hosted = await uploadHeroToStorage(shop.slug, next);
        const url = cleanStillUrl(hosted) || cleanStillUrl(json.asset?.url);
        if (!url) throw new Error(json.error || "That image could not be saved");
        setStill(url);
        setStatus("Still is ready. Publish to put it on the storefront.");
      } else {
        const res = await fetch(`/api/hero-video/${shop.id}`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "video/mp4", ...authHeaders },
          body: next,
        });
        const json = (await res.json()) as { heroVideoUrl?: string; error?: string };
        const hosted = await uploadHeroToStorage(shop.slug, next);
        const url = cleanHeroUrl(hosted) || cleanHeroUrl(json.heroVideoUrl);
        if (!url) throw new Error(json.error || "That clip could not be saved");
        setVideo(url);
        setStatus("Loop is ready. Publish to put it on the storefront.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="motion-studio">
      <section className="motion-frame">
        <span className="motion-tick" aria-hidden />
        <p className="motion-kicker">Hero studio</p>
        <p className="motion-help">
          Drop a still or a short MP4. The still sits on the film. The MP4 becomes the background loop.
        </p>
        <Link href={`/${shop.slug}/admin`} className="studio-back">
          Back to the desk
        </Link>
        <AiContentAutopilotToggle shop={shop} readonly={readonly} />
        <TemplateAssetTracker
          heroLoop={video}
          brandedPlate={still}
          logoUrl={shop.frontendTemplate?.logoUrl}
          serviceOnboarded={shop.onboarding.service}
          serviceCount={shop.primaryServiceId ? 1 : 0}
        />
        <DefaultAssetStudioPanel shop={shop} readonly={readonly} />

        <div className={`motion-preview${look.glow ? " is-ring" : ""}`}>
          {isSharkHeroFilm(video) ? (
            <HeroSharkInteractive active src={video}>
              {video ? <HeroLoopVideo key={video} src={video} autoPlay muted loop playsInline /> : null}
            </HeroSharkInteractive>
          ) : (
            <HeroOtterInteractive active={isOtterHeroFilm(video)} src={video || defaultNicheFilm(shop.niche)}>
              <HeroLoopVideo key={video || shop.niche} src={video || defaultNicheFilm(shop.niche)} autoPlay muted loop playsInline />
            </HeroOtterInteractive>
          )}
          {still ? <img src={still} alt="" /> : null}
          {look.brackets ? (
            <>
              <span className="film-bracket film-bracket-nw" aria-hidden />
              <span className="film-bracket film-bracket-ne" aria-hidden />
              <span className="film-bracket film-bracket-sw" aria-hidden />
              <span className="film-bracket film-bracket-se" aria-hidden />
            </>
          ) : null}
          {look.overlay ? (
            <p className="studio-plate">
              <strong>{shop.name}</strong>
              {tagline ? <span>{tagline}</span> : null}
            </p>
          ) : null}
        </div>

        <div
          className={drag ? "studio-drop is-hot" : "studio-drop"}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!readonly) setDrag(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!readonly) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDrag(false);
            void takeFile(event.dataTransfer.files?.[0]);
          }}
        >
          <p>Drop an image or a short MP4</p>
          <p className="motion-help">{`JPEG, PNG, or WebP up to ${STILL_MB} MB. MP4 up to ${MAX_MB} MB and ${HERO_CLIP_MAX_SECONDS} seconds.`}</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,.mp4"
            disabled={readonly || busy}
            onChange={(event) => {
              void takeFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        <div id="hero-archive">
          <HeroCustomizer
            niche={shop.niche}
            selectedUrl={video}
            disabled={busy || readonly}
            onSelect={(value) => {
              const next = value === "default" ? defaultNicheFilm(shop.niche) : value;
              setVideo(next);
              if (!readonly) void publish({ video: next });
            }}
          />
        </div>

        <label className="motion-label" htmlFor="hero-tagline">
          Overlay line
        </label>
        <input
          id="hero-tagline"
          className="motion-tag"
          value={tagline}
          maxLength={160}
          disabled={readonly}
          onChange={(event) => setTagline(event.target.value)}
        />

        <div className="studio-presets" role="group" aria-label="Frame presets">
          {PRESETS.map((preset) => {
            const on = look[preset.key];
            return (
              <button
                key={preset.key}
                type="button"
                className={on ? "studio-switch is-on" : "studio-switch"}
                aria-pressed={on}
                disabled={readonly}
                onClick={() => setLook((current) => ({ ...current, [preset.key]: !current[preset.key] }))}
              >
                <span>{preset.label}</span>
                <small>{preset.detail}</small>
              </button>
            );
          })}
        </div>

        <HeroMotionStudio
          shop={shop}
          readonly={readonly}
          onStill={(url) => {
            setStill(url);
            setStatus("Branded still is on the canvas.");
          }}
          onFilm={(url) => {
            setVideo(url);
            setStatus("Cinematic loop is on the canvas and the storefront.");
          }}
        />

        <HeroButtonStudio shop={shop} readonly={readonly} film={video} />

        <button type="button" className="studio-save" disabled={readonly || busy} onClick={() => void publish({})}>
          {busy ? "Publishing" : "Publish hero"}
        </button>
        {readonly ? <p className="motion-help">This desk can preview the frame. It cannot publish.</p> : null}
        {error ? <p className="motion-error">{error}</p> : null}
        {status ? <p className="motion-status">{status}</p> : null}
      </section>
      <CyberCompanionHud
        environment="hero-studio"
        shopName={shop.name}
        shopSlug={shop.slug}
        niche={shop.customNiche || shop.niche}
        city=""
        onFocusArchive={() => {
          document.getElementById("hero-archive")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </main>
  );
}
