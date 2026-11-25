import type { Metadata } from "next";
import AxiomInteractiveCompanion from "@/components/axiom/AxiomInteractiveCompanion";
import { getAxiomConfig } from "@/lib/axiom/landing/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Axiom Companion",
  robots: { index: false },
};

export default async function AxiomCompanionPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug = "default" } = await searchParams;
  const safeSlug = slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
  const config = await getAxiomConfig(safeSlug);
  return (
    <main style={{ background: config.theme.bg, minHeight: "100svh" }}>
      <AxiomInteractiveCompanion slug={safeSlug} initialConfig={config} />
      {/* scroll room so particle stream intensifies with scroll */}
      <div className="h-[80vh]" aria-hidden />
    </main>
  );
}
