"use client";

import { useState } from "react";
import { AxiomChatDrawer } from "@/components/AxiomChatDrawer";
import { AxiomVideoCompanion } from "@/components/AxiomVideoCompanion";

/** Live water-droplet companion loop featured on `/companion`. */
export function CompanionHero() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <section
      className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-4 border-b border-white/5 pb-10"
      aria-label="Axiom AI companion"
    >
      <div className="relative flex w-full flex-col items-center gap-4 lg:flex-row lg:items-end lg:justify-center lg:gap-8">
        <AxiomVideoCompanion
          size="lg"
          showLabel
          onClick={() => setChatOpen(true)}
        />
        <div className="max-w-md text-center lg:pb-6 lg:text-left">
          <p className="text-sm leading-relaxed text-muted">
            Your animated water-droplet companion — live loop, ready for desk duty.
            Open chat to book, price, or qualify a lead; the droplet reacts as Axiom streams.
          </p>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-[#00f2fe]/40 bg-[#00f2fe]/10 px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#00f2fe] transition hover:border-[#00f2fe]/80 hover:bg-[#00f2fe]/18"
          >
            Talk to Axiom
          </button>
        </div>
      </div>
      <AxiomChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        hideTrigger
        deskLabel="Companion desk"
      />
    </section>
  );
}
