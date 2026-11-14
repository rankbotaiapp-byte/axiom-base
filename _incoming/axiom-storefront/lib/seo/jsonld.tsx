import { niches, plans, site } from "@/config/storefront";
import type { Post, Tenant } from "@/lib/tenants/types";

/**
 * Structured data. Only facts we actually hold go in — no self-serving review
 * stars, no invented ratings (Google ignores or penalises those for LocalBusiness).
 */

const DAY_MAP: Record<string, string> = {
  Monday: "https://schema.org/Monday",
  Tuesday: "https://schema.org/Tuesday",
  Wednesday: "https://schema.org/Wednesday",
  Thursday: "https://schema.org/Thursday",
  Friday: "https://schema.org/Friday",
  Saturday: "https://schema.org/Saturday",
  Sunday: "https://schema.org/Sunday",
};

export const tenantUrl = (t: Tenant) => `${site.url}/b/${t.slug}`;

export function localBusinessLd(t: Tenant) {
  const url = tenantUrl(t);
  const sameAs = Object.values(t.config.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": niches[t.niche].schemaType,
    "@id": `${url}#business`,
    name: t.name,
    url,
    telephone: t.phone,
    email: t.email,
    image: `${url}/opengraph-image`,
    description: t.config.tagline,
    address: {
      "@type": "PostalAddress",
      ...(t.street ? { streetAddress: t.street } : {}),
      addressLocality: t.city,
      addressRegion: t.region,
      ...(t.postalCode ? { postalCode: t.postalCode } : {}),
      addressCountry: "US",
    },
    areaServed: t.config.serviceArea.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: t.config.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days.map((d) => DAY_MAP[d] ?? d),
      opens: h.opens,
      closes: h.closes,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${t.name} services`,
      itemListElement: t.config.services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, ...(s.description ? { description: s.description } : {}), areaServed: t.city },
        ...(s.price ? { price: s.price.replace(/[^0-9.]/g, ""), priceCurrency: "USD" } : {}),
      })),
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}#book`, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      result: { "@type": "Reservation", name: `Booking with ${t.name}` },
    },
    ...(sameAs.length ? { sameAs } : {}),
    ...(t.website ? { mainEntityOfPage: t.website } : {}),
  };
}

export function faqLd(t: Tenant) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.config.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function articleLd(t: Tenant, p: Post) {
  const url = `${tenantUrl(t)}/posts/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: p.title,
    description: p.excerpt,
    keywords: p.keywords.join(", "),
    datePublished: p.publishedAt ?? p.scheduledFor,
    dateModified: p.publishedAt ?? p.scheduledFor,
    mainEntityOfPage: url,
    image: `${url}/opengraph-image`,
    author: { "@type": "Organization", name: t.name, url: tenantUrl(t) },
    publisher: { "@id": `${tenantUrl(t)}#business` },
    about: { "@id": `${tenantUrl(t)}#business` },
  };
}

/** Axiom's own storefront: the product + its offers. */
export function storefrontLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${site.url}#org`,
      name: site.legalName,
      brand: site.name,
      url: site.url,
      email: site.contactEmail,
      areaServed: site.region,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${site.name} — Complete App System`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android (PWA)",
      description: site.description,
      publisher: { "@id": `${site.url}#org` },
      offers: [
        { "@type": "Offer", name: plans.starter.label, price: "1.00", priceCurrency: "USD", description: `${plans.starter.price}, ${plans.starter.fine}` },
        { "@type": "Offer", name: plans.lifetime.label, price: "1000.00", priceCurrency: "USD", description: plans.lifetime.fine },
      ],
    },
  ];
}

export function JsonLd({ data }: { data: unknown }) {
  // Escape "<" so content can never break out of the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
