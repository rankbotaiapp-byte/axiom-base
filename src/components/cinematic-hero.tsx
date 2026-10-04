import { useEffect, useState, type ReactNode } from "react";
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

export function CinematicHero({
  imageUrl,
  blendPercent,
  introPreset = "kenburns",
  introSpeed = 40,
  introIntensity = 45,
  replayKey,
  previewMode = false,
  className,
  children,
}: {
  imageUrl: string;
  blendPercent: number;
  introPreset?: IntroPreset;
  introSpeed?: number;
  introIntensity?: number;
  replayKey?: string | number;
  previewMode?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  const [fxOn, setFxOn] = useState(true);

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

  const skip = reduced || (!previewMode && !fxOn);
  const preset: IntroPreset = skip ? "none" : introPreset;
  const motionProps = cameraMotion(preset, introIntensity);
  const duration = introDurationSec(introSpeed);
  const animate = preset !== "none";

  return (
    <section
      className={cn("relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-bg", className)}
      style={{ ["--hero-blend" as string]: `${blendPercent}%` }}
    >
      <div className="hero-blend absolute inset-0 overflow-hidden">
        <motion.img
          key={`${imageUrl}-${preset}-${replayKey ?? "0"}`}
          src={imageUrl}
          alt=""
          className="absolute inset-0 z-0 h-full w-full origin-center object-cover outline-none"
          initial={animate ? motionProps.initial : { scale: 1, x: "0%", y: "0%", opacity: 1 }}
          animate={motionProps.animate}
          transition={
            animate
              ? { duration, ease: [0.22, 0.08, 0.2, 1] }
              : { duration: 0 }
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[42%] bg-gradient-to-t from-bg to-transparent" />
      <div className="relative z-20 flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
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
