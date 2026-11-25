import { notFound } from "next/navigation";
import { OutboundStorefront } from "@/components/outbound/OutboundStorefront";
import { TradeShowcasePage } from "@/components/storefront/trade-showcase-page";
import { firstQuery } from "@/lib/axiom/outbound-preview";
import { resolveOutboundLead } from "@/lib/axiom/outbound-preview.server";
import { previewStockForBusiness } from "@/lib/axiom/preview-stock";
import { readPublicShop } from "@/lib/axiom/shop-accent.server";
import { readStudioAccess } from "@/lib/axiom/studio-credits.server";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { shopSlug } = await params;
  const query = await searchParams;
  const shop = await readPublicShop(shopSlug);
  const lead = firstQuery(query.lead);

  if (!lead) {
    if (!shop) notFound();

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: shop.name,
      description: `Open 24/7 for emergency ${shop.niche} bookings.`,
      url: `/${shop.slug}`,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <TradeShowcasePage shop={shop} />
      </>
    );
  }

  // --- OUTBOUND LEAD PREVIEW FLOW ---
  const accent = shop?.accent ?? "";
  const theme = accent ? <style>{`.immutable-storefront{--shop-accent:${accent} !important}`}</style> : null;

  const profile = await resolveOutboundLead({
    slug: shopSlug,
    lead,
    name: firstQuery(query.name),
    city: firstQuery(query.city),
    county: firstQuery(query.county),
    niche: firstQuery(query.niche),
  });
  
  const access = await readStudioAccess(profile.slug);
  
  return (
    <>
      {theme}
      <OutboundStorefront
        profile={profile}
        stock={previewStockForBusiness({
          niche: profile.niche,
          businessName: profile.businessName,
          city: profile.city,
          accent,
        })}
        studioUnlocked={access.isActive && access.credits > 0}
      />
    </>
  );
}