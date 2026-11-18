"use client";

import { FounderWelcomeStrip } from "@/components/conversion/FounderWelcomeStrip";
import { AXIOM_CRO_OFFER_LINE } from "@/lib/axiom/founder-welcome";

/** Phase 4 — founder face + $1 trial CTA. */
export function LandingFounderTrust({ studioHref }: { studioHref: string }) {
  return (
    <section
      id="founder"
      className="relative overflow-hidden border-t border-white/10 bg-[#050507] px-5 py-20 sm:px-8 sm:py-24"
      aria-labelledby="founder-cta-heading"
    >
      <div className="relative mx-auto max-w-[1120px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#00f2fe]">
          Founder trust // built in Southern Oregon
        </p>
        <h2
          id="founder-cta-heading"
          className="mt-3 max-w-2xl font-[family-name:var(--font-head,'Space_Grotesk',system-ui,sans-serif)] text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          No agency retainer. No dev shop. One system for your trucks and your calendar.
        </h2>

        <div className="mt-10">
          <FounderWelcomeStrip
            owner="Contractor"
            business="your shop"
            trade="plumbing, roofing, HVAC, electrical"
            place="your service area"
            className="border-white/10 bg-[#0a0a0f]/80"
          />
        </div>

        <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em] text-white/55">
            {AXIOM_CRO_OFFER_LINE}
          </p>
          <a
            href={studioHref}
            className="inline-flex items-center justify-center rounded-xl bg-[#00f2fe] px-8 py-4 text-center text-sm font-semibold tracking-wide text-[#02070a] shadow-[0_0_32px_rgba(0,242,254,0.35)] transition hover:translate-y-[-2px]"
          >
            Start $1 trial — live in minutes
          </a>
        </div>
      </div>
    </section>
  );
}