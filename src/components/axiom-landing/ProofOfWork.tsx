"use client";

import { type PointerEvent } from "react";
import { Play } from "lucide-react";
import { FEATURED_DEMOS, type FeaturedDemo } from "@/lib/axiom-landing/featured-demos";
import { useFunnel } from "./FunnelProvider";
import { RippleButton } from "./RippleButton";
import { buildPrice, fmt } from "@/lib/axiom-landing/pricing";

export default function ProofOfWork({ readyIds: _readyIds, showPending: _showPending }: { readyIds: string[]; showPending: boolean }) {
  const { startOnboarding } = useFunnel();

  return (
    <section id="proof" className="relative overflow-hidden bg-slate py-24 sm:py-32">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-volt/10 blur-[120px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-volt">Live storefronts</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Four shops you can open right now.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-mist">
            Leopard Adventures, Plumbing Otter, Ocean Shark Diver, and the Rogue River fishing guide. Each card opens that tenant&apos;s storefront.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {FEATURED_DEMOS.map((demo) => (
            <ShowcaseCard
              key={demo.slug}
              demo={demo}
              onBuy={() => startOnboarding({ plan: "cinematic", templateId: demo.buildId ?? demo.slug })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ demo, onBuy }: { demo: FeaturedDemo; onBuy: () => void }) {
  const href = demo.href ?? `/t/${demo.slug}`;
  const price = fmt(buildPrice());
  const play = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    e.currentTarget.querySelector("video")?.play().catch(() => {});
  };
  const stop = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.querySelector("video")?.pause();
  };
  return (
    <article
      onPointerEnter={play}
      onPointerLeave={stop}
      className="niche-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/70"
      style={{ ["--accent" as string]: demo.accent }}
    >
      <a href={href} className="relative block aspect-video overflow-hidden bg-ink text-left" data-sample-color={demo.accent} aria-label={`Open ${demo.name}`}>
        {demo.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={demo.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : null}
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
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: demo.accent }} /> Interactive
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-display text-sm font-bold text-white backdrop-blur">{price}</span>
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden /> Open storefront
          </span>
        </span>
      </a>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: demo.accent }}>
          {demo.niche}
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold text-white">{demo.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-mist">{demo.blurb}</p>
        <p className="mt-3 font-mono text-[11px] text-mist/80">{href}</p>
        <p className="mt-3 text-xs leading-relaxed text-mist/90">{demo.hook}</p>
        <div className="flex-1" />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <a href={href} className="btn btn-ghost inline-flex items-center justify-center !px-3 !py-2.5 text-center text-sm">
            Live Demo
          </a>
          <RippleButton variant="primary" className="!px-3 !py-2.5 text-sm" onClick={onBuy}>
            Make mine — {price}
          </RippleButton>
        </div>
      </div>
    </article>
  );
}
