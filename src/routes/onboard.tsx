import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isCatalogNiche, resolveCatalogNiche, tradeLoopUrl } from "@/config/catalog";
import { MASTER_CATEGORY_CARDS } from "@/config/MasterCategoryDefaults";
import { CatalogCardVisual } from "@/components/catalog-card-visual";
import { HeroLoopVideo } from "@/components/loop-video";
import { LEAD_STORAGE_KEY } from "@/lib/axiom/funnel";
import { createShopFromNiche, listMyShops } from "@/lib/axiom/server";
import { NICHES } from "@/lib/axiom/niches";
import { type Shop, type ShopNiche } from "@/lib/axiom/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Wordmark } from "@/components/shop-chrome";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboard")({
  validateSearch: (search: Record<string, unknown>): { niche?: ShopNiche } => {
    const niche = typeof search.niche === "string" ? search.niche : "";
    if (!isCatalogNiche(niche)) return {};
    return { niche };
  },
  component: Onboard,
});

function Onboard() {
  const requested = Route.useSearch().niche ?? null;
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<Shop[] | null>(null);
  const [niche, setNiche] = useState<ShopNiche | null>(requested);
  const [solo, setSolo] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [leadSlug, setLeadSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LEAD_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { leadSlug?: string; tradeType?: string };
      if (typeof saved.leadSlug === "string") setLeadSlug(saved.leadSlug);
      if (requested) return;
      if (typeof saved.tradeType === "string" && saved.tradeType) {
        setNiche(resolveCatalogNiche(saved.tradeType));
      }
    } catch {
      /* a bad saved lead should not block onboarding */
    }
  }, [requested]);

  useEffect(() => {
    if (!user) return;
    void listMyShops()
      .then(setExisting)
      .catch(() => setExisting([]));
  }, [user]);

  if (isPending || (user && existing === null)) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/8" />
      </main>
    );
  }
  if (!user) {
    return <RedirectToSignIn to="/login" next={requested ? `/onboard?niche=${requested}` : "/onboard"} />;
  }

  const owned = existing?.find((s) => s.ownerUserId === user.id);
  if (owned) {
    return (
      <Navigate
        to="/$shopSlug/admin"
        params={{ shopSlug: owned.slug }}
      />
    );
  }

  async function generate() {
    if (!niche) return;
    setBusy(true);
    setError(null);
    try {
      const result = await createShopFromNiche({
        data: {
          niche,
          name: name.trim() || NICHES[niche].defaultName,
          solo: solo === true,
          ownerName: user?.displayName ?? "",
          leadSlug,
          heroFilm: tradeLoopUrl(niche),
        },
      });
      await navigate({
        to: "/welcome",
        search: { shop: result.slug },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create shop");
      setBusy(false);
    }
  }

  const selected = MASTER_CATEGORY_CARDS.find((row) => row.seedNiche === niche) ?? null;

  return (
    <main className="min-h-dvh bg-bg px-5 py-6 sm:px-10">
      <Wordmark />
      <div className="mx-auto mt-12 max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Guided loop</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">Who is on the book?</h1>
        <p className="mt-3 max-w-lg text-muted">
          Pick solo or a team, then choose one of the five shop categories. Each one opens with its own loop.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSolo(true)}
            className="rounded-2xl bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
            style={solo === true ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
          >
            <p className="font-display text-2xl">Just me</p>
            <p className="mt-2 text-sm text-muted">Clients book you. There is no staff list to hand out.</p>
          </button>
          <button
            type="button"
            onClick={() => setSolo(false)}
            className="rounded-2xl bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
            style={solo === false ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
          >
            <p className="font-display text-2xl">A team</p>
            <p className="mt-2 text-sm text-muted">Each person gets a station and sees their own book.</p>
          </button>
        </div>

        <h2 className="mt-12 font-display text-3xl">What do you sell?</h2>
        <p className="mt-2 text-sm text-muted">Five master categories — the rest of the catalog lives in Admin.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {MASTER_CATEGORY_CARDS.map((entry) => {
            const active = niche === entry.seedNiche;
            const shopName = NICHES[entry.seedNiche].defaultName;
            return (
              <button
                key={entry.id}
                id={`niche-${entry.seedNiche}`}
                type="button"
                onClick={() => {
                  setNiche(entry.seedNiche);
                  setName((current) => {
                    if (!current || (niche && current === NICHES[niche].defaultName)) return shopName;
                    return current;
                  });
                }}
                className={cn(
                  "overflow-hidden rounded-[24px] bg-surface text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
                  active && "shadow-[0_0_0_1px_var(--color-fg)]",
                )}
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-bg">
                  <CatalogCardVisual
                    mode="video"
                    videoSrc={entry.src}
                    poster={entry.poster}
                    className="pointer-events-none absolute inset-0"
                  />
                </span>
                <span className="block p-4">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">{NICHES[entry.seedNiche].kicker}</span>
                  <span className="mt-1 block font-display text-2xl">{entry.title}</span>
                  <span className="mt-2 block text-sm text-muted">{entry.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        {niche ? (
          <div className="mt-8 max-w-md pb-24">
            <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-[24px] bg-bg">
              <HeroLoopVideo src={selected?.src || tradeLoopUrl(niche)} className="pointer-events-none absolute inset-0 h-full w-full object-cover" muted loop playsInline autoPlay />
            </div>
            <Label htmlFor="shop-name">Shop name</Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={NICHES[niche].defaultName}
            />
            <p className="mt-3 text-sm text-muted">{NICHES[niche].tagline}</p>
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={busy || solo === null}
              onClick={() => void generate()}
            >
              {busy ? "Generating site…" : "Generate live site"}
            </Button>
          </div>
        ) : null}

        <p className="mt-10 text-sm text-faint">
          Want to browse first?{" "}
          <Link to="/" className="text-muted underline-offset-4 hover:underline">
            See live shops
          </Link>
        </p>
      </div>
    </main>
  );
}
