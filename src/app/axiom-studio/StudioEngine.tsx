"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  DEFAULT_STUDIO_ACCENT,
  STOREFRONT_ACCENT_KEY,
  STUDIO_SWATCHES,
  normalizeAccent,
  writeStorefrontAccent,
  writeStorefrontDraft,
  type StorefrontDraft,
} from "@/lib/axiom/accent-color";
import {
  analyzeImage,
  drawBackground,
  drawNiche,
  hexRgb,
  paintStill,
  type Palette,
  type Rgb,
  type StudioNiche,
} from "./compose";
import { encodeGif } from "./gif";

const LOGO_LOOP = "/media/axiom/axiom-logo-loop.mp4";
const LOGO_POSTER = "/media/axiom/axiom-logo-poster.jpg";

type Phase = "idle" | "processing" | "ready";

export type StudioEngineProps = {
  embedded?: boolean;
  onLaunch?: (draft: StorefrontDraft) => void;
};

type Art = {
  url: string;
  subject: HTMLCanvasElement;
  palette: Palette;
  niche: StudioNiche;
  name: string;
};

const NICHES: { id: StudioNiche; label: string }[] = [
  { id: "plumbing", label: "Plumbing" },
  { id: "fishing", label: "Fishing Guide" },
  { id: "contracting", label: "Contracting" },
];

function nicheLabel(id: StudioNiche): string {
  return NICHES.find((item) => item.id === id)?.label ?? "Your shop";
}

