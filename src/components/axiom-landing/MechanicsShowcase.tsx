"use client";

import { useState } from "react";
import { LIQUID_WRENCH_ALIAS, LIQUID_WRENCH_SRC } from "@/lib/axiom-landing/storefront-films";

const LIQUID_LOOP_CANDIDATES = [LIQUID_WRENCH_ALIAS, LIQUID_WRENCH_SRC] as const;

export function MechanicalShowcase({
  videoSrc,
  className = "",
}: {
  videoSrc?: string;
  className?: string;
}) {
  const [srcIndex, setSrcIndex] = useState(0);
  const fallback = LIQUID_LOOP_CANDIDATES[srcIndex] ?? LIQUID_WRENCH_SRC;
  const src = videoSrc ?? fallback;

  return (
    <section id="mechanics" className={`w-full bg-void py-24 px-4 sm:px-6 lg:px-8 ${className}`.trim()}>
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="mb-4 font-display text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
          The phone rings. You don't pick up. The job still books.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-mist sm:text-xl">
          Manual dispatch wastes hours. Sticky notes get lost. Axiom takes the call, puts the job on the board, and
          texts the tech the address — so you are not running an office from the truck.
        </p>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-panel/50 shadow-2xl backdrop-blur-xl">
          <div className="relative aspect-video w-full overflow-hidden">
            <video
              key={src}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
              src={src}
              aria-label="Mechanical service loop"
              onError={() => {
                if (videoSrc) return;
                setSrcIndex((i) => Math.min(i + 1, LIQUID_LOOP_CANDIDATES.length - 1));
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default MechanicalShowcase;
