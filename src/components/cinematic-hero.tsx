import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  cameraMotion,
  introDurationSec,
  INTRO_FX_EVENT,
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
  className?: string;
  children: ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  const [fxOn, setFxOn] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    setVideoOk(true);
  }, [videoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;
    el.muted = true;
    const play = () => {
      void el.play().catch(() => undefined);
    };
    play();
    el.addEventListener("canplay", play);
    return () => el.removeEventListener("canplay", play);
  }, [videoUrl, videoOk]);

  const skip = reduced || (!previewMode && !fxOn);
  const preset: IntroPreset = skip ? "none" : introPreset;
  const intensity = Number.isFinite(introIntensity) ? introIntensity : 45;
  const speed = Number.isFinite(introSpeed) ? introSpeed : 40;
  const blend = Number.isFinite(blendPercent) ? blendPercent : 60;
  const motionProps = cameraMotion(preset, intensity);
  const duration = introDurationSec(speed);
  const animate = preset !== "none";

  return (
    <section
      className={cn("relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-bg", className)}
      style={{ ["--hero-blend" as string]: `${blend}%` }}
    >
      <div
        className={cn(
          "hero-blend absolute inset-0 overflow-hidden",
          tone === "stage" && "hero-stage",
          tone === "site" && "hero-site",
        )}
      >
        <motion.div
          key={`${imageUrl}-${videoUrl ?? ""}-${preset}-${replayKey ?? "0"}`}
          className="absolute inset-0 origin-center"
          initial={animate ? motionProps.initial : { scale: 1, x: "0%", y: "0%", opacity: 1 }}
          animate={motionProps.animate}
          transition={
            animate
              ? { duration, ease: [0.22, 0.08, 0.2, 1] }
              : { duration: 0 }
          }
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover outline-none" />
          ) : null}
          {videoUrl && videoOk ? (
            <video
              ref={videoRef}
              className="absolute inset-0 z-[1] h-full w-full object-cover"
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              poster={imageUrl || undefined}
              onError={() => setVideoOk(false)}
            />
          ) : null}
        </motion.div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[42%] bg-gradient-to-t from-bg to-transparent" />
      <div className="relative z-20 flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
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
