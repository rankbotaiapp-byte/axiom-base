"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AxiomStarfieldBackground } from "@/components/AxiomStarfieldBackground";
import { Atmosphere } from "@/app/atmosphere";

/** Home `/` is the landing document iframe — skip WebGL chrome that delays LCP. */
export default function HomeChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const home = path === "/";
  return (
    <>
      {home ? null : <Atmosphere />}
      {home ? null : <AxiomStarfieldBackground />}
      <div className={home ? "relative z-10 min-h-dvh bg-[#050507]" : "relative z-10 min-h-dvh bg-transparent"}>
        {children}
      </div>
    </>
  );
}
