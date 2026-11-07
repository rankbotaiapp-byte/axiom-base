import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import WaterCanvas from "@/components/water/WaterCanvas";

const HERO_VIDEO = "/media/otter-hero-animation.mp4" as const;
const HERO_POSTER = "/media/otter-hero-poster.jpg" as const;

type AxiomHeroProps = {
  /** Primary CTA — Choose Your Price trial entry into the main build. */
  onEnter?: () => void | Promise<void>;
  ctaLabel?: string;
  headerSlot?: ReactNode;
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
  /** When true, fade the stage out during the transition into the app. */
  leaving?: boolean;
};

function releaseVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  try {
    video.pause();
    video.removeAttribute("src");
    video.load();
  } catch {
    /* ignore teardown races */
  }
}

/**
 * Corporate otter hero from the axiom-hero pack:
 * full-bleed muted loop + WebGL droplet/ripple refraction + Choose Your Price CTA.
 */
export function AxiomHero({
  onEnter,
  ctaLabel = "$1 Choose Your Price Trial",
  headerSlot,
  videoSrc = HERO_VIDEO,
  posterSrc = HERO_POSTER,
  className,
  leaving = false,
}: AxiomHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const [shaderLive, setShaderLive] = useState(true);

  // Stop WebGL as soon as we begin leaving so RAF / listeners / textures release.
  useEffect(() => {
    if (!leaving) {
      setShaderLive(true);
      return;
    }
    setShaderLive(false);
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
    }
  }, [leaving]);

  // Full unmount cleanup — drop the media element source to free decoder memory.
  useEffect(() => {
    const video = videoRef.current;
    return () => releaseVideo(video);
  }, []);

  async function handleEnter() {
    if (busy || leaving) return;
    setBusy(true);
    setShaderLive(false);
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
    }
    try {
      await onEnter?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={cn(
        "relative h-[100svh] w-full snap-start snap-always touch-none select-none overflow-hidden bg-obsidian",
        "transition-[opacity,transform,filter] duration-700 ease-out",
        leaving && "pointer-events-none scale-[1.02] opacity-0 blur-sm",
        className,
      )}
      aria-label="Axiom water hero"
    >
      {/* Layer 0 — cinematic base video (also the no-WebGL fallback) */}
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={leaving ? undefined : videoSrc}
        poster={posterSrc}
        autoPlay={!leaving}
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />

      {/* Layer 1 — WebGL lens: droplets + ripple refraction of the otter film */}
      {shaderLive ? <WaterCanvas videoRef={videoRef} active={!leaving} /> : null}

      {/* Layer 2 — UI. Wrapper ignores pointers so empty space still ripples. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
          <span className="font-display text-sm font-semibold tracking-[0.35em] text-fg/90">AXIOM</span>
          <div className="pointer-events-auto flex items-center gap-3">{headerSlot}</div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p
            className="font-display text-[clamp(4.5rem,18vw,13rem)] font-black leading-[0.85] tracking-tight text-fg"
            style={{ textShadow: "0 0 40px color-mix(in srgb, var(--color-accent) 35%, transparent), 0 4px 24px rgba(0,0,0,0.6)" }}
          >
            AXIOM
          </p>
          <p className="mt-5 max-w-md text-balance text-base text-fg/85 sm:text-lg">
            Your business app, live on your customers&apos; phones in minutes — and built to scale as far as you go.
          </p>

          <button
            type="button"
            onClick={() => void handleEnter()}
            disabled={busy || leaving}
            className={cn(
              "pointer-events-auto mt-9 inline-flex min-h-12 items-center gap-3 rounded-full bg-accent px-8 py-4",
              "text-base font-bold text-obsidian shadow-[0_0_40px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]",
              "transition hover:scale-[1.03] hover:bg-accent/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50",
              "active:scale-[0.98] disabled:opacity-70 sm:text-lg",
            )}
          >
            <span className="rounded-full bg-obsidian px-2.5 py-0.5 text-sm text-accent">$1</span>
            {ctaLabel.replace(/^\$1\s*/, "")}
          </button>
          <p className="mt-3 text-xs text-muted">Start for $1. Pay what it&apos;s worth after. Then $150/mo on day 31.</p>
        </div>

        <footer className="pb-6 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-faint sm:pb-8">
          Tap or swipe the water
        </footer>
      </div>
    </section>
  );
}

export default AxiomHero;
