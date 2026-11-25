"use client";

import React from "react";
import Link from "next/link";
import AxiomCinematicExperienceLazy from "@/components/AxiomCinematicExperienceLazy";
import { AxiomHeroBackground } from "@/components/AxiomHeroBackground";

const LOGO_VIDEO = "/media/studio-cyan-fog-loop.mp4";
const LOGO_POSTER = "/media/studio-cyan-fog-poster.jpg";

const BTN_BASE =
  "group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full px-7 py-3 text-sm font-bold tracking-wide transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const NEON_RIM =
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:p-[1.5px] before:content-[''] " +
  "before:bg-[linear-gradient(135deg,#34d399_0%,#06b6d4_50%,#34d399_100%)] " +
  "before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] " +
  "before:[-webkit-mask-composite:xor] before:[mask-composite:exclude]";

/**
 * Full-hero black logo particle pipeline:
 *
 *  z-0  — Viewport-wide centered logo loop + WebGL burst (`pointer-events-none`)
 *  z-10 — Neon glass conversion CTAs below center (`pointer-events-auto`)
 */
export function AxiomCinematicHero({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <section
        className={className ?? "relative h-full w-full overflow-hidden rounded-xl bg-[#030712]"}
        style={{ height: "100%", minHeight: 180 }}
        aria-label="Axiom cinematic hero"
        data-axiom-cinematic-hero=""
        data-compact=""
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <AxiomHeroBackground videoSrc={LOGO_VIDEO} posterSrc={LOGO_POSTER} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <AxiomCinematicExperienceLazy
            className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden border-0 bg-transparent shadow-none"
            style={{ minHeight: "100%", height: "100%" }}
          />
        </div>
        <div className="pointer-events-none relative z-10 flex h-full items-end justify-center p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#06b6d4]">
            Axiom · AI booking
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={className ?? "relative w-full min-h-[100svh] overflow-hidden bg-[#030712]"}
      style={{ minHeight: "100svh" }}
      aria-label="Axiom cinematic hero"
      data-axiom-cinematic-hero=""
    >
      {/* ── z-0: Full-hero black logo + particle field (unclipped) ───── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 h-full min-h-[100svh] w-full"
        aria-hidden
        data-layer="logo-particle-stage"
      >
        <AxiomHeroBackground videoSrc={LOGO_VIDEO} posterSrc={LOGO_POSTER} />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        data-layer="webgl-particle-burst"
      >
        <AxiomCinematicExperienceLazy
          className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden border-0 bg-transparent shadow-none"
          style={{ minHeight: "100%", height: "100%" }}
        />
      </div>

      {/* Soft floor fade — center logo stays fully visible */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[20%] bg-gradient-to-t from-[#030712] via-[#030712]/70 to-transparent"
        aria-hidden
      />

      {/* ── z-10: Bright neon CTAs — below center, zero occlusion ────── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pb-10"
        data-layer="conversion-ui"
      >
        <div className="pointer-events-auto flex w-full max-w-2xl flex-col items-center gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
            $1 for 2 weeks · then $150/mo
          </p>
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="#book"
              id="hero-primary-cta"
              className={`${BTN_BASE} ${NEON_RIM} bg-[#030712]/90 text-white shadow-[0_0_28px_rgba(52,211,153,0.35),0_0_48px_rgba(6,182,212,0.2)] hover:shadow-[0_0_36px_rgba(52,211,153,0.55),0_0_60px_rgba(6,182,212,0.35)] hover:brightness-110 focus-visible:outline-[#34d399]`}
            >
              <span
                className="pointer-events-none absolute inset-[1.5px] rounded-full bg-[#030712]/95"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute inset-0 opacity-40 transition group-hover:opacity-70"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 120% at 50% 120%, rgba(52,211,153,0.35), transparent 55%), radial-gradient(ellipse 80% 120% at 50% -20%, rgba(6,182,212,0.28), transparent 55%)",
                }}
                aria-hidden
              />
              <span className="relative z-[1]">$1 Trial — Start Now</span>
            </Link>
            <Link
              href="#proof"
              className={`${BTN_BASE} ${NEON_RIM} bg-[#030712]/85 text-[#a5f3fc] shadow-[0_0_22px_rgba(6,182,212,0.28)] hover:text-white hover:shadow-[0_0_32px_rgba(6,182,212,0.45)] focus-visible:outline-[#06b6d4]`}
            >
              <span
                className="pointer-events-none absolute inset-[1.5px] rounded-full bg-[#030712]/92"
                aria-hidden
              />
              <span className="relative z-[1]">Preview templates</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AxiomCinematicHero;
