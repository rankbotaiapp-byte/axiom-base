"use client";

import dynamic from "next/dynamic";

const AxiomBubbleCompanion = dynamic(() => import("@/components/AxiomBubbleCompanion"), {
  ssr: false,
  loading: () => null,
});

export default function AxiomBubbleCompanionLazy() {
  return <AxiomBubbleCompanion placement="corner" />;
}
