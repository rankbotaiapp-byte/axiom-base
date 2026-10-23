import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { NicheStorefront, type StorefrontStaff } from "@/components/niche-storefront";
import { GearGuardianCheckout } from "@/components/gear-guardian-checkout";
import { Wordmark } from "@/components/shop-chrome";
import { Button } from "@/components/ui/button";
import {
  beginTerritoryCheckout,
  confirmTerritorySession,
  ensureFunnelSession,
  finishTerritoryCheckout,
  getLeadPreview,
} from "@/lib/axiom/master";
import { leadHeroFor, NICHE_MEDIA, SHARED_STAFF } from "@/lib/axiom/media";
import { DEFAULT_HOURS, formatOffer, nicheCopy, NICHES } from "@/lib/axiom/niches";
import { resolveProspectBrand } from "@/lib/axiom/prospect-brand";
import { TERRITORY_PLANS, type TerritoryPlanId } from "@/lib/axiom/pricing";
import { isShopNiche } from "@/lib/axiom/types";
import { formatMoney } from "@/lib/utils";
import { AskEricAvatar } from "@/components/AskEricAvatar";
import { ProductShelf } from "@/components/product-shelf";
import { AuditEcho } from "@/components/audit-echo";
import { NeonField, SnapEstimate } from "@/components/snap-estimate";
import { offerModel, shelfFor } from "@/lib/axiom/storefront";
import { OnboardingVideoModal } from "@/components/OnboardingVideoModal";
import { SnapSimulation } from "@/components/snap-simulation";
import { LEAD_STORAGE_KEY } from "@/lib/axiom/funnel";
import { OutreachWelcomeFilm } from "@/components/welcome-film";

type Preview = Awaited<ReturnType<typeof getLeadPreview>>;

