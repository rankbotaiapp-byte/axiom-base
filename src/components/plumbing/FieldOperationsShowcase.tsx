import { useState } from "react";
import {
  PLUMBING_FIELD_OPS_SRC,
  PLUMBING_FIELD_OPS_SRC_FALLBACK,
} from "@/lib/axiom-landing/storefront-films";

const SRC_CHAIN = [PLUMBING_FIELD_OPS_SRC, PLUMBING_FIELD_OPS_SRC_FALLBACK] as const;

/** Heavy-duty terrain loop for fleet dispatch on plumbing tenant storefronts. */
export function FieldOperationsShowcase() {
  const [srcIndex, setSrcIndex] = useState(0);
  const src = SRC_CHAIN[Math.min(srcIndex, SRC_CHAIN.length - 1)]!;

  return (
    <section id="field-ops" className="pl-section bg-void">
      <div className="pl-section-head">
        <p className="pl-kicker">Field operations & fleet dispatch</p>
        <h2 className="pl-h2">Crews rolling while the desk books the next job.</h2>
        <p className="pl-lede">
          Terrain, trucks, and the mechanical grind of a plumbing outfit that never parks the van for a callback.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
        <div className="relative aspect-video w-full overflow-hidden bg-void">
          <video
            key={src}
            className="absolute inset-0 h-full w-full object-cover"
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="Plumber field operations and fleet dispatch"
            onError={() => setSrcIndex((i) => Math.min(i + 1, SRC_CHAIN.length - 1))}
          />
        </div>
      </div>
    </section>
  );
}
