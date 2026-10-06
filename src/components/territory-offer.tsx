import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { CinematicHero } from "@/components/cinematic-hero";
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
import { leadHeroFor } from "@/lib/axiom/media";
import { nicheCopy, NICHES } from "@/lib/axiom/niches";
import { TERRITORY_PLANS, type TerritoryPlanId } from "@/lib/axiom/pricing";
import { isShopNiche } from "@/lib/axiom/types";
import { formatMoney } from "@/lib/utils";

type Preview = Awaited<ReturnType<typeof getLeadPreview>>;

export function LeadTerritory({
  leadSlug,
  layout,
  sessionId,
}: {
  leadSlug: string;
  layout: "pitch" | "page";
  sessionId?: string;
}) {
  const [lead, setLead] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<TerritoryPlanId | null>(null);
  const [checkoutId, setCheckoutId] = useState("");
  const [processor, setProcessor] = useState<"trial" | "desk" | "stripe" | "">("");
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState("");

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
      .then(() => getLeadPreview({ data: leadSlug }))
      .then((next) => {
        if (!cancelled) {
          setLead(next);
          setCheckoutId("");
          setProcessor("");
        }
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

  if (!lead && !error) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-40 animate-pulse rounded-full bg-fg/10" />
      </div>
    );
  }
  if (!lead) {
    return <p className="px-5 py-16 text-sm text-muted">{error}</p>;
  }

  const hero = leadHeroFor(lead.tradeType, lead.businessName, lead.tradeLabel);
  const known = isShopNiche(lead.tradeType);
  const niche = isShopNiche(lead.tradeType) ? NICHES[lead.tradeType] : NICHES.trade;
  const tradeName = known ? niche.label : lead.tradeLabel || lead.tradeType.replace(/-/g, " ");
  const services = niche.services.slice(0, 3);
  const copy = nicheCopy(niche.niche);
  const live = lead.mode === "live";

  const offer = (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Territory</p>
      <h2 className="mt-2 font-display text-3xl leading-none sm:text-4xl">
        {live ? "This territory is live." : "Choose how it goes live."}
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

  const film = (
    <CinematicHero
      imageUrl={hero.heroImageUrl}
      videoUrl={hero.heroVideoUrl || null}
      blendPercent={hero.heroBlendPercent}
      introPreset={hero.introPreset}
      introSpeed={hero.introSpeed}
      introIntensity={hero.introIntensity}
      tone={hero.tone ?? null}
    >
      {layout === "pitch" ? (
        <header className="flex items-center justify-between px-5 py-5 sm:px-10">
          <Wordmark />
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Customer view</p>
        </header>
      ) : null}
      <div className="mt-auto px-5 pb-28 pt-24 sm:px-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          {[lead.city, tradeName, lead.county].filter(Boolean).join(" · ")}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.92]">{lead.businessName}</h1>
      </div>
    </CinematicHero>
  );

  if (layout === "page") {
    return (
      <>
        {film}
        <section id="territory" className="px-5 py-16 sm:px-10">
          <div className="mx-auto max-w-xl">{offer}</div>
        </section>
      </>
    );
  }

  return (
    <main className="min-h-dvh bg-bg">
      {film}
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:px-10">
        <section>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            {lead.contactName ? `Built for ${lead.contactName}. ` : ""}
            {known ? niche.tagline : `${tradeName} bookings, on one page.`}
            {lead.reviewScore != null ? ` ${lead.reviewScore} from ${lead.reviewCount ?? 0} reviews.` : ""}
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-muted">
            {live ? "Live production" : "Simulation"}
          </p>
          <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.menuKicker}</p>
              <ul className="mt-3 divide-y divide-line">
                {services.map((service) => (
                  <li key={service.name} className="flex items-baseline justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted">{service.description}</p>
                    </div>
                    <p className="shrink-0 text-sm text-muted">{formatMoney(service.priceCents)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setHeld(services[0]?.name ?? "the next opening")}
                >
                  {copy.bookLabel} · Tomorrow 10:00
                </Button>
                {held ? <p className="text-sm text-muted">Held for the demo. Nothing was booked.</p> : null}
              </div>
            </div>
          <p className="mt-8 max-w-md text-sm text-faint">
            This screen is the customer view. Leave the desk on the other device.
          </p>
        </section>
        <section className="lg:pt-16">{offer}</section>
      </div>
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
