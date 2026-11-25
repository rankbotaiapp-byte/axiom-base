"use client";

import { useState } from "react";
import { AxiomTopGlow } from "./AxiomAtmosphere";
import {
  LANDING_HERO_BODY,
  LANDING_HERO_CLAIM,
  LANDING_HERO_HEADLINE,
  LANDING_HERO_PRICE,
  LANDING_HERO_PROOF,
  LANDING_REVENUE_MACHINE_HERO,
} from "@/lib/axiom/landing-hero";

interface AxiomHeroStageProps {
  panelSrc?: string;
  onStart?: () => void;
  onProof?: () => void;
  priceNote?: string;
}

export default function AxiomHeroStage({
  panelSrc = LANDING_REVENUE_MACHINE_HERO,
  onStart,
  onProof,
  priceNote = LANDING_HERO_PRICE,
}: AxiomHeroStageProps) {
  const [broken, setBroken] = useState(false);

  return (
    <section className="ax-hero relative isolate w-full overflow-x-clip bg-[#050507]" aria-labelledby="ax-hero-title">
      <AxiomTopGlow />

      <div className="relative mx-auto w-full max-w-[1400px] px-3 pb-8 pt-6 sm:px-5 sm:pt-8">
        <div className="ax-showcase relative overflow-hidden">
          <span className="ax-tick ax-tick-tl" aria-hidden />
          <span className="ax-tick ax-tick-tr" aria-hidden />
          <span className="ax-tick ax-tick-bl" aria-hidden />
          <span className="ax-tick ax-tick-br" aria-hidden />

          <div className="relative min-h-[78svh] w-full overflow-hidden bg-[#050507] sm:min-h-[86svh]">
            {broken ? (
              <div className="ax-panel-fallback absolute inset-0 h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={panelSrc}
                alt="Ford Super Duty towing a fifth-wheel under pines at night, Axiom Autopilot on."
                className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
                onError={() => setBroken(true)}
              />
            )}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/92 to-transparent sm:via-[#050507]/70"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050507] to-transparent" aria-hidden />

            <div className="relative z-[2] flex min-h-[78svh] max-w-2xl flex-col justify-end px-4 py-8 sm:min-h-[86svh] sm:px-10 sm:py-12">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[#00ffcc]/45 bg-[#050507]/80 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#00ffcc]">
                <span className="ax-live-dot" /> Axiom Autopilot on
              </p>
              <h1
                id="ax-hero-title"
                className="mt-4 max-w-xl text-balance text-4xl font-semibold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl"
              >
                Turn your web presence into a{" "}
                <span className="text-[#FFE500]">revenue machine.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/75 sm:text-lg">{LANDING_HERO_BODY}</p>
              <div className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onStart} className="ax-btn-amber ax-btn-multiline min-h-12">
                  {LANDING_HERO_CLAIM}
                </button>
                <button type="button" onClick={onProof} className="ax-btn-ghost min-h-12">
                  {LANDING_HERO_PROOF}
                </button>
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#FFE500]/90">{priceNote}</p>
              <p className="sr-only">{LANDING_HERO_HEADLINE}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
