"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import {
  demoStudioHref,
  type ProofOfWorkDemo,
  type ProofOfWorkDemoSlug,
  proofOfWorkDemo,
} from "@/lib/axiom-landing/proof-of-work-demos";

type ChromeProps = {
  slug: ProofOfWorkDemoSlug;
  /** Extra bottom padding so the floating dock never covers hero/booking UI. */
  contentClassName?: string;
  children: React.ReactNode;
};

export function ShowcaseDemoChrome({ slug, contentClassName = "", children }: ChromeProps) {
  const demo = proofOfWorkDemo(slug);
  if (!demo) return <>{children}</>;
  const studioHref = demoStudioHref(demo);

  return (
    <div className="relative min-h-dvh bg-[#030712] text-white">
      <StickyShowcaseBar demo={demo} studioHref={studioHref} />
      <div className={`pb-[7.5rem] pt-14 ${contentClassName}`}>{children}</div>
      <FloatingBuildDock studioHref={studioHref} />
    </div>
  );
}

export function StickyShowcaseBar({
  demo,
  studioHref,
}: {
  demo: ProofOfWorkDemo;
  studioHref: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050507]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-5">
        <Link
          href="/#proof"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/25 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Back to Axiom</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className="min-w-0 truncate rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-200/90 sm:text-[11px]">
          Live Proof of Work: {demo.name}
        </span>
        <Link
          href={studioHref}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#34d399] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#04140f] shadow-[0_0_24px_rgba(52,211,153,0.45)] transition hover:bg-[#6ee7b7] sm:px-4 sm:text-sm"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Build Yours Today
        </Link>
      </div>
    </header>
  );
}

export function FloatingBuildDock({ studioHref }: { studioHref: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 sm:inset-x-6">
      <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-[#050507]/92 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        <p className="flex-1 text-center text-sm leading-snug text-white/70 sm:text-left">
          Like this layout &amp; booking flow? Launch your own version in minutes.
        </p>
        <Link
          href={studioHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34d399] px-4 py-3 text-sm font-bold text-[#04140f] shadow-[0_0_28px_rgba(52,211,153,0.5)] transition hover:bg-[#6ee7b7]"
        >
          Build Yours Today
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function BuildYoursSectionCta({
  slug,
  label = "Build Yours Today — Use This Structure",
  className = "",
}: {
  slug: ProofOfWorkDemoSlug;
  label?: string;
  className?: string;
}) {
  const demo = proofOfWorkDemo(slug);
  if (!demo) return null;
  return (
    <div className={`flex justify-center sm:justify-start ${className}`}>
      <Link
        href={demoStudioHref(demo)}
        className="inline-flex items-center gap-2 rounded-xl border border-[#34d399]/40 bg-[#34d399]/10 px-4 py-2.5 text-sm font-semibold text-[#a7f3d0] transition hover:border-[#34d399]/80 hover:bg-[#34d399]/20"
      >
        {label}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
