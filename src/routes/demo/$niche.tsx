import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Magnetic } from "@/components/magnetic";
import { NicheStorefront, type StorefrontService, type StorefrontStaff } from "@/components/niche-storefront";
import { presetForShopNiche } from "@/config/nichePresets";
import { mapBusinessToTemplateBrand, parseBusinessId, type BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { getBusinessBrand } from "@/lib/axiom/business-lookup";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { NICHE_MEDIA, SHARED_STAFF } from "@/lib/axiom/media";
import { applyDepthStudio, DEFAULT_HUD, paintHero, setHeroLayer, type HeroLayerId, type StorefrontHud } from "@/lib/axiom/hud";
import { PreviewStudio } from "@/components/preview-studio";
import {
  DEFAULT_HOURS,
  formatOffer,
  isPublicNiche,
  NICHES,
  nicheCopy,
  PUBLIC_NICHE_ORDER,
} from "@/lib/axiom/niches";
import { resolveProspectBrand } from "@/lib/axiom/prospect-brand";
import { isShopNiche, type ShopNiche } from "@/lib/axiom/types";

type DemoSearch = ReturnType<typeof parseFunnelSearch> & { id?: string };

export const Route = createFileRoute("/demo/$niche")({
  validateSearch: (search: Record<string, unknown>): DemoSearch => {
    const parsed = parseFunnelSearch(search);
    const id = parseBusinessId(search.id);
    return id ? { ...parsed, id } : parsed;
  },
  loader: ({ params }) => {
    const niche = params.niche;
    if (!isShopNiche(niche) || !isPublicNiche(niche)) throw notFound();
    return { niche };
  },
  component: NicheDemo,
  notFoundComponent: DemoMissing,
});

function claimSearch(niche: ShopNiche) {
  return { niche } as const;
}

function NicheDemo() {
  const { niche } = Route.useLoaderData();
  const search = Route.useSearch();
  const template = NICHES[niche];
  const media = NICHE_MEDIA[niche];
  const copy = nicheCopy(niche);
  const bookLabel = presetForShopNiche(niche).bookingCta || copy.bookLabel;
  const lookupId = search.id ?? "";
  const lookupSlug = search.b || search.lead_slug || "";
  const [loaded, setLoaded] = useState<BusinessBrandRecord | null>(null);
  const [hud, setHud] = useState<StorefrontHud>(() => applyDepthStudio(DEFAULT_HUD, niche));
  const [activeLayer, setActiveLayer] = useState<HeroLayerId>("headline");

  useEffect(() => {
    setHud(applyDepthStudio(DEFAULT_HUD, niche));
  }, [niche]);

  useEffect(() => {
    if (!lookupId && !lookupSlug) {
      setLoaded(null);
      return;
    }
    let cancelled = false;
    const request = lookupId
      ? getBusinessBrand({ data: { id: lookupId } })
      : getBusinessBrand({ data: { slug: lookupSlug } });
    void request
      .then((row) => {
        if (!cancelled) setLoaded(row);
      })
      .catch(() => {
        if (!cancelled) setLoaded(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lookupId, lookupSlug]);

  const mapped = loaded ? mapBusinessToTemplateBrand(loaded) : null;
  const brand = resolveProspectBrand({
    fallbackName: mapped?.businessName || template.defaultName,
    fallbackAccent: template.ringColor,
    businessName: search.biz || mapped?.businessName,
    logoUrl: search.logo || mapped?.logoUrl || undefined,
    accent: search.accent || mapped?.accent || undefined,
    contactName: mapped?.contactName,
    contactPhone: search.phone || mapped?.contactPhone,
    contactEmail: search.email || mapped?.contactEmail,
  });
  const navigate = useNavigate();
  const services: StorefrontService[] = template.services.map((service, index) => ({
    key: `${service.name}-${index}`,
    name: service.name,
    description: service.description,
    price: formatOffer(service),
    group: service.group,
  }));
  const staff = [0, 1].map((index) => {
    const person = template.employees[index];
    return {
      key: person?.displayName ?? `staff-${index}`,
      displayName: person?.displayName ?? (index === 0 ? "Alex Morgan" : "Willa Grant"),
      title: person?.title ?? "",
      bio: person?.bio ?? "",
      avatarUrl: SHARED_STAFF[index],
    } satisfies StorefrontStaff;
  }) as [StorefrontStaff, StorefrontStaff];
  const painted = paintHero(media.heroImageUrl, media.heroVideoUrl || null, hud);
  const heroChoices = [
    { id: "film" as const, label: media.loopLabel },
    ...(media.heroImageUrl ? [{ id: "still" as const, label: "Niche still" }] : []),
    { id: "url" as const, label: "Custom URL" },
  ];

  return (
    <main className="min-h-dvh bg-transparent pb-28">
      <NicheStorefront
        businessName={brand.businessName}
        kicker={`Live preview · ${mapped?.categoryLabel || template.label}`}
        tagline={template.tagline}
        description={template.description}
        address={mapped?.location || template.address}
        accent={brand.accent}
        logoUrl={brand.logoUrl}
        contactName={brand.contactName}
        contactPhone={brand.contactPhone}
        contactEmail={brand.contactEmail}
        services={services}
        hours={template.hours ?? DEFAULT_HOURS}
        staff={staff}
        heroImageUrl={painted.imageUrl}
        heroVideoUrl={painted.videoUrl}
        blendPercent={hud.fade}
        introPreset={template.introPreset}
        introSpeed={template.introSpeed}
        introIntensity={template.introIntensity}
        tone={media.tone ?? null}
        fallbackImageUrl={NICHE_MEDIA.trade.heroImageUrl}
        fallbackVideoUrl={NICHE_MEDIA.trade.heroVideoUrl}
        bookLabel={bookLabel}
        bookHref="#book"
        hud={hud}
        headline={hud.headline}
        layoutEditable
        activeLayer={activeLayer}
        onActiveLayer={setActiveLayer}
        onLayerChange={(id, layer) => setHud((current) => setHeroLayer(current, id, layer))}
        extra={
          <PreviewStudio
            hud={hud}
            onChange={setHud}
            heroChoices={heroChoices}
            activeLayer={activeLayer}
            onActiveLayer={setActiveLayer}
          />
        }
        header={
          <label className="min-w-0">
            <span className="sr-only">Explore industries</span>
            <select
              className="h-11 max-w-48 rounded-xl bg-surface px-3 text-sm text-fg"
              value={niche}
              onChange={(event) => {
                const next = event.target.value;
                if (!isPublicNiche(next)) return;
                void navigate({ to: "/demo/$niche", params: { niche: next }, search });
              }}
            >
              {PUBLIC_NICHE_ORDER.map((key) => (
                <option key={key} value={key}>
                  {NICHES[key].label}
                </option>
              ))}
            </select>
          </label>
        }
        footer={
          <div
            id="book"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/92 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:pl-36"
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">{template.label} preview. The services and the book are this trade’s.</p>
              <Magnetic className="inline-flex w-full sm:w-auto">
                <Link
                  to="/onboard"
                  search={claimSearch(niche)}
                  className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg sm:w-auto"
                >
                  Claim This Storefront for Your Business
                </Link>
              </Magnetic>
            </div>
          </div>
        }
      />
    </main>
  );
}

function DemoMissing() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div>
        <p className="font-display text-3xl">That industry is not on the book.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted hover:text-fg">
          Back to Axiom
        </Link>
      </div>
    </main>
  );
}
