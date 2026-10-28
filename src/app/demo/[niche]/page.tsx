import { notFound } from "next/navigation";
import { DemoLeadInlay } from "@/components/DemoLeadInlay";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { resolveDemoNiche } from "@/lib/axiom/preview-link";
import { flatSearch } from "../../search";

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
  return <DemoLeadInlay niche={niche} search={search} />;
}
