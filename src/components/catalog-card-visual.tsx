"use client";

import { AETHER_ASSETS } from "@/components/aether/assets";
import { LoopVideo } from "@/components/cinematic-hero";
import { cn } from "@/lib/utils";

/* Do not import aether.css here — it is unlayered and was bleeding into the app shell. */

export type CardVisualMode = "video" | "canvas";

/**
 * Fills a catalog / dashboard card visual frame.
 * - `video`: category or niche loop (heroes still as poster so the frame is never blank)
 * - `canvas`: Aether propulsion media (same pack the live /aether WebGL stage textures from)
 *
 * Full Three.js is reserved for `/aether` — mounting it in every grid tile OOMs the Vite
 * process and fights fixed-stage CSS. Canvas mode still binds real Aether assets live.
 */
export function CatalogCardVisual({
  mode,
  videoSrc,
  poster,
  className,
}: {
  mode: CardVisualMode;
  videoSrc: string;
  poster?: string;
  className?: string;
}) {
  const frame = cn("absolute inset-0 h-full w-full object-cover", className);

  if (mode === "canvas") {
    return (
      <LoopVideo
        src={AETHER_ASSETS.video}
        poster={poster || AETHER_ASSETS.poster}
        className={frame}
      />
    );
  }

  if (!videoSrc && poster) {
    return <img src={poster} alt="" className={frame} />;
  }

  return <LoopVideo src={videoSrc} poster={poster || undefined} className={frame} />;
}
