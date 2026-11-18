"use client";

import dynamic from "next/dynamic";
import { AxiomHeroAdOverlay } from "@/components/AxiomHeroAdOverlay";

const AxiomEliteOrbPortal = dynamic(() => import("@/components/AxiomEliteOrbPortal"), {
  ssr: false,
  loading: () => (
    <section
      className="relative inset-0 w-full min-h-[100svh] overflow-hidden bg-[#030712]"
      aria-hidden
    />
  ),
});

export default function AxiomEliteOrbPortalLazy() {
  return (
    <AxiomEliteOrbPortal className="relative w-full min-h-[100svh] overflow-hidden bg-[#030712]">
      <AxiomHeroAdOverlay />
    </AxiomEliteOrbPortal>
  );
}
