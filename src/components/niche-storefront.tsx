import { useEffect, useRef, useState, type ReactNode } from "react";
import { HeroTextCanvas } from "@/components/hero-text-canvas";
import { Link } from "@tanstack/react-router";
import { CinematicHero } from "@/components/cinematic-hero";
import { TacticalHero } from "@/components/tactical-hero";
import { AUTO_HERO_POSTER, AUTO_HERO_SRC } from "@/lib/axiom/auto-sequence";
import { HoloCard } from "@/components/holo-card";
import { Reveal } from "@/components/reveal";
import { StatusPill, StatusRow, toneAt } from "@/components/status-pill";
import { NICHE_MEDIA, type HeroTone } from "@/lib/axiom/media";
import { isShopNiche } from "@/lib/axiom/types";
import type { IntroPreset } from "@/lib/axiom/intro";
import { WEEKDAYS } from "@/lib/axiom/niches";
import { DEFAULT_HUD, hudVars, type HeroLayerId, type HeroTextLayer, type StorefrontHud } from "@/lib/axiom/hud";
import { HeroSpatial } from "@/components/hero-spatial";
import { BarberMirrorStudio, usesBarberMirror } from "@/components/barber-mirror-studio";
import { OutdoorGuideStudio, usesOutdoorGuide } from "@/components/outdoor-guide-studio";
import { HolographicStage } from "@/components/HolographicStage";
import { StorefrontPresence, storefrontFilm } from "@/components/storefront-presence";
import { storefrontRevealHero } from "@/components/storefront-reveal";
import { usesCeramicReveal } from "@/lib/axiom/ceramic-reveal";
import { usesRiverReveal } from "@/lib/axiom/river-reveal";
import { usesAutomotiveCockpit } from "@/lib/axiom/cockpit";
import { ownerHeroMedia } from "@/lib/axiom/hero-motion";
import { brandPlate, heroAtmosphereActive, type HeroEffect } from "@/lib/axiom/hero-brand";
import { HeroBrandFrame } from "@/components/hero-weather";
import { applyBrowserFilmOverride, readMasterTelemetry, readNicheFilmOverride } from "@/lib/axiom/hero-films";
import { formatPhone, initials } from "@/lib/utils";
import { CraftLoop } from "@/components/craft-loop";
import { StudioCinematicHero } from "@/components/studio-cinematic-hero";
import { craftKindFor } from "@/lib/axiom/studio-craft";
import type { StudioIdentity } from "@/lib/axiom/studio-identity";

export type StorefrontService = {
  key: string;
  name: string;
  description: string;
  price: string;
  group?: string;
};

export type StorefrontStaff = {
  key: string;
  displayName: string;
  title: string;
  bio: string;
  avatarUrl: string;
  shopSlug?: string;
  employeeId?: string;
};

