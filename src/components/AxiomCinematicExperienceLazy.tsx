"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const AxiomCinematicExperience = dynamic(() => import("@/components/AxiomCinematicExperience"), {
  ssr: false,
  loading: () => (
    <div
      className="pointer-events-none absolute inset-0 bg-transparent"
      aria-hidden
    />
  ),
});

type Props = ComponentProps<typeof AxiomCinematicExperience>;

/** Transparent by default so it can layer over the deep-red fluid stage. */
export default function AxiomCinematicExperienceLazy(props: Props) {
  return (
    <AxiomCinematicExperience
      {...props}
      className={
        props.className ??
        "pointer-events-none absolute inset-0 h-full w-full overflow-hidden border-0 bg-transparent shadow-none"
      }
    />
  );
}
