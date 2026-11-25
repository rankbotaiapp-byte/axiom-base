import type { Metadata } from "next";
import AxiomStudioPanel from "@/components/axiom/studio/AxiomStudioPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Axiom Landing Studio",
  description: "Live-edit Axiom 3D landing config persisted to Supabase app_settings.",
  robots: { index: false },
};

/**
 * 3D landing CMS editor (separate from /axiom-studio logo workspace).
 * Saves to app_settings key `axiom_landing:<slug>` via /api/axiom/config.
 */
export default async function AxiomLandingStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug = "default" } = await searchParams;
  const safeSlug = slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
  return <AxiomStudioPanel slug={safeSlug} previewPath="/axiom" />;
}
