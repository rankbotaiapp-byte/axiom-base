import type { ReactNode } from "react";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";
import AxiomStudioWizard, { type StudioSignup } from "./AxiomStudioWizard";
import { FeatureSection, PitchBand, StingDivider } from "./MediaSections";
import { AXIOM_COLORS, landingConfig } from "./landing.config";

/**
 * Page order:
 *   1. Studio engine   (upload, accent, niche preview, $1 trial)
 *   2. Pitch band      (heart-to-phone loop, autoplaying, muted)
 *   3. Feature section (trades reel)
 *   4. Logo sting      (transition band)
 *   5. Axiom Studio    (4-step wizard, id="book")
 *
 * Next.js App Router usage, app/page.tsx. The handler must live in a client
 * component because it is a function:
 *
 *   "use client";
 *   export default function Page() {
 *     return <AxiomLanding onCheckout={async (signup) => {
 *       const res = await fetch("/api/checkout", { method: "POST", body: JSON.stringify(signup) });
 *       const { url } = await res.json();
 *       window.location.assign(url);
 *     }} />;
 *   }
 */
export default function AxiomLanding({
  onCheckout,
  onLaunch,
  midSlot,
}: {
  onCheckout?: (signup: StudioSignup) => void | Promise<void>;
  onLaunch?: () => void;
  midSlot?: ReactNode;
}) {
  const { studio, hero } = landingConfig;
  return (
    <main className="relative z-10 min-h-dvh bg-transparent text-white antialiased">
      <StudioWorkspace embedded onLaunch={() => onLaunch?.()} />
      <div className="relative z-10">
        <PitchBand />
        <FeatureSection />
        {midSlot}
        <StingDivider />
        <section id="book" className="scroll-mt-24 bg-transparent px-4 pb-20 pt-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.4em]" style={{ color: AXIOM_COLORS.cyan }}>
              {studio.eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{studio.title}</h2>
            <p className="mt-3 text-white/70">{studio.body}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{hero.feeLine}</p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-cyan-500/25 bg-[#030712]/85 p-4 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400 hover:shadow-cyan-500/30 sm:p-7 md:p-12">
            <AxiomStudioWizard onCheckout={onCheckout} />
          </div>
        </section>
      </div>
    </main>
  );
}
