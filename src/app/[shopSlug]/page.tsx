import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { getNicheActions, type NicheActions } from "@/config/niche-actions";
import { fetchClientStorefront, type ClientStorefront } from "@/lib/axiom/autopilot";
import {
  HERO_STUDIO_EVENT,
  HERO_STUDIO_KEY,
  LEOPARD_HERO_ANIMATION,
  cleanStillUrl,
  isPlayableHeroFilm,
  readHeroDraft,
  resolveStorefrontFilm,
  type HeroDraft,
  type HeroLook,
} from "@/lib/axiom/hero-studio-state";
import { getShopAccess, revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import type { AccessMode } from "@/lib/axiom/types";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useShopPageData } from "@/routes/$shopSlug/route";
import { FilmStudioDock } from "@/components/admin/film-studio-dock";
import { FounderWelcomeStage } from "@/components/founder-welcome-stage";
import { HeroHud, InlineLabel } from "@/components/hero-hud";
import { InteractiveOtterHero } from "@/components/interactive-otter-hero";
import { HeroSharkInteractive } from "@/components/HeroSharkInteractive";
import { isOtterHeroFilm, isSharkHeroFilm } from "@/lib/axiom/hero-films";
import { deepSeaHeroButtons, nicheHeroButtons } from "@/config/niche-button-presets";
import { seedFilmPlates, seedSeaPlates, type FilmPlateSeed, type HeroHudConfig } from "@/lib/axiom/hero-hud";

function useHeroDraft(slug: string) {
  const [draft, setDraft] = useState<HeroDraft | null>(null);
  useEffect(() => {
    const load = () => setDraft(readHeroDraft(slug));
    load();
    const onStore = (event: StorageEvent) => {
      if (event.key === HERO_STUDIO_KEY) load();
    };
    window.addEventListener(HERO_STUDIO_EVENT, load);
    window.addEventListener("storage", onStore);
    return () => {
      window.removeEventListener(HERO_STUDIO_EVENT, load);
      window.removeEventListener("storage", onStore);
    };
  }, [slug]);
  return draft;
}

