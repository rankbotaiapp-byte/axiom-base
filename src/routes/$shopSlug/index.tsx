import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IntroFxToggle } from "@/components/cinematic-hero";
import { HoloCard } from "@/components/holo-card";
import { Magnetic } from "@/components/magnetic";
import { Reveal } from "@/components/reveal";
import { NicheStorefront, type StorefrontStaff } from "@/components/niche-storefront";
import { ProductShelf } from "@/components/product-shelf";
import { NeonField, SnapEstimate } from "@/components/snap-estimate";
import { offerModel, shelfFor } from "@/lib/axiom/storefront";
import { LoopOverlay, TourOverlay } from "@/components/tour-overlay";
import { PoweredBy, ShopNav } from "@/components/shop-chrome";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { TradeStorefront } from "@/components/trade-storefront";
import { StorefrontAuditWidget } from "@/components/StorefrontAuditWidget";
import { presetsForShop } from "@/config/nichePresets";
import { formatOffer, NICHES, nicheCopy } from "@/lib/axiom/niches";
import { resolveHeroMedia, heroForCustomNiche, NICHE_MEDIA, SHARED_STAFF } from "@/lib/axiom/media";
import { compileBrandMark, rippleTheme, themeSurface } from "@/lib/axiom/brand-studio";
import { paintHero } from "@/lib/axiom/hud";
import { resolveProspectBrand } from "@/lib/axiom/prospect-brand";
import type { AccessMode } from "@/lib/axiom/types";
import { getShopAccess, submitInquiry } from "@/lib/axiom/server";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useShopPageData } from "./route";

export const Route = createFileRoute("/$shopSlug/")({
  validateSearch: (s: Record<string, unknown>): { tour?: boolean; loop?: boolean; requested?: boolean } => {
    const out: { tour?: boolean; loop?: boolean; requested?: boolean } = {};
    if (s.tour === true || s.tour === "1" || s.tour === "true") out.tour = true;
    if (s.loop === true || s.loop === "1" || s.loop === "true") out.loop = true;
    if (s.requested === true || s.requested === "1" || s.requested === "true") out.requested = true;
    return out;
  },
  component: CustomerHome,
});

