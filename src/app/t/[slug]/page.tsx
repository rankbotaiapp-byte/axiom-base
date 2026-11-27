import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BarberOutreachLive } from "@/components/barber/barber-outreach-landing";
import { ElectricianOutreachLive } from "@/components/electrician/electrician-outreach-landing";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";
import { featuredDemo, featuredShowcase } from "@/lib/axiom-landing/featured-demos";
import { showcaseSrc } from "@/lib/axiom-landing/showcase";
import { readStorefrontDesk } from "@/lib/axiom/storefront-unlock.server";
import type { UnlockPhase } from "@/lib/axiom/hydrate-storefront";
import { TenantStorefrontSchema } from "@/lib/schemas/tenant";
import { loadTenantStorefrontConfig } from "@/lib/storefront/load-tenant-config";
import { themeKeyFromSearch } from "@/lib/axiom/lifecycle";
import { DEFAULT_BARBER_OUTREACH, isBarberCampaign } from "@/lib/axiom/barber-outreach";
import { DEFAULT_ELECTRICIAN_OUTREACH, isElectricalCampaign } from "@/lib/axiom/electrician-outreach";
import { showcaseTheme } from "@/lib/axiom/outreach-desk";
import { emptyOutreachTenant } from "@/lib/axiom/plumber-outreach";
import { loadShopProofSlots } from "@/lib/axiom/shop-proof-slots.server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function flag(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadTenantStorefrontConfig(slug);
  if (loaded.status === "ok") {
    const parsed = TenantStorefrontSchema.safeParse(loaded.config);
    if (parsed.success) {
      return {
        title: `${parsed.data.businessName} · Axiom`,
        description: parsed.data.hero.subheadline,
      };
    }
  }
  const demo = featuredDemo(slug);
  if (!demo) return {};
  return { title: `${demo.name} · Axiom`, description: demo.blurb };
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export default async function TenantStorefrontPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const niche = first(query.niche).toLowerCase();
  const electricalPreview = niche === "electrical" || isElectricalCampaign(slug);
  const barberPreview = niche === "barber" || isBarberCampaign(slug);
  const desk = await readStorefrontDesk(slug);
  const proofSlots = await loadShopProofSlots(slug).catch(() => null);
  const loaded = await loadTenantStorefrontConfig(slug);
  const stored = desk?.config ? TenantStorefrontSchema.safeParse(desk.config) : null;
  const fileConfig = loaded.status === "ok" ? TenantStorefrontSchema.safeParse(loaded.config) : null;
  const parsed = stored?.success ? stored : fileConfig?.success ? fileConfig : null;
  if (barberPreview && !parsed?.success) {
    const tenant = {
      ...emptyOutreachTenant(slug),
      business: first(query.biz) || first(query.business) || "",
      city: first(query.city),
      county: first(query.county),
    };
    return (
      <BarberOutreachLive
        tenant={tenant}
        config={DEFAULT_BARBER_OUTREACH}
        studio={flag(query.studio)}
        tracking={{ utmSource: first(query.utm_source), county: tenant.county, stopToken: first(query.t) }}
      />
    );
  }
  if (electricalPreview && !parsed?.success) {
    const tenant = {
      ...emptyOutreachTenant(slug),
      business: first(query.biz) || first(query.business) || "",
      city: first(query.city),
      county: first(query.county),
    };
    return (
      <ElectricianOutreachLive
        tenant={tenant}
        config={DEFAULT_ELECTRICIAN_OUTREACH}
        studio={flag(query.studio)}
        tracking={{ utmSource: first(query.utm_source), county: tenant.county, stopToken: first(query.t) }}
      />
    );
  }
  if (loaded.status === "invalid" && !parsed) notFound();

  if (parsed?.success) {
    const phase: UnlockPhase = desk?.phase ?? "locked";
    const themeKey = themeKeyFromSearch(query);
    const config = parsed.data;
    if (themeKey) {
      const skin = showcaseTheme(themeKey);
      config.theme = {
        ...config.theme,
        showcaseThemeId: themeKey,
        ringColor: skin.ring,
        ringHot: skin.ringHot,
        callCta: skin.call,
        bookCta: skin.book,
        primaryAccent: skin.book,
        secondaryAccent: skin.call,
      };
    }
    return (
      <StorefrontRenderer
        config={
          proofSlots?.heroUrl
            ? {
                ...config,
                hero: {
                  ...config.hero,
                  media: { ...config.hero.media, kind: "image", posterUrl: proofSlots.heroUrl, videoUrl: "" },
                },
              }
            : config
        }
        initialUrgency={flag(query.urgent) || flag(query.emergency)}
        phase={phase}
        proofSlots={proofSlots}
      />
    );
  }

  const demo = featuredDemo(slug);
  if (!demo) notFound();
  if (demo.href) redirect(`${demo.href}?showcase=1&template=${demo.slug}`);

  const build = featuredShowcase(demo);
  if (!build) notFound();

  return (
    <iframe
      title={demo.name}
      src={showcaseSrc(build, build.entry)}
      className="block h-dvh w-full border-0 bg-black"
    />
  );
}
