"use client";

import dynamic from "next/dynamic";
import type { AxiomParticleCoreProps } from "@/components/AxiomParticleCore";

const AxiomParticleCore = dynamic(() => import("@/components/AxiomParticleCore"), {
  ssr: false,
  loading: () => null,
});

/** Client-only particle core — avoids R3F/WebGL during SSR. */
export default function AxiomParticleCoreLazy(props: AxiomParticleCoreProps) {
  return <AxiomParticleCore {...props} />;
}