function CustomerHome() {
  const data = useShopPageData();
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<AccessMode>("customer");

  useEffect(() => {
    if (isPending || !user) return;
    void getShopAccess({ data: data.shop.slug })
      .then((a) => setMode(a.mode === "none" ? "customer" : a.mode))
      .catch(() => setMode("customer"));
  }, [data.shop.slug, isPending, user]);

  const employees = data.employees ?? [];
  const services = data.services ?? [];
  const hours = data.shop.hours ?? {};
  const invited = employees[employees.length - 1];
  const copy = nicheCopy(data.shop.niche);
  const bookLabel = presetsForShop(data.shop.niche)[0]?.bookingCta ?? copy.bookLabel;
  const contact = employees.find((e) => e.phone)?.phone;
  const hero = resolveHeroMedia(data.shop);
  const painted = paintHero(hero.imageUrl, hero.videoUrl, data.shop.tradeProfile.hud, hero.videos);
  const nicheFilm = data.shop.customNiche ? heroForCustomNiche(data.shop.customNiche) : NICHE_MEDIA[data.shop.niche];
  const fallback = data.shop.customNiche ? NICHE_MEDIA.trade : nicheFilm;
  const brand = resolveProspectBrand({
    fallbackName: data.shop.name,
    fallbackAccent: data.shop.neonAccent || data.shop.ringColor,
    logoUrl: data.shop.tradeProfile.logoUrl,
    contactPhone: contact ? String(contact) : "",
  });
  const studio = data.shop.tradeProfile.studio;
  const theme = rippleTheme(studio.theme);
  const mark = studio.header ? compileBrandMark(studio.header, studio.tagline || data.shop.tagline, theme?.accent || brand.accent) : null;
  const surface = theme ? themeSurface(theme) : undefined;
  const templatePeople = NICHES[data.shop.niche].employees;
  const staff = [0, 1].map((index) => {
    const person = employees[index];
    const raw = person?.avatarUrl ?? "";
    const custom = raw.startsWith("data:") || raw.startsWith("http");
    return {
      key: person?.id ?? `staff-${index}`,
      displayName: person?.displayName || templatePeople[index]?.displayName || (index === 0 ? "Alex Morgan" : "Willa Grant"),
      title: person?.title || templatePeople[index]?.title || "",
      bio: person?.bio || templatePeople[index]?.bio || "",
      avatarUrl: custom ? raw : SHARED_STAFF[index],
      shopSlug: person ? data.shop.slug : undefined,
      employeeId: person?.id,
    } satisfies StorefrontStaff;
  }) as [StorefrontStaff, StorefrontStaff];
  const product = offerModel(data.shop.niche) === "product";
  const shelf = shelfFor(
    data.shop.niche,
    services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceCents: service.priceCents,
    })),
  );

  return (
    <>
      <NicheStorefront
        businessName={brand.businessName}
        kicker={data.shop.customNiche || data.shop.address}
        tagline={data.shop.tagline}
        description={data.shop.description}
        address={data.shop.address}
        accent={theme?.accent || brand.accent}
        logoUrl={mark?.dataUrl || brand.logoUrl}
        contactPhone={brand.contactPhone}
        services={services.map((service) => ({
          key: service.id,
          name: service.name,
          description: service.description,
          price: formatOffer(service),
          group: service.group,
        }))}
        hours={hours}
        staff={staff}
        heroImageUrl={painted.imageUrl}
        heroVideoUrl={painted.videos.length > 1 ? painted.videos : painted.videoUrl}
        blendPercent={data.shop.heroBlendPercent}
        introPreset={studio.presentation || data.shop.introPreset}
        introSpeed={data.shop.introSpeed}
        introIntensity={data.shop.introIntensity}
        tone={hero.tone}
        fallbackImageUrl={fallback.heroImageUrl}
        fallbackVideoUrl={fallback.heroVideoUrl}
        bookLabel={bookLabel}
        bookHref={`/${data.shop.slug}/book`}
        niche={data.shop.customNiche || data.shop.niche}
        autoHero={data.shop.slug === "axiom-auto"}
        hud={data.shop.tradeProfile.hud}
        surface={surface}
        headline={data.shop.tradeProfile.hud.headline}
        header={
          <div className="min-w-0 flex-1">
            <ShopNav shop={data.shop} mode={mode} highlightAdmin={search.tour} />
          </div>
        }
        extra={
          <>
            <NeonField active={data.shop.glowEnabled} />
            {search.requested ? (
              <p className="mx-auto max-w-5xl px-5 text-sm text-muted sm:px-10">
                Request received. This shop has it. If you left a phone or email, a confirmation follows when the time is accepted.
              </p>
            ) : null}
            <TradeStorefront shop={data.shop} services={services} phone={contact ? String(contact) : ""} />
            <section className="px-5 pb-4 sm:px-10">
              <div className="mx-auto max-w-5xl">
                {product ? (
                  <ProductShelf items={shelf} />
                ) : (
                  <SnapEstimate
                    niche={data.shop.niche}
                    bookLabel={bookLabel}
                    shopSlug={data.shop.slug}
                    lines={services.map((service) => ({
                      name: service.name,
                      description: service.description,
                      priceCents: service.priceCents,
                    }))}
                    bookTo={`/${data.shop.slug}/book`}
                  />
                )}
              </div>
            </section>
            <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
              <InquiryForm slug={data.shop.slug} label={copy.inquiry} />
            </section>
            <Reveal>
              <section className="px-5 pb-28 sm:px-10 sm:pb-16">
                <StorefrontAuditWidget
                  tenantId={data.shop.id}
                  businessName={data.shop.name}
                  niche={data.shop.niche}
                  bookSlug={data.shop.slug}
                />
              </section>
            </Reveal>
            <PoweredBy />
            <div className="sticky bottom-0 z-30 border-t border-line bg-bg/92 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
              <div className="mb-2 flex justify-center">
                <IntroFxToggle />
              </div>
              <Magnetic className="block">
                <Link
                  to="/$shopSlug/book"
                  params={{ shopSlug: data.shop.slug }}
                  className="glass-btn flex h-12 items-center justify-center rounded-xl text-sm font-medium"
                >
                  {bookLabel}
                </Link>
              </Magnetic>
            </div>
            {search.tour ? <TourOverlay slug={data.shop.slug} /> : null}
            {search.loop ? <LoopOverlay slug={data.shop.slug} employeeId={invited?.id} /> : null}
          </>
        }
      />
    </>
  );
}

function InquiryForm({ slug, label }: { slug: string; label: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Reveal delay={0.12}>
      <HoloCard tilt={false} className="glass-panel lift-card mt-8 rounded-[24px] p-5">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            void submitInquiry({ data: { slug, name, phone, message } })
              .then(() => {
                setSent(true);
                setMessage("");
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not send"))
              .finally(() => setBusy(false));
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</p>
          {sent ? <p className="text-sm text-ok">Sent. They have it on the console.</p> : null}
          <div>
            <Label htmlFor="inq-name">Name</Label>
            <Input id="inq-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="inq-phone">Phone</Label>
            <Input id="inq-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="inq-msg">Message</Label>
            <textarea
              id="inq-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={8}
              rows={3}
              className="mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Sending" : "Send inquiry"}
          </Button>
        </form>
      </HoloCard>
    </Reveal>
  );
}
