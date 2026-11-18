"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FISH_SPLASH_AT, haptic, vibrateSplash } from "@/lib/axiom/haptics";

interface SyncedHeroPlayerProps {
  videoSrc: string;
  posterSrc?: string;
  /** Copy and actions that sit under the video, never on top of it. */
  children: ReactNode;
}

export default function SyncedHeroPlayer({ videoSrc, children }: SyncedHeroPlayerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const syncPlayback = useRef<() => void>(() => {});

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;

    let lastTime = 0;
    let splashed = false;
    let visible = true;
    let frame = 0;

    const play = () => {
      if (userPaused.current || !visible) return;
      video.muted = true;
      const attempt = video.play();
      if (attempt) attempt.catch(() => {});
    };

    const onTime = () => {
      const time = video.currentTime;
      if (lastTime > time + 0.4) splashed = false;
      if (!splashed && lastTime < FISH_SPLASH_AT && time >= FISH_SPLASH_AT) {
        splashed = true;
        vibrateSplash();
      }
      lastTime = time;
      if (barRef.current && video.duration) {
        barRef.current.style.transform = `scaleX(${time / video.duration})`;
      }
    };

    syncPlayback.current = () => {
      if (userPaused.current) video.pause();
      else play();
    };

    const tick = () => {
      onTime();
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else if (!userPaused.current) video.pause();
      },
      { threshold: 0.15 },
    );

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadeddata", play);
    video.addEventListener("canplay", play);
    observer.observe(section);
    play();
    frame = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [videoSrc]);

  const togglePlayback = () => {
    haptic("tap");
    userPaused.current = !userPaused.current;
    setIsPaused(userPaused.current);
    syncPlayback.current();
  };

  const onSplashClick = () => {
    vibrateSplash();
  };

  return (
    <section ref={sectionRef} className="relative w-full bg-[#05070a] pt-20">
      <div className="relative w-full">
        <video
          key={videoSrc}
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={0}
          aria-label="Fish release"
          onClick={onSplashClick}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSplashClick();
          }}
          className="block h-auto w-full cursor-pointer object-contain"
          style={{ objectFit: "contain" }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      <div className="flex items-center gap-3 px-5 pt-3 sm:px-8">
        <div aria-hidden className="h-px flex-1 overflow-hidden bg-white/10">
          <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-amber-300/70" />
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPaused ? "Play fish release" : "Pause fish release"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/30 text-white/80 backdrop-blur-md transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden>
            {isPaused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />}
          </svg>
        </button>
      </div>

      <div className="relative w-full">{children}</div>
    </section>
  );
}
