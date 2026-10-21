import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppWindow, ArrowUpRight, CalendarRange, Radio } from "lucide-react";
import { nicheIcon } from "@/components/niche-icon";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { LEAD_STORAGE_KEY, parseFunnelSearch } from "@/lib/axiom/funnel";
import { ensureFunnelSession, masterGate, recordFunnelHit } from "@/lib/axiom/master";
import { listMyShops, listShowcaseShops } from "@/lib/axiom/server";
import { isShopNiche, type Shop, type ShopNiche } from "@/lib/axiom/types";
import { NICHE_MEDIA } from "@/lib/axiom/media";
import { PreviewStudio, FaqAccordion } from "@/components/preview-studio";
import { DEFAULT_HUD, hudVars, paintHero, setHeroLayer, type HeroLayerId, type StorefrontHud } from "@/lib/axiom/hud";
import { HeroTextCanvas } from "@/components/hero-text-canvas";
import { NICHES, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import { TERRITORY_PLANS } from "@/lib/axiom/pricing";
import { LoopVideo } from "@/components/cinematic-hero";
import { CursorSpotlight } from "@/components/cursor-spotlight";
import { DataFlow } from "@/components/data-flow";
import { LandingAtmosphere } from "@/components/landing-atmosphere";
import { HoloCard } from "@/components/holo-card";
import { MagneticCard } from "@/components/magnetic-card";
import { Reveal } from "@/components/reveal";
import { StatusPill, StatusRow, toneAt } from "@/components/status-pill";
import { LandingBookingLoop } from "@/components/landing-loop";
import { PoweredBy, Wordmark } from "@/components/shop-chrome";
import { cn, formatMoney } from "@/lib/utils";
import { LeadTerritory } from "@/components/territory-offer";
import { OutreachWelcomeFilm } from "@/components/welcome-film";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => parseFunnelSearch(search),
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [mine, setMine] = useState<Shop[] | null>(null);
  const [showcases, setShowcases] = useState<Shop[] | null>(null);
  const [masterOpen, setMasterOpen] = useState(false);
  const [leadName, setLeadName] = useState("");

  useEffect(() => {
    void listShowcaseShops().then(setShowcases).catch(() => setShowcases([]));
  }, []);

  useEffect(() => {
    const leadSlug = search.b || search.lead_slug || "";
    const utmSource = search.utm_source || "";
    const county = search.county || "";
    const stopToken = search.t || "";
    if (search.pitch) return;
    if (!leadSlug && !utmSource && !county) return;
    const seen = `axiom.hit:${leadSlug}|${utmSource}|${county}|${stopToken}`;
    if (sessionStorage.getItem(seen) === "1") return;
    sessionStorage.setItem(seen, "1");
    if (leadSlug) {
      sessionStorage.setItem(
        LEAD_STORAGE_KEY,
        JSON.stringify({ leadSlug, utmSource, county }),
      );
    }
    void ensureFunnelSession()
      .then(() => recordFunnelHit({ data: { leadSlug, utmSource, county, stopToken } }))
      .then((hit) => {
        if (!hit.businessName) return;
        setLeadName(hit.businessName);
        sessionStorage.setItem(
          LEAD_STORAGE_KEY,
          JSON.stringify({
            leadSlug: leadSlug || undefined,
            tradeType: hit.tradeType,
            county: hit.county,
            utmSource,
          }),
        );
      })
      .catch(() => undefined);
  }, [search.b, search.county, search.lead_slug, search.pitch, search.t, search.utm_source]);

  useEffect(() => {
    if (!user) {
      setMine(null);
      setMasterOpen(false);
      return;
    }
    void listMyShops()
      .then(setMine)
      .catch(() => setMine([]));
    void masterGate()
      .then((gate) => setMasterOpen(gate.open))
      .catch(() => setMasterOpen(false));
  }, [user]);

  const owned = mine?.filter((s) => s.ownerUserId === user?.id) ?? [];
  const leadSlug = search.b || search.lead_slug || "";

  if (search.pitch && leadSlug) {
    return (
      <LeadTerritory
        leadSlug={leadSlug}
        layout="pitch"
        sessionId={search.session_id}
        greet={search.greet}
        businessName={search.biz}
        trade={search.trade}
        city={search.city}
        simulate={search.utm_source === "desk"}
        logoUrl={search.logo}
        accent={search.accent}
        phone={search.phone}
        email={search.email}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-transparent">
      <LandingBookingLoop />
      <header className="glass-panel sticky top-3 z-30 mx-3 flex items-center justify-between rounded-2xl px-4 py-3 sm:mx-6 sm:px-5">
        <Wordmark />
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-fg/10" />
          ) : (
            <>
              <SignedOut>
                <Link to="/login" className="text-sm text-muted hover:text-fg">
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                {masterOpen ? (
                  <Link to="/master-admin" className="text-sm text-muted hover:text-fg">
                    Master
                  </Link>
                ) : null}
                <UserButton />
              </SignedIn>
            </>
          )}
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-10 sm:pt-16">
        <OutreachWelcomeFilm active={Boolean(leadSlug || search.utm_source)} />
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Vertical SaaS · local services</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,8vw,5.6rem)] leading-[0.95] tracking-[-0.03em]">
          The 24/7 Booking & Outreach Machine.
        </h1>
        {leadName ? (
          <p className="mt-6 text-sm text-copper">This link is saved for {leadName}.</p>
        ) : null}
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Pick a niche. Axiom stands up a booking site, an operator console, and a staff station — then lights the edge of the screen when the first appointment lands.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {owned[0] ? (
            <Link
              to="/$shopSlug"
              params={{ shopSlug: owned[0].slug }}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg"
            >
              Open {owned[0].name}
            </Link>
          ) : (
            <Link
              to="/onboard"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg"
            >
              Create your shop
            </Link>
          )}
          <a
            href="#live"
            className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm text-muted shadow-[0_0_0_1px_rgba(243,241,235,0.1)] hover:text-fg"
          >
            See live shops
          </a>
        </div>

        <div className="mt-14 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
          {PUBLIC_NICHE_ORDER.map((key) => {
            const n = NICHES[key];
            const Icon = nicheIcon(key);
            return (
              <NicheCard
                key={key}
                niche={key}
                icon={<Icon className="size-4" />}
                title={n.label}
                copy={n.blurb}
                videoUrl={NICHE_MEDIA[key].heroVideoUrl}
                imageUrl={NICHE_MEDIA[key].heroImageUrl}
              />
            );
          })}
        </div>
      </section>

      <div className="relative overflow-x-clip">
        <LandingAtmosphere />
        <div className="relative z-10">
          <DataFlow />
          <FeatureBand />
          <IndustryGallery />

          {leadSlug ? (
            <Reveal>
              <LeadTerritory
                leadSlug={leadSlug}
                layout="page"
                sessionId={search.session_id}
                greet={search.greet}
                businessName={search.biz}
                trade={search.trade}
                city={search.city}
                simulate={search.utm_source === "desk"}
                logoUrl={search.logo}
                accent={search.accent}
                phone={search.phone}
                email={search.email}
              />
            </Reveal>
          ) : null}

          <DataFlow />
          <LiveBook showcases={showcases} />
          <LandingStudio />
          <PricingBand />
          <FaqAccordion />
          <LandingFooter />
        </div>
      </div>
    </main>
  );
}

const FEATURES = [
  {
    title: "Booking site",
    copy: "A public page for the trade. Guests pick a time and the book takes the job.",
    icon: CalendarRange,
  },
  {
    title: "Operator console",
    copy: "The desk for the owner: the calendar, the staff, and the shop.",
    icon: AppWindow,
  },
  {
    title: "Staff station",
    copy: "A station for the people on the job, reading the same book.",
    icon: Radio,
  },
] as const;

function FeatureBand() {
  return (
    <section id="features" className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">The machine</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Three stations. One book.</h2>
        </Reveal>
        <CursorSpotlight className="mt-8">
          <Reveal stagger className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="min-w-0">
                  <HoloCard className="glass-panel lift-card h-full rounded-[28px] p-5">
                    <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-accent">
                      <Icon className="size-4" />
                    </span>
                    <p className="mt-5 font-display text-2xl">{feature.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{feature.copy}</p>
                  </HoloCard>
                </div>
              );
            })}
          </Reveal>
        </CursorSpotlight>
      </div>
    </section>
  );
}

function IndustryGallery() {
  const navigate = useNavigate();
  const [view, setView] = useState<"cards" | "list">("cards");
  return (
    <section id="industries" className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Explore All Industries</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">Sample the book for your trade.</h2>
            </div>
            <label className="text-sm text-muted">
              Jump to a trade
              <select
                className="glass-field mt-2 h-12 w-full rounded-xl px-3 sm:w-72"
                defaultValue=""
                onChange={(event) => {
                  const niche = event.target.value;
                  if (!isShopNiche(niche) || niche === "trade") return;
                  void navigate({ to: "/demo/$niche", params: { niche } });
                }}
              >
                <option value="" disabled>
                  Choose an industry
                </option>
                {PUBLIC_NICHE_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {NICHES[key].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <StatusRow />
          <div role="tablist" aria-label="Industry layout" className="glass-panel mt-6 inline-flex rounded-full p-1">
            <button
              type="button"
              role="tab"
              aria-selected={view === "cards"}
              className={cn("pressable h-11 rounded-full px-4 text-sm", view === "cards" ? "bg-fg text-bg" : "text-muted")}
              onClick={() => setView("cards")}
            >
              Cards
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={cn("pressable h-11 rounded-full px-4 text-sm", view === "list" ? "bg-fg text-bg" : "text-muted")}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
        </Reveal>
        <CursorSpotlight className="mt-8">
          <div key={view}>
            {view === "cards" ? (
              <Reveal stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PUBLIC_NICHE_ORDER.map((key, index) => {
                  const n = NICHES[key];
                  const Icon = nicheIcon(key);
                  return (
                    <div key={key} className="min-w-0">
                      <HoloCard className="glass-panel lift-card h-full rounded-2xl">
                        <Link
                          to="/demo/$niche"
                          params={{ niche: key }}
                          className="flex min-h-24 items-start gap-3 p-4 hover:text-fg"
                        >
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{n.label}</span>
                            <span className="mt-1 block text-sm text-muted">{n.blurb}</span>
                            <StatusPill tone={toneAt(index)} className="mt-3" />
                          </span>
                        </Link>
                      </HoloCard>
                    </div>
                  );
                })}
              </Reveal>
            ) : (
              <Reveal stagger className="grid gap-2">
                {PUBLIC_NICHE_ORDER.map((key) => {
                  const n = NICHES[key];
                  const Icon = nicheIcon(key);
                  return (
                    <div key={key} className="min-w-0">
                      <MagneticCard>
                        <Link
                          to="/demo/$niche"
                          params={{ niche: key }}
                          className="glass-panel lift-card flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 hover:text-fg"
                        >
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{n.label}</span>
                            <span className="mt-1 block text-sm text-muted">{n.blurb}</span>
                          </span>
                        </Link>
                      </MagneticCard>
                    </div>
                  );
                })}
              </Reveal>
            )}
          </div>
        </CursorSpotlight>
      </div>
    </section>
  );
}

function LiveBook({ showcases }: { showcases: Shop[] | null }) {
  return (
    <section id="live" className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Live tenants · Automated by Axiom</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Already on the books.</h2>
          <StatusRow />
        </Reveal>
        {showcases === null ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3" aria-hidden>
            {[0, 1, 2].map((slot) => (
              <div key={slot} className="landing-skeleton glass-panel overflow-hidden rounded-[28px]">
                <div className="aspect-[16/10] bg-surface-2" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-28 rounded-full bg-fg/10" />
                  <div className="h-7 w-40 rounded-full bg-fg/10" />
                  <div className="h-3 w-full rounded-full bg-fg/10" />
                </div>
              </div>
            ))}
          </div>
        ) : showcases.length === 0 ? (
          <div className="glass-panel mt-8 rounded-[28px] px-5 py-8 text-sm text-muted">
            No live shops on the book yet.
          </div>
        ) : (
          <CursorSpotlight className="mt-8">
            <Reveal stagger className="grid gap-4 md:grid-cols-3">
              {showcases.map((s, index) => (
                <div key={s.id} className="min-w-0">
                  <HoloCard className="glass-panel lift-card h-full overflow-hidden rounded-[28px]">
                    <Link to="/$shopSlug" params={{ shopSlug: s.slug }} className="group block h-full">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={s.heroImageUrl}
                          alt=""
                          className="media-zoom h-full w-full object-cover outline-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
                      </div>
                      <div className="flex items-end justify-between gap-3 p-5">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Automated by Axiom</p>
                          <p className="mt-1 font-display text-2xl">{s.name}</p>
                          <p className="mt-1 text-sm text-muted">{s.tagline}</p>
                          <StatusPill tone={toneAt(index)} className="mt-3" />
                        </div>
                        <ArrowUpRight className="size-5 shrink-0 text-muted transition-colors duration-200 group-hover:text-fg" />
                      </div>
                    </Link>
                  </HoloCard>
                </div>
              ))}
            </Reveal>
          </CursorSpotlight>
        )}
      </div>
    </section>
  );
}

