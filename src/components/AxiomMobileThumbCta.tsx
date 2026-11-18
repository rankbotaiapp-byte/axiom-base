"use client";

import Link from "next/link";
import { AXIOM_VISUAL_LOCK } from "@/lib/axiom/visual-design";

void AXIOM_VISUAL_LOCK;

export type AxiomMobileThumbCtaProps = {
  /** Primary booking / demo path */
  bookHref?: string;
  /** Secondary dispatch — tel: or page anchor */
  dispatchHref?: string;
  bookLabel?: string;
  dispatchLabel?: string;
  className?: string;
};

/**
 * Persistent mobile thumb-zone CTA — stays in the bottom reach area so
 * contractors testing on-phone never scroll back to the hero to act.
 */
export function AxiomMobileThumbCta({
  bookHref = "#book",
  dispatchHref = "tel:",
  bookLabel = "Book Now",
  dispatchLabel = "Test Dispatch",
  className = "",
}: AxiomMobileThumbCtaProps) {
  const dispatchIsTel = dispatchHref.startsWith("tel:");
  const dispatchDisabled = dispatchHref === "tel:" || dispatchHref === "tel:undefined";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[45] lg:hidden ${className}`}
      role="region"
      aria-label="Quick actions"
    >
      <div
        className="pointer-events-auto border-t border-white/10 bg-[#030712]/92 px-3 pt-3 backdrop-blur-md"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,229,0,0.08)",
        }}
      >
        <div className="mx-auto flex max-w-lg gap-2">
          {dispatchDisabled ? (
            <Link
              href="#how"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-white/15 bg-black/40 px-3 text-sm font-semibold text-slate-100"
            >
              {dispatchLabel}
            </Link>
          ) : dispatchIsTel ? (
            <a
              href={dispatchHref}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-white/15 bg-black/40 px-3 text-sm font-semibold text-slate-100"
            >
              {dispatchLabel}
            </a>
          ) : (
            <Link
              href={dispatchHref}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-white/15 bg-black/40 px-3 text-sm font-semibold text-slate-100"
            >
              {dispatchLabel}
            </Link>
          )}
          <Link
            href={bookHref}
            className="inline-flex min-h-12 flex-[1.35] items-center justify-center rounded-xl bg-gradient-to-r from-[#FFE500] via-amber-400 to-amber-600 px-3 text-sm font-bold text-[#12080a] shadow-[0_0_24px_rgba(255,229,0,0.28)]"
          >
            {bookLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AxiomMobileThumbCta;
