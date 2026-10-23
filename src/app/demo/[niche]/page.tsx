import { notFound } from "next/navigation";
import { AxiomParticleStudio } from "@/components/axiom-particle-studio";
import { GlassyMountainLake } from "@/components/glassy-mountain-lake";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { resolveDemoNiche } from "@/lib/axiom/preview-link";
import { flatSearch } from "../../search";
import { PreviewFrame } from "../../preview-frame";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ niche: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { niche: requested } = await params;
  const niche = resolveDemoNiche(requested);
  if (!niche) notFound();
  const search = parseFunnelSearch(flatSearch(await searchParams));
  const branded = {
    ...search,
    preview: true as const,
    business: search.business || search.biz || undefined,
  };
  return (
    <>
      <AxiomParticleStudio niche={niche} business={branded.business} />
      <GlassyMountainLake title={branded.business} />
      <PreviewFrame niche={niche} search={branded} />
    </>
  );
}
