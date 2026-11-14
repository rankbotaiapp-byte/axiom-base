import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { GuestBookDialog } from "@/components/guest-book-dialog";
import { type NicheActions } from "@/config/niche-actions";
import { catalogFilmFallbackUrl, defaultNicheFilm, resolveCatalogNiche } from "@/config/catalog";
import { cleanStillUrl, isPlayableHeroFilm, type HeroLook } from "@/lib/axiom/hero-studio-state";
import { useShopPageData } from "@/routes/$shopSlug/route";
import { FounderWelcomeStage } from "@/components/founder-welcome-stage";
import { HeroHud, InlineLabel } from "@/components/hero-hud";
import { ShopProofGallery } from "@/components/proof-gallery";
import { ImmutableStorefront } from "@/components/storefront/immutable-storefront";
import { InteractiveOtterHero } from "@/components/interactive-otter-hero";
import { HeroSharkInteractive } from "@/components/HeroSharkInteractive";
import { abyssalTelemetry, isOtterHeroFilm, isSharkHeroFilm } from "@/lib/axiom/hero-films";
import { deepSeaHeroButtons, nicheHeroButtons } from "@/config/niche-button-presets";
import { seedFilmPlates, seedSeaPlates, type FilmPlateSeed, type HeroHudConfig } from "@/lib/axiom/hero-hud";
import { nicheVoice } from "@/lib/axiom/niches";
import { isShopNiche } from "@/lib/axiom/types";
import { SyncedHeroPlayer } from "@/components/studio/SyncedHeroPlayer";
import { DEFAULT_HERO_LOOK } from "@/lib/axiom/hero-look";

function storefrontHud(
  saved: HeroHudConfig | null | undefined,
  niche: string,
  shark = false,
  bookHref = "",
  phone = "",
  mapsUrl = "",
): HeroHudConfig {
  if (saved && saved.buttons.length > 0) return { ...saved, plates: saved.plates ?? [] };
  const abyssal = shark || resolveCatalogNiche(niche) === "water-systems";
  return {
    title: "",
    buttons: abyssal
      ? deepSeaHeroButtons({ bookHref, phone, mapsUrl })
      : nicheHeroButtons(niche, { phone, bookHref }),
    plates: [],
  };
}

function presentHud(
  saved: HeroHudConfig | null | undefined,
  niche: string,
  seed: FilmPlateSeed,
  shark = false,
  phone = "",
  mapsUrl = "",
): HeroHudConfig {
  const abyssal = shark || resolveCatalogNiche(niche) === "water-systems";
  const hud = seedFilmPlates(storefrontHud(saved, niche, abyssal, seed.bookHref, phone, mapsUrl), seed);
  return abyssal ? seedSeaPlates(hud, seed) : hud;
}

