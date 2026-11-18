"use client";

import Link from "next/link";
import { AXIOM_HUD_CYAN, AXIOM_VISUAL_LOCK } from "@/lib/axiom/visual-design";

void AXIOM_VISUAL_LOCK;

const HEART_SRC = "/media/heroes/axiom-landing.mp4";
const HEART_FALLBACK = "/media/axioms-heart.mp4";

/**
 * Cinematic feature strip — Mechanical Heart Autopilot for social + SEO.
 */
export function AxiomMechanicalHeartSection() {
  return (
    <section
      id="mechanical-heart"
      className="relative isolate overflow-hidden border-y border-white/10 bg-[#030712] px-4 py-16 sm:px-6 sm:py-24"
      aria-labelledby="mechanical-heart-title"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 70% 50%, rgba(0,242,254,0.12), transparent 60%),
            radial-gradient(ellipse 40% 35% at 20% 60%, rgba(255,229,0,0.08), transparent 55%)
          `,
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        {/* Glassmorphic video vessel */}
        <div className="relative">
          <div
            className="axiom-glass relative overflow-hidden rounded-2xl border border-white/10 p-2 backdrop-blur-md"
            style={{
              boxShadow: `
                0 0 0 1px rgba(0,242,254,0.25),
                0 0 40px rgba(0,242,254,0.15),
                0 0 0 1px rgba(255,229,0,0.12) inset,
                0 24px 60px rgba(0,0,0,0.55)
              `,
            }}
          >
            {/* Cyan / amber perimeter rings */}
            <span
              className="pointer-events-none absolute -inset-1 rounded-2xl border border-[#00f2fe]/35"
              style={{ boxShadow: "0 0 24px rgba(0,242,254,0.25)" }}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-2 rounded-xl border border-[#FFE500]/20"
              aria-hidden
            />
            <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-[#00f2fe]/70" aria-hidden />
            <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-[#FFE500]/70" aria-hidden />
            <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#FFE500]/70" aria-hidden />
            <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#00f2fe]/70" aria-hidden />

            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster="/media/eric.jpg"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.src.includes("heroes/axiom-landing")) {
                    el.src = HEART_FALLBACK;
                  }
                }}
              >
                <source src={HEART_SRC} type="video/mp4" />
                <source src={HEART_FALLBACK} type="video/mp4" />
              </video>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent px-4 pb-3 pt-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: AXIOM_HUD_CYAN }}>
                  Mechanical Heart Engine · Live
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: AXIOM_HUD_CYAN }}>
            Autonomous content creator
          </p>
          <h2
            id="mechanical-heart-title"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Mechanical Heart{" "}
            <span className="bg-gradient-to-r from-white to-[#FFE500] bg-clip-text text-transparent">
              Autopilot
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-100 sm:text-lg">
            Fully Autonomous Social Content &amp; SEO Autopilot — Tracks performance stats, replicates
            winning viral hooks, manages your social comments strictly to convert leads, and optimizes
            your local Google ranking 24/7.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00f2fe]" aria-hidden />
              Publishes branded reels &amp; stills from Pexels/Unsplash + your shop stamp
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFE500]" aria-hidden />
              Auto-replies that steer commenters into booking — not endless chat
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00f2fe]" aria-hidden />
              Local SEO telemetry: GBP posts, ranking signals, and conversion loops
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/master"
              className="inline-flex min-h-11 items-center rounded-full border border-[#00f2fe]/40 bg-[#00f2fe]/10 px-5 text-sm font-semibold text-[#00f2fe] transition hover:bg-[#00f2fe]/20"
            >
              Open Autopilot desk
            </Link>
            <Link
              href="/content-creator"
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-slate-100 transition hover:border-white/30"
            >
              Niche content creator
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AxiomMechanicalHeartSection;
