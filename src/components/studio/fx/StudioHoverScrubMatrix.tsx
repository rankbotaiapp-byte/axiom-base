"use client";

import { useState } from "react";
import type { StudioFxLevels, StudioFxToggles } from "@/lib/axiom/studio-fx";
import { StudioFxOverlay, scrubStageFx } from "./StudioFxOverlay";

type Props = {
  frames: string[];
  toggles?: StudioFxToggles;
  levels?: StudioFxLevels;
  className?: string;
};

const FALLBACK_TOGGLES: StudioFxToggles = {
  axiomBadge: true,
  neonGlow: true,
  copperWrap: true,
  hudFrame: true,
  cinematicSmoke: true,
  wetMud: true,
  snowEmber: true,
};

const FALLBACK_LEVELS: StudioFxLevels = { smoke: 0.6, mud: 0.4, glow: 0.8, copper: 0.7 };

/** 6-stage hover-scrub matrix. Moving across the filmstrip grades the still. */
export function StudioHoverScrubMatrix({ frames, toggles, levels, className = "" }: Props) {
  const cells = [...frames, ...frames, ...frames].slice(0, 6);
  const [active, setActive] = useState(0);
  const fx = scrubStageFx(active, toggles ?? FALLBACK_TOGGLES, levels ?? FALLBACK_LEVELS);
  const src = cells[active] || cells[0] || "";

  return (
    <div className={`ax-matrix ${className}`}>
      <div className="ax-matrix__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`Studio stage ${active + 1}`} />
        <StudioFxOverlay toggles={fx.toggles} levels={fx.levels} amount={fx.amount} />
        <span className="ax-cap">Stage {String(active + 1).padStart(2, "0")} / 06</span>
      </div>
      <div className="ax-matrix__film" role="listbox" aria-label="Six stage hover scrub">
        {cells.map((frame, i) => (
          <button
            key={`scrub-${i}`}
            type="button"
            role="option"
            aria-selected={i === active}
            data-on={i === active}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame} alt="" />
            <span>S{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
