import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { nicheIcon } from "@/components/niche-icon";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { LEAD_STORAGE_KEY, parseFunnelSearch } from "@/lib/axiom/funnel";
import { ensureFunnelSession, masterGate, recordFunnelHit } from "@/lib/axiom/master";
import { listMyShops, listShowcaseShops } from "@/lib/axiom/server";
import { isShopNiche, type Shop, type ShopNiche } from "@/lib/axiom/types";
import { NICHE_MEDIA } from "@/lib/axiom/media";
import { NICHES, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import { LoopVideo } from "@/components/cinematic-hero";
import { Reveal } from "@/components/reveal";
import { LandingBookingLoop } from "@/components/landing-loop";
import { Wordmark } from "@/components/shop-chrome";
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
  const [showcases, setShowcases] = useState<Shop[]>([]);
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

      <Reveal>
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
      </Reveal>

      <Reveal>
        <IndustryGallery />
      </Reveal>

      {leadSlug ? (
        <LeadTerritory
          leadSlug={leadSlug}
          layout="page"
          sessionId={search.session_id}
          greet={search.greet}
          businessName={search.biz}
          trade={search.trade}
          city={search.city}
          simulate={search.utm_source === "desk"}
        />
      ) : null}

      <Reveal>
      <section id="live" className="border-t border-line px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Live tenants · Automated by Axiom</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Already on the books.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {showcases.map((s) => (
              <Link
                key={s.id}
                to="/$shopSlug"
                params={{ shopSlug: s.slug }}
                className="glass-panel lift-card group overflow-hidden rounded-[28px]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={s.heroImageUrl}
                    alt=""
                    className="h-full w-full object-cover outline-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
                </div>
                <div className="flex items-end justify-between gap-3 p-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Automated by Axiom</p>
                    <p className="mt-1 font-display text-2xl">{s.name}</p>
                    <p className="mt-1 text-sm text-muted">{s.tagline}</p>
                  </div>
                  <ArrowUpRight className="size-5 shrink-0 text-muted" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </Reveal>
    </main>
  );
}

function IndustryGallery() {
  const navigate = useNavigate();
  return (
    <section id="industries" className="border-t border-line px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Explore All Industries</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Sample the book for your trade.</h2>
          </div>
          <label className="text-sm text-muted">
            Jump to a trade
            <select
              className="mt-2 h-12 w-full rounded-xl bg-surface px-3 text-fg sm:w-72"
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
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_NICHE_ORDER.map((key) => {
            const n = NICHES[key];
            const Icon = nicheIcon(key);
            return (
              <Link
                key={key}
                to="/demo/$niche"
                params={{ niche: key }}
                className="glass-panel lift-card flex min-h-24 items-start gap-3 rounded-2xl p-4 hover:text-fg"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{n.label}</span>
                  <span className="mt-1 block text-sm text-muted">{n.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
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
    <Link
      to="/demo/$niche"
      params={{ niche }}
      className="glass-panel lift-card block w-64 shrink-0 snap-start overflow-hidden rounded-2xl"
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
  );
}
