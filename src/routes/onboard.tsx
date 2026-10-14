import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { nicheIcon } from "@/components/niche-icon";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LEAD_STORAGE_KEY } from "@/lib/axiom/funnel";
import { createShopFromNiche, listMyShops } from "@/lib/axiom/server";
import { heroForCustomNiche, NICHE_MEDIA } from "@/lib/axiom/media";
import { NICHES, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import { presetForShopNiche, presetsForShop } from "@/config/nichePresets";
import { LoopVideo } from "@/components/cinematic-hero";
import { isShopNiche, type Shop, type ShopNiche } from "@/lib/axiom/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Wordmark } from "@/components/shop-chrome";
import { PenLine } from "lucide-react";

const CUSTOM_NICHE = "custom";
type NichePick = ShopNiche | typeof CUSTOM_NICHE;

export const Route = createFileRoute("/onboard")({
  validateSearch: (search: Record<string, unknown>): { niche?: ShopNiche } => {
    const niche = typeof search.niche === "string" ? search.niche : "";
    if (!isShopNiche(niche) || niche === "trade") return {};
    return { niche };
  },
  component: Onboard,
});

function Onboard() {
  const requested = Route.useSearch().niche ?? null;
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<Shop[] | null>(null);
  const [niche, setNiche] = useState<NichePick | null>(requested);
  const [customTitle, setCustomTitle] = useState("");
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
        if (isShopNiche(saved.tradeType)) setNiche(saved.tradeType);
        else {
          const title = saved.tradeType.replace(/-/g, " ").replace(/\s+/g, " ").trim();
          setNiche(CUSTOM_NICHE);
          if (title.length >= 2) setCustomTitle(title.slice(0, 80));
        }
      }
    } catch {
      /* a bad saved lead should not block onboarding */
    }
  }, [requested]);

  useEffect(() => {
    if (!requested) return;
    document.getElementById(`niche-${requested}`)?.scrollIntoView({ inline: "center", block: "nearest" });
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
    const customNiche = niche === CUSTOM_NICHE ? customTitle.trim().replace(/\s+/g, " ") : "";
    if (niche === CUSTOM_NICHE && customNiche.length < 2) return;
    const picked: ShopNiche = niche === CUSTOM_NICHE ? "trade" : niche;
    setBusy(true);
    setError(null);
    try {
      const result = await createShopFromNiche({
        data: {
          niche: picked,
          name: name.trim() || customNiche || NICHES[picked].defaultName,
          solo: solo === true,
          ownerName: user?.displayName ?? "",
          leadSlug,
          customNiche,
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

  const customPreview = heroForCustomNiche(niche === CUSTOM_NICHE ? customTitle : "");

  return (
    <main className="min-h-dvh bg-bg px-5 py-6 sm:px-10">
      <Wordmark />
      <div className="mx-auto mt-12 max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Guided loop</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">Who is on the book?</h1>
        <p className="mt-3 max-w-lg text-muted">
          Some trades are one person. Some have a station for each person. Pick that first, then the trade. You can rename every line after.
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

        <div className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
          {PUBLIC_NICHE_ORDER.map((key) => {
            const n = NICHES[key];
            const selected = niche === key;
            const Icon = nicheIcon(key);
            return (
              <button
                key={key}
                id={`niche-${key}`}
                type="button"
                onClick={() => {
                  setNiche(key);
                  const starter = presetsForShop(key)[0]?.title ?? n.defaultName;
                  setName((current) => {
                    if (!current) return starter;
                    if (!niche || niche === CUSTOM_NICHE) return current;
                    const previous = presetsForShop(niche)[0]?.title ?? NICHES[niche].defaultName;
                    return current === previous || current === NICHES[niche].defaultName ? starter : current;
                  });
                }}
                className="w-72 shrink-0 snap-start overflow-hidden rounded-[24px] bg-surface text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)] transition-[box-shadow] duration-150"
                style={
                  selected
                    ? { boxShadow: `0 0 0 1px ${n.ringColor}` }
                    : undefined
                }
              >
                <span className="relative -mx-0 block aspect-[16/10] overflow-hidden bg-surface-2">
                  {NICHE_MEDIA[key].heroVideoUrl ? (
                    <LoopVideo
                      src={NICHE_MEDIA[key].heroVideoUrl}
                      className="pointer-events-none absolute inset-0"
                    />
                  ) : NICHE_MEDIA[key].heroImageUrl ? (
                    <img
                      src={NICHE_MEDIA[key].heroImageUrl}
                      alt=""
                      className="media-drift pointer-events-none absolute inset-0 h-full w-full object-cover outline-none"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-muted">
                      <Icon className="size-8" />
                    </span>
                  )}
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

        <button
          type="button"
          onClick={() => {
            setNiche(CUSTOM_NICHE);
            setName((current) => {
              if (!niche || niche === CUSTOM_NICHE) return current;
              const previous = presetsForShop(niche)[0]?.title ?? NICHES[niche].defaultName;
              return current === previous || current === NICHES[niche].defaultName ? "" : current;
            });
          }}
          className="mt-3 flex w-full items-center gap-4 rounded-[24px] bg-surface p-4 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)] transition-[box-shadow] duration-150"
          style={niche === CUSTOM_NICHE ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
        >
          <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-2 text-muted">
            {customPreview.heroVideoUrl ? (
              <LoopVideo src={customPreview.heroVideoUrl} className="pointer-events-none absolute inset-0" />
            ) : (
              <PenLine className="size-5" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">Not on the list</span>
            <span className="mt-1 block font-display text-2xl">Custom niche</span>
            <span className="mt-1 block text-sm text-muted">
              Type the trade. A stock film plays until you upload one for this shop.
            </span>
          </span>
        </button>

        {niche ? (
          <div className="mt-8 max-w-md">
            {niche === CUSTOM_NICHE ? (
              <>
                <Label htmlFor="custom-niche">Your niche</Label>
                <Input
                  id="custom-niche"
                  value={customTitle}
                  maxLength={80}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Watchmaker"
                />
                <p className="mt-3 text-sm text-muted">
                  {customPreview.heroVideoUrl === NICHE_MEDIA.trade.heroVideoUrl
                    ? "A stock film plays until you upload one. An upload stays on this shop."
                    : "A matching film plays for this trade. An upload you add later stays on this shop."}
                </p>
              </>
            ) : null}
            <Label htmlFor="shop-name" className={niche === CUSTOM_NICHE ? "mt-6" : undefined}>
              Shop name
            </Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                niche === CUSTOM_NICHE
                  ? customTitle.trim() || "Your shop name"
                  : presetsForShop(niche)[0]?.title ?? NICHES[niche].defaultName
              }
            />
            {niche !== CUSTOM_NICHE && presetsForShop(niche)[0] ? (
              <p className="mt-3 text-sm text-muted">
                {presetForShopNiche(niche).tagline} The booking button reads “{presetForShopNiche(niche).bookingCta}”.
              </p>
            ) : null}
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={busy || solo === null || (niche === CUSTOM_NICHE && customTitle.trim().length < 2)}
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
