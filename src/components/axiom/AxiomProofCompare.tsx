"use client";

import AxiomHeroCompare, { LANDING_HERO_AFTER, LANDING_HERO_BEFORE } from "./AxiomHeroCompare";

export default function AxiomProofCompare() {
  return (
    <section id="proof" className="relative scroll-mt-6 px-5 pb-6 pt-4" aria-labelledby="ax-proof-title">
      <div className="mx-auto w-full max-w-6xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00ffcc]">Live proof</p>
        <h2 id="ax-proof-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          See live Before / After
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
          Drag the split. This is the shop-photo treatment Autopilot can recreate from a niche template or a custom hero
          — not a weeks-long layout project.
        </p>
        <div className="ax-showcase relative mt-6 overflow-hidden">
          <span className="ax-tick ax-tick-tl" aria-hidden />
          <span className="ax-tick ax-tick-tr" aria-hidden />
          <span className="ax-tick ax-tick-bl" aria-hidden />
          <span className="ax-tick ax-tick-br" aria-hidden />
          <AxiomHeroCompare beforeSrc={LANDING_HERO_BEFORE} afterSrc={LANDING_HERO_AFTER} />
        </div>
      </div>
    </section>
  );
}
