import { FunnelProvider } from "@/components/FunnelProvider";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ProofOfWork from "@/components/ProofOfWork";
import Pricing from "@/components/Pricing";
import { Faq, FinalCta, Footer } from "@/components/FaqAndCta";
import DemoModal from "@/components/DemoModal";
import StickyConversionBar from "@/components/StickyConversionBar";
import OnboardingWizard from "@/components/OnboardingWizard";
import ParticleTrail from "@/components/ParticleTrail";
import ShowcaseModal from "@/components/ShowcaseModal";
import { SHOWCASE } from "@/lib/showcase";
import { existsSync } from "node:fs";
import path from "node:path";

// Runs at build time: a cinematic build only shows once all its files are installed.
const readyIds = SHOWCASE.filter((b) =>
  b.requires.every((f) => existsSync(path.join(process.cwd(), "public", "showcase", b.dir ?? b.id, f))),
).map((b) => b.id);
const showPending = process.env.NODE_ENV === "development";

export default function Page() {
  return (
    <FunnelProvider>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <ProofOfWork readyIds={readyIds} showPending={showPending} />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />

      {/* Overlays */}
      <DemoModal />
      <ShowcaseModal />
      <StickyConversionBar />
      <OnboardingWizard />
      <ParticleTrail />
    </FunnelProvider>
  );
}
