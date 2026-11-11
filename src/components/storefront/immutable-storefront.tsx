import { useMemo, useState } from "react";
import { AvatarSpeakerPhone } from "@/components/ai/AvatarSpeakerPhone";
import { FunnelLayout } from "@/components/funnel/FunnelLayout";
import { getNicheActions } from "@/config/niche-actions";
import { shopCity } from "@/lib/axiom/avatar";
import { callHrefFor, mapsSearchUrl } from "@/lib/axiom/frontend-template";
import { bustStorefrontFilm, resolveShopHeroFilm } from "@/lib/axiom/resolve-hero-film";
import { isPlayableHeroFilm } from "@/lib/axiom/hero-studio-state";
import { nicheVoice } from "@/lib/axiom/niches";
import { SMS_TCPA_FOOTER } from "@/lib/axiom/legal-notices";
import type { ShopPublic } from "@/lib/axiom/types";
import { cn, formatMoney } from "@/lib/utils";
import { CyberCompanionHud } from "@/components/CyberCompanionHud";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { ShopProofGallery } from "@/components/proof-gallery";

const FONT_CLASS = {
  display: "font-display",
  sans: "font-sans",
  mono: "font-mono",
} as const;

export function ImmutableStorefront({ data }: { data: ShopPublic }) {
  const shop = data.shop;
  const template = shop.frontendTemplate;
  const name = template?.brandName || shop.name;
  const city = template?.city || shopCity(shop.address);
  const address = template?.address || shop.address;
  const phone = template?.phone || data.employees.find((e) => e.phone)?.phone || "";
  const callHref = template?.callHref || callHrefFor(phone);
  const mapsUrl = template?.mapsUrl || mapsSearchUrl(address);
  const bookPath = template?.bookPath || `/${shop.slug}/book`;
  const accent = template?.primary || shop.ringColor || shop.neonAccent;
  const font = FONT_CLASS[template?.font ?? "display"];
  const still = template?.heroAssetUrl || shop.heroImageUrl;
  const pinned = resolveShopHeroFilm({
    overrideHeroVideoUrl: template?.heroVideoUrl || shop.shopConfig?.overrideHeroVideoUrl || shop.heroVideoUrl,
    heroVideoUrl: shop.heroVideoUrl,
    niche: shop.niche,
  });
  const filmSrc = bustStorefrontFilm(pinned, shop.shopConfig?.storefrontFilmAt);
  const playFilm = Boolean(template?.animate !== false) && isPlayableHeroFilm(filmSrc);
  const [bookOpen, setBookOpen] = useState(false);

  const services = useMemo(() => {
    if (data.services.length > 0) {
      return data.services.slice(0, 8).map((row) => ({
        title: row.name,
        detail: row.description,
        price: formatMoney(row.priceCents),
      }));
    }
    const niche = getNicheActions(shop.niche);
    return (niche?.services ?? []).map((row) => ({
      title: row.title,
      detail: row.detail,
      price: row.priceLabel,
    }));
  }, [data.services, shop.niche]);

  return (
    <div className="immutable-storefront" style={{ ["--shop-accent" as string]: accent }}>
      <FunnelLayout
        name={name}
        city={city}
        logoUrl={template?.logoUrl}
        bookPath={bookPath}
        callHref={callHref}
        mapsUrl={mapsUrl}
        onBook={() => setBookOpen(true)}
      >

      <section className="immutable-hero" aria-label="Hero">
        {playFilm ? (
          <CinematicHero
            className="is-storefront immutable-hero-media"
            showCtas={false}
            sources={[{ src: filmSrc, type: "video/mp4" }]}
            poster={still || "/media/hero-poster.jpg"}
            freezeAt={/leopard|leapord/i.test(filmSrc) ? 3.6 : undefined}
          />
        ) : still ? (
          <img src={still} alt="" className="immutable-hero-media" />
        ) : (
          <div className="immutable-hero-media bg-surface" />
        )}
        <div className="immutable-hero-veil" />
        <div className="immutable-hero-copy">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">{city}</p>
          <h1 className={cn("mt-2 text-4xl leading-none sm:text-6xl", font)}>{name}</h1>
          <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">{shop.tagline}</p>
        </div>
      </section>

      <ShopProofGallery slug={shop.slug} niche={shop.niche} heading={nicheVoice(shop.niche).gallery} />

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-10" id="services">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Core services</p>
        <h2 className={cn("mt-2 text-3xl sm:text-4xl", font)}>What we run</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {services.map((row) => (
            <li key={row.title} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg">{row.title}</h3>
                <p className="font-mono text-sm text-accent">{row.price}</p>
              </div>
              {row.detail ? <p className="mt-2 text-sm text-muted">{row.detail}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line px-5 py-12 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className={cn("text-xl", font)}>{name}</p>
            <p className="mt-2 max-w-sm text-sm text-muted">{address || city}</p>
            {phone ? <p className="mt-1 font-mono text-sm text-fg">{phone}</p> : null}
          </div>
          <nav className="flex flex-col gap-2 text-sm text-muted" aria-label="Compliance">
            <a href="/privacy" className="hover:text-fg">
              Privacy
            </a>
            <a href="/terms" className="hover:text-fg">
              Terms
            </a>
            <p className="max-w-xs text-xs leading-relaxed">{SMS_TCPA_FOOTER}</p>
          </nav>
        </div>
      </footer>

      {bookOpen ? (
        <div className="fixed inset-0 z-50 bg-bg/90 p-3 backdrop-blur-sm sm:p-8">
          <div className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Book Now</p>
              <button type="button" className="h-11 rounded-xl px-3 text-sm" onClick={() => setBookOpen(false)}>
                Close
              </button>
            </div>
            <iframe title="Booking calendar" src={bookPath} className="min-h-0 flex-1 bg-bg" />
          </div>
        </div>
      ) : null}

      <CyberCompanionHud
        environment="storefront"
        shopName={name}
        shopSlug={shop.slug}
        niche={shop.customNiche || shop.niche}
        city={city}
        bookHref={bookPath}
        onBook={() => setBookOpen(true)}
      />
      <AvatarSpeakerPhone
        shopName={name}
        shopSlug={shop.slug}
        niche={shop.customNiche || shop.niche}
        city={city}
      />
      </FunnelLayout>
    </div>
  );
}
