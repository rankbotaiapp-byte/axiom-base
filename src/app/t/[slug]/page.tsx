import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";
import { featuredDemo, featuredShowcase } from "@/lib/axiom-landing/featured-demos";
import { showcaseSrc } from "@/lib/axiom-landing/showcase";
import { readStorefrontDesk } from "@/lib/axiom/storefront-unlock.server";
import type { UnlockPhase } from "@/lib/axiom/hydrate-storefront";
import { TenantStorefrontSchema } from "@/lib/schemas/tenant";
import { loadTenantStorefrontConfig } from "@/lib/storefront/load-tenant-config";
import { themeKeyFromSearch } from "@/lib/axiom/lifecycle";
import { showcaseTheme } from "@/lib/axiom/outreach-desk";

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

export default async function TenantStorefrontPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const desk = await readStorefrontDesk(slug);
  const loaded = await loadTenantStorefrontConfig(slug);
  const stored = desk?.config ? TenantStorefrontSchema.safeParse(desk.config) : null;
  const fileConfig = loaded.status === "ok" ? TenantStorefrontSchema.safeParse(loaded.config) : null;
  const parsed = stored?.success ? stored : fileConfig?.success ? fileConfig : null;
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
        config={config}
        initialUrgency={flag(query.urgent) || flag(query.emergency)}
        phase={phase}
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
