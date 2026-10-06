import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { nicheIcon } from "@/components/niche-icon";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { LEAD_STORAGE_KEY, parseFunnelSearch } from "@/lib/axiom/funnel";
import { ensureFunnelSession, masterGate, recordFunnelHit } from "@/lib/axiom/master";
import { listMyShops, listShowcaseShops } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { NICHE_MEDIA } from "@/lib/axiom/media";
import { NICHE_ORDER, NICHES } from "@/lib/axiom/niches";
import { LoopVideo } from "@/components/cinematic-hero";
import { Wordmark } from "@/components/shop-chrome";
import { LeadTerritory } from "@/components/territory-offer";

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
    return <LeadTerritory leadSlug={leadSlug} layout="pitch" sessionId={search.session_id} />;
  }

  return (
    <main className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between px-5 py-5 sm:px-10">
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
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Vertical SaaS · local services</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,8vw,5.6rem)] leading-[0.95] tracking-[-0.03em]">
          Your shop, live before the second cup of coffee.
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
          {NICHE_ORDER.map((key) => {
            const n = NICHES[key];
            const Icon = nicheIcon(key);
            return (
              <NicheCard
                key={key}
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

      {leadSlug ? <LeadTerritory leadSlug={leadSlug} layout="page" sessionId={search.session_id} /> : null}

      <section id="live" className="border-t border-line px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Live tenants · New Era Apps</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Already on the books.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {showcases.map((s) => (
              <Link
                key={s.id}
                to="/$shopSlug"
                params={{ shopSlug: s.slug }}
                className="group overflow-hidden rounded-[28px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
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
                    <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Powered by Axiom</p>
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
    </main>
  );
}

function NicheCard({
  icon,
  title,
  copy,
  videoUrl,
  imageUrl,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
  videoUrl: string;
  imageUrl: string;
}) {
  return (
    <div className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
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
    </div>
  );
}
