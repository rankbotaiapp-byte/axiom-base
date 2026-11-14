import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GuidedFishingStorefront from '@/components/guided-fishing/GuidedFishingStorefront';
import { getGuidedFishingConfig } from '@/lib/axiom/guided-fishing/getTenantConfig';

// Next.js 15: route params arrive as a Promise.
type PageProps = { params: Promise<{ tenant: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenant } = await params;
  const config = await getGuidedFishingConfig(tenant);
  if (!config) return {};
  return {
    title: config.seo.title,
    description: config.seo.description,
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      images: config.hero.posterSrc ? [config.hero.posterSrc] : undefined,
      type: 'website',
    },
  };
}

export default async function GuidedFishingPage({ params }: PageProps) {
  const { tenant } = await params;
  const config = await getGuidedFishingConfig(tenant);
  if (!config) notFound();

  const { business, pricing, seo } = config;
  const digits = business.phone.replace(/\D/g, '');

  // Local-business structured data: helps "fishing guide near me" searches in the tagged counties.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: seo.description,
    telephone: digits.length === 10 ? `+1${digits}` : `+${digits}`,
    email: business.email,
    areaServed: business.locationTags,
    makesOffer: pricing.tiers.map((tier) => ({
      '@type': 'Offer',
      name: tier.name,
      description: tier.blurb,
      price: tier.price,
      priceCurrency: 'USD',
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so tenant-supplied text can never break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <GuidedFishingStorefront initialConfig={config} />
    </>
  );
}