function LandingStudio() {
  const [hud, setHud] = useState<StorefrontHud>(DEFAULT_HUD);
  const [activeLayer, setActiveLayer] = useState<HeroLayerId>("headline");
  const media = NICHE_MEDIA.practice;
  const painted = paintHero(media.heroImageUrl, media.heroVideoUrl || null, hud);
  return (
    <section id="studio">
      <div
        className="storefront-stage"
        data-wash={hud.wash}
        data-rim={hud.rim ? "on" : "off"}
        data-scan={hud.scan ? "on" : "off"}
        style={hudVars(hud, "")}
      >
        <div className="relative mx-auto min-h-[28rem] max-w-5xl overflow-hidden">
          <div className="hero-blend absolute inset-0">
            {painted.imageUrl ? (
              <>
                <img src={painted.imageUrl} alt="" className="hero-plate absolute inset-0 h-full w-full" />
                <img src={painted.imageUrl} alt="" className="hero-frame absolute inset-0 h-full w-full" />
              </>
            ) : null}
            {painted.videoUrl ? (
              <video className="hero-frame absolute inset-0 h-full w-full object-cover" src={painted.videoUrl} autoPlay loop muted playsInline />
            ) : null}
            <div className="hero-scan pointer-events-none absolute inset-0" />
            <div className="hero-dissolve pointer-events-none absolute inset-0" />
          </div>
          <HeroTextCanvas
            layers={hud.layers}
            fallbacks={{
              headline: "The book, open.",
              subheadline: "Feather, glow, and the line.",
              cta_button: "Book a time",
            }}
            editable
            activeLayer={activeLayer}
            onActiveLayer={setActiveLayer}
            onLayerChange={(id, layer) => setHud((current) => setHeroLayer(current, id, layer))}
          />
        </div>
      </div>
      <PreviewStudio
        hud={hud}
        onChange={setHud}
        heroChoices={[
          { id: "film", label: "Niche still" },
          { id: "url", label: "Custom URL" },
        ]}
        activeLayer={activeLayer}
        onActiveLayer={setActiveLayer}
      />
    </section>
  );
}

