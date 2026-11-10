"use client";

import { AxiomMasterLanding } from "@/components/axiom-landing/AxiomMasterLanding";
import { SHOWCASE } from "@/lib/axiom-landing/showcase";

/**
 * Next.js leftover public landing. Live `/` is `src/routes/index.tsx`.
 * Both render the same master Axiom landing so this file cannot drift.
 */
export default function Page() {
  const readyIds = SHOWCASE.map((b) => b.id);
  return <AxiomMasterLanding readyIds={readyIds} showPending />;
}
