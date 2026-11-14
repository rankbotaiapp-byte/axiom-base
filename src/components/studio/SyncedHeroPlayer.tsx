import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { HeroLoopVideo } from "@/components/loop-video";
import {
  cinematicEffect,
  consumeTimeCues,
  fireCtaHaptic,
  fireProfileHaptic,
  heroInViewThreshold,
  unlockHaptics,
  type BrandMarkStyle,
  type CinematicEffectId,
} from "@/lib/haptic-profiles";
import { AXIOM_HUD_CYAN } from "@/lib/axiom/visual-design";

type SyncedHeroPlayerProps = {
  src: string;
  poster?: string;
  effect?: CinematicEffectId | string | null;
  brandMark?: BrandMarkStyle;
  shopName: string;
  logoUrl?: string;
  tagline?: string;
  className?: string;
  children?: ReactNode;
  showPlate?: boolean;
  onError?: () => void;
};

export function SyncedHeroPlayer({
  src,
  poster,
  effect,
  brandMark = "frost",
  shopName,
  logoUrl,
  tagline,
  className = "",
  children,
  showPlate = true,
  onError,
}: SyncedHeroPlayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastTime = useRef(0);
  const fired = useRef<Set<number>>(new Set());
  const [inView, setInView] = useState(false);
  const spec = cinematicEffect(effect);
  const film = src || spec.loopUrl;

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const floor = heroInViewThreshold();
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= floor);
        setInView(hit);
      },
      { threshold: [0.2, 0.45, 0.7], rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) {
      fired.current = new Set();
      lastTime.current = 0;
      return;
    }
    fireProfileHaptic(spec.haptic);
  }, [inView, spec.haptic]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const onPointer = (event: Event) => {
      unlockHaptics();
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("button, [data-hero-cta], [data-haptic-cta], a[href]")) return;
      fireCtaHaptic();
    };
    node.addEventListener("pointerdown", onPointer, true);
    return () => {
      node.removeEventListener("pointerdown", onPointer, true);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-tactile-film
      data-cinematic-effect={spec.id}
      className={`relative isolate min-h-[70dvh] overflow-hidden bg-studio ${className}`}
    >
      <HeroLoopVideo
        className="absolute inset-0 size-full object-cover"
        src={film}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        onError={onError}
        onTimeUpdate={(event) => {
          const time = event.currentTarget.currentTime;
          fired.current = consumeTimeCues(spec.cues, time, lastTime.current, fired.current);
          lastTime.current = time;
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(10,10,12,0.78)_100%)]"
        aria-hidden
      />
      <div className={`pointer-events-none absolute inset-0 studio-fx studio-fx-${spec.id}`} aria-hidden />
      <span className="pointer-events-none absolute left-3 top-3 size-5 border-l border-t border-hud/80" aria-hidden />
      <span className="pointer-events-none absolute right-3 top-3 size-5 border-r border-t border-hud/80" aria-hidden />
      <span className="pointer-events-none absolute bottom-3 left-3 size-5 border-b border-l border-hud/80" aria-hidden />
      <span className="pointer-events-none absolute bottom-3 right-3 size-5 border-b border-r border-hud/80" aria-hidden />
      {showPlate ? (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`pointer-events-none absolute bottom-8 left-1/2 z-10 w-[min(92%,28rem)] -translate-x-1/2 px-5 py-4 text-center ${
          brandMark === "etch"
            ? "mix-blend-screen text-hud/90"
            : brandMark === "decal"
              ? "rounded-md border border-hud/40 bg-obsidian/70"
              : "rounded-2xl border border-hud/25 bg-obsidian/45 backdrop-blur-md"
        }`}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="mx-auto mb-2 h-10 w-auto object-contain" />
        ) : null}
        <p className="font-display text-xl tracking-tight text-fg" style={{ textShadow: `0 0 18px ${AXIOM_HUD_CYAN}33` }}>
          {shopName}
        </p>
        {tagline ? <p className="mt-1 text-sm text-muted">{tagline}</p> : null}
      </motion.div>
      ) : null}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
