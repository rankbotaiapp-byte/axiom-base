import type { Metadata } from "next";
import GuidedFishingStorefront from "@/components/guided-fishing/GuidedFishingStorefront";
import { ShowcaseDemoChrome } from "@/components/showcase/ShowcaseDemoChrome";
import { defaultGuidedFishingConfig } from "@/lib/axiom/guided-fishing/defaults";
import { getGuidedFishingConfig } from "@/lib/axiom/guided-fishing/getTenantConfig";
import type { GuidedFishingConfig } from "@/lib/axiom/guided-fishing/types";

async function loadConfig(): Promise<GuidedFishingConfig> {
  try {
    return (await getGuidedFishingConfig(SLUG)) ?? { ...defaultGuidedFishingConfig, tenantId: SLUG };
  } catch {
    return { ...defaultGuidedFishingConfig, tenantId: SLUG };
  }
}

const SLUG = "rogue-river-fishing";

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadConfig();
  return {
    title: config.seo.title,
    description: config.seo.description,
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      images: config.hero.posterSrc ? [config.hero.posterSrc] : undefined,
      type: "website",
    },
  };
}

export default async function RogueRiverFishingPage() {
  const config = await loadConfig();

  const { business, pricing, seo } = config;
  const digits = business.phone.replace(/\D/g, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: seo.description,
    telephone: digits.length === 10 ? `+1${digits}` : `+${digits}`,
    email: business.email,
    areaServed: business.locationTags,
    makesOffer: pricing.tiers.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      description: tier.blurb,
      price: tier.price,
      priceCurrency: "USD",
    })),
  };

  return (
    <ShowcaseDemoChrome slug="rogue-river-fishing">
      <div style={{ ["--font-serif" as string]: '"Fraunces", Georgia, "Times New Roman", serif' }}>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <GuidedFishingStorefront initialConfig={config} />
      </div>
    </ShowcaseDemoChrome>
  );
}
