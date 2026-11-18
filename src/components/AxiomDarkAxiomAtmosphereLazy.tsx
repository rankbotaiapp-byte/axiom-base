"use client";

import dynamic from "next/dynamic";
import type { AxiomDarkAxiomAtmosphereProps } from "@/components/AxiomDarkAxiomAtmosphere";

const AxiomDarkAxiomAtmosphere = dynamic(() => import("@/components/AxiomDarkAxiomAtmosphere"), {
  ssr: false,
  loading: () => null,
});

export default function AxiomDarkAxiomAtmosphereLazy(props: AxiomDarkAxiomAtmosphereProps) {
  return <AxiomDarkAxiomAtmosphere {...props} />;
}
