import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { getNicheActions, type NicheActions } from "@/config/niche-actions";
import { fetchClientStorefront, type ClientStorefront } from "@/lib/axiom/autopilot";
import {
  HERO_STUDIO_EVENT,
  HERO_STUDIO_KEY,
  LEOPARD_HERO_ANIMATION,
  isHeroAnimationUrl,
  readHeroDraft,
  resolveStorefrontFilm,
  type HeroDraft,
} from "@/lib/axiom/hero-studio-state";
import { getShopAccess } from "@/lib/axiom/server";
import type { AccessMode } from "@/lib/axiom/types";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useShopPageData } from "@/routes/$shopSlug/route";

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

/** Full-bleed loop with the shop name, tagline, and city. No cards. */
export function FilmStage({
  name,
  tagline,
  city,
  src,
  book,
  actions,
  bookHref,
}: {
  name: string;
  tagline: string;
  city: string;
  src: string;
  book?: ReactNode;
  /** Niche CTAs and service cards. Omitted only when the niche is not in the catalog. */
  actions?: NicheActions;
  bookHref?: string;
}) {
  const [broken, setBroken] = useState(false);
  const film = broken || !isHeroAnimationUrl(src) ? LEOPARD_HERO_ANIMATION : src;

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
      <header className="film-nav">
        <p className="film-nav-mark">{name}</p>
        {book ? (
          <nav className="film-nav-links" aria-label="Shop">
            {book}
          </nav>
        ) : null}
      </header>
      <div className="film-type">
        {actions ? <p className="film-badge">{actions.badge}</p> : null}
        <h1>{name}</h1>
        {tagline ? <p>{tagline}</p> : null}
        {city ? <p className="film-city">{city}</p> : null}
        {actions && bookHref ? (
          <div className="film-cta-row">
            <a href={bookHref} className="film-cta film-cta-primary">
              {actions.primaryCta}
            </a>
            <a href={bookHref} className="film-cta">
              {actions.secondaryCta}
            </a>
          </div>
        ) : null}
      </div>
      {actions ? (
        <ul className="film-services" aria-label="Services">
          {actions.services.map((service) => (
            <li key={service.title} className="film-service">
              <p className="film-service-title">{service.title}</p>
              <p className="film-service-detail">{service.detail}</p>
              <p className="film-service-price">{service.priceLabel}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Full-screen shop film. Type and nav sit on the loop, with nothing else in the frame. */
export function ShopFilmPage() {
  const data = useShopPageData();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<AccessMode>("customer");
  const draft = useHeroDraft(data.shop.slug);
  const tenant = useTenant(data.shop.slug);
  const remoteFilm = isHeroAnimationUrl(tenant?.heroVideoUrl) ? tenant?.heroVideoUrl : data.shop.heroVideoUrl;
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

  useEffect(() => {
    if (isPending || !user) return;
    void getShopAccess({ data: data.shop.slug })
      .then((access) => setMode(access.mode === "none" ? "customer" : access.mode))
      .catch(() => setMode("customer"));
  }, [data.shop.slug, isPending, user]);

  const desk = mode === "owner" || mode === "preview";
  const actions = getNicheActions(data.shop.niche);
  const bookPath = `/${data.shop.slug}/book`;

  return (
    <FilmStage
      name={name}
      tagline={selection.tagline}
      city={city}
      src={selection.hero_video_url}
      actions={actions}
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
    />
  );
}

export default ShopFilmPage;
