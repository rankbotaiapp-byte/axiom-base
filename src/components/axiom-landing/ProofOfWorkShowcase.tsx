"use client";

import { type PointerEvent } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import {
  PROOF_OF_WORK_DEMOS,
  demoExploreHref,
  type ProofOfWorkDemo,
} from "@/lib/axiom-landing/proof-of-work-demos";

/**
 * Landing-only Proof of Work grid. Mount above the freeze-landing footer —
 * do not touch hero / nav / particle sections.
 */
export function ProofOfWorkShowcase() {
  return (
    <section
      id="proof"
      className="relative overflow-hidden border-t border-white/10 bg-[#030305] px-5 py-20 sm:px-8 sm:py-28"
      aria-labelledby="proof-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(6,182,212,0.12), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1120px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#00f2fe]">
          Proof grid // pages that already book
        </p>
        <h2
          id="proof-heading"
          className="mt-3 max-w-2xl font-[family-name:var(--font-head,'Space_Grotesk',system-ui,sans-serif)] text-3xl font-semibold tracking-tight text-white sm:text-5xl"
        >
          See what homeowners see on a trade shop that runs 24/7.
        </h2>
        <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-white/55 sm:text-lg">
          Four live storefronts — emergency bar, instant quote, video booking, and packages. Open any
          card; your $1 trial ships the same stack for your logo and your ZIP codes.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PROOF_OF_WORK_DEMOS.map((demo) => (
            <ProofCard key={demo.slug} demo={demo} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofCard({ demo }: { demo: ProofOfWorkDemo }) {
  const href = demoExploreHref(demo);
  const play = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    e.currentTarget.querySelector("video")?.play().catch(() => undefined);
  };
  const stop = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.querySelector("video")?.pause();
  };

  return (
    <article
      onPointerEnter={play}
      onPointerLeave={stop}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050507] transition duration-300 hover:border-[#06b6d4]/60 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.35),0_24px_60px_rgba(0,0,0,0.55)]"
    >
      <a href={href} className="relative block aspect-[16/11] overflow-hidden bg-black" aria-label={`Explore ${demo.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={demo.poster}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        {demo.preview ? (
          <video
            src={demo.preview}
            muted
            loop
            playsInline
            preload="none"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
          {demo.niche}
        </span>
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
            Open live demo
          </span>
        </span>
      </a>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">{demo.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{demo.blurb}</p>
        </div>
        <ul className="grid gap-1.5">
          {demo.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#06b6d4]" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
        <a
          href={href}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#06b6d4]/35 bg-[#06b6d4]/10 px-4 py-3 text-sm font-semibold text-[#67e8f9] transition hover:border-[#34d399]/70 hover:bg-[#34d399]/15 hover:text-[#a7f3d0]"
        >
          Explore Live Demo
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}

export default ProofOfWorkShowcase;
