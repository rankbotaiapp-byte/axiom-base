"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CINEMATIC_HERO_FALLBACKS,
  CINEMATIC_HERO_POSTER,
  CINEMATIC_HERO_VIDEO,
} from "@/lib/axiom/cinematic-content-seo";

const HERO_CHAIN = CINEMATIC_HERO_FALLBACKS;

function nextCandidate(current: string): string | null {
  const idx = HERO_CHAIN.indexOf(current as (typeof HERO_CHAIN)[number]);
  if (idx >= 0 && idx < HERO_CHAIN.length - 1) return HERO_CHAIN[idx + 1]!;
  if (idx < 0) return HERO_CHAIN[0] ?? null;
  return null;
}

export type AxiomCinematicPlayerProps = {
  className?: string;
  poster?: string;
  /** Fires once when playback ends and the final frame is locked. */
  onFreezeLock?: () => void;
};

/**
 * Play-once hero video — never loops. On `ended` (or near-end clamp), pauses on the
 * final high-detail frame and notifies the particle / debris freeze pipeline.
 */
export function AxiomCinematicPlayer({
  className,
  poster = CINEMATIC_HERO_POSTER,
  onFreezeLock,
}: AxiomCinematicPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frozenRef = useRef(false);
  const [src, setSrc] = useState<string | null>(HERO_CHAIN[0] ?? null);
  const [frozen, setFrozen] = useState(false);

  const lockFinalFrame = useCallback(() => {
    if (frozenRef.current) return;
    frozenRef.current = true;
    const video = videoRef.current;
    if (video) {
      try {
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        if (dur > 0.05) {
          video.currentTime = Math.max(0, dur - 0.05);
        }
      } catch {
        // seek may fail on some codecs — pause is enough
      }
      video.pause();
      video.loop = false;
    }
    setFrozen(true);
    onFreezeLock?.();
  }, [onFreezeLock]);

  useEffect(() => {
    setSrc(HERO_CHAIN[0] ?? null);
    frozenRef.current = false;
    setFrozen(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const onEnded = () => lockFinalFrame();

    const onTimeUpdate = () => {
      if (frozenRef.current) return;
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      // Clamp near end so we never wrap / restart before `ended` fires
      if (video.currentTime >= dur - 0.08) {
        lockFinalFrame();
      }
    };

    video.loop = false;
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    void video.play().catch(() => {
      // Autoplay blocked — leave poster; still allow manual / freeze via ended
    });

    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [src, lockFinalFrame]);

  return (
    <div
      className={className ?? "absolute inset-0 overflow-hidden bg-[#030712]"}
      data-axiom-cinematic-player=""
      data-frozen={frozen ? "" : undefined}
    >
      {src ? (
        <video
          ref={videoRef}
          key={src}
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={src}
          autoPlay
          muted
          playsInline
          preload="auto"
          loop={false}
          poster={poster}
          onError={() => {
            if (!src) return;
            frozenRef.current = false;
            setFrozen(false);
            setSrc(nextCandidate(src));
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/35 to-[#030712]/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 28%, rgba(3,7,18,0.72) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

export default AxiomCinematicPlayer;
