"use client";

import type { CSSProperties } from "react";
import type { CinemagraphPreset } from "@/lib/axiom/storefront-atmosphere";
import { cn } from "@/lib/utils";
import "./cinematic-ambient.css";

const EMBER_COUNT = 10;

export function CinematicAmbientOverlay({
  preset = "dust_motes",
  className,
}: {
  preset?: CinemagraphPreset;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "cinematic-ambient-layer",
        preset === "exhaust_haze" && "cinematic-ambient--haze",
        preset === "dust_motes" && "cinematic-ambient--motes",
        preset === "embers" && "cinematic-ambient--embers",
        className,
      )}
      aria-hidden
    >
      {preset === "embers"
        ? Array.from({ length: EMBER_COUNT }, (_, i) => (
            <span
              key={i}
              style={
                {
                  ["--ember-x" as string]: `${8 + (i * 83) % 84}%`,
                  ["--ember-dur" as string]: `${5 + (i % 5)}s`,
                  ["--ember-delay" as string]: `${i * 0.55}s`,
                  ["--ember-dx" as string]: `${(i % 2 === 0 ? 1 : -1) * (6 + (i % 4))}px`,
                } as CSSProperties
              }
            />
          ))
        : null}
    </div>
  );
}