import type { Metadata } from "next";
import { HolographicStage } from "@/components/HolographicStage";

export const metadata: Metadata = {
  title: "Holographic Assistant Studio",
  description: "Preview the shop assistant hologram, morph, and wardrobe.",
};

export default function AssistantStudioPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-8 sm:px-8">
      <h1 className="mb-6 font-display text-4xl text-fg">Holographic assistant</h1>
      <HolographicStage businessName="New Era Auto & Service" />
    </main>
  );
}