function PricingBand() {
  const [months, setMonths] = useState(3);
  const [planId, setPlanId] = useState<(typeof TERRITORY_PLANS)[number]["id"]>("growth");
  const plan = TERRITORY_PLANS.find((item) => item.id === planId) ?? TERRITORY_PLANS[1];
  const total =
    plan.cadence === "once" ? plan.amountCents : plan.cadence === "trial" ? 0 : plan.amountCents * months;
  const note =
    plan.cadence === "trial"
      ? "Due today is $0. The published renewal is $497 a month starting day 31."
      : plan.cadence === "once"
        ? "One published charge. The month slider does not change it."
        : `${months} × the published $497 monthly price. This is not a discount.`;
  return (
    <section id="pricing" className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Territory</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">The book, priced.</h2>
        </Reveal>
        <div className="hud-card mt-8 grid gap-4 rounded-[28px] p-5 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-sm text-muted">Calculator</p>
            <p className="mt-2 font-display text-4xl">{formatMoney(total)}</p>
            <p className="mt-2 min-h-12 text-sm text-muted">{note}</p>
            <label className="mt-4 block text-sm text-muted">
              Months shown {months}
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
                className="mt-2 w-full accent-accent"
              />
            </label>
          </div>
          <div className="grid gap-2 lg:col-span-7">
            {TERRITORY_PLANS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === planId}
                onClick={() => setPlanId(item.id)}
                className="hud-card rounded-2xl px-4 py-3 text-left"
              >
                <span className="block text-sm font-medium">{item.name}</span>
                <span className="mt-1 block text-sm text-muted">{item.summary}</span>
              </button>
            ))}
          </div>
        </div>
        <CursorSpotlight className="mt-8">
          <Reveal stagger className="grid gap-4 md:grid-cols-3">
            {TERRITORY_PLANS.map((planCard) => (
              <div key={planCard.id} className="min-w-0">
                <HoloCard
                  className={cn(
                    "hud-card h-full rounded-[28px]",
                    planCard.id === "growth" && "plan-featured",
                  )}
                >
                  <Link to="/onboard" className="flex h-full flex-col p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
                      {planCard.cadence === "once" ? "Once" : planCard.cadence === "trial" ? "Trial" : "Monthly"}
                    </p>
                    <p className="mt-3 font-display text-2xl">{planCard.name}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{planCard.summary}</p>
                    <span className="mt-6 inline-flex h-12 items-center text-sm text-fg">Create your shop</span>
                  </Link>
                </HoloCard>
              </div>
            ))}
          </Reveal>
        </CursorSpotlight>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer id="footer" className="px-5 pb-8 pt-4 sm:px-10">
      <Reveal>
        <div className="glass-panel mx-auto flex max-w-6xl flex-col gap-6 rounded-[28px] px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="#features" className="inline-flex h-11 items-center text-muted transition-colors duration-200 hover:text-fg">
              Machine
            </a>
            <a href="#industries" className="inline-flex h-11 items-center text-muted transition-colors duration-200 hover:text-fg">
              Industries
            </a>
            <a href="#live" className="inline-flex h-11 items-center text-muted transition-colors duration-200 hover:text-fg">
              Live shops
            </a>
            <a href="#pricing" className="inline-flex h-11 items-center text-muted transition-colors duration-200 hover:text-fg">
              Pricing
            </a>
            <Link to="/onboard" className="inline-flex h-11 items-center text-muted transition-colors duration-200 hover:text-fg">
              Create a shop
            </Link>
            <Link to="/login" className="inline-flex h-11 items-center text-muted transition-colors duration-200 hover:text-fg">
              Sign in
            </Link>
          </nav>
        </div>
      </Reveal>
      <PoweredBy />
    </footer>
  );
}

function NicheCard({
  niche,
  icon,
  title,
  copy,
  videoUrl,
  imageUrl,
}: {
  niche: ShopNiche;
  icon: ReactNode;
  title: string;
  copy: string;
  videoUrl: string;
  imageUrl: string;
}) {
  return (
    <MagneticCard className="w-64 shrink-0 snap-start">
    <Link
      to="/demo/$niche"
      params={{ niche }}
      className="glass-panel lift-card block overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {videoUrl ? (
          <LoopVideo src={videoUrl} className="absolute inset-0" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="" className="media-drift absolute inset-0 h-full w-full object-cover outline-none" />
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-surface-2 text-fg">
          {icon}
        </div>
        <p className="mt-4 text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted">{copy}</p>
      </div>
    </Link>
    </MagneticCard>
  );
}
