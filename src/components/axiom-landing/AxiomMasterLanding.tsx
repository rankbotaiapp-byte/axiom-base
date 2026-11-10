"use client";

import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import Nav from "./Nav";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import ProofOfWork from "./ProofOfWork";
import Pricing from "./Pricing";
import { Faq, FinalCta, Footer } from "./FaqAndCta";
import DemoModal from "./DemoModal";
import StickyConversionBar from "./StickyConversionBar";
import OnboardingWizard from "./OnboardingWizard";
import ShowcaseModal from "./ShowcaseModal";
import { FunnelProvider } from "./FunnelProvider";

const ParticleTrail = lazy(() => import("./ParticleTrail"));

function DeferredTrail() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const start = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 450));
    const id = start(() => setReady(true));
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <ParticleTrail />
    </Suspense>
  );
}

export function AxiomMasterLanding({
  readyIds,
  showPending,
  headerSlot,
}: {
  readyIds: string[];
  showPending: boolean;
  headerSlot?: ReactNode;
}) {
  return (
    <FunnelProvider>
      <div className="axiom-master min-h-svh bg-ink text-[#e8edf3]">
        <Nav headerSlot={headerSlot} />
        <main>
          <Hero />
          <HowItWorks />
          <ProofOfWork readyIds={readyIds} showPending={showPending} />
          <Pricing />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
        <DemoModal />
        <ShowcaseModal />
        <StickyConversionBar />
        <OnboardingWizard />
        <DeferredTrail />
      </div>
    </FunnelProvider>
  );
}