export function NicheStorefront({
  businessName,
  kicker,
  tagline,
  description,
  address,
  accent,
  logoUrl,
  contactName,
  contactPhone,
  contactEmail,
  services,
  hours,
  staff,
  heroImageUrl,
  heroVideoUrl,
  blendPercent,
  introPreset,
  surface = {},
  introSpeed,
  introIntensity,
  tone,
  fallbackImageUrl,
  fallbackVideoUrl,
  bookLabel,
  bookHref,
  header,
  extra,
  footer,
  niche = "",
  autoHero = false,
  hud = DEFAULT_HUD,
  headline = "",
  heroEffect = "smoke",
  heroTagline = "",
  heroPrompt = "",
  morphDurationSec = 4.5,
  revealHero,
  heroPresence = "orb",
  layoutEditable = false,
  activeLayer = "headline",
  onActiveLayer,
  onLayerChange,
  cinematic = null,
}: {
  businessName: string;
  kicker: string;
  tagline: string;
  description?: string;
  address?: string;
  accent: string;
  logoUrl?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  services: StorefrontService[];
  hours?: Record<string, string>;
  staff: readonly [StorefrontStaff, StorefrontStaff];
  heroImageUrl: string;
  heroVideoUrl: string | readonly string[] | null;
  blendPercent: number;
  introPreset?: IntroPreset;
  /** Ripple theme variables. Glass, ring, and touch accent follow the shop theme. */
  surface?: Record<string, string>;
  introSpeed?: number;
  introIntensity?: number;
  tone?: HeroTone | null;
  fallbackImageUrl?: string;
  fallbackVideoUrl?: string;
  bookLabel: string;
  bookHref?: string;
  header?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;
  niche?: string;
  /** The Axiom Auto tenant always plays the finished portal-to-cockpit film. */
  autoHero?: boolean;
  hud?: StorefrontHud;
  headline?: string;
  heroEffect?: HeroEffect;
  heroTagline?: string;
  heroPrompt?: string;
  morphDurationSec?: number;
  /** Scratch-off wildlife hero. Used when this storefront is the outdoor guide. */
  revealHero?: ReactNode;
  /** Demo pages drop the center orb and play a full-bleed film. */
  heroPresence?: "orb" | "film";
  layoutEditable?: boolean;
  activeLayer?: HeroLayerId;
  onActiveLayer?: (id: HeroLayerId) => void;
  onLayerChange?: (id: HeroLayerId, layer: HeroTextLayer, persist: boolean) => void;
  /** Published Axiom Studio intro. Replaces the stock hero on the shop. */
  cinematic?: { plateUrl: string; identity: StudioIdentity } | null;
}) {
  const contact = [contactName, contactPhone ? formatPhone(contactPhone) : "", contactEmail].filter(Boolean).join(" · ");
  const stageRef = useRef<HTMLDivElement>(null);
  const [masterLines, setMasterLines] = useState<string[]>([]);
  const [filmOverride, setFilmOverride] = useState("");
  useEffect(() => {
    setMasterLines(readMasterTelemetry());
    setFilmOverride(readNicheFilmOverride(niche));
  }, [niche]);
  const nicheFilm = isShopNiche(niche) ? NICHE_MEDIA[niche].heroVideoUrl : "";
  const playedVideo =
    heroPresence === "film"
      ? heroVideoUrl
      : applyBrowserFilmOverride(heroVideoUrl, nicheFilm, filmOverride);
  const city = (address ?? "").split(",").map((part) => part.trim()).filter(Boolean)[1] ?? "";
  const tradeLabel = kicker || niche;
  const tradeText = [businessName, kicker, tagline, description].filter(Boolean).join(" ");
  const telemetry = masterLines;
  const brand = { name: businessName, accent, logoUrl, city, trade: tradeLabel };
  const owned = autoHero ? null : ownerHeroMedia(playedVideo, heroImageUrl);
  const plate = brandPlate({ name: businessName, niche, trade: kicker, tagline: heroTagline });
  const atmosphere = heroEffect === "orb_genesis_transform" || heroAtmosphereActive(heroImageUrl, heroTagline);
  const brandFrame = atmosphere ? (
    <HeroBrandFrame
      effect={heroEffect}
      tagline={plate.line || heroTagline}
      sticker={plate.sticker}
      prompt={heroPrompt}
      morphDurationSec={morphDurationSec}
      name={businessName}
    />
  ) : null;
  const cinematicBrand = atmosphere
    ? {
        effect: heroEffect,
        brandTagline: plate.line || heroTagline,
        brandSticker: plate.sticker,
        heroPrompt,
        morphDurationSec,
      }
    : { effect: null, brandTagline: "", brandSticker: "", heroPrompt: "", morphDurationSec: 4.5 };
  const cockpit = autoHero || usesAutomotiveCockpit(niche, tradeText);
  const mirror = usesBarberMirror(niche, tradeText);
  const outdoor = usesOutdoorGuide(niche, tradeText);
  const ceramic = !outdoor && usesCeramicReveal(niche, tradeText);
  const river = !outdoor && !ceramic && usesRiverReveal(niche, tradeText);
  const renderChrome = () => (
    <>
      <div className="hero-scrim pointer-events-none absolute inset-x-0 top-0 z-0 h-40" aria-hidden />
      <div data-spatial="nav" className="relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark name={businessName} logoUrl={logoUrl ?? ""} />
          {header}
        </div>
        <p className="hidden max-w-xs truncate text-right text-sm text-muted sm:block">{contact || "\u00a0"}</p>
      </div>
    </>
  );

  return (
    <div
      ref={stageRef}
      className="storefront-stage"
      data-neon="on"
      data-ripple-theme={surface["--ripple"] ? "on" : "off"}
      data-wash={hud.wash}
      data-rim={hud.rim ? "on" : "off"}
      data-scan={hud.scan ? "on" : "off"}
      style={{ ...hudVars(hud, accent), ...surface }}
    >
      {cinematic ? (
        <StudioCinematicHero plateUrl={cinematic.plateUrl} identity={cinematic.identity}>
          {renderChrome()}
          <div className="relative z-10 flex min-h-[70dvh] flex-1 flex-col justify-end px-5 pb-16 pt-6 sm:px-10">
            <p className="pointer-events-none min-h-4 text-[11px] uppercase tracking-[0.22em] text-muted">{kicker || "\u00a0"}</p>
            <div className="relative mt-4 min-h-[16rem] flex-1">
              <HeroTextCanvas
                layers={hud.layers}
                fallbacks={{
                  headline: businessName,
                  subheadline: tagline || headline,
                  cta_button: bookLabel,
                }}
                editable={layoutEditable}
                activeLayer={activeLayer}
                onActiveLayer={onActiveLayer}
                onLayerChange={onLayerChange}
                bookHref={bookHref}
              />
            </div>
          </div>
        </StudioCinematicHero>
      ) : (
      <>
      <StorefrontPresence
        name={businessName}
        kicker={kicker}
        tagline={tagline || headline}
        videoUrl={
          owned?.video ||
          (cockpit ? AUTO_HERO_SRC : null) ||
          playedVideo ||
          fallbackVideoUrl
        }
        imageUrl={owned?.image || heroImageUrl || fallbackImageUrl}
        bookHref={heroPresence === "film" ? undefined : bookHref}
        bookLabel={bookLabel}
        showOrb={heroPresence === "orb"}
      >
        {renderChrome()}
      </StorefrontPresence>
      {heroPresence === "orb" ? (
      <HolographicStage
        businessName={businessName}
        customer
        filmUrl={storefrontFilm(
          owned?.video || (cockpit ? AUTO_HERO_SRC : null) || playedVideo || fallbackVideoUrl,
        )}
        posterUrl={owned?.image || heroImageUrl || fallbackImageUrl || undefined}
      />
      ) : null}
      {owned || cockpit || mirror || outdoor || ceramic || river ? null : <HeroSpatial rootRef={stageRef} />}
      {owned ? (
        <div className="hero-atmosphere-host">
          <TacticalHero videoUrl={owned.video || undefined} imageUrl={owned.image || undefined} label={businessName}>
            <div className="relative z-10">{renderChrome()}</div>
          </TacticalHero>
          {brandFrame}
        </div>
      ) : cockpit ? (
        <CinematicHero
          sequence="auto"
          imageUrl={heroImageUrl || AUTO_HERO_POSTER}
          videoUrl={AUTO_HERO_SRC}
          blendPercent={blendPercent}
          introPreset={introPreset}
          introSpeed={introSpeed}
          introIntensity={introIntensity}
          tone={tone ?? null}
          fallbackImageUrl={fallbackImageUrl}
          fallbackVideoUrl={fallbackVideoUrl}
          brand={brand}
          telemetry={telemetry}
          {...cinematicBrand}
          dashboard={
            <OfferingDesk
              businessName={businessName}
              services={services}
              staff={staff}
              hours={hours}
              bookHref={bookHref}
              bookLabel={bookLabel}
            />
          }
        >
          {renderChrome()}
        </CinematicHero>
      ) : mirror ? (
        <div className="hero-atmosphere-host">
          <BarberMirrorStudio
            businessName={businessName}
            bookHref={bookHref}
            services={services}
            filmUrl={typeof playedVideo === "string" ? playedVideo : playedVideo?.[0]}
          >
            {renderChrome()}
          </BarberMirrorStudio>
          {brandFrame}
        </div>
      ) : outdoor ? (
        <div className="hero-atmosphere-host">
          <OutdoorGuideStudio businessName={businessName} bookHref={bookHref} services={services} hud={hud} hero={revealHero}>
            {renderChrome()}
          </OutdoorGuideStudio>
          {brandFrame}
        </div>
      ) : ceramic ? (
        <div className="hero-atmosphere-host">
          <section className="ceramic-stage" aria-label="Ceramic coat studio" data-asset="car-pristine-base.mp4">
            {revealHero ?? storefrontRevealHero(niche, tradeText)}
            <div className="relative z-10">{renderChrome()}</div>
          </section>
          {brandFrame}
        </div>
      ) : river ? (
        <div className="hero-atmosphere-host">
          <section className="river-stage" aria-label="River hawk studio" data-asset="river-hawk-base.mp4">
            {revealHero ?? storefrontRevealHero(niche, tradeText)}
            <div className="relative z-10">{renderChrome()}</div>
          </section>
          {brandFrame}
        </div>
      ) : (
      <CinematicHero
        imageUrl={heroImageUrl}
        videoUrl={playedVideo}
        blendPercent={blendPercent}
        introPreset={introPreset}
        introSpeed={introSpeed}
        introIntensity={introIntensity}
        tone={tone ?? null}
        fallbackImageUrl={fallbackImageUrl}
        fallbackVideoUrl={fallbackVideoUrl}
        brand={brand}
        telemetry={telemetry}
        {...cinematicBrand}
      >
        {renderChrome()}
        <div className="relative z-10 flex min-h-[18rem] flex-1 flex-col px-5 pb-24 pt-6 sm:px-10">
          <p className="pointer-events-none min-h-4 text-[11px] uppercase tracking-[0.22em] text-muted">{kicker || "\u00a0"}</p>
          <p className="pointer-events-none mt-2 min-h-5 text-sm text-muted sm:hidden">{contact || "\u00a0"}</p>
          <div className="relative mt-4 min-h-[16rem] flex-1">
            <HeroTextCanvas
              layers={hud.layers}
              fallbacks={{
                headline: businessName,
                subheadline: tagline || headline,
                cta_button: bookLabel,
              }}
              editable={layoutEditable}
              activeLayer={activeLayer}
              onActiveLayer={onActiveLayer}
              onLayerChange={onLayerChange}
              bookHref={bookHref}
            />
          </div>
        </div>
      </CinematicHero>
      )}
      </>
      )}
      <div className="hero-contact" aria-hidden />

      <ServiceCards services={services} description={description} niche={niche} accent={accent} bookHref={bookHref} />
      <StaffRow people={staff} />
      {hours ? <HoursBlock hours={hours} address={address} contact={contact} /> : null}
      {extra}
      {footer}
    </div>
  );
}

