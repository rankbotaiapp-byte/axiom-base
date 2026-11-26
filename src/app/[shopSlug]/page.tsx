import { notFound } from "next/navigation";
import { TradeShowcasePage } from "@/components/storefront/trade-showcase-page";
import { firstQuery } from "@/lib/axiom/outbound-preview";
import { resolveOutboundLead } from "@/lib/axiom/outbound-preview.server";
import { readPublicShop } from "@/lib/axiom/shop-accent.server";

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

  if (!shop && !lead) notFound();

  const profile = lead
    ? await resolveOutboundLead({
        slug: shopSlug,
        lead,
        name: firstQuery(query.name),
        city: firstQuery(query.city),
        county: firstQuery(query.county),
        niche: firstQuery(query.niche),
      })
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile?.businessName || shop?.name || shopSlug,
    description: `Open 24/7 for emergency ${(profile?.niche || shop?.niche || "service")} bookings.`,
    url: `/${shopSlug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <TradeShowcasePage
        shop={{
          slug: shopSlug,
          name: profile?.businessName || shop?.name || shopSlug,
          niche: profile?.niche || shop?.niche || "contractor",
          tagline: profile?.tagline || shop?.tagline,
          description: shop?.description,
          address: profile?.city || shop?.address,
          accent: shop?.accent,
          ringColor: shop?.ringColor,
          neonAccent: shop?.neonAccent,
          heroImageUrl: shop?.heroImageUrl,
          heroVideoUrl: shop?.heroVideoUrl,
          phone: profile?.phone || shop?.phone,
          showcaseThemeId: shop?.showcaseThemeId,
        }}
      />
    </>
  );
}
