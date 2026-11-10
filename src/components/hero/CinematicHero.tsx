import { useEffect, useRef, useState } from "react";
import { hero, plans, type HeroSource } from "@/config/storefront";
import { TactileButton } from "@/components/ui/TactileButton";
import { detectTier, type HeroTier } from "./tier";
import type { FreezeOrbitHandle } from "./freeze-orbit";

type Phase = "playing" | "ramping" | "frozen" | "releasing";

export type CinematicHeroProps = {
  className?: string;
  showCtas?: boolean;
  sources?: readonly HeroSource[];
  poster?: string;
  freezeAt?: number;
  rampIn?: number;
  freezeDuration?: number;
  onError?: () => void;
};

/**
 * Media panel of the landing / storefront hero.
 * - Box size is fixed by CSS before anything loads (zero layout shift).
 * - Poster is the LCP; the native <video> plays the untouched footage.
 * - three.js is code-split and only fetched once the panel is visible and the
 *   browser is idle, and only on devices that pass the tier check.
 */
export function CinematicHero({
  className = "",
  showCtas = true,
  sources = hero.sources,
  poster = hero.poster,
  freezeAt = hero.freezeAt,
  rampIn = hero.rampIn,
  freezeDuration = hero.freezeDuration,
  onError,
}: CinematicHeroProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FreezeOrbitHandle | null>(null);
  const [phase, setPhase] = useState<Phase>("playing");
  const [tier, setTier] = useState<HeroTier>("off");

  useEffect(() => {
    const box = boxRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!box || !video || !canvas) return;

    const t = detectTier();
    setTier(t);
    let disposed = false;
    let visible = false;

    if (t === "off") {
      video.pause();
      video.removeAttribute("autoplay");
    }

    const load = () => {
      if (t === "off" || engineRef.current || disposed) return;
      import("./freeze-orbit").then(({ createFreezeOrbit }) => {
        if (disposed || engineRef.current) return;
        engineRef.current = createFreezeOrbit({
          canvas,
          video,
          tier: t,
          freezeAt,
          rampIn,
          freezeDuration,
          videoAspect: hero.videoAspect,
          subject: hero.subject,
          orbitArc: hero.orbitArc,
          orbitClip: hero.orbitClip,
          freezeLoops: hero.freezeLoops,
          onPhase: setPhase,
        });
        engineRef.current.setActive(visible);
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (t !== "off") {
          if (visible) void video.play().catch(() => {});
          else video.pause();
        }
        engineRef.current?.setActive(visible);
        if (visible) {
          const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
            .requestIdleCallback;
          if (ric) ric(load, { timeout: 1200 });
          else window.setTimeout(load, 300);
        }
      },
      { threshold: 0.2 },
    );
    io.observe(box);

    const onVis = () => engineRef.current?.setActive(document.visibilityState === "visible" && visible);
    document.addEventListener("visibilitychange", onVis);

    const qa = new URLSearchParams(window.location.search).get("freeze");
    const qaTimer = qa
      ? window.setInterval(() => {
          if (engineRef.current?.freezeNow()) window.clearInterval(qaTimer);
        }, 200)
      : undefined;

    return () => {
      disposed = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (qaTimer) window.clearInterval(qaTimer);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [freezeAt, freezeDuration, rampIn, sources]);

  const frozen = phase === "frozen";

  return (
    <div ref={boxRef} className={`hero-media ${className}`.trim()} data-phase={phase} data-tier={tier}>
      <video
        ref={videoRef}
        className="hero-video"
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-label="Axiom hero animation: a snow leopard bursts through ice into the Axiom app system"
        onError={onError}
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} media={"media" in s ? s.media : undefined} />
        ))}
      </video>

      <canvas ref={canvasRef} className="hero-canvas" aria-hidden />

      <div className="hero-scrim" aria-hidden />

      <div className={`hero-hud ${frozen ? "is-on" : ""}`} aria-hidden>
        <span className="hud-dot" /> FROZEN · 360° <span className="hud-hint">drag to steer</span>
      </div>

      {showCtas ? (
        <div className="hero-ctas">
          <TactileButton href={`/start?plan=${plans.starter.id}`} tone="ember" sub={plans.starter.fine} track="hero_starter">
            {plans.starter.cta}
          </TactileButton>
          <TactileButton href={`/start?plan=${plans.lifetime.id}`} tone="ice" sub={plans.lifetime.fine} track="hero_lifetime">
            {plans.lifetime.cta}
          </TactileButton>
        </div>
      ) : null}
    </div>
  );
}
