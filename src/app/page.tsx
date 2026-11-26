import type { Metadata } from "next";
import { Suspense } from "react";
import AxiomLanding from "@/components/axiom/AxiomLanding";

export const metadata: Metadata = {
  title: "Axiom Autopilot — Full-spectrum web presence management",
  description:
    "Stop manually managing your web presence. Axiom Autopilot generates content and deploys campaigns across Facebook, Instagram, YouTube, LinkedIn, and TikTok.",
  openGraph: {
    title: "Axiom Autopilot — Full-spectrum web presence management",
    description: "Focus on your business; we'll fly the brand.",
    images: [{ url: "/autopilot/axiom-autopilot-cockpit.webp" }],
  },
};

/** Cockpit hero → 60s intro → Studio Builder ($1 test drive). */
export default function Home() {
  return (
    <Suspense fallback={null}>
      <AxiomLanding />
    </Suspense>
  );
}
