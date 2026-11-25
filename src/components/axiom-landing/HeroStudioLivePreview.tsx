"use client";

import { useMemo, useState } from "react";
import { getNicheActions } from "@/config/niche-actions";
import { previewStockForBusiness } from "@/lib/axiom/preview-stock";
import { STUDIO_MATRIX, STUDIO_MATRIX_NICHES, type StudioMatrixNiche } from "@/lib/axiom/studio-engine";
import SparkField from "@/components/components/axiom/SparkField";

const HUD = "#00f2fe";

export function HeroStudioLivePreview() {
  const [name, setName] = useState("Apex Plumbing");
  const [niche, setNiche] = useState<StudioMatrixNiche>("plumbing");
  const entry = STUDIO_MATRIX[niche];
  const stock = useMemo(
    () => previewStockForBusiness({ niche, businessName: name }),
    [name, niche],
  );
  const actions = getNicheActions(entry.catalogNiche ?? "contractor");
  const plate = name.trim() || "Your shop";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_30px_90px_-28px_rgba(0,242,254,0.45)] backdrop-blur-xl sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr]">
        <label className="grid gap-1.5 text-left text-xs text-mist" htmlFor="hero-studio-name">
          Business name
          <input
            id="hero-studio-name"
            value={name}
            maxLength={48}
            onChange={(event) => setName(event.target.value)}
            className="min-h-11 border border-white/15 bg-black/50 px-3 text-sm text-white outline-none focus:border-[var(--color-hud)]"
          />
        </label>
        <label className="grid gap-1.5 text-left text-xs text-mist" htmlFor="hero-studio-niche">
          Trade
          <select
            id="hero-studio-niche"
            value={niche}
            onChange={(event) => setNiche(event.target.value as StudioMatrixNiche)}
            className="min-h-11 border border-white/15 bg-black/50 px-3 text-sm text-white outline-none focus:border-[var(--color-hud)]"
          >
            {STUDIO_MATRIX_NICHES.map((id) => (
              <option key={id} value={id}>
                {STUDIO_MATRIX[id].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative mt-3 w-full overflow-hidden rounded-[18px] bg-black">
        <video
          key={stock.loop}
          className="block h-auto w-full object-contain"
          style={{ objectFit: "contain" }}
          src={stock.loop}
          poster={stock.still}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          data-sample
          data-sample-fit="contain"
        />
        <SparkField colors={[HUD, "#FFE500"]} density={28} />
        <div className="pointer-events-none absolute inset-3" aria-hidden>
          {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map(
            (corner) => (
              <span key={corner} className={`absolute h-4 w-4 ${corner}`} style={{ borderColor: `${HUD}cc` }} />
            ),
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: HUD }}>
            Hero Studio · {entry.label}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-white">{plate}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button type="button" className="min-h-11 bg-[var(--color-hud)] px-3 text-sm font-semibold text-[#030712]">
          {actions?.primaryCta ?? "Book a visit"}
        </button>
        <button type="button" className="min-h-11 border border-white/20 px-3 text-sm font-semibold text-white">
          {actions?.secondaryCta ?? "Request a quote"}
        </button>
        <button type="button" className="min-h-11 border border-white/20 px-3 text-sm font-semibold text-white">
          Log cash or check
        </button>
      </div>
      <p className="mt-3 text-left text-[11px] leading-relaxed text-mist">
        Online bookings 1.5% via Stripe Connect. Cash and checks logged in the field are 0%.
      </p>
    </div>
  );
}
