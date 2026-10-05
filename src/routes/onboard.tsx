import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { AppWindow, Brush, Dumbbell, HardHat, Mic, Store, Truck, type LucideIcon } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createShopFromNiche, listMyShops } from "@/lib/axiom/server";
import { NICHE_MEDIA } from "@/lib/axiom/media";
import { NICHE_ORDER, NICHES } from "@/lib/axiom/niches";
import { LoopVideo } from "@/components/cinematic-hero";
import type { Shop, ShopNiche } from "@/lib/axiom/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Wordmark } from "@/components/shop-chrome";

export const Route = createFileRoute("/onboard")({ component: Onboard });

function nicheIcon(key: ShopNiche): LucideIcon {
  if (key === "fitness") return Dumbbell;
  if (key === "music") return Mic;
  if (key === "contractor") return HardHat;
  if (key === "tattoo") return Brush;
  if (key === "field") return Truck;
  if (key === "studio") return AppWindow;
  return Store;
}

function Onboard() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<Shop[] | null>(null);
  const [niche, setNiche] = useState<ShopNiche | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  if (!user) return <RedirectToSignIn to="/login" />;

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
        data: { niche, name: name.trim() || NICHES[niche].defaultName },
      });
      await navigate({
        to: "/$shopSlug",
        params: { shopSlug: result.slug },
        search: { tour: true },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create shop");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-bg px-5 py-6 sm:px-10">
      <Wordmark />
      <div className="mx-auto mt-12 max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Guided loop</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">What kind of shop is this?</h1>
        <p className="mt-3 max-w-lg text-muted">
          We generate a live booking site with dummy staff, services, and a cinematic hero. You can rename it in the next breath.
        </p>

        <div className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
          {NICHE_ORDER.map((key) => {
            const n = NICHES[key];
            const selected = niche === key;
            const Icon = nicheIcon(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setNiche(key);
                  if (!name) setName(n.defaultName);
                }}
                className="w-72 shrink-0 snap-start overflow-hidden rounded-[24px] bg-surface text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)] transition-[box-shadow] duration-150"
                style={
                  selected
                    ? { boxShadow: `0 0 0 1px ${n.ringColor}` }
                    : undefined
                }
              >
                <span className="relative -mx-0 block aspect-[16/10] bg-surface-2">
                  <LoopVideo
                    src={NICHE_MEDIA[key].heroVideoUrl}
                    className="pointer-events-none absolute inset-0"
                  />
                </span>
                <span className="block p-5">
                  <span className="grid size-9 place-items-center rounded-lg bg-surface-2">
                    <Icon className="size-4" />
                  </span>
                  <span className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-muted">{n.kicker}</span>
                  <span className="mt-1 block font-display text-2xl">{n.label}</span>
                  <span className="mt-2 block text-sm text-muted">{n.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        {niche ? (
          <div className="mt-8 max-w-md">
            <Label htmlFor="shop-name">Shop name</Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={NICHES[niche].defaultName}
            />
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={busy}
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
