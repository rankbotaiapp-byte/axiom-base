import type { Metadata } from "next";
import AxiomLayeredCROLanding from "@/components/axiom/AxiomLayeredCROLanding";
import { getAxiomConfig } from "@/lib/axiom/landing/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Axiom — 3D CRO Landing",
  description:
    "Black particle atmosphere, interactive Axiom companion, and live Studio framing powered by app_settings.",
};

export default async function AxiomLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug = "default" } = await searchParams;
  const safeSlug = slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
  const config = await getAxiomConfig(safeSlug);

  return <AxiomLayeredCROLanding slug={safeSlug} initialConfig={config} />;
}
