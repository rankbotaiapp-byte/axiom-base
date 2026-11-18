import type { Metadata } from "next";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";
import { AxiomGlobalAssistant } from "@/components/AxiomGlobalAssistant";
import { AxiomTelemetryProvider } from "@/context/AxiomTelemetryContext";
import { studioTemplateFromSearch } from "@/lib/axiom/studio-templates";
import { flatSearch } from "../search";

export const metadata: Metadata = {
  title: "Axiom Studio",
  description: "Drop a logo or reference photo and spin a branded cinematic loop for a niche service business.",
};

/** Single global companion via AxiomGlobalAssistant — StudioWorkspace never mounts its own. */
export default async function AxiomStudioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = flatSearch(await searchParams);
  const template = typeof raw.template === "string" ? raw.template : "";
  const source = typeof raw.source === "string" ? raw.source : "";
  const preset = studioTemplateFromSearch(template);

  return (
    <AxiomTelemetryProvider>
      <StudioWorkspace
        initialTemplate={preset}
        templateSource={source === "proof_of_work" ? "proof_of_work" : undefined}
      />
      <AxiomGlobalAssistant />
    </AxiomTelemetryProvider>
  );
}