export function LeadTerritory({
  leadSlug,
  layout,
  sessionId,
  greet = false,
  businessName = "",
  trade = "",
  city = "",
  simulate = false,
  logoUrl = "",
  accent = "",
  phone = "",
  email = "",
}: {
  leadSlug: string;
  layout: "pitch" | "page";
  sessionId?: string;
  greet?: boolean;
  businessName?: string;
  trade?: string;
  city?: string;
  simulate?: boolean;
  logoUrl?: string;
  accent?: string;
  phone?: string;
  email?: string;
}) {
  const [lead, setLead] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<TerritoryPlanId | null>(null);
  const [checkoutId, setCheckoutId] = useState("");
  const [processor, setProcessor] = useState<"trial" | "desk" | "stripe" | "">("");
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState("");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void getLeadPreview({ data: leadSlug })
      .then((next) => {
        if (!cancelled) setLead(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "This page is not available");
      });
    return () => {
      cancelled = true;
    };
  }, [leadSlug]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void confirmTerritorySession({ data: sessionId })
      .then(async (settled) => {
        if (cancelled) return;
        if (settled.shop?.slug) {
          await navigate({
            to: "/$shopSlug",
            params: { shopSlug: settled.shop.slug },
            search: settled.shop.created ? { tour: true } : {},
          });
          return;
        }
        const next = await getLeadPreview({ data: leadSlug });
        if (cancelled) return;
        setLead(next);
        setCheckoutId("");
        setProcessor("");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Payment did not finish");
      });
    return () => {
      cancelled = true;
    };
  }, [leadSlug, sessionId]);

  async function choose(nextPlan: TerritoryPlanId) {
    setBusy(true);
    setError(null);
    setPlanId(nextPlan);
    try {
      await ensureFunnelSession();
      const started = await beginTerritoryCheckout({ data: { leadSlug, planId: nextPlan } });
      if (started.processor === "stripe" && started.url) {
        window.location.assign(started.url);
        return;
      }
      setCheckoutId(started.checkoutId);
      setProcessor(started.processor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout did not start");
      setProcessor("");
    } finally {
      setBusy(false);
    }
  }

  async function finish(paymentRef: string) {
    setBusy(true);
    setError(null);
    try {
      await finishTerritoryCheckout({ data: { checkoutId, paymentRef } });
      setLead(await getLeadPreview({ data: leadSlug }));
      setCheckoutId("");
      setProcessor("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout did not finish");
    } finally {
      setBusy(false);
    }
  }

  const avatar = (
    <AskEricAvatar
      businessName={lead?.businessName || businessName}
      trade={
        lead?.tradeLabel ||
        (lead && isShopNiche(lead.tradeType) ? NICHES[lead.tradeType].label : "") ||
        trade
      }
      city={lead?.city || city}
      startOpen={greet}
    />
  );

  const nicheKey = lead && isShopNiche(lead.tradeType) ? lead.tradeType : "trade";
  const niche = NICHES[nicheKey];
  const hero = lead ? leadHeroFor(lead.tradeType, lead.businessName, lead.tradeLabel) : NICHE_MEDIA.trade;
  const brand = resolveProspectBrand({
    fallbackName: niche.defaultName,
    fallbackAccent: accent || niche.ringColor,
    businessName: lead?.businessName || businessName,
    logoUrl,
    accent,
    contactName: lead?.contactName,
    contactPhone: lead?.contactPhone || phone,
    contactEmail: lead?.contactEmail || email,
  });
  const staff = [0, 1].map((index) => {
    const person = niche.employees[index];
    return {
      key: person?.displayName ?? `staff-${index}`,
      displayName: person?.displayName ?? (index === 0 ? "Alex Morgan" : "Willa Grant"),
      title: person?.title ?? "",
      bio: person?.bio ?? "",
      avatarUrl: SHARED_STAFF[index],
    } satisfies StorefrontStaff;
  }) as [StorefrontStaff, StorefrontStaff];
  const preview = (
    <NicheStorefront
      businessName={brand.businessName}
      kicker={lead ? [lead.city, niche.label, lead.county].filter(Boolean).join(" · ") : "Territory preview"}
      tagline={niche.tagline}
      description={niche.description}
      address={lead ? [lead.city, lead.county].filter(Boolean).join(" · ") : city}
      accent={brand.accent}
      logoUrl={brand.logoUrl}
      contactName={brand.contactName}
      contactPhone={brand.contactPhone}
      contactEmail={brand.contactEmail}
      services={niche.services.map((service, index) => ({
        key: `${service.name}-${index}`,
        name: service.name,
        description: service.description,
        price: formatOffer(service),
        group: service.group,
      }))}
      hours={niche.hours ?? DEFAULT_HOURS}
      staff={staff}
      heroImageUrl={hero.heroImageUrl}
      heroVideoUrl={hero.heroVideos.length > 1 ? hero.heroVideos : hero.heroVideoUrl || null}
      blendPercent={hero.heroBlendPercent}
      introPreset={hero.introPreset}
      introSpeed={hero.introSpeed}
      introIntensity={hero.introIntensity}
      tone={hero.tone ?? null}
      fallbackImageUrl={NICHE_MEDIA.trade.heroImageUrl}
      fallbackVideoUrl={NICHE_MEDIA.trade.heroVideoUrl}
      bookLabel={nicheCopy(niche.niche).bookLabel}
      bookHref="#territory"
      niche={lead?.tradeLabel || niche.niche}
      header={layout === "pitch" ? <Wordmark /> : undefined}
    />
  );

  if (!lead && !error) {
    return (
      <>
        {preview}
        {avatar}
      </>
    );
  }
  if (!lead) {
    return (
      <>
        <p className="px-5 py-16 text-sm text-muted">{error}</p>
        {avatar}
      </>
    );
  }

  const known = isShopNiche(lead.tradeType);
  const tradeName = known ? niche.label : lead.tradeLabel || lead.tradeType.replace(/-/g, " ");
  const services = niche.services.slice(0, 3);
  const copy = nicheCopy(niche.niche);
  const live = lead.mode === "live";

  const offer = (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Territory</p>
      <h2 className="mt-2 font-display text-3xl leading-none sm:text-4xl">
        {live ? "This territory is live." : simulate ? "Claim Your Storefront & Booking Engine" : "Choose how it goes live."}
      </h2>
      {live && lead.activation ? (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{renewalCopy(lead.activation)}</p>
      ) : (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Simulation until checkout. The account switches to live production the moment a plan is confirmed.
        </p>
      )}
      <div className="mt-6 grid gap-3">
        {TERRITORY_PLANS.map((plan) => {
          const on = planId === plan.id || lead.activation?.planId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              disabled={live || busy}
              onClick={() => void choose(plan.id)}
              className="rounded-2xl bg-surface px-4 py-4 text-left disabled:opacity-80"
              style={{
                boxShadow: on ? "inset 0 0 0 2px var(--color-accent)" : "0 0 0 1px rgba(243,241,235,0.08)",
              }}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{plan.name}</span>
                <span className="shrink-0 tabular text-sm text-muted">{priceLabel(plan.id, plan.amountCents)}</span>
              </span>
              <span className="mt-1 block text-sm text-muted">{plan.summary}</span>
            </button>
          );
        })}
      </div>
      {processor === "trial" && checkoutId ? (
        <div className="mt-4 rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <p className="text-sm">$0 today. On day 31 the plan becomes $497 a month.</p>
          <Button type="button" className="mt-4" size="lg" disabled={busy} onClick={() => void finish("")}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Start the 30-day trial
          </Button>
        </div>
      ) : null}
      {processor === "desk" && checkoutId && planId ? (
        <div className="mt-4">
          <GearGuardianCheckout
            amountCents={TERRITORY_PLANS.find((plan) => plan.id === planId)?.amountCents ?? 0}
            shopName={lead.businessName}
            onPaid={finish}
            onCancel={() => {
              setProcessor("");
              setCheckoutId("");
            }}
          />
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );

  const simulation = simulate ? (
    <SnapSimulation
      niche={niche.niche}
      imageUrl={hero.heroImageUrl}
      prices={niche.services.map((service) => service.priceCents)}
    />
  ) : null;

  const claim = simulate ? (
    <div className="mb-8">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-fg px-4 py-3 text-center text-sm font-medium text-bg"
        onClick={() => {
          sessionStorage.setItem(
            LEAD_STORAGE_KEY,
            JSON.stringify({
              leadSlug,
              tradeType: lead.tradeType,
              county: lead.county,
              utmSource: "desk",
            }),
          );
          setShowWelcomeModal(true);
        }}
      >
        Claim Your Storefront & Booking Engine
      </button>
      <p className="mt-2 text-sm text-muted">
        A short welcome plays first. The plans on this page start the subscription.
      </p>
      <OnboardingVideoModal
        isOpen={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          void navigate({ to: "/onboard" });
        }}
        shopName={lead.businessName || businessName}
      />
    </div>
  ) : null;

  const customer =
    offerModel(niche.niche) === "product" ? (
      <div>
        {simulation}
        {claim}
        <ProductShelf items={shelfFor(niche.niche, niche.services)} />
      </div>
    ) : (
      <div className="min-w-0">
        {simulation}
        {claim}
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.menuKicker}</p>
        <ul className="mt-3 divide-y divide-line">
          {services.map((service) => (
            <li key={service.name} className="flex min-w-0 items-baseline justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="break-words font-medium">{service.name}</p>
                <p className="text-sm text-muted">{service.description}</p>
              </div>
              <p className="shrink-0 text-sm text-muted">{formatMoney(service.priceCents)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="glass-btn"
            onClick={() => setHeld(services[0]?.name ?? "the next opening")}
          >
            {copy.bookLabel}
          </Button>
          {held ? <p className="text-sm text-muted">Held for the demo. Nothing was booked.</p> : null}
        </div>
        <div className="mt-8">
          <SnapEstimate
            niche={niche.niche}
            bookLabel={copy.bookLabel}
            leadSlug={leadSlug}
            lines={niche.services.map((service) => ({
              name: service.name,
              description: service.description,
              priceCents: service.priceCents,
            }))}
          />
        </div>
      </div>
    );

  if (layout === "page") {
    return (
      <>
        {preview}
        <section id="territory" className="px-5 py-16 sm:px-10">
          <div className="mx-auto max-w-xl">
            <AuditEcho />
            {customer}
            <div className="mt-10">{offer}</div>
          </div>
        </section>
        {avatar}
      </>
    );
  }

  return (
    <main className="min-h-dvh bg-bg">
      <NeonField active />
      {preview}
      <OutreachWelcomeFilm active />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:px-10">
        <section id="territory">
          <p className="max-w-xl text-base text-muted sm:text-lg">
            {lead.contactName ? `Built for ${lead.contactName}. ` : ""}
            {known ? niche.tagline : `${tradeName} bookings, on one page.`}
            {lead.reviewScore != null ? ` ${lead.reviewScore} from ${lead.reviewCount ?? 0} reviews.` : ""}
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-muted">
            {live ? "Live production" : "Simulation"}
          </p>
          <AuditEcho />
          <div className="mt-8 min-w-0">{customer}</div>
          <p className="mt-8 max-w-md text-sm text-faint">
            This screen is the customer view. Leave the desk on the other device.
          </p>
        </section>
        <section className="lg:pt-16">{offer}</section>
      </div>
      {avatar}
    </main>
  );
}

function priceLabel(id: TerritoryPlanId, amountCents: number) {
  if (id === "trial") return "$0 today";
  if (id === "growth") return `${formatMoney(amountCents)}/mo`;
  return formatMoney(amountCents);
}

function renewalCopy(activation: NonNullable<Preview["activation"]>) {
  if (!activation.renewsAt) return `${activation.planName}. Paid once. This territory stays live.`;
  const when = new Date(activation.renewsAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (activation.amountCents === 0) {
    return `${activation.planName}. $0 today. $497 a month begins ${when}.`;
  }
  return `${activation.planName}. Next charge ${formatMoney(activation.renewalCents ?? 0)} on ${when}.`;
}
