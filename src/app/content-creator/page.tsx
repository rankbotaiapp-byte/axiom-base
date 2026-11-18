import type { Metadata } from "next";
import AxiomContentCreator from "@/components/AxiomContentCreator";
import AxiomContentCreatorBoard from "@/components/AxiomContentCreatorBoard";
import { AxiomParticleCanvasBackground } from "@/components/AxiomParticleCanvasBackground";
import { AxiomGlobalAssistant } from "@/components/AxiomGlobalAssistant";
import { AxiomTelemetryProvider } from "@/context/AxiomTelemetryContext";

export const metadata: Metadata = {
  title: "Axiom Content Creator — Niche Customization",
  description:
    "Tenant layout board: brand identity, trade niches, accent glows, live storefront preview, and Supabase metadata saves with RLS.",
};

export default function ContentCreatorPage() {
  return (
    <AxiomTelemetryProvider>
      <div className="relative isolate min-h-svh overflow-x-hidden bg-[#030712]">
        <AxiomParticleCanvasBackground fixed logoAnchor="center" />
        <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
          <AxiomContentCreator />
          <AxiomContentCreatorBoard />
        </main>
      </div>
      <AxiomGlobalAssistant />
    </AxiomTelemetryProvider>
  );
}