function useTenant(slug: string) {
  const [tenant, setTenant] = useState<ClientStorefront | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetchClientStorefront(slug)
      .then((row) => {
        if (!cancelled) setTenant(row);
      })
      .catch(() => {
        if (!cancelled) setTenant(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return tenant;
}

function storefrontHud(saved: HeroHudConfig | null | undefined, niche: string, shark = false, bookHref = ""): HeroHudConfig {
  if (saved && saved.buttons.length > 0) return { ...saved, plates: saved.plates ?? [] };
  return { title: "", buttons: shark ? deepSeaHeroButtons(bookHref) : nicheHeroButtons(niche), plates: [] };
}

function presentHud(saved: HeroHudConfig | null | undefined, niche: string, seed: FilmPlateSeed, shark = false): HeroHudConfig {
  const hud = seedFilmPlates(storefrontHud(saved, niche, shark, seed.bookHref), seed);
  return shark ? seedSeaPlates(hud, seed) : hud;
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
}) {
  const [broken, setBroken] = useState(false);
  const chosen = src.startsWith("blob:") || isPlayableHeroFilm(src);
  const film = broken || !chosen ? LEOPARD_HERO_ANIMATION : src;
  const plate = cleanStillUrl(still);
  const frame = look ?? { brackets: false, glow: false, overlay: true };
  const stageHud = presentHud(hud, niche, {
    name,
    tagline,
    city,
    badge: actions?.badge ?? "",
    bookHref: bookHref ?? "",
    services: actions?.services ?? [],
  }, isSharkHeroFilm(src));
  const visibleHud = frame.overlay ? stageHud : { ...stageHud, plates: stageHud.plates.filter((item) => item.id !== "plate_identity") };
  const liveName = visibleHud.plates.find((item) => item.id === "plate_identity")?.lines.find((line) => line.id === "line_name")?.text || name;
  const otter = isOtterHeroFilm(film);
  const shark = isSharkHeroFilm(film);
  const [splash, setSplash] = useState(false);

  const filmNode = (
    <video
      key={film}
      className="film-hero-media"
      src={film}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
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
      {shark ? (
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
          bookHref={bookHref}
          editable={editable}
          buoyant={(otter || shark) && !editable}
          onChange={onChange}
          chrome={!frame.brackets}
          beforeAction={
            shark && !editable
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
          <nav className="film-nav-links" aria-label="Shop">
            {book}
          </nav>
        ) : null}
      </header>
      {studio}
    </section>
  );
}

/** Outreach tenant reel: founder HUD first, then the prospect's trade film. No catalog. */
export function OutreachTenantPage({
  owner,
  business,
  trade,
  place,
  ...film
}: ComponentProps<typeof FilmStage> & {
  owner: string;
  business: string;
  trade: string;
  place: string;
}) {
  return (
    <>
      <FounderWelcomeStage owner={owner} business={business} trade={trade} place={place} />
      <div id="trade-stage">
        <FilmStage {...film} />
      </div>
    </>
  );
}

/** Full-screen shop film. Type and nav sit on the loop, with nothing else in the frame. */
export function ShopFilmPage() {
  const data = useShopPageData();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<AccessMode>("customer");
  const draft = useHeroDraft(data.shop.slug);
  const tenant = useTenant(data.shop.slug);
  const remoteFilm = isPlayableHeroFilm(tenant?.heroVideoUrl) ? (tenant?.heroVideoUrl ?? null) : data.shop.heroVideoUrl;
  const selection = resolveStorefrontFilm({
    draft,
    shopVideoUrl: remoteFilm,
    niche: data.shop.niche,
    customNiche: [data.shop.customNiche, tenant?.niche].filter(Boolean).join(" "),
    fallbackVideoUrl: LEOPARD_HERO_ANIMATION,
    shopTagline: tenant?.tagline || data.shop.tagline,
  });
  const name = tenant?.name || data.shop.name;
  const city = (tenant?.address || data.shop.address || "").trim();
  const look = draft?.look ?? data.shop.heroLook ?? { brackets: false, glow: data.shop.glowEnabled, overlay: true };
  const still = draft?.hero_image_url || cleanStillUrl(data.shop.heroImageUrl);

  useEffect(() => {
    if (isPending || !user) return;
    void getShopAccess({ data: data.shop.slug })
      .then((access) => setMode(access.mode === "none" ? "customer" : access.mode))
      .catch(() => setMode("customer"));
  }, [data.shop.slug, isPending, user]);

  const desk = mode === "owner" || mode === "preview";
  const canEdit = (mode === "owner" || mode === "preview") && !data.shop.isShowcase;
  const actions = getNicheActions(data.shop.niche);
  const bookPath = `/${data.shop.slug}/book`;
  const seed: FilmPlateSeed = {
    name,
    tagline: selection.tagline,
    city,
    badge: actions?.badge ?? "",
    bookHref: actions ? bookPath : "",
    services: actions?.services ?? [],
  };
  const [hud, setHud] = useState(() => presentHud(data.shop.heroHud, data.shop.niche, seed, isSharkHeroFilm(selection.hero_video_url)));
  const [filmOverride, setFilmOverride] = useState<string | null>(null);
  const dirty = useRef(false);
  const filmSrc = filmOverride || selection.hero_video_url;

  useEffect(() => {
    if (dirty.current) return;
    setHud(presentHud(data.shop.heroHud, data.shop.niche, seed, isSharkHeroFilm(filmSrc)));
  }, [data.shop.heroHud, data.shop.niche, actions, name, selection.tagline, city, seed.bookHref, seed.badge]);

  function commitHud(next: HeroHudConfig, commit = false) {
    dirty.current = true;
    setHud(next);
    if (!canEdit || !commit) return;
    const nameLine = next.plates.find((plate) => plate.id === "plate_identity")?.lines.find((line) => line.id === "line_name")?.text.trim();
    const tagLine = next.plates.find((plate) => plate.id === "plate_identity")?.lines.find((line) => line.id === "line_tag")?.text.trim();
    void updateShopBrand({
      data: {
        slug: data.shop.slug,
        heroHud: next,
        markHero: true,
        ...(nameLine ? { name: nameLine } : {}),
        ...(tagLine ? { tagline: tagLine } : {}),
      },
    })
      .then(() => revalidateStorefront({ data: data.shop.slug }))
      .catch(() => undefined);
  }

  return (
    <FilmStage
      name={name}
      tagline={selection.tagline}
      city={city}
      src={filmSrc}
      still={still}
      look={look}
      hud={hud}
      editable={canEdit}
      onChange={commitHud}
      actions={actions}
      niche={data.shop.niche}
      bookHref={actions ? bookPath : undefined}
      book={
        <>
          {actions ? (
            <a href={bookPath}>{actions.primaryCta}</a>
          ) : null}
          {desk ? (
            <Link to="/$shopSlug/admin/hero-studio" params={{ shopSlug: data.shop.slug }}>
              Studio
            </Link>
          ) : null}
        </>
      }
      studio={
        canEdit ? (
          <FilmStudioDock
            shopId={data.shop.id}
            slug={data.shop.slug}
            niche={data.shop.niche}
            current={filmSrc}
            tagline={selection.tagline}
            onFilm={setFilmOverride}
          />
        ) : null
      }
    />
  );
}

export default ShopFilmPage;
