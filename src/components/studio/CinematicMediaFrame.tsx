"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  resolveStorefrontTheme,
  STOREFRONT_OBSIDIAN,
  themeCssVars,
  type StorefrontThemeId,
} from "@/lib/axiom/storefront-themes";
import type { CinemagraphPreset } from "@/lib/axiom/storefront-atmosphere";
import { cinemagraphPresetForNiche } from "@/lib/axiom/storefront-atmosphere";
import { CinematicAmbientOverlay } from "@/components/atmosphere/CinematicAmbientOverlay";
import { cn } from "@/lib/utils";

export type CinematicMediaFrameProps = {
  themeId?: StorefrontThemeId | string | null;
  /** Optional accent override for `--brand-primary`. */
  brandColor?: string | null;
  className?: string;
  mediaClassName?: string;
  children: ReactNode;
  /** CSS-only ambient overlay on stills (skipped for video children when false). */
  ambientOverlay?: boolean;
  ambientPreset?: CinemagraphPreset;
  /** When set, picks haze / motes / embers from trade niche. */
  niche?: string | null;
};

/**
 * Obsidian edge-feathered frame: radial/linear masks, ambient halo, 1px gradient HUD rim.
 */
export function CinematicMediaFrame({
  themeId,
  brandColor,
  className,
  mediaClassName,
  children,
  ambientOverlay = false,
  ambientPreset,
  niche,
}: CinematicMediaFrameProps) {
  const theme = resolveStorefrontTheme(themeId);
  const vars = themeCssVars(theme, brandColor) as CSSProperties;

  return (
    <div
      className={cn("cinematic-media-frame group relative isolate overflow-hidden rounded-xl", className)}
      style={{
        ...vars,
        backgroundColor: STOREFRONT_OBSIDIAN,
      }}
      data-theme={theme.id}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-18%] -z-10 opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background: `radial-gradient(ellipse 72% 58% at 50% 42%, color-mix(in srgb, var(--brand-glow) 42%, transparent), transparent 72%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          border: "1px solid transparent",
          backgroundImage: `linear-gradient(${STOREFRONT_OBSIDIAN}, ${STOREFRONT_OBSIDIAN}), linear-gradient(135deg, var(--brand-primary), transparent 68%)`,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      />
      <MediaFeatherMask className={cn("relative z-[1] h-full w-full", mediaClassName)}>
        {children}
        {ambientOverlay ? (
          <CinematicAmbientOverlay preset={ambientPreset ?? cinemagraphPresetForNiche(niche)} />
        ) : null}
      </MediaFeatherMask>
    </div>
  );
}

function MediaFeatherMask({ className, children }: { className?: string; children: ReactNode }) {
  const maskStyle: CSSProperties = {
    maskImage:
      "radial-gradient(ellipse 94% 90% at 50% 48%, #000 58%, transparent 100%), linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)",
    WebkitMaskImage:
      "radial-gradient(ellipse 94% 90% at 50% 48%, #000 58%, transparent 100%), linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)",
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  };

  return (
    <div className={className} style={maskStyle}>
      {children}
    </div>
  );
}

export function CinematicStill({
  src,
  alt,
  themeId,
  className,
  ambientOverlay,
  ambientPreset,
  niche,
}: {
  src: string;
  alt: string;
  themeId?: StorefrontThemeId | string | null;
  className?: string;
  ambientOverlay?: boolean;
  ambientPreset?: CinemagraphPreset;
  niche?: string | null;
}) {
  return (
    <CinematicMediaFrame
      themeId={themeId}
      className={className}
      ambientOverlay={ambientOverlay ?? true}
      ambientPreset={ambientPreset}
      niche={niche}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </CinematicMediaFrame>
  );
}

export function CinematicLoop({
  src,
  poster,
  themeId,
  className,
}: {
  src: string;
  poster?: string;
  themeId?: StorefrontThemeId | string | null;
  className?: string;
}) {
  return (
    <CinematicMediaFrame themeId={themeId} className={className}>
      <video
        className="h-full w-full object-cover"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    </CinematicMediaFrame>
  );
}