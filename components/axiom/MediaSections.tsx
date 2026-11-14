"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { AXIOM_COLORS, landingConfig } from "./landing.config";

const { cyan, amber } = AXIOM_COLORS;

/**
 * Muted looping video that plays only while on screen. `eager` starts loading
 * straight away (use it for the one loop near the top of the page); otherwise
 * the file is not requested until the visitor scrolls to it. Reduced-motion
 * visitors get the poster only.
 */
export function InViewVideo({
  src,
  poster,
  label,
  eager = false,
  className = "",
}: {
  src: string;
  poster: string;
  label?: string;
  eager?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!el.getAttribute("src")) el.src = src;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25, rootMargin: eager ? "400px" : "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src, eager]);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      width={1280}
      height={720}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}

/** Full-bleed heart-to-phone loop with the 24/7 pitch over it. */
export function PitchBand() {
  const { pitch } = landingConfig;
  return (
    <section className="relative isolate bg-[#050507] text-white">
      <div className="relative mx-auto aspect-[4/5] max-h-[820px] w-full overflow-hidden sm:aspect-video">
        <InViewVideo src={pitch.src} poster={pitch.poster} eager />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, #050507 0%, transparent 22%, transparent 55%, #050507 100%)" }}
        />
        {/* HUD corner marks */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-4 sm:inset-8">
          {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map((c) => (
            <span key={c} className={`absolute h-5 w-5 ${c}`} style={{ borderColor: `${cyan}88` }} />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-6 sm:pb-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{pitch.title}</h2>
            <p className="mt-3 max-w-xl text-pretty text-base text-white/75 sm:text-lg">{pitch.body}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {pitch.chips.map((chip) => (
                <li key={chip} className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 font-mono text-xs uppercase tracking-widest backdrop-blur-md" style={{ color: cyan }}>
                  {chip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Trades reel in a glass card next to the customization points. */
export function FeatureSection() {
  const { features } = landingConfig;
  return (
    <section className="bg-[#050507] px-4 py-12 text-white sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-5 lg:gap-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl sm:p-3 lg:col-span-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            <InViewVideo src={features.src} poster={features.poster} label="Trade tools morphing from one business type to the next" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: amber }}>
            {features.eyebrow}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{features.title}</h2>
          <ul className="mt-6 grid gap-4">
            {features.points.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: `${cyan}22`, color: cyan }}>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{p.title}</span>
                  <span className="block text-sm text-white/65">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Logo sting as a wide transition band between sections. */
export function StingDivider() {
  const { sting } = landingConfig;
  return (
    <div className="relative bg-[#050507]" aria-hidden="true">
      <div className="relative mx-auto aspect-[21/9] max-h-[420px] w-full overflow-hidden">
        <InViewVideo src={sting.src} poster={sting.poster} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #050507, transparent 30%, transparent 70%, #050507)" }} />
      </div>
    </div>
  );
}