export function StudioEngine({ embedded = false, onLaunch }: StudioEngineProps) {
  const reduced = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const rawUrl = useRef<string | null>(null);
  const buzzed = useRef(false);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState<StudioNiche>("contracting");
  const [phase, setPhase] = useState<Phase>("idle");
  const [art, setArt] = useState<Art | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState<"video" | "gif" | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [videoLabel, setVideoLabel] = useState("Download video");
  const [accent, setAccent] = useState<string>(DEFAULT_STUDIO_ACCENT);
  const [hexDraft, setHexDraft] = useState<string>(DEFAULT_STUDIO_ACCENT);
  const inkRef = useRef<Rgb>(hexRgb(DEFAULT_STUDIO_ACCENT));

  useEffect(() => {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/mp4")) {
      setVideoLabel("Download MP4");
    }
    try {
      const stored = normalizeAccent(window.localStorage.getItem(STOREFRONT_ACCENT_KEY));
      if (stored) {
        setAccent(stored);
        setHexDraft(stored);
        inkRef.current = hexRgb(stored);
      }
    } catch {
      /* private mode */
    }
    return () => {
      if (rawUrl.current) URL.revokeObjectURL(rawUrl.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !art) return;
    const bg = bgRef.current;
    const fx = fxRef.current;
    if (!bg || !fx) return;
    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = (now - started) / 1000;
      const rect = bg.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      for (const canvas of [bg, fx]) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }
      const bgCtx = bg.getContext("2d");
      const fxCtx = fx.getContext("2d");
      const target = hexRgb(accent);
      const live = inkRef.current;
      live.r += (target.r - live.r) * 0.18;
      live.g += (target.g - live.g) * 0.18;
      live.b += (target.b - live.b) * 0.18;
      if (bgCtx) drawBackground(bgCtx, w, h, t, art.palette.tint, live);
      if (fxCtx) drawNiche(fxCtx, w, h, t, art.niche, live);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, art, accent]);

  async function receive(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Use a PNG, JPG, or WEBP.");
      return;
    }
    setError("");
    const url = URL.createObjectURL(file);
    if (rawUrl.current) URL.revokeObjectURL(rawUrl.current);
    rawUrl.current = url;
    setSourceUrl(url);
    await generate(url, name.trim(), niche);
  }

  async function generate(url: string, business: string, chosen: StudioNiche) {
    setPhase("processing");
    buzzed.current = false;
    const started = performance.now();
    try {
      await nextFrame();
      const image = await loadImage(url);
      const { subject, palette } = analyzeImage(image, image.naturalWidth || image.width, image.naturalHeight || image.height);
      const elapsed = performance.now() - started;
      if (elapsed < 760) await wait(760 - elapsed);
      setArt({
        url: subject.toDataURL("image/png"),
        subject,
        palette,
        niche: chosen,
        name: business || nicheLabel(chosen),
      });
      setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image could not be read.");
      setPhase("idle");
    }
  }

  function updateName(value: string) {
    setName(value);
    const label = value.trim();
    setArt((current) => (current ? { ...current, name: label || nicheLabel(current.niche) } : current));
  }

  function chooseNiche(next: StudioNiche) {
    setNiche(next);
    setArt((current) => (current ? { ...current, niche: next, name: name.trim() || nicheLabel(next) } : current));
  }

  function chooseAccent(next: string) {
    const hex = normalizeAccent(next);
    if (!hex) return;
    setAccent(hex);
    setHexDraft(hex);
    writeStorefrontAccent(hex);
  }

  async function launchGenerate() {
    if (!rawUrl.current) {
      setError("Drop a logo or reference photo first.");
      return;
    }
    await generate(rawUrl.current, name.trim(), niche);
  }

  function launchDraft(): StorefrontDraft {
    let imageDataUrl = "";
    try {
      imageDataUrl = art?.subject.toDataURL("image/jpeg", 0.72) ?? "";
    } catch {
      imageDataUrl = "";
    }
    return writeStorefrontDraft({
      accent,
      niche,
      businessName: name.trim() || art?.name || nicheLabel(niche),
      imageDataUrl,
    });
  }

  async function downloadVideo() {
    if (!art) return;
    setSaving("video");
    try {
      const blob = await recordVideo(art, accent);
      saveBlob(blob, `axiom-${slug(art.name)}.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The video export did not finish.");
    } finally {
      setSaving(null);
    }
  }

  async function downloadGif() {
    if (!art) return;
    setSaving("gif");
    try {
      const bytes = renderGif(art, accent);
      saveBlob(
        new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
          type: "image/gif",
        }),
        `axiom-${slug(art.name)}.gif`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "The GIF export did not finish.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section id={embedded ? "studio" : undefined} className={`bg-[#050507] text-white ${embedded ? "scroll-mt-24 pt-24" : "min-h-dvh"}`} style={{ ["--studio-accent" as string]: accent }}>
      <style>{`
        .studio-scan {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 7px,
            color-mix(in srgb, var(--studio-accent) 50%, transparent) 8px,
            transparent 9px
          );
          animation: studio-scan 1.05s linear infinite;
        }
        .studio-sweep {
          background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--studio-accent) 70%, transparent), transparent);
          animation: studio-sweep 1.4s linear infinite;
        }
        @keyframes studio-scan { from { background-position: 0 0; } to { background-position: 0 36px; } }
        @keyframes studio-sweep { from { transform: translateY(-120%); } to { transform: translateY(220%); } }
        @media (prefers-reduced-motion: reduce) {
          .studio-scan, .studio-sweep { animation: none; }
        }
      `}</style>

      {embedded ? null : <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#00f2fe]">
          Axiom
        </Link>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/70">Studio Engine</p>
      </header>}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-6">
        <motion.div
          className="relative border bg-black/40"
          animate={{
            borderColor: dragging ? accent : `${accent}66`,
            boxShadow: `0 0 28px ${accent}55`,
          }}
          transition={{ duration: 0.35 }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void receive(event.dataTransfer.files?.[0]);
          }}
        >
          <motion.span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t" animate={{ borderColor: accent }} transition={{ duration: 0.35 }} aria-hidden />
          <motion.span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r border-t" animate={{ borderColor: accent }} transition={{ duration: 0.35 }} aria-hidden />
          <motion.span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l" animate={{ borderColor: accent }} transition={{ duration: 0.35 }} aria-hidden />
          <motion.span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r" animate={{ borderColor: accent }} transition={{ duration: 0.35 }} aria-hidden />

          <div className="relative w-full overflow-hidden bg-[#050507]">
            {phase !== "ready" && sourceUrl ? (
              <img src={sourceUrl} alt="" className="relative z-10 block h-auto w-full object-contain opacity-80" style={{ objectFit: "contain" }} />
            ) : null}
            {phase !== "ready" && !sourceUrl ? (
              <div className="relative w-full" style={{ perspective: 900 }}>
                <motion.video
                  className="block h-auto w-full object-contain"
                  style={{ objectFit: "contain" }}
                  src={LOGO_LOOP}
                  poster={LOGO_POSTER}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  animate={reduced ? undefined : { rotateY: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            ) : null}

            {phase === "ready" && art ? (
              <>
                <canvas ref={bgRef} className="absolute inset-0 h-full w-full" aria-hidden />
                <motion.img
                  key={art.url}
                  src={art.url}
                  alt=""
                  className="relative z-10 block h-auto w-full object-contain"
                  style={{ objectFit: "contain" }}
                  initial={reduced ? false : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  onAnimationComplete={() => {
                    if (buzzed.current) return;
                    buzzed.current = true;
                    if (reduced) return;
                    try {
                      navigator.vibrate(50);
                    } catch {
                      /* no vibrator, or the browser blocked it */
                    }
                  }}
                />
                <canvas ref={fxRef} className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden />
                <motion.p
                  className="absolute left-5 top-4 z-30 text-lg font-semibold tracking-tight sm:text-2xl"
                  animate={{ color: accent }}
                  transition={{ duration: 0.35 }}
                  style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
                >
                  {art.name}
                </motion.p>
              </>
            ) : null}

            {phase === "processing" ? (
              <div className="absolute inset-0 z-10 overflow-hidden">
                <div className="studio-scan absolute inset-0" />
                <div className="studio-sweep absolute inset-x-0 top-0 h-1/3" />
                <div className="absolute inset-0 grid place-items-center gap-3">
                  <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/15" style={{ borderTopColor: accent }} />
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>Neural scan</p>
                </div>
              </div>
            ) : null}
          </div>

          {phase === "idle" ? (
            <button
              type="button"
              className="w-full px-4 py-4 text-sm text-white/80"
              onClick={() => fileRef.current?.click()}
            >
              Drop your logo or reference photo to start generating.
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              void receive(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </motion.div>

        {phase === "ready" && art ? (
          <div className="grid gap-2">
            {onLaunch ? (
              <button
                type="button"
                onClick={() => onLaunch(launchDraft())}
                className="inline-flex min-h-12 items-center justify-center border px-4 text-center text-base font-semibold"
                style={{ borderColor: accent, color: accent, boxShadow: `0 0 24px ${accent}44` }}
              >
                Launch This Niche Site — $1 Today
              </button>
            ) : (
              <Link
                href={`/?plan=trial&accent=${encodeURIComponent(accent)}&niche=${encodeURIComponent(niche)}#book`}
                onClick={() => launchDraft()}
                className="inline-flex min-h-12 items-center justify-center border px-4 text-center text-base font-semibold"
                style={{ borderColor: accent, color: accent, boxShadow: `0 0 24px ${accent}44` }}
              >
                Launch This Niche Site — $1 Today
              </Link>
            )}
            <p className="text-center text-sm text-white/65">14-day trial, then $150/mo, cancel anytime in Admin Billing.</p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-2 text-sm text-white/70" htmlFor="studio-business">
            Business name
            <input
              ref={nameRef}
              id="studio-business"
              value={name}
              maxLength={48}
              onChange={(event) => updateName(event.target.value)}
              placeholder="Rogue River Fishing"
              className="min-h-12 border border-white/15 bg-black/50 px-3 text-base text-white outline-none focus:border-[#00f2fe]"
            />
          </label>
          <button
            type="button"
            onClick={() => void launchGenerate()}
            disabled={phase === "processing" || !sourceUrl}
            className="min-h-12 px-5 text-sm font-semibold text-[#041016] disabled:opacity-40"
            style={{ background: accent }}
          >
            Generate
          </button>
        </div>

        <fieldset>
          <legend className="text-sm text-white/70">Accent color</legend>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {STUDIO_SWATCHES.map((swatch) => {
              const selected = accent === swatch.value;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  aria-label={swatch.label}
                  aria-pressed={selected}
                  onClick={() => chooseAccent(swatch.value)}
                  className="grid h-11 w-11 place-items-center rounded-full border-2"
                  style={{ borderColor: selected ? "#ffffff" : "transparent" }}
                >
                  <motion.span
                    className="block h-7 w-7 rounded-full"
                    animate={{ backgroundColor: swatch.value, boxShadow: selected ? `0 0 16px ${swatch.value}` : `0 0 0 ${swatch.value}` }}
                    transition={{ duration: 0.35 }}
                  />
                </button>
              );
            })}
            <label className="grid gap-1 text-[11px] uppercase tracking-[0.16em] text-white/55">
              Hex
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Custom accent color"
                  value={accent}
                  onChange={(event) => chooseAccent(event.target.value)}
                  className="h-11 w-11 cursor-pointer border border-white/20 bg-transparent"
                />
                <input
                  value={hexDraft}
                  maxLength={7}
                  spellCheck={false}
                  onChange={(event) => {
                    const next = event.target.value;
                    setHexDraft(next);
                    const hex = normalizeAccent(next);
                    if (hex) chooseAccent(hex);
                  }}
                  className="min-h-11 w-28 border border-white/15 bg-black/50 px-2 font-mono text-sm normal-case tracking-normal text-white outline-none"
                  style={{ borderColor: `${accent}88` }}
                />
              </span>
            </label>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          {NICHES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={niche === item.id}
              onClick={() => chooseNiche(item.id)}
              className={`min-h-11 border px-4 text-sm ${niche === item.id ? "" : "border-white/15 text-white/70"}`}
              style={niche === item.id ? { borderColor: accent, color: accent, background: `${accent}22` } : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-[#ff2a3d]">{error}</p> : null}

        {phase === "ready" && art ? (
          <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void downloadVideo()}
                disabled={saving !== null}
                className="min-h-11 border border-[#00f2fe] px-4 text-sm text-[#00f2fe] disabled:opacity-40"
              >
                {saving === "video" ? "Recording…" : videoLabel}
              </button>
              <button
                type="button"
                onClick={() => void downloadGif()}
                disabled={saving !== null}
                className="min-h-11 border border-white/20 px-4 text-sm text-white disabled:opacity-40"
              >
                {saving === "gif" ? "Encoding…" : "Download GIF"}
              </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "studio";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be read."));
    image.src = url;
  });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function recordVideo(art: Art, accent: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas export is not available.");
  const stream = canvas.captureStream(30);
  const mime = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
    ? "video/mp4;codecs=avc1"
    : MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm";
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported(mime)) {
    throw new Error("This browser cannot record an MP4 or WebM from the preview.");
  }
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  recorder.start();
  const started = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      paintStill(ctx, 1280, 720, (now - started) / 1000, art.niche, art.palette.tint, art.subject, art.subject.width, art.subject.height, art.name, accent);
      if (now - started < 2800) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await stopped;
  return new Blob(chunks, { type: mime });
}

function renderGif(art: Art, accent: string): Uint8Array {
  const canvas = document.createElement("canvas");
  const w = 320;
  const h = 180;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas export is not available.");
  const frames: Uint8ClampedArray[] = [];
  for (let i = 0; i < 8; i++) {
    paintStill(ctx, w, h, i / 6, art.niche, art.palette.tint, art.subject, art.subject.width, art.subject.height, art.name, accent);
    frames.push(new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data));
  }
  return encodeGif(w, h, frames, 12);
}
