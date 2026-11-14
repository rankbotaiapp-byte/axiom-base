import AxiomBrandHero from "./AxiomBrandHero";
import AxiomStudioWizard, { type StudioSignup } from "./AxiomStudioWizard";
import { FeatureSection, PitchBand, StingDivider } from "./MediaSections";
import { AXIOM_COLORS, landingConfig } from "./landing.config";

/**
 * Page order:
 *   1. Brand hero      (AXIOM still + play-to-animate loop, headline, CTAs)
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
export default function AxiomLanding({ onCheckout }: { onCheckout?: (signup: StudioSignup) => void | Promise<void> }) {
  const { studio } = landingConfig;
  return (
    <main className="min-h-dvh bg-[#050507] text-white antialiased">
      <AxiomBrandHero />
      <PitchBand />
      <FeatureSection />
      <StingDivider />
      <section id="book" className="scroll-mt-6 bg-[#050507] px-4 pb-20 pt-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em]" style={{ color: AXIOM_COLORS.cyan }}>
            {studio.eyebrow}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{studio.title}</h2>
          <p className="mt-3 text-white/70">{studio.body}</p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-7">
          <AxiomStudioWizard onCheckout={onCheckout} />
        </div>
      </section>
    </main>
  );
}
