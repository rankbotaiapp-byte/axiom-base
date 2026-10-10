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
import type { HeroTone } from "@/lib/axiom/media";

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
  className,
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
  className?: string;
  children: ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  const [fxOn, setFxOn] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const [imageSrc, setImageSrc] = useState(imageUrl);
  const [videoSrc, setVideoSrc] = useState(videoUrl ?? "");
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
  const backgroundY = useMotionValue(0);
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
    const sync = () => setFxOn(readIntroFx());
    sync();
    window.addEventListener(INTRO_FX_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INTRO_FX_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [previewMode]);

  useEffect(() => {
    setImageSrc(imageUrl);
    setVideoSrc(videoUrl ?? "");
    setVideoOk(Boolean(videoUrl));
  }, [imageUrl, videoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoSrc) return;
    el.muted = true;
    const play = () => {
      void el.play().catch(() => undefined);
    };
    play();
    el.addEventListener("canplay", play);
    return () => el.removeEventListener("canplay", play);
  }, [videoSrc, videoOk]);

  const skip = reduced || (!previewMode && !fxOn);
  const preset: IntroPreset = skip ? "none" : introPreset;
  const intensity = Number.isFinite(introIntensity) ? introIntensity : 45;
  const speed = Number.isFinite(introSpeed) ? introSpeed : 40;
  const blend = Number.isFinite(blendPercent) ? blendPercent : 60;
  const motionProps = cameraMotion(preset, intensity);
  const duration = introDurationSec(speed);
  const animate = preset !== "none";
  const depthOn = !skip && intensity > 0;

  useEffect(() => {
    // One scroll position drives every layer. Speeds come from parallaxTravel:
    // film slowest, wash and light farther, title in the opposite direction.
    const apply = (progress: number) => {
      const travel = parallaxTravel(depthOn ? intensity : 0, speed);
      backgroundY.set(progress * travel.background);
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
      backgroundY.set(0);
      washY.set(0);
      lightY.set(0);
      foregroundY.set(0);
      if (videoRef.current) videoRef.current.playbackRate = 1;
    };
  }, [scrollYProgress, depthOn, intensity, speed, backgroundY, washY, lightY, foregroundY]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-bg", className)}
      style={{ ["--hero-blend" as string]: `${blend}%` }}
    >
      <div className="hero-blend absolute inset-0 overflow-hidden">
        {/* Slowest layer. Overscan keeps the crop covered while it lags the scroll. */}
        <motion.div
          className={cn("absolute inset-0 origin-center", depthOn && "will-change-transform")}
          style={{ y: backgroundY, scale: depthOn ? 1.12 : 1 }}
        >
          <motion.div
            key={`${imageSrc}-${videoSrc}-${preset}-${replayKey ?? "0"}`}
            className="absolute inset-0 origin-center"
            initial={animate ? motionProps.initial : { scale: 1, x: "0%", y: "0%", opacity: 1 }}
            animate={motionProps.animate}
            transition={
              animate
                ? { duration, ease: [0.22, 0.08, 0.2, 1] }
                : { duration: 0 }
            }
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt=""
                className={cn(
                  "absolute inset-0 h-full w-full object-cover outline-none",
                  !videoSrc && "media-drift",
                )}
                onError={() => {
                  if (fallbackImageUrl && imageSrc !== fallbackImageUrl) {
                    setImageSrc(fallbackImageUrl);
                    return;
                  }
                  setImageSrc("");
                }}
              />
            ) : null}
            {videoSrc && videoOk ? (
              <video
                ref={videoRef}
                className="absolute inset-0 z-[1] h-full w-full object-cover"
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
          </motion.div>
        </motion.div>
        {tone ? (
          <motion.div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-[2]",
              depthOn && "will-change-transform",
              tone === "stage" && "hero-stage",
              tone === "site" && "hero-site",
            )}
            style={{ y: washY }}
          />
        ) : null}
        {depthOn ? (
          <motion.div
            aria-hidden
            className="hero-atmosphere pointer-events-none absolute inset-0 z-[3] will-change-transform"
            style={{ y: lightY }}
          />
        ) : null}
        {animate ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[4] bg-bg"
            initial={{ opacity: 0.94 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.45, ease: [0.22, 0.08, 0.2, 1] }}
          />
        ) : null}
      </div>
      <div className="hero-dissolve pointer-events-none absolute inset-x-0 -bottom-px z-10 h-[68%]" />
      <motion.div
        className={cn(
          "relative z-20 flex min-h-0 flex-1 flex-col",
          depthOn && "will-change-transform",
        )}
        style={{ y: foregroundY }}
      >
        {children}
      </motion.div>
    </section>
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