export function FilmStage({
  name,
  tagline,
  city,
  src,
  book,
  actions,
  niche = "",
  bookHref,
  still,
  look,
  hud,
  editable = false,
  onChange,
  studio,
  serviceThumbs = [],
  guestBook = false,
  claimHref,
}: {
  name: string;
  tagline: string;
  city: string;
  src: string;
  book?: ReactNode;
  /** Niche CTAs and service cards. Omitted only when the niche is not in the catalog. */
  actions?: NicheActions;
  niche?: string;
  bookHref?: string;
  still?: string;
  look?: HeroLook;
  hud?: HeroHudConfig | null;
  editable?: boolean;
  onChange?: (next: HeroHudConfig, commit?: boolean) => void;
  studio?: ReactNode;
  serviceThumbs?: readonly string[];
  guestBook?: boolean;
  claimHref?: string;
}) {
  const [broken, setBroken] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const liveBookHref = guestBook ? "#guest-book" : bookHref;
  const chosen = src.startsWith("blob:") || isPlayableHeroFilm(src);
  const nicheKey = resolveCatalogNiche(niche);
  const film = broken
    ? catalogFilmFallbackUrl(nicheKey)
    : !chosen
      ? defaultNicheFilm(niche)
      : src;
  const plate = cleanStillUrl(still);
  const frame = look ?? DEFAULT_HERO_LOOK;
  const stageHud = presentHud(hud, niche, {
    name,
    tagline,
    city,
    badge: actions?.badge ?? "",
    bookHref: liveBookHref ?? "",
    services: actions?.services ?? [],
  }, isSharkHeroFilm(src) || nicheKey === "water-systems");
  const visibleHud = frame.overlay ? stageHud : { ...stageHud, plates: stageHud.plates.filter((item) => item.id !== "plate_identity") };
  const liveName = visibleHud.plates.find((item) => item.id === "plate_identity")?.lines.find((line) => line.id === "line_name")?.text || name;
  const otter = isOtterHeroFilm(film);
  const sharkFilm = isSharkHeroFilm(film);
  const abyssal = sharkFilm || nicheKey === "water-systems";
  const seaTelemetry = abyssal ? abyssalTelemetry() : [];
  const [splash, setSplash] = useState(false);

  const filmNode = (
    <SyncedHeroPlayer
      key={film}
      className="film-hero-media min-h-[70dvh] md:min-h-[85dvh]"
      src={film}
      poster={plate || "/media/hero-poster.jpg"}
      effect={frame.effect}
      brandMark={frame.brandMark}
      shopName={name}
      logoUrl={plate}
      tagline={tagline}
      onError={() => setBroken(true)}
    />
  );

  function writeName(text: string, commit: boolean) {
    onChange?.({
      ...visibleHud,
      plates: visibleHud.plates.map((item) =>
        item.id === "plate_identity"
          ? { ...item, lines: item.lines.map((line) => (line.id === "line_name" ? { ...line, text } : line)) }
          : item,
      ),
    }, commit);
  }

  useEffect(() => {
    setBroken(false);
  }, [src]);

  useEffect(() => {
    document.documentElement.dataset.film = "open";
    return () => {
      delete document.documentElement.dataset.film;
    };
  }, []);

  return (
    <section className="film-hero" aria-label={`${name} storefront`}>
      {sharkFilm ? (
        <HeroSharkInteractive active src={film}>
          {filmNode}
        </HeroSharkInteractive>
      ) : (
        <InteractiveOtterHero active={otter}>{filmNode}</InteractiveOtterHero>
      )}
      {splash ? <div className="sea-splash" aria-hidden /> : null}
      {plate ? <img className="film-hero-still" src={plate} alt="" /> : null}
      {frame.brackets ? (
        <>
          <span className="film-bracket film-bracket-nw" aria-hidden />
          <span className="film-bracket film-bracket-ne" aria-hidden />
          <span className="film-bracket film-bracket-sw" aria-hidden />
          <span className="film-bracket film-bracket-se" aria-hidden />
        </>
      ) : null}
      {frame.glow ? <span className="film-glow-ring" aria-hidden /> : null}
      {hud ? (
        <HeroHud
          hud={visibleHud}
          telemetry={seaTelemetry}
          bookHref={liveBookHref}
          editable={editable}
          buoyant={(otter || sharkFilm) && !editable}
          serviceThumbs={serviceThumbs}
          onChange={onChange}
          chrome={!frame.brackets}
          onBook={guestBook ? () => setGuestOpen(true) : undefined}
          beforeAction={
            sharkFilm && !editable
              ? (_button, proceed) => {
                  setSplash(true);
                  const wait = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 720;
                  window.setTimeout(() => {
                    setSplash(false);
                    proceed();
                  }, wait);
                }
              : undefined
          }
        />
      ) : null}
      <header className="film-nav">
        {editable ? (
          <InlineLabel
            value={liveName}
            maxLength={42}
            className="film-nav-mark"
            onType={(text) => writeName(text, false)}
            onCommit={(text) => writeName(text, true)}
          />
        ) : (
          <p className="film-nav-mark">{liveName}</p>
        )}
        {book ? (
          <nav
            className="film-nav-links"
            aria-label="Shop"
            onClick={(event) => {
              if (!guestBook) return;
              const target = (event.target as HTMLElement).closest("button");
              if (target) {
                event.preventDefault();
                setGuestOpen(true);
              }
            }}
          >
            {book}
          </nav>
        ) : null}
      </header>
      {studio}
      {guestBook ? (
        <GuestBookDialog
          open={guestOpen}
          niche={niche}
          shopName={name}
          claimHref={claimHref || `/onboard?niche=${niche}`}
          onClose={() => setGuestOpen(false)}
        />
      ) : null}
    </section>
  );
}

/** Outreach tenant reel: founder HUD first, then the prospect's trade film. No catalog. */
export function OutreachTenantPage({
  owner,
  business,
  trade,
  place,
  proofSlug,
  proofNiche,
  ...film
}: ComponentProps<typeof FilmStage> & {
  owner: string;
  business: string;
  trade: string;
  place: string;
  proofSlug?: string;
  proofNiche?: string;
}) {
  const galleryNiche = proofNiche && isShopNiche(proofNiche) ? proofNiche : null;
  return (
    <>
      <FounderWelcomeStage owner={owner} business={business} trade={trade} place={place} />
      <div id="trade-stage">
        <FilmStage {...film} />
      </div>
      {proofSlug && galleryNiche ? (
        <ShopProofGallery slug={proofSlug} niche={galleryNiche} heading={nicheVoice(galleryNiche).gallery} />
      ) : null}
    </>
  );
}

/** Locked tenant template. Layout is identical; brand tokens and media change per shop. */
export function ShopFilmPage() {
  const data = useShopPageData();
  return <ImmutableStorefront data={data} />;
}

export default ShopFilmPage;
