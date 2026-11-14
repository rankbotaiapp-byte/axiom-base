"use client";

import { useState } from "react";
import {
  PLUMBERS_DRAIN_SRC,
  PLUMBING_DIAGNOSTIC_SRC,
  PLUMBING_DIAGNOSTIC_SRC_FALLBACK,
  PLUMBING_FIELD_OPS_SRC,
  PLUMBING_FIELD_OPS_SRC_FALLBACK,
} from "@/lib/axiom-landing/storefront-films";

const TIERS = [
  {
    n: "01",
    title: "The emergency page they land on",
    body: "Pipes, wrench, and a page that books the leak. First thing they see — not a software demo.",
    src: PLUMBERS_DRAIN_SRC,
    fallback: PLUMBERS_DRAIN_SRC,
    label: "Emergency plumbing intro",
  },
  {
    n: "02",
    title: "Camera in the line",
    body: "Show the camera find the clog, the jet clear it, and the crew roll. Proof you do the work.",
    src: PLUMBING_DIAGNOSTIC_SRC,
    fallback: PLUMBING_DIAGNOSTIC_SRC_FALLBACK,
    label: "Camera in the line",
  },
  {
    n: "03",
    title: "Trucks on the job",
    body: "Your vans, your roads, your after-hours readiness. Done-for-you social presence uses this same look.",
    src: PLUMBING_FIELD_OPS_SRC,
    fallback: PLUMBING_FIELD_OPS_SRC_FALLBACK,
    label: "Trucks on the job",
  },
] as const;

function TierFilm({ src, fallback, label }: { src: string; fallback: string; label: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const active = useFallback ? fallback : src;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
      <div className="relative aspect-video w-full overflow-hidden bg-void">
        <video
          key={active}
          className="absolute inset-0 h-full w-full object-cover"
          src={active}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label={label}
          onError={() => {
            if (!useFallback && fallback !== src) setUseFallback(true);
          }}
        />
      </div>
    </div>
  );
}

export default function FieldDominanceTiers() {
  return (
    <section id="tiers" className="w-full bg-void px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Three tiers of field dominance</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight text-fg sm:text-5xl">
          The page that books the job. Then the proof that you can do it.
        </h2>
        <div className="mt-14 grid gap-10">
          {TIERS.map((tier) => (
            <article key={tier.n} className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
              <div>
                <p className="font-display text-sm font-semibold text-volt">{tier.n}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-fg sm:text-3xl">{tier.title}</h3>
                <p className="mt-3 max-w-md text-lg leading-relaxed text-mist">{tier.body}</p>
              </div>
              <TierFilm src={tier.src} fallback={tier.fallback} label={tier.label} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
