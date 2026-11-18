"use client";

import { useState } from "react";
import Link from "next/link";
import { AXIOM_VISUAL_LOCK } from "@/lib/axiom/visual-design";

void AXIOM_VISUAL_LOCK;

const BTN_BASE =
  "group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full px-7 py-3 text-sm font-bold tracking-wide transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60";

/** Neon emerald / cyan gradient rim on obsidian glass. */
const NEON_RIM =
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:p-[1.5px] before:content-[''] " +
  "before:bg-[linear-gradient(135deg,#34d399_0%,#06b6d4_50%,#34d399_100%)] " +
  "before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] " +
  "before:[-webkit-mask-composite:xor] before:[mask-composite:exclude]";

/**
 * High-impact conversion strip — sits at z-10 below the centered logo stage.
 * Neon green `#34d399` + electric cyan `#06b6d4` glass CTAs on obsidian.
 */
export function AxiomHeroAdOverlay() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startTrial() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug: "axiom-trial",
          planId: "trial",
          namedPriceCents: 100,
          businessName: "Axiom 2-Week Trial",
          niche: "contractor",
          origin: window.location.origin,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Checkout did not start");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout did not start");
      setBusy(false);
    }
  }

  return (
    <div
      className="pointer-events-auto relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-1 antialiased"
      data-axiom-hero-ad-overlay=""
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
        $1 for 2 weeks · then $150/mo · cancel anytime
      </p>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <button
          type="button"
          id="hero-primary-cta"
          disabled={busy}
          onClick={() => void startTrial()}
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
          <span className="relative z-[1] font-semibold tracking-wide">
            {busy ? "Opening checkout…" : "$1 Trial — Start Now"}
          </span>
        </button>

        <Link
          href="#mechanical-heart"
          className={`${BTN_BASE} ${NEON_RIM} bg-[#030712]/85 text-[#a5f3fc] shadow-[0_0_22px_rgba(6,182,212,0.28)] hover:text-white hover:shadow-[0_0_32px_rgba(6,182,212,0.45),0_0_40px_rgba(52,211,153,0.2)] focus-visible:outline-[#06b6d4]`}
        >
          <span
            className="pointer-events-none absolute inset-[1.5px] rounded-full bg-[#030712]/92"
            aria-hidden
          />
          <span className="relative z-[1]">Mechanical Heart</span>
        </Link>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

export default AxiomHeroAdOverlay;
