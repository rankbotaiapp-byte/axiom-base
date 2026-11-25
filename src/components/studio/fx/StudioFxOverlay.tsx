"use client";

import type { StudioFxLevels, StudioFxToggles } from "@/lib/axiom/studio-fx";

type Props = {
  toggles: StudioFxToggles;
  levels: StudioFxLevels;
  /** 0 hides the plate. 1 is the full studio grade. */
  amount?: number;
};

const EMBERS = [12, 28, 46, 63, 81];

export function scrubStageFx(index: number, toggles: StudioFxToggles, levels: StudioFxLevels) {
  const step = Math.max(0, Math.min(5, index));
  const amount = step / 5;
  return {
    amount,
    toggles: {
      axiomBadge: step >= 1 && toggles.axiomBadge,
      hudFrame: step >= 1 && toggles.hudFrame,
      neonGlow: step >= 2 && toggles.neonGlow,
      copperWrap: step >= 2 && toggles.copperWrap,
      cinematicSmoke: step >= 3 && toggles.cinematicSmoke,
      wetMud: step >= 4 && toggles.wetMud,
      snowEmber: step >= 5 && toggles.snowEmber,
    } satisfies StudioFxToggles,
    levels: {
      smoke: levels.smoke * amount,
      mud: step >= 4 ? levels.mud : 0,
      glow: levels.glow * (step >= 2 ? 1 : 0.15),
      copper: step >= 2 ? levels.copper : 0,
    } satisfies StudioFxLevels,
  };
}

/** Real-time grade painted over a raw plate: badge, neon, copper, smoke, weather. */
export function StudioFxOverlay({ toggles, levels, amount = 1 }: Props) {
  if (amount <= 0.01) return null;
  const mix = Math.max(0, Math.min(1, amount));
  return (
    <div className="ax-fx" style={{ opacity: mix }} aria-hidden>
      {toggles.copperWrap ? (
        <div className="ax-fx__copper" style={{ opacity: 0.35 + levels.copper * 0.65 }} />
      ) : null}
      {toggles.cinematicSmoke ? (
        <div className="ax-fx__smoke" style={{ opacity: 0.25 + levels.smoke * 0.75 }} />
      ) : null}
      {toggles.wetMud ? (
        <>
          <div className="ax-fx__mud" style={{ opacity: 0.35 + levels.mud * 0.65 }} />
          <div className="ax-fx__rain" style={{ opacity: levels.mud }} />
        </>
      ) : null}
      {toggles.neonGlow ? (
        <div className="ax-fx__neon" style={{ opacity: 0.25 + levels.glow * 0.75 }} />
      ) : null}
      {toggles.snowEmber
        ? EMBERS.map((left, i) => (
            <i key={left} className="ax-ember" style={{ left: `${left}%`, animationDelay: `${i * 0.35}s` }} />
          ))
        : null}
      {toggles.hudFrame ? (
        <>
          <i className="ax-corner ax-corner--tl" />
          <i className="ax-corner ax-corner--tr" />
          <i className="ax-corner ax-corner--bl" />
          <i className="ax-corner ax-corner--br" />
        </>
      ) : null}
      {toggles.axiomBadge ? (
        <svg className="ax-badge" viewBox="0 0 64 64" aria-hidden>
          <polygon
            points="32,4 56,18 56,46 32,60 8,46 8,18"
            fill="#1a100c"
            stroke="#e4b57a"
            strokeWidth="2.5"
          />
          <text
            x="32"
            y="40"
            textAnchor="middle"
            fontFamily="Space Grotesk, sans-serif"
            fontSize="26"
            fontWeight="700"
            fill="#00ffcc"
          >
            A
          </text>
        </svg>
      ) : null}
    </div>
  );
}
