import { notFound } from "next/navigation";
import { DemoLeadInlay } from "@/components/DemoLeadInlay";
import { BarberOutreachLive } from "@/components/barber/barber-outreach-landing";
import { ElectricianOutreachLive } from "@/components/electrician/electrician-outreach-landing";
import { DEFAULT_BARBER_OUTREACH } from "@/lib/axiom/barber-outreach";
import { DEFAULT_ELECTRICIAN_OUTREACH } from "@/lib/axiom/electrician-outreach";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { emptyOutreachTenant } from "@/lib/axiom/plumber-outreach";
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
  if (niche === "barber") {
    const tenant = {
      ...emptyOutreachTenant(search.b || search.lead_slug || "ashland-barber"),
      business: search.biz || search.business || "",
      city: search.city || "",
      county: search.county || "",
    };
    return (
      <BarberOutreachLive
        tenant={tenant}
        config={DEFAULT_BARBER_OUTREACH}
        tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
      />
    );
  }
  if (niche === "electrical") {
    const tenant = {
      ...emptyOutreachTenant(search.b || search.lead_slug || "cascade-electric"),
      business: search.biz || search.business || "",
      city: search.city || "",
      county: search.county || "",
    };
    return (
      <ElectricianOutreachLive
        tenant={tenant}
        config={DEFAULT_ELECTRICIAN_OUTREACH}
        tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
      />
    );
  }
  return <DemoLeadInlay niche={niche} search={search} />;
}
