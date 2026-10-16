import { useRef, useState, type ReactNode } from "react";
import { HeroTextCanvas } from "@/components/hero-text-canvas";
import { Link } from "@tanstack/react-router";
import { CinematicHero } from "@/components/cinematic-hero";
import { HoloCard } from "@/components/holo-card";
import { Reveal } from "@/components/reveal";
import { StatusPill, StatusRow, toneAt } from "@/components/status-pill";
import type { HeroTone } from "@/lib/axiom/media";
import type { IntroPreset } from "@/lib/axiom/intro";
import { WEEKDAYS } from "@/lib/axiom/niches";
import { DEFAULT_HUD, hudVars, type HeroLayerId, type HeroTextLayer, type StorefrontHud } from "@/lib/axiom/hud";
import { HeroSpatial } from "@/components/hero-spatial";
import { formatPhone, initials } from "@/lib/utils";

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
  hud = DEFAULT_HUD,
  headline = "",
  layoutEditable = false,
  activeLayer = "headline",
  onActiveLayer,
  onLayerChange,
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
  heroVideoUrl: string | null;
  blendPercent: number;
  introPreset?: IntroPreset;
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
  hud?: StorefrontHud;
  headline?: string;
  layoutEditable?: boolean;
  activeLayer?: HeroLayerId;
  onActiveLayer?: (id: HeroLayerId) => void;
  onLayerChange?: (id: HeroLayerId, layer: HeroTextLayer, persist: boolean) => void;
}) {
  const contact = [contactName, contactPhone ? formatPhone(contactPhone) : "", contactEmail].filter(Boolean).join(" · ");
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={stageRef}
      className="storefront-stage"
      data-neon="on"
      data-wash={hud.wash}
      data-rim={hud.rim ? "on" : "off"}
      data-scan={hud.scan ? "on" : "off"}
      style={hudVars(hud, accent)}
    >
      <HeroSpatial rootRef={stageRef} />
      <CinematicHero
        imageUrl={heroImageUrl}
        videoUrl={heroVideoUrl}
        blendPercent={blendPercent}
        introPreset={introPreset}
        introSpeed={introSpeed}
        introIntensity={introIntensity}
        tone={tone ?? null}
        fallbackImageUrl={fallbackImageUrl}
        fallbackVideoUrl={fallbackVideoUrl}
      >
        <div className="hero-scrim pointer-events-none absolute inset-x-0 top-0 z-0 h-40" aria-hidden />
        <div data-spatial="nav" className="relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark name={businessName} logoUrl={logoUrl ?? ""} />
            {header}
          </div>
          <p className="hidden max-w-xs truncate text-right text-sm text-muted sm:block">{contact || "\u00a0"}</p>
        </div>
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
      <div className="hero-contact" aria-hidden />

      <ServiceCards services={services} description={description} />
      <StaffRow people={staff} />
      {hours ? <HoursBlock hours={hours} address={address} contact={contact} /> : null}
      {extra}
      {footer}
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
}: {
  services: StorefrontService[];
  description?: string;
}) {
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
          return (
            <div key={service.key} data-spatial="card" className={`min-w-0 ${span}`}>
              {showGroup ? (
                <p className="mb-3 mt-6 text-[11px] uppercase tracking-[0.18em] text-muted">{service.group}</p>
              ) : null}
              <HoloCard className="hud-card h-full rounded-[24px] px-5 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium">{service.name}</p>
                  <p className="shrink-0 text-sm text-muted">{service.price}</p>
                </div>
                <p className="mt-1 text-sm text-muted">{service.description}</p>
                <StatusPill tone={toneAt(index)} className="mt-3" />
              </HoloCard>
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
