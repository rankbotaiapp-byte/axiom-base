'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SyncedHeroPlayerProps {
  videoSrc: string;
  posterSrc?: string;
  /** Overlay content (headline, CTAs, glass cards). */
  children: ReactNode;
}

/**
 * Full-bleed looping hero video kept in sync with the page:
 *  - plays only while the hero is on screen (saves battery and data)
 *  - a hairline progress bar tracks the loop position
 *  - the footage drifts with scroll for depth
 *  - visitors with reduced-motion or data-saver on get the poster instead
 */
export default function SyncedHeroPlayer({ videoSrc, posterSrc, children }: SyncedHeroPlayerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const syncPlayback = useRef<() => void>(() => {});

  const [motionAllowed, setMotionAllowed] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hasFrames, setHasFrames] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const update = () => setMotionAllowed(!reduce.matches && !saveData);
    update();
    reduce.addEventListener('change', update);
    return () => reduce.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let visible = false;
    let frame = 0;

    const sync = () => {
      if (visible && motionAllowed && !userPaused.current) {
        video.muted = true; // required for autoplay on every mobile browser
        video.play().catch(() => {
          /* autoplay refused (low-power mode etc). Poster stays up. */
        });
      } else {
        video.pause();
      }
    };
    syncPlayback.current = sync;

    const tick = () => {
      if (barRef.current && video.duration) {
        barRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
      }
      if (mediaRef.current && motionAllowed) {
        const offset = Math.min(window.scrollY, section.offsetHeight) * 0.18;
        mediaRef.current.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`;
      }
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
        cancelAnimationFrame(frame);
        if (visible) frame = requestAnimationFrame(tick);
      },
      { threshold: 0.05 },
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [motionAllowed, videoSrc]);

  const togglePlayback = () => {
    userPaused.current = !userPaused.current;
    setIsPaused(userPaused.current);
    syncPlayback.current();
  };

  return (
    <section ref={sectionRef} className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[#05070a]">
      <div ref={mediaRef} className="absolute inset-0 -z-20 scale-[1.06] will-change-transform">
        {posterSrc ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${posterSrc}")` }}
          />
        ) : null}
        <video
          key={videoSrc}
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
          aria-hidden
          tabIndex={-1}
          onPlaying={() => setHasFrames(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${hasFrames ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      {/* Obsidian scrims: keep text legible over bright water and sky. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#05070a] via-[#05070a]/55 to-[#05070a]/25" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#05070a]/70 via-transparent to-transparent" />

      <div className="relative w-full">{children}</div>

      {motionAllowed ? (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPaused ? 'Play background video' : 'Pause background video'}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/30 text-white/80 backdrop-blur-md transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:right-6 sm:top-6"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden>
            {isPaused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />}
          </svg>
        </button>
      ) : null}

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-white/10">
        <div ref={barRef} className="h-full origin-left scale-x-0 bg-amber-300/70" />
      </div>
    </section>
  );
}
