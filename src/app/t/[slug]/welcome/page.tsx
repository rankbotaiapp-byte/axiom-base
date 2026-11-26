import type { Metadata } from "next";
import { AxiomBusinessNumberCard } from "@/components/storefront/AxiomBusinessNumberCard";
import { readAxiomBusinessNumber } from "@/lib/axiom/axiom-business-number.server";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";
import { readStorefrontDesk } from "@/lib/axiom/storefront-unlock.server";
import { loadTenantStorefrontConfig } from "@/lib/storefront/load-tenant-config";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = cleanShopSlug((await params).slug);
  return { title: slug ? `Save your Axiom number · ${slug}` : "Axiom number" };
}

export default async function StorefrontWelcomePage({ params }: PageProps) {
  const slug = cleanShopSlug((await params).slug) || "shop";
  const desk = await readStorefrontDesk(slug);
  const loaded = await loadTenantStorefrontConfig(slug);
  const businessName =
    desk?.businessName ||
    (loaded.status === "ok" ? loaded.config.businessName : "") ||
    slug.replace(/-/g, " ");
  const initial = await readAxiomBusinessNumber(slug);

  return (
    <main className="min-h-dvh bg-[#050507] px-4 py-10 text-[#f4f7fb] sm:px-6">
      <div className="mx-auto grid max-w-2xl gap-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00ffcc]">Checkout locked</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your Axiom line is live.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
            {businessName} now has a dedicated dispatch number. Save the contact, then keep this thread open in
            Messages for job photos and 24/7 booking.
          </p>
        </header>
        <AxiomBusinessNumberCard
          slug={slug}
          businessName={businessName}
          initial={initial}
          showInstructions
          showNav
        />
      </div>
    </main>
  );
}
