"use client";

import { useEffect, useState } from "react";
import { DefaultAssetPlaceholder } from "@/components/default-asset-placeholder";
import { CinematicMediaFrame } from "@/components/storefront/CinematicMediaFrame";
import { resolveCinemaGrade } from "@/lib/axiom/cinematic-media";
import type { MediaSlot } from "@/lib/schemas/tenant";

type HeroMediaSlotProps = {
  media: MediaSlot;
  className?: string;
  cinemaGrade?: boolean;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Poster paints immediately. Motion video overlays only when it is allowed to play. */
export function HeroMediaSlot({ media, className, cinemaGrade }: HeroMediaSlotProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
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

  const grade = resolveCinemaGrade(cinemaGrade, media.cinemaGrade);

  return (
    <CinematicMediaFrame
      cinemaGrade={grade}
      className={className ?? "relative h-full min-h-[280px] w-full overflow-hidden"}
    >
      {posterFailed || !media.posterUrl ? (
        <DefaultAssetPlaceholder label="Hero still — replace in Studio" />
      ) : (
        <img
          src={media.posterUrl}
          alt={media.alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: position }}
          fetchPriority="high"
          decoding="async"
          onError={() => setPosterFailed(true)}
        />
      )}
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
    </CinematicMediaFrame>
  );
}
