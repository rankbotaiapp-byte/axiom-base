import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { AxiomCatalogHub } from "@/components/AxiomCatalogHub";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CATALOG, catalogFilmUrl, isCatalogNiche, resolveCatalogNiche } from "@/config/catalog";
import { CatalogCardMedia } from "@/components/catalog-card-media";
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
        to="/$shopSlug"
        params={{ shopSlug: owned.slug }}
        search={{ tour: owned.onboardingStep !== "complete" }}
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
          heroFilm: catalogFilmUrl(niche),
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

  const selected = niche ? CATALOG.find((row) => row.id === niche) : null;

  return (
    <main className="min-h-dvh bg-bg px-5 py-6 sm:px-10">
      <Wordmark />
      <div className="mx-auto mt-12 max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Guided loop</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">Who is on the book?</h1>
        <p className="mt-3 max-w-lg text-muted">
          Pick solo or a team, then choose one of the twenty-one verified trades. Each one opens with its hero loop.
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
        <p className="mt-2 text-sm text-muted">Verified catalog only — twenty-one hero loops.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {CATALOG.map((entry) => {
            const active = niche === entry.id;
            return (
              <button
                key={entry.id}
                id={`niche-${entry.id}`}
                type="button"
                onClick={() => {
                  setNiche(entry.id);
                  setName((current) => {
                    if (!current || (niche && current === NICHES[niche].defaultName)) return entry.defaultName;
                    return current;
                  });
                }}
                className={cn(
                  "overflow-hidden rounded-[24px] bg-surface text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
                  active && "shadow-[0_0_0_1px_var(--color-fg)]",
                )}
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-bg">
                  <CatalogCardMedia niche={entry.id} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
                </span>
                <span className="block p-4">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">{entry.kicker}</span>
                  <span className="mt-1 block font-display text-2xl">{entry.label}</span>
                  <span className="mt-2 block text-sm text-muted">{entry.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        {niche && selected ? (
          <div className="mt-8 max-w-md">
            <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-[24px] bg-bg">
              <CatalogCardMedia niche={niche} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            </div>
            <Label htmlFor="shop-name">Shop name</Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selected.defaultName}
            />
            <p className="mt-3 text-sm text-muted">{selected.tagline}</p>
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
        ) : (
          <div className="mt-8">
            <AxiomCatalogHub view="strip" linkTo="onboard" />
          </div>
        )}

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
