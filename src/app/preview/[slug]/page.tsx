import { OutboundStorefront } from "@/components/outbound/OutboundStorefront";
import { firstQuery } from "@/lib/axiom/outbound-preview";
import { resolveOutboundLead } from "@/lib/axiom/outbound-preview.server";
import { previewStockForNiche } from "@/lib/axiom/preview-stock";
import { readStudioAccess } from "@/lib/axiom/studio-credits.server";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await resolveOutboundLead({
    slug,
    lead: firstQuery(query.lead),
    name: firstQuery(query.name),
    city: firstQuery(query.city),
    county: firstQuery(query.county),
    niche: firstQuery(query.niche),
  });
  const access = await readStudioAccess(profile.slug);
  return (
    <OutboundStorefront
      profile={profile}
      stock={previewStockForNiche(profile.niche)}
      studioUnlocked={access.isActive && access.credits > 0}
    />
  );
}
