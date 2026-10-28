"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Magnetic } from "@/components/magnetic";
import { NicheStorefront, type StorefrontService, type StorefrontStaff } from "@/components/niche-storefront";
import { presetForShopNiche } from "@/config/nichePresets";
import { mapBusinessToTemplateBrand, type BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { NICHE_MEDIA, SHARED_STAFF } from "@/lib/axiom/media";
import { applyDepthStudio, DEFAULT_HUD, paintHero, setHeroLayer, type HeroLayerId, type StorefrontHud } from "@/lib/axiom/hud";
import { PreviewStudio } from "@/components/preview-studio";
import { AxiomGenerativeBrandingStudio } from "@/components/brand-studio";
import { compileBrandMark, rippleTheme, themeSurface, type RippleThemeId } from "@/lib/axiom/brand-studio";
import { PRESENTATION_STYLES, type PresentationStyle } from "@/lib/axiom/intro";
import { demoHeroFilm } from "@/lib/axiom/demo-hero";
import { previewStyleId, previewThemeId } from "@/lib/axiom/preview-link";
import { DEFAULT_HOURS, formatOffer, isPublicNiche, NICHES, nicheCopy, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import { resolveProspectBrand } from "@/lib/axiom/prospect-brand";
import type { ShopNiche } from "@/lib/axiom/types";

export type TenantPreviewSearch = {
  preview?: boolean;
  business?: string;
  biz?: string;
  city?: string;
  logo?: string;
  accent?: string;
  phone?: string;
  email?: string;
};

export function TenantPreview({
  niche,
  search,
  loaded = null,
  onNiche,
  claim,
  revealHero,
}: {
  niche: ShopNiche;
  search: TenantPreviewSearch;
  loaded?: BusinessBrandRecord | null;
  onNiche: (niche: ShopNiche) => void;
  claim: ReactNode;
  revealHero?: ReactNode;
}) {
  const template = NICHES[niche];
  const media = NICHE_MEDIA[niche];
  const copy = nicheCopy(niche);
  const bookLabel = presetForShopNiche(niche).bookingCta || copy.bookLabel;
  const previewOn = search.preview === true || Boolean(search.business);
  const seedName = (search.business || search.biz || template.defaultName).trim();
  const [hud, setHud] = useState<StorefrontHud>(() => applyDepthStudio(DEFAULT_HUD, niche));
  const [activeLayer, setActiveLayer] = useState<HeroLayerId>("headline");
  const [header, setHeader] = useState(seedName);
  const [tagline, setTagline] = useState(template.tagline);
  const [themeId, setThemeId] = useState<RippleThemeId>(() => previewThemeId(seedName));
  const [styleId, setStyleId] = useState<PresentationStyle>(() => previewStyleId(seedName));

  useEffect(() => {
    setHud(applyDepthStudio(DEFAULT_HUD, niche));
  }, [niche]);

  useEffect(() => {
    setHeader(seedName);
    setTagline(template.tagline);
    setThemeId(previewThemeId(seedName));
    setStyleId(previewStyleId(seedName));
  }, [seedName, template.tagline]);

  const mapped = loaded ? mapBusinessToTemplateBrand(loaded) : null;
  const brand = resolveProspectBrand({
    fallbackName: mapped?.businessName || template.defaultName,
    fallbackAccent: template.ringColor,
    businessName: search.biz || search.business || mapped?.businessName,
    logoUrl: search.logo || mapped?.logoUrl || undefined,
    accent: search.accent || mapped?.accent || undefined,
    contactName: mapped?.contactName,
    contactPhone: search.phone || mapped?.contactPhone,
    contactEmail: search.email || mapped?.contactEmail,
  });
  const theme = rippleTheme(themeId);
  const mark = theme ? compileBrandMark(header || seedName, tagline, theme.accent) : null;
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
  const painted = paintHero(media.heroImageUrl, media.heroVideoUrl || null, hud, media.heroVideos);
  const heroChoices = [
    { id: "film" as const, label: media.loopLabel },
    ...(media.heroImageUrl ? [{ id: "still" as const, label: "Niche still" }] : []),
    { id: "url" as const, label: "Custom URL" },
  ];

  return (
    <main className="min-h-dvh bg-transparent pb-28">
      {previewOn && theme ? (
        <div className="axiom-ring" data-state="idle" style={{ ["--ring-color" as string]: theme.ring }} aria-hidden="true">
          <span className="axiom-ring-edge" />
          <span className="axiom-ring-bloom" />
        </div>
      ) : null}
      <NicheStorefront
        businessName={previewOn ? header || seedName : brand.businessName}
        kicker={`Live preview · ${mapped?.categoryLabel || template.label}`}
        tagline={previewOn ? tagline : template.tagline}
        description={template.description}
        address={mapped?.location || (search.city ? `${search.city}` : template.address)}
        accent={previewOn && theme ? theme.accent : brand.accent}
        logoUrl={previewOn && mark ? mark.dataUrl : brand.logoUrl}
        contactName={brand.contactName}
        contactPhone={brand.contactPhone}
        contactEmail={brand.contactEmail}
        services={services}
        hours={template.hours ?? DEFAULT_HOURS}
        staff={staff}
        heroImageUrl={painted.imageUrl}
        heroVideoUrl={demoHeroFilm(niche, mapped?.categoryLabel || mapped?.category || search.trade)}
        heroPresence="film"
        blendPercent={hud.fade}
        introPreset={previewOn ? styleId : template.introPreset}
        introSpeed={template.introSpeed}
        introIntensity={template.introIntensity}
        tone={media.tone ?? null}
        fallbackImageUrl={NICHE_MEDIA.trade.heroImageUrl}
        fallbackVideoUrl={NICHE_MEDIA.trade.heroVideoUrl}
        bookLabel={bookLabel}
        bookHref="#book"
        niche={niche}
        revealHero={revealHero}
        hud={hud}
        headline={hud.headline}
        layoutEditable
        surface={previewOn && theme ? themeSurface(theme) : undefined}
        activeLayer={activeLayer}
        onActiveLayer={setActiveLayer}
        onLayerChange={(id, layer) => setHud((current) => setHeroLayer(current, id, layer))}
        extra={
          <>
            {previewOn && theme ? (
              <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-6">
                <AxiomGenerativeBrandingStudio
                  header={header}
                  tagline={tagline}
                  theme={themeId}
                  onHeader={setHeader}
                  onTagline={setTagline}
                  onTheme={setThemeId}
                />
                <label className="grid gap-2 text-sm text-fg">
                  Hero presentation
                  <select
                    className="h-11 rounded-xl bg-surface px-3"
                    value={styleId}
                    onChange={(event) => setStyleId(event.target.value as PresentationStyle)}
                  >
                    {PRESENTATION_STYLES.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>
            ) : null}
            <PreviewStudio
              hud={hud}
              onChange={setHud}
              heroChoices={heroChoices}
              activeLayer={activeLayer}
              onActiveLayer={setActiveLayer}
            />
          </>
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
                onNiche(next);
              }}
            >
              {PUBLIC_NICHE_ORDER.map((key) => (
                <option key={key} value={key}>
                  {NICHES[key].label}
                </option>
              ))}
              {!isPublicNiche(niche) ? <option value={niche}>{template.label}</option> : null}
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
              <Magnetic className="inline-flex w-full sm:w-auto">{claim}</Magnetic>
            </div>
          </div>
        }
      />
    </main>
  );
}