function shopSlugFromBook(bookHref?: string): string | null {
  if (!bookHref) return null;
  const match = /^\/([^/?#]+)\/book\/?$/.exec(bookHref);
  return match?.[1] ?? null;
}

function OfferingDesk({
  businessName,
  services,
  staff,
  hours,
  bookHref,
  bookLabel,
}: {
  businessName: string;
  services: StorefrontService[];
  staff: readonly [StorefrontStaff, StorefrontStaff];
  hours?: Record<string, string>;
  bookHref?: string;
  bookLabel: string;
}) {
  const slug = shopSlugFromBook(bookHref);
  const openDays = hours ? Object.values(hours).filter((value) => value && !/closed/i.test(value)).length : 0;
  const crew = staff.filter((person) => person.displayName).length;
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end px-5 pb-8 sm:px-10 sm:pb-12">
      <div className="mx-auto w-full max-w-5xl rounded-[28px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Axiom desk</p>
        <h2 className="mt-2 font-display text-4xl text-fg sm:text-5xl">{businessName}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          The book, the crew, and the prices for this curb. This is the desk the shop runs.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <DeskStat label="On the book" value={String(services.length)} />
          <DeskStat label="Crew" value={String(crew)} />
          <DeskStat label="Open days" value={hours ? String(openDays) : "—"} />
        </div>
        <ul className="mt-6 divide-y divide-line">
          {services.slice(0, 4).map((service) => (
            <li key={service.key} className="flex items-baseline justify-between gap-3 py-3">
              <span className="text-sm text-fg">{service.name}</span>
              <span className="shrink-0 text-sm text-accent">{service.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          {bookHref ? (
            <a href={bookHref} className="inline-flex h-11 items-center rounded-xl bg-fg px-4 text-sm text-bg">
              {bookLabel}
            </a>
          ) : null}
          {slug ? (
            <a
              href={`/${slug}/admin`}
              className="inline-flex h-11 items-center rounded-xl px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.12)]"
            >
              Open the live desk
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DeskStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg px-3 py-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-fg">{value}</p>
    </div>
  );
}

function BrandMark({ name, logoUrl }: { name: string; logoUrl: string }) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(logoUrl) && !failed;
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 font-display text-lg">
      {show ? (
        <img
          src={logoUrl}
          alt={name}
          className="size-11 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initials(name || "Shop")}</span>
      )}
    </span>
  );
}

export function ServiceCards({
  services,
  description,
  niche = "",
  accent = "",
  bookHref,
}: {
  services: StorefrontService[];
  description?: string;
  niche?: string;
  accent?: string;
  bookHref?: string;
}) {
  const slug = shopSlugFromBook(bookHref);
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:px-10">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">The book</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">Services</h2>
        {description ? <p className="mt-4 max-w-xl text-muted">{description}</p> : null}
        <StatusRow />
      </Reveal>
      <Reveal stagger className="mt-8 grid gap-4 lg:grid-cols-12">
        {services.map((service, index) => {
          const previous = services[index - 1];
          const showGroup = service.group && service.group !== previous?.group;
          const span = index % 3 === 0 ? "lg:col-span-7" : index % 3 === 1 ? "lg:col-span-5 lg:mt-10" : "lg:col-span-8 lg:col-start-3";
          const kind = craftKindFor(niche, service.name);
          const body = (
            <>
              <CraftLoop kind={kind} />
              <span className="craft-button-copy">
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-medium text-fg">{service.name}</span>
                  <span className="shrink-0 text-sm">{service.price}</span>
                </span>
                <span className="mt-1 line-clamp-2 text-sm text-muted">{service.description}</span>
              </span>
            </>
          );
          return (
            <div key={service.key} data-spatial="card" className={`min-w-0 ${span}`}>
              {showGroup ? (
                <p className="mb-3 mt-6 text-[11px] uppercase tracking-[0.18em] text-muted">{service.group}</p>
              ) : null}
              {slug ? (
                <Link
                  to="/$shopSlug/book"
                  params={{ shopSlug: slug }}
                  search={{ service: service.key }}
                  className="craft-button"
                  style={accent ? { color: accent } : undefined}
                  aria-label={`${service.name}, ${service.price}`}
                >
                  {body}
                </Link>
              ) : (
                <a href={bookHref || "#book"} className="craft-button" style={accent ? { color: accent } : undefined}>
                  {body}
                </a>
              )}
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}

function StaffRow({ people }: { people: readonly [StorefrontStaff, StorefrontStaff] }) {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">The crew</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">Who takes the book</h2>
        <StatusRow />
      </Reveal>
      <Reveal stagger className="mt-8 grid gap-4 sm:grid-cols-2">
        {people.map((person, index) => {
          const body = (
            <>
              <img src={person.avatarUrl} alt="" className="size-24 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0 py-2 pr-2">
                <p className="font-display text-2xl leading-tight">{person.displayName}</p>
                <p className="text-sm text-muted">{person.title}</p>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{person.bio}</p>
                <StatusPill tone={toneAt(index)} className="mt-3" />
              </div>
            </>
          );
          return (
            <div key={person.key} className="min-w-0">
              <HoloCard className={`hud-card h-full rounded-[24px] p-3 ${index === 1 ? "lg:mt-12" : ""}`}>
                {person.shopSlug && person.employeeId ? (
                  <Link
                    to="/$shopSlug/staff/$employeeId"
                    params={{ shopSlug: person.shopSlug, employeeId: person.employeeId }}
                    className="flex h-full gap-4"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex h-full gap-4">{body}</div>
                )}
              </HoloCard>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}

function HoursBlock({
  hours,
  address,
  contact,
}: {
  hours: Record<string, string>;
  address?: string;
  contact: string;
}) {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
      <Reveal>
        <h2 className="font-display text-3xl">Hours</h2>
        <StatusRow tones={["node", "latency"]} />
        <p className="mt-4 min-h-5 text-sm text-muted">{address || "\u00a0"}</p>
        <p className="mt-1 min-h-5 text-sm text-muted">{contact || "\u00a0"}</p>
      </Reveal>
      <Reveal stagger className="mt-4 grid gap-2 sm:grid-cols-2">
        {WEEKDAYS.map(([key, label], index) => (
          <div key={key} className="min-w-0">
            <HoloCard className="hud-card flex h-full flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm">
              <span>{label}</span>
              <span className="flex min-w-0 items-center gap-2">
                <StatusPill tone={index % 2 === 0 ? "latency" : "node"} />
                <span className="shrink-0 text-muted">{hours[key] || "closed"}</span>
              </span>
            </HoloCard>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
