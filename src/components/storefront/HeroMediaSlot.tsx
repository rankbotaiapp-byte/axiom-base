"use client";

import { useEffect, useState } from "react";
import type { MediaSlot } from "@/lib/schemas/tenant";

type HeroMediaSlotProps = {
  media: MediaSlot;
  className?: string;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Poster paints immediately. Motion video overlays only when it is allowed to play. */
export function HeroMediaSlot({ media, className }: HeroMediaSlotProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    setMotionReady(!prefersReducedMotion());
  }, []);

  const position = `${media.focalPoint.x}% ${media.focalPoint.y}%`;
  const canPlay =
    motionReady &&
    !videoFailed &&
    Boolean(media.videoUrl) &&
    (media.kind === "cinemagraph" || media.kind === "loop-video");

  return (
    <div className={className ?? "relative h-full min-h-[280px] w-full overflow-hidden"}>
      <img
        src={media.posterUrl}
        alt={media.alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: position }}
        fetchPriority="high"
        decoding="async"
      />
      {canPlay && media.videoUrl ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: position }}
          poster={media.posterUrl}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
        >
          <source src={media.videoUrl} />
        </video>
      ) : null}
    </div>
  );
}
