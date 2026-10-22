import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  cameraMotion,
  heroPlaybackRate,
  introDurationSec,
  INTRO_FX_EVENT,
  parallaxTravel,
  readIntroFx,
  writeIntroFx,
  type IntroPreset,
} from "@/lib/axiom/intro";
import {
  AUTO_HERO_SRC,
  swapMissingAutoHero,
  AUTO_SEQUENCE,
  autoBeatFromFilm,
  type AutoBeat,
} from "@/lib/axiom/auto-sequence";
import type { HeroTone } from "@/lib/axiom/media";
import { TelemetryLog } from "@/components/telemetry-log";

export function CinematicHero({
  imageUrl,
  videoUrl,
  blendPercent,
  introPreset = "kenburns",
  introSpeed = 40,
  introIntensity = 45,
  replayKey,
  previewMode = false,
  tone = null,
  fallbackImageUrl = "",
  fallbackVideoUrl = "",
  brand = null,
  telemetry = [],
  className,
  sequence,
  dashboard = null,
  children,
}: {
  imageUrl: string;
  videoUrl?: string | null;
  blendPercent: number;
  introPreset?: IntroPreset;
  introSpeed?: number;
  introIntensity?: number;
  replayKey?: string | number;
  previewMode?: boolean;
  tone?: HeroTone | null;
  fallbackImageUrl?: string;
  fallbackVideoUrl?: string;
  brand?: { name: string; accent?: string; logoUrl?: string; city?: string; trade?: string } | null;
  telemetry?: readonly string[];
  className?: string;
  /** Portal, then auto-hero.mp4, then the live desk. */
  sequence?: "auto";
  dashboard?: ReactNode;
  children: ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  const [fxOn, setFxOn] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const [imageSrc, setImageSrc] = useState(imageUrl);
  const [videoSrc, setVideoSrc] = useState(videoUrl ?? "");
  const [beat, setBeat] = useState<AutoBeat>("portal");
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  /**
   * Progress is 0 while the hero's top is at the top of the viewport and 1
   * when its bottom reaches that edge. Touch scrolling updates the same value.
   * The vh unit keeps this on the scroll listener. A named offset can be
   * promoted to a view timeline that stops reporting once it has been measured.
   */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0vh", "end 0vh"],
  });
  const plateY = useMotionValue(0);
  const backgroundY = useMotionValue(0);
  const particleY = useMotionValue(0);
  const washY = useMotionValue(0);
  const lightY = useMotionValue(0);
  const foregroundY = useMotionValue(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (previewMode) return;
    const sync = () => {
      const autoFilm = sequence === "auto" || videoUrl === AUTO_HERO_SRC;
      if (autoFilm && !readIntroFx()) writeIntroFx(true);
      setFxOn(autoFilm ? true : readIntroFx());
    };
    sync();
    window.addEventListener(INTRO_FX_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INTRO_FX_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [previewMode, sequence, videoUrl]);

  useEffect(() => {
    setImageSrc(imageUrl);
    setVideoSrc(videoUrl ?? "");
    setVideoOk(Boolean(videoUrl));
  }, [imageUrl, videoUrl]);

  const sequenced = sequence === "auto";
  const autoFilm = sequenced || videoSrc === AUTO_HERO_SRC;
  const showAutoPlayer = autoFilm;
  const activeVideo = showAutoPlayer ? AUTO_HERO_SRC : videoSrc;

  useEffect(() => {
    if (!sequenced) return;
    if (reduced) {
      setBeat("dashboard");
      return;
    }
    setBeat("portal");
    const cut = window.setTimeout(() => {
      setBeat((current) => (current === "portal" ? "mechanic" : current));
    }, AUTO_SEQUENCE.portalMs);
    const desk = window.setTimeout(() => {
      setBeat("dashboard");
    }, AUTO_SEQUENCE.portalMs + AUTO_SEQUENCE.dashboardSec * 1000 + 800);
    return () => {
      window.clearTimeout(cut);
      window.clearTimeout(desk);
    };
  }, [reduced, sequenced, replayKey]);

  useEffect(() => {
    const el = videoRef.current;
    if (!showAutoPlayer || !el) return;
    el.muted = true;
    el.loop = true;
    void el.play().catch(() => undefined);
  }, [activeVideo, showAutoPlayer, beat]);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root || !videoSrc) return;
    const sync = () => {
      root.querySelectorAll("video").forEach((el) => {
        el.muted = true;
        if (document.visibilityState !== "visible") {
          el.pause();
          return;
        }
        void el.play().catch(() => undefined);
      });
    };
    sync();
    const el = videoRef.current;
    el?.addEventListener("canplay", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      el?.removeEventListener("canplay", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [videoSrc, videoOk, imageSrc, sequenced, beat]);

  const skip = reduced || (!previewMode && !fxOn) || sequenced;
  const preset: IntroPreset = skip ? "none" : introPreset;
  const intensity = Number.isFinite(introIntensity) ? introIntensity : 45;
  const speed = Number.isFinite(introSpeed) ? introSpeed : 40;
  const blend = Number.isFinite(blendPercent) ? blendPercent : 60;
  const motionProps = cameraMotion(preset, intensity);
  const duration = introDurationSec(speed);
  const animate = preset !== "none";
  const depthOn = !skip && intensity > 0;

  useEffect(() => {
    if (sequenced) {
      plateY.set(0);
      backgroundY.set(0);
      particleY.set(0);
      washY.set(0);
      lightY.set(0);
      foregroundY.set(0);
      if (videoRef.current) videoRef.current.playbackRate = 1;
      return;
    }
    // One scroll position drives every layer. Speeds come from parallaxTravel:
    // film slowest, wash and light farther, title in the opposite direction.
    const apply = (progress: number) => {
      const travel = parallaxTravel(depthOn ? intensity : 0, speed);
      plateY.set(progress * travel.plate);
      backgroundY.set(progress * travel.background);
      particleY.set(progress * travel.particles);
      washY.set(progress * travel.wash);
      lightY.set(progress * travel.light);
      foregroundY.set(progress * travel.foreground);
      const el = videoRef.current;
      if (!el) return;
      const next = depthOn ? heroPlaybackRate(progress, intensity) : 1;
      if (el.playbackRate !== next) el.playbackRate = next;
    };
    apply(scrollYProgress.get());
    const stop = scrollYProgress.on("change", apply);
    return () => {
      stop();
      plateY.set(0);
      backgroundY.set(0);
      particleY.set(0);
      washY.set(0);
      lightY.set(0);
      foregroundY.set(0);
      if (videoRef.current) videoRef.current.playbackRate = 1;
    };
  }, [scrollYProgress, depthOn, intensity, speed, plateY, backgroundY, particleY, washY, lightY, foregroundY, sequenced]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative isolate flex w-full flex-col overflow-hidden bg-transparent",
        previewMode ? "min-h-[28rem]" : "h-screen min-h-[100dvh]",
        sequenced && (beat === "dashboard" ? "hero-sequence is-dashboard" : "hero-sequence is-reel"),
        className,
      )}
      style={{ ["--hero-blend" as string]: `${blend}%` }}
    >
      <div className="hero-blend absolute inset-0 h-full w-full overflow-hidden">
        {imageSrc || (videoSrc && videoOk) ? (
          <motion.div
            className={cn("absolute -inset-[8%] origin-center", depthOn && "will-change-transform")}
            style={{ y: plateY }}
            initial={animate ? { scale: 1.16 } : { scale: 1.06 }}
            animate={{ scale: 1.06 }}
            transition={animate ? { duration: 2.4, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
          >
            {imageSrc ? (
              <img src={imageSrc} alt="" className="hero-plate pointer-events-none absolute inset-0 h-full w-full object-cover" />
            ) : (
              <video
                className="hero-plate pointer-events-none absolute inset-0 h-full w-full object-cover"
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden
              />
            )}
          </motion.div>
        ) : null}
        {/* Sharp film covers the viewport. The plate stays behind it as the ambient blur. */}
        <motion.div
          className={cn("hero-sharp absolute inset-0 origin-center", depthOn && "will-change-transform")}
          style={{ y: backgroundY }}
          initial={{ scale: 1 }}
          animate={{ scale: 1 }}
          transition={animate ? { duration: 1.8, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
        >
          <motion.div
            key={`${imageSrc}-${videoSrc}-${preset}-${replayKey ?? "0"}`}
            className="hero-sharp absolute inset-0 origin-center"
            initial={animate ? motionProps.initial : { scale: 1, x: "0%", y: "0%", opacity: 1 }}
            animate={motionProps.animate}
            transition={
              animate
                ? { duration, ease: [0.22, 0.08, 0.2, 1] }
                : { duration: 0 }
            }
          >
            <div className="hero-subject absolute inset-0">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt=""
                className="hero-frame pointer-events-none absolute inset-0 h-full w-full object-cover outline-none"
                onError={() => {
                  if (fallbackImageUrl && imageSrc !== fallbackImageUrl) {
                    setImageSrc(fallbackImageUrl);
                    return;
                  }
                  setImageSrc("");
                }}
              />
            ) : null}
            {showAutoPlayer ? (
              <div className="hero-player absolute inset-0 z-[6]">
                <video
                  ref={videoRef}
                  data-film="auto-hero"
                  className="hero-frame pointer-events-none absolute inset-0 h-full w-full object-cover"
                  src={AUTO_HERO_SRC}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster={imageSrc || undefined}
                  onError={(event) => swapMissingAutoHero(event.currentTarget)}
                  onTimeUpdate={(event) => {
                    if (!sequenced) return;
                    const next = autoBeatFromFilm(event.currentTarget.currentTime);
                    setBeat((current) => (current === "portal" || current === next ? current : next));
                  }}
                />
              </div>
            ) : videoSrc && videoOk ? (
              <video
                ref={videoRef}
                key={`${videoSrc}-${replayKey ?? "0"}`}
                className="hero-frame pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                poster={imageSrc || undefined}
                onError={() => {
                  if (fallbackVideoUrl && videoSrc !== fallbackVideoUrl) {
                    setVideoSrc(fallbackVideoUrl);
                    setVideoOk(true);
                    return;
                  }
                  setVideoOk(false);
                }}
              />
            ) : null}
            </div>
          </motion.div>
        </motion.div>
        {reduced ? null : (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{ y: particleY }}
          >
            <HeroMotes />
          </motion.div>
        )}
        {tone ? (
          <motion.div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-[2]",
              depthOn && "will-change-transform",
              tone === "stage" && "hero-stage",
              tone === "site" && "hero-site",
              tone === "backcountry" && "hero-grade-backcountry",
              tone === "cinema" && "hero-grade-cinema",
            )}
            style={{ y: washY }}
          />
        ) : null}
        <motion.div
          aria-hidden
          className={cn(
            "hero-atmosphere pointer-events-none absolute inset-0 z-[3]",
            depthOn && "will-change-transform",
          )}
          style={{ y: lightY }}
        />
        <div aria-hidden className="hero-scan pointer-events-none absolute inset-0 z-[4]" />
        {animate ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[4] bg-[#050507]"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
      </div>
      <div className="hero-dissolve pointer-events-none absolute inset-0 z-10" />
      {brand?.name ? (
        <div className="pointer-events-none absolute bottom-8 left-5 z-30 flex max-w-[min(28rem,70%)] items-center gap-3 sm:left-8">
          <span
            className="h-10 w-1 shrink-0 rounded-full"
            style={{ background: brand.accent || "var(--color-accent)" }}
            aria-hidden
          />
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover shadow-[0_8px_24px_rgba(0,0,0,0.45)]" />
          ) : null}
          <div className="min-w-0">
            <p
              className="truncate text-[11px] uppercase tracking-[0.22em] text-fg"
              style={{ textShadow: "0 8px 20px rgba(0,0,0,0.7)" }}
            >
              {brand.name}
            </p>
            {brand.trade || brand.city ? (
              <p
                className="truncate text-[10px] uppercase tracking-[0.16em] text-fg/80"
                style={{ textShadow: "0 8px 20px rgba(0,0,0,0.7)" }}
              >
                {[brand.trade, brand.city].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {sequenced
          ? beat === "portal"
            ? "Portal"
            : beat === "mechanic"
              ? "Mechanic at the car"
              : beat === "headunit"
                ? "Interior head unit"
                : "Axiom desk"
          : ""}
      </p>
      <TelemetryLog dataset={telemetry} />
      <motion.div
        className={cn(
          "hero-foreground relative z-20 flex min-h-0 flex-1 flex-col",
          depthOn && "will-change-transform",
        )}
        style={{ y: foregroundY }}
      >
        {children}
        {sequenced && dashboard ? (
          <div className="relative z-10 flex min-h-0 flex-1 flex-col" aria-hidden={beat !== "dashboard"}>
            {dashboard}
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}

const MOTES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 7) % 100,
  size: 1.5 + (i % 3) * 0.9,
  delay: `${(i % 8) * 0.65}s`,
  duration: `${9 + (i % 5) * 1.7}s`,
  drift: 10 + (i % 4) * 7,
}));

function HeroMotes() {
  return (
    <>
      {MOTES.map((mote) => (
        <span
          key={mote.id}
          className="hero-mote"
          style={{
            left: `${mote.left}%`,
            top: `${mote.top}%`,
            width: mote.size,
            height: mote.size,
            ["--mote-delay" as string]: mote.delay,
            ["--mote-duration" as string]: mote.duration,
            ["--mote-drift" as string]: String(mote.drift),
          }}
        />
      ))}
    </>
  );
}

export function InsetFilm({ imageUrl, videoUrl }: { imageUrl?: string; videoUrl?: string }) {
  if (!videoUrl && !imageUrl) return null;
  return (
    <figure className="overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {videoUrl ? (
          <LoopVideo src={videoUrl} className="absolute inset-0" />
        ) : (
          <img src={imageUrl} alt="" className="h-full w-full object-cover outline-none" />
        )}
      </div>
    </figure>
  );
}

export function LoopVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    el.muted = true;
    const play = () => {
      void el.play().catch(() => undefined);
    };
    play();
    el.addEventListener("canplay", play);
    return () => el.removeEventListener("canplay", play);
  }, [src]);

  if (!src) return null;

  return (
    <video
      ref={ref}
      className={cn("h-full w-full object-cover", className)}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
    />
  );
}

export function IntroFxToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(readIntroFx());
    const sync = () => setOn(readIntroFx());
    window.addEventListener(INTRO_FX_EVENT, sync);
    return () => window.removeEventListener(INTRO_FX_EVENT, sync);
  }, []);

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        writeIntroFx(next);
      }}
      className={cn(
        "inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted transition-[color,background-color] duration-150 hover:text-fg",
        className,
      )}
    >
      Intro FX · {on ? "On" : "Off"}
    </button>
  );
}
