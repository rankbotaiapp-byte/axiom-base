import { createFileRoute } from "@tanstack/react-router";
import { HolographicStage } from "@/components/HolographicStage";

export const Route = createFileRoute("/assistant-studio")({
  component: AssistantStudioPage,
});

function AssistantStudioPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-8 sm:px-8">
      <h1 className="mb-6 font-display text-4xl text-fg">Holographic assistant</h1>
      <HolographicStage businessName="New Era Auto & Service" />
    </main>
  );
}
