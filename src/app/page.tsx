import type { Metadata } from "next";
import { Suspense } from "react";
import AxiomLanding from "@/components/axiom/AxiomLanding";

export const metadata: Metadata = {
  title: "Axiom — Turn your web presence into a revenue machine",
  description:
    "24/7 booking, daily content, and social on Autopilot with admin approval. $1 first month — $150/mo starts on the first verified real lead.",
  openGraph: {
    title: "Axiom — Turn your web presence into a revenue machine",
    description:
      "Claim a storefront from a niche template or recreated hero. Autopilot drafts; you approve. $1 first month.",
    images: [{ url: "/media/heroes/axiom-revenue-machine-hero.png" }],
  },
};

/** Hero (cursor-tracking Axiom) → 60s intro → Studio $1 test drive. */
export default function Home() {
  return (
    <Suspense fallback={null}>
      <AxiomLanding />
    </Suspense>
  );
}
