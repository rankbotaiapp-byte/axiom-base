import type { Metadata } from "next";
import { AxiomBusinessNumberCard } from "@/components/storefront/AxiomBusinessNumberCard";
import { Day1SetupCard } from "@/components/onboard/Day1SetupCard";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";
import { loadTenantStorefrontConfig } from "@/lib/storefront/load-tenant-config";
import { shopAdminHref } from "@/lib/axiom/onboard-success";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = cleanShopSlug((await params).slug);
  return { title: slug ? `Day-1 setup · ${slug}` : "Axiom setup" };
}

export default async function StorefrontWelcomePage({ params, searchParams }: PageProps) {
  const slug = cleanShopSlug((await params).slug) || "shop";
  const query = await searchParams;
  const desk = await import("@/lib/axiom/storefront-unlock.server")
    .then((mod) => mod.readStorefrontDesk(slug))
    .catch(() => null);
  const loaded = await loadTenantStorefrontConfig(slug).catch(() => ({ status: "missing" as const }));
  const day1 = await import("@/lib/axiom/sprint2-dispatch.server")
    .then((mod) => mod.loadDay1Onboarding(slug))
    .catch(() => null);
  const businessName =
    desk?.businessName ||
    day1?.name ||
    (loaded.status === "ok" ? loaded.config.businessName : "") ||
    slug.replace(/-/g, " ");
  const initial = await import("@/lib/axiom/axiom-business-number.server")
    .then((mod) => mod.readAxiomBusinessNumber(slug))
    .catch(() => null);
  const showSetup = first(query.setup) === "1" || first(query.unlocked) === "1";
  const prefillPhone = first(query.phone) || day1?.owner_phone || day1?.notify_phone || "";

  return (
    <main className="min-h-dvh bg-[#050507] px-4 py-10 text-[#f4f7fb] sm:px-6">
      <div className="mx-auto grid max-w-2xl gap-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00ffcc]">Checkout locked</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your Axiom line is live.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
            {businessName} now has a dedicated dispatch number. Confirm owner mobile, Google reviews, and hours —
            then keep this thread open in Messages.
          </p>
        </header>
        {showSetup ? (
          <Day1SetupCard
            slug={slug}
            businessName={businessName}
            initialPhone={prefillPhone}
            initialCity={day1?.address || ""}
            initialNiche={day1?.niche || desk?.niche || ""}
            initialReviewUrl={day1?.google_review_url || ""}
            hoursStart={day1?.service_hours_start || "07:00"}
            hoursEnd={day1?.service_hours_end || "19:00"}
            adminHref={shopAdminHref(slug, first(query.claim))}
          />
        ) : null}
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
