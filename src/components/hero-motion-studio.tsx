import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { TacticalHero } from "@/components/tactical-hero";
import { Button } from "@/components/ui/button";
import {
  HERO_MOTIONS,
  heroMotionPreview,
  heroPresetLabel,
  planLiveHero,
  type HeroMotionId,
  type HeroMotionState,
  type LiveHeroPlan,
} from "@/lib/axiom/hero-motion";
import { inspectHeroUpload } from "@/lib/axiom/hero-poster";
import { HERO_VIDEO_MAX_BYTES } from "@/lib/axiom/hero-video";
import { isCatalogHeroUrl } from "@/lib/axiom/hero-films";
import { NICHE_MEDIA } from "@/lib/axiom/media";
import { NICHES, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import type { Shop, ShopNiche } from "@/lib/axiom/types";
import { coveredShare, createCover, revealStroke } from "@/lib/axiom/particle-brand";

export type HeroMotionPublish = {
  plan: LiveHeroPlan;
  file: File | null;
  /** JPEG data URL captured from the upload. Used as the still and the video poster. */
  poster?: string;
};

export type HeroMotionResult = {
  path: string;
  warning?: string;
};

const COLS = 72;
const ROWS = 40;
const BRUSH = 5.5;
const LEAD: ShopNiche[] = ["field", "landscaper", "contractor"];

type Upload = { file: File; url: string; kind: "video" | "image"; poster: string };

function leadRank(niche: ShopNiche): number {
  const index = LEAD.indexOf(niche);
  return index === -1 ? LEAD.length : index;
}

export function HeroMotionStudio({
  shop,
  readonly,
  onSetLive,
}: {
  shop: Shop;
  readonly: boolean;
  onSetLive: (action: HeroMotionPublish) => Promise<HeroMotionResult>;
}) {
  const reduce = useReducedMotion();
  const presets = useMemo(() => {
    return PUBLIC_NICHE_ORDER.flatMap((niche) => {
      const film = NICHE_MEDIA[niche];
      if (!film || !isCatalogHeroUrl(film.heroVideoUrl)) return [];
      return [
        {
          niche,
          label: heroPresetLabel(niche, NICHES[niche].label),
          url: film.heroVideoUrl,
          image: film.heroImageUrl,
        },
      ];
    }).sort((a, b) => leadRank(a.niche) - leadRank(b.niche) || a.label.localeCompare(b.label));
  }, []);
  const initialNiche = presets.some((item) => item.niche === shop.niche) ? shop.niche : (presets[0]?.niche ?? shop.niche);
  const stored = shop.tradeProfile.studio.motion;
  const [picked, setPicked] = useState<ShopNiche>(initialNiche);
  const [motionOn, setMotionOn] = useState<HeroMotionState>({
    pan: stored.pan || shop.introPreset === "cinematic-pan",
    ripple: stored.ripple,
    neon: stored.neon || shop.glowEnabled,
    particle: stored.particle,
  });
  const [upload, setUpload] = useState<Upload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hot, setHot] = useState(false);
  const [painted, setPainted] = useState(false);
  const [hidden, setHidden] = useState(1);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const rippleRef = useRef<HTMLCanvasElement>(null);

  const preset = presets.find((item) => item.niche === picked) ?? presets[0];
  const fallback = NICHES[picked]?.defaultName || NICHES[shop.niche].defaultName;
  const preview = heroMotionPreview(
    shop.name,
    fallback,
    upload?.kind === "video" ? "" : (preset?.url ?? ""),
    upload?.kind === "image" ? "" : (preset?.image ?? ""),
  );
  const mediaUrl = upload?.url || preview.mediaUrl;
  const mediaKind = upload?.kind ?? preview.kind;
  const livePath = shop.heroVideoUrl || NICHE_MEDIA[shop.niche]?.heroVideoUrl || "Niche default";

  useEffect(() => {
    if (!motionOn.ripple || reduce) return;
    const canvas = rippleRef.current;
    if (!canvas) return;
    let dead = false;
    let frame = 0;
    const draw = (time: number) => {
      if (dead) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width >= 8 && rect.height >= 8) {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const width = Math.floor(rect.width * dpr);
        const height = Math.floor(rect.height * dpr);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const ink = getComputedStyle(canvas).color || "rgb(46, 230, 214)";
          ctx.clearRect(0, 0, width, height);
          ctx.strokeStyle = ink;
          ctx.fillStyle = ink;
          for (let i = 0; i < 5; i += 1) {
            const phase = (time / 900 + i * 0.72) % (Math.PI * 2);
            const radius = (0.16 + ((Math.sin(phase) + 1) / 2) * 0.42) * Math.min(width, height);
            ctx.globalAlpha = 0.16 + 0.14 * ((Math.sin(phase) + 1) / 2);
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.ellipse(width * 0.5, height * 0.62, radius, radius * 0.26, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 0.1;
          ctx.fillRect(0, height * 0.58, width, height * 0.42);
          ctx.globalAlpha = 1;
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
    };
  }, [motionOn.ripple, reduce]);

  useEffect(() => {
    if (!motionOn.particle) return;
    const canvas = particleRef.current;
    if (!canvas) return;
    let dead = false;
    let frame = 0;
    let pointerId = -1;
    let down = false;
    const cover = createCover(COLS, ROWS);
    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(2, Math.floor(rect.width * dpr));
      const height = Math.max(2, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const ink = getComputedStyle(canvas).color || "rgb(8, 8, 10)";
      const cellW = canvas.width / COLS;
      const cellH = canvas.height / ROWS;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = ink;
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          if ((cover[y * COLS + x] ?? 0) < 0.5) continue;
          ctx.globalAlpha = (x + y) % 5 === 0 ? 0.96 : 0.86;
          ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
        }
      }
      ctx.globalAlpha = 1;
      return true;
    };
    const cellAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * COLS,
        y: ((clientY - rect.top) / rect.height) * ROWS,
      };
    };
    const onDown = (event: PointerEvent) => {
      down = true;
      pointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      const hit = cellAt(event.clientX, event.clientY);
      if (hit) revealStroke(cover, COLS, ROWS, hit.x, hit.y, BRUSH);
    };
    const onMove = (event: PointerEvent) => {
      if (!down || event.pointerId !== pointerId) return;
      const hit = cellAt(event.clientX, event.clientY);
      if (hit) revealStroke(cover, COLS, ROWS, hit.x, hit.y, BRUSH);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      down = false;
      setHidden(coveredShare(cover));
    };
    let didPaint = false;
    const loop = () => {
      if (dead) return;
      if (paint() && !didPaint) {
        didPaint = true;
        setPainted(true);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      setPainted(false);
      setHidden(1);
    };
  }, [motionOn.particle]);

  function toggle(id: HeroMotionId) {
    setMotionOn((current) => ({ ...current, [id]: !current[id] }));
    setNotice(null);
  }

  async function chooseFile(file: File | undefined) {
    if (!file || busy) return;
    const video = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    const image = file.type.startsWith("image/");
    if (!video && !image) {
      setError("Upload a photo or an .mp4 video");
      return;
    }
    if (video && file.size > HERO_VIDEO_MAX_BYTES) {
      setError("Video must be 12 MB or smaller");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const inspected = await inspectHeroUpload(file);
      const url = URL.createObjectURL(file);
      const next: Upload = { file, url, kind: video ? "video" : "image", poster: inspected.poster };
      setUpload((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return next;
      });
      if (!readonly) await commit(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (readonly || busy) return;
    setBusy(true);
    try {
      await commit(upload);
    } finally {
      setBusy(false);
    }
  }

  async function commit(current: Upload | null) {
    const plan = planLiveHero(
      {
        upload: current?.kind ?? null,
        catalogVideo: current ? "" : (preset?.url ?? ""),
        catalogImage: current ? "" : (preset?.image ?? ""),
      },
      motionOn,
    );
    if (!plan.mediaPath) {
      setError("Choose a niche film or upload a photo or video.");
      return;
    }
    setError(null);
    try {
      const result = await onSetLive({ plan, file: current?.file ?? null, poster: current?.poster });
      setNotice(result.path);
      if (result.warning) setError(result.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set the live hero");
    }
  }

  return (
    <section aria-label="Hero Motion and Generation Studio" className="pointer-events-auto glass-panel rounded-[28px] p-5 sm:p-6">
      <p className="text-xs uppercase tracking-widest text-muted">Storefront</p>
      <h2 className="mt-1 font-display text-4xl">Hero Motion & Generation Studio</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Drop a photo or a short MP4. It becomes this shop&apos;s hero, with a poster frame, as soon as the file lands. Niche films stay available until you upload your own.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.85fr)]">
        {upload ? (
          <TacticalHero
            compact
            label={shop.name}
            videoUrl={upload.kind === "video" ? upload.url : undefined}
            imageUrl={upload.kind === "image" ? upload.url : upload.poster}
          >
            {motionOn.ripple ? (
              <canvas ref={rippleRef} aria-hidden className="pointer-events-none absolute inset-0 z-[2] h-full w-full text-accent" />
            ) : null}
            {motionOn.particle ? (
              <canvas
                ref={particleRef}
                aria-label="Swipe to reveal the hero loop"
                className="pointer-events-auto absolute inset-0 z-[2] h-full w-full touch-none text-bg"
              />
            ) : null}
            {motionOn.particle && !painted ? <div className="pointer-events-none absolute inset-0 z-[2] bg-bg" /> : null}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-5">
              <p className="text-xs uppercase tracking-widest text-accent">{preview.line}</p>
              <p className="font-display text-3xl text-fg">{shop.name}</p>
            </div>
          </TacticalHero>
        ) : (
        <div className="relative aspect-video overflow-hidden rounded-[24px] bg-bg" style={{ perspective: "900px" }}>
          <motion.div
            className="pointer-events-none absolute inset-[-8%]"
            animate={
              motionOn.pan && !reduce
                ? { x: ["-3%", "3%", "-3%"], y: ["1.2%", "-1.2%", "1.2%"], rotateY: [-8, 8, -8] }
                : { x: "0%", y: "0%", rotateY: 0 }
            }
            transition={
              motionOn.pan && !reduce
                ? { duration: 16, repeat: Infinity, ease: "easeInOut" }
                : { duration: reduce ? 0 : 0.35 }
            }
            style={{ transformStyle: "preserve-3d" }}
          >
            {mediaUrl && mediaKind === "video" ? (
              <video
                key={mediaUrl}
                className="pointer-events-none h-full w-full object-cover"
                src={mediaUrl}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : null}
            {mediaUrl && mediaKind === "image" ? (
              <img key={mediaUrl} src={mediaUrl} alt="" className="pointer-events-none h-full w-full object-cover" />
            ) : null}
          </motion.div>

          {motionOn.ripple ? (
            <canvas ref={rippleRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-accent" />
          ) : null}
          {motionOn.particle ? (
            <canvas
              ref={particleRef}
              aria-label="Swipe to reveal the hero loop"
              className="pointer-events-auto absolute inset-0 h-full w-full touch-none text-bg"
            />
          ) : null}
          {motionOn.particle && !painted ? <div className="pointer-events-none absolute inset-0 bg-bg" /> : null}
          {motionOn.neon ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow:
                  "inset 0 0 0 1px color-mix(in srgb, var(--neon, var(--color-accent)) 75%, transparent), inset 0 0 56px color-mix(in srgb, var(--neon, var(--color-accent)) 32%, transparent)",
              }}
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5"
            style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--color-bg) 84%, transparent), transparent)" }}
          >
            <p className="text-xs uppercase tracking-widest text-accent">{preview.line}</p>
            <p className="font-display text-4xl text-fg">{shop.name}</p>
            <p className="mt-1 text-sm text-muted">
              {motionOn.particle ? (hidden < 0.08 ? "Film open" : "Swipe the cover") : "Live micro-loop"}
            </p>
          </div>
        </div>
        )}

        <div className="pointer-events-auto flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              className={`hero-drop ${hot ? "is-hot" : ""}`}
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
                void chooseFile(event.dataTransfer.files?.[0]);
              }}
            >
              <span className="text-sm text-fg">{busy ? "Reading the file…" : "Drop a photo or short MP4"}</span>
              <span className="text-xs text-muted">This shop&apos;s hero library. 12 MB, under 20 seconds.</span>
              <input
                type="file"
                accept="image/*,video/mp4,.mp4"
                className="sr-only"
                disabled={readonly || busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void chooseFile(file);
                }}
              />
            </label>
            {upload ? (
              <button
                type="button"
                className="pointer-events-auto inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-sm text-fg"
                onClick={() => {
                  setUpload((current) => {
                    if (current) URL.revokeObjectURL(current.url);
                    return null;
                  });
                  setNotice(null);
                }}
              >
                Use the niche film
              </button>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            {upload
              ? `Your ${upload.kind} is in the tactical frame. A poster frame was cut from it.`
              : "Niche films play from the hero library until you drop your own."}
          </p>

          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Niche presets">
            {presets.map((item) => {
              const on = !upload && item.niche === picked;
              return (
                <button
                  key={item.niche}
                  type="button"
                  role="option"
                  aria-selected={on}
                  disabled={busy}
                  className={`pointer-events-auto inline-flex h-11 items-center rounded-full px-4 text-sm ${on ? "bg-fg text-bg" : "bg-surface-2 text-fg"}`}
                  onClick={() => {
                    setPicked(item.niche);
                    setUpload((current) => {
                      if (current) URL.revokeObjectURL(current.url);
                      return null;
                    });
                    setNotice(null);
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-2">
            {HERO_MOTIONS.map((item) => {
              const on = motionOn[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={busy}
                  onClick={() => toggle(item.id)}
                  className="pointer-events-auto flex h-11 items-center justify-between rounded-xl bg-surface-2 px-3 text-sm text-fg disabled:opacity-50"
                >
                  <span>{item.label}</span>
                  <span className={on ? "text-accent" : "text-faint"}>{on ? "On" : "Off"}</span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-muted">Live path · {notice || livePath}</p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button
            variant="accent"
            size="lg"
            className="pointer-events-auto w-full"
            disabled={readonly || busy || !mediaUrl}
            onClick={() => void publish()}
          >
            {busy ? "Setting live hero…" : "Set as Live Hero"}
          </Button>
          {readonly ? <p className="text-sm text-muted">This preview keeps the niche film. A shop you own can set it live.</p> : null}
        </div>
      </div>
    </section>
  );
}
