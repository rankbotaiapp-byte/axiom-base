"use client";

import { useEffect, useRef, useState } from "react";

interface AxiomIntroVideoProps {
  src?: string;
  poster?: string;
  onSkip?: () => void;
}

/**
 * Autoplays muted + looped when ≥55% visible (unless reduced motion), pauses off-screen.
 * "Tap for sound" restarts from 0 with audio and hands over to native controls.
 */
export default function AxiomIntroVideo({
  src = "/videos/axiom-intro.mp4",
  poster = "/videos/axiom-intro-poster.jpg",
  onSkip,
}: AxiomIntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Once the viewer opts into sound, they own playback — no more auto play/resume.
  const soundRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.55) {
          if (!reduce && !soundRef.current) v.play().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      },
      { threshold: [0, 0.55, 1] }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const enableSound = () => {
    const v = videoRef.current;
    if (!v) return;
    soundRef.current = true;
    v.muted = false;
    v.currentTime = 0;
    v.play().catch(() => {});
    setSoundOn(true);
  };

  return (
    <div className="mx-auto w-full max-w-[440px] px-5">
      <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
        <span>01 · Meet the builder</span>
        <span>0:60</span>
      </div>

      <div className="ax-video-card relative overflow-hidden rounded-[22px]">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          muted={!soundOn}
          loop={!soundOn}
          preload="metadata"
          controls={soundOn}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="block aspect-[1080/1328] w-full bg-[#050507] object-cover"
          aria-label="Eric's 60-second Axiom walkthrough"
        />

        {!soundOn && (
          <button
            type="button"
            onClick={enableSound}
            className="group absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent pb-6 focus-visible:outline-none"
            aria-label="Play intro with sound"
          >
            <span className="ax-sound-pill">
              <span aria-hidden className="text-base">{playing ? "🔊" : "▶"}</span>
              {playing ? "Tap for sound" : "Play with sound"}
            </span>
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">Eric, New Era Apps — Rogue Valley, OR</p>
        <button type="button" onClick={onSkip} className="ax-link-btn">
          Skip to the Studio ↓
        </button>
      </div>
    </div>
  );
}
