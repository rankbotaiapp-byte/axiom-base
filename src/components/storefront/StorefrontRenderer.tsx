"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { BeforeAfterProject, TenantStorefrontConfig } from "@/lib/schemas/tenant";
import { ConversionDrawer } from "./ConversionDrawer";
import { HeroMediaSlot } from "./HeroMediaSlot";
import { UnlockCheckoutButton } from "./UnlockCheckoutButton";
import type { UnlockPhase } from "@/lib/axiom/hydrate-storefront";

type StorefrontRendererProps = {
  config: TenantStorefrontConfig;
  initialUrgency?: boolean;
  phase?: UnlockPhase;
};

type DrawerRequest = {
  serviceId: string | null;
  urgency: boolean;
};

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function StorefrontRenderer({ config, initialUrgency = false, phase = "published" }: StorefrontRendererProps) {
  const [drawer, setDrawer] = useState<DrawerRequest | null>(initialUrgency ? { serviceId: null, urgency: true } : null);
  const { theme, conversion, trust } = config;
  const style = {
    "--canvasBg": theme.canvasBg || "#050507",
    "--surfaceBg": theme.surfaceBg || "#0B0D12",
    "--primaryAccent": theme.primaryAccent,
    "--secondaryAccent": theme.secondaryAccent,
    "--ringColor": theme.ringColor || theme.primaryAccent,
    "--callCta": theme.callCta || theme.secondaryAccent,
    backgroundColor: "var(--canvasBg)",
    color: "#f4f7fb",
  } as CSSProperties;

  function openBooking(serviceId: string | null = null) {
    setDrawer({ serviceId, urgency: false });
  }

  function openEmergency(serviceId: string | null = null) {
    setDrawer({ serviceId, urgency: true });
  }

  return (
    <div style={style} className="min-h-dvh bg-[#050507] text-[#f4f7fb]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--canvasBg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight sm:text-base">{config.businessName}</p>
            <p className="truncate text-[11px] uppercase tracking-[0.16em] text-white/55">
              <span className="text-[var(--primaryAccent)]">{config.licenseBadge}</span>
              <span className="px-1 text-white/30">·</span>
              <a href={telHref(conversion.displayPhone)} className="text-white/80 normal-case tracking-normal">
                {conversion.displayPhone}
              </a>
            </p>
          </div>
          {phase === "locked" ? (
            <UnlockCheckoutButton
              slug={config.slug}
              businessName={config.businessName}
              phone={conversion.displayPhone}
              email={conversion.notificationEmail}
              city={conversion.serviceCities[0]}
            />
          ) : phase === "draft" ? (
            <a href={`/${config.slug}/admin?unlocked=1`} className="rounded-full border border-[var(--primaryAccent)] px-3 py-2 text-sm font-semibold text-[var(--primaryAccent)]">
              Edit in Studio
            </a>
          ) : (
            <button
              type="button"
              onClick={() => openBooking()}
              className="rounded-full bg-[var(--primaryAccent)] px-3 py-2 text-sm font-semibold text-[#050507]"
            >
              {conversion.primaryCtaLabel}
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--primaryAccent)]">{config.hero.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">{config.hero.headline}</h1>
            <p className="mt-4 max-w-xl text-base text-white/75">{config.hero.subheadline}</p>
            <p className="mt-4 inline-flex rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/80">
              {config.hero.responseSlaBadge}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openBooking()}
                className="rounded-full bg-[var(--primaryAccent)] px-5 py-3 text-sm font-semibold text-[#050507]"
              >
                {config.hero.primaryCtaLabel}
              </button>
              {config.hero.secondaryCtaLabel ? (
                <button
                  type="button"
                  onClick={() => openEmergency()}
                  className="rounded-full border border-[var(--secondaryAccent)] px-5 py-3 text-sm font-semibold text-[var(--secondaryAccent)]"
                >
                  {config.hero.secondaryCtaLabel}
                </button>
              ) : null}
            </div>
          </div>
          <HeroMediaSlot
            media={config.hero.media}
            className="relative aspect-[4/5] min-h-[320px] overflow-hidden rounded-3xl border border-white/10 sm:aspect-[5/4]"
          />
        </section>

        <section className="border-y border-white/10 bg-[var(--surfaceBg)]">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
            <TrustFact label="License" value={trust.licenseNumber || "On file"} />
            <TrustFact label="Coverage" value={trust.insuredAndBonded ? "Insured & bonded" : "Ask for proof"} />
            <TrustFact label="Years" value={String(trust.yearsInBusiness)} />
            <TrustFact label="Warranty" value={trust.warrantyHeadline} />
            <TrustFact
              label={trust.ratingSummary.label}
              value={`${trust.ratingSummary.score.toFixed(1)} · ${trust.ratingSummary.count}`}
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">Services</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {config.services.map((service) => (
              <article key={service.id} className="rounded-2xl border border-white/10 bg-[var(--surfaceBg)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  {service.isEmergencyEligible ? (
                    <span className="shrink-0 rounded-full border border-[var(--secondaryAccent)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--secondaryAccent)]">
                      Emergency
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-white/70">{service.summary}</p>
                <p className="mt-3 text-sm text-white/85">
                  {service.startingPriceLabel}
                  <span className="text-white/40"> · </span>
                  {service.estimatedDuration}
                </p>
                <button
                  type="button"
                  onClick={() => (service.isEmergencyEligible ? openEmergency(service.id) : openBooking(service.id))}
                  className="mt-4 rounded-full border border-[var(--primaryAccent)] px-4 py-2 text-sm font-semibold text-[var(--primaryAccent)]"
                >
                  {service.isEmergencyEligible ? conversion.emergencyCtaLabel : conversion.primaryCtaLabel}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="text-2xl font-semibold tracking-tight">Proof of work</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {config.projects.map((project) => (
              <CompareCard key={project.id} project={project} />
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {config.testimonials.map((item) => (
              <blockquote key={item.id} className="rounded-2xl border border-white/10 bg-[var(--surfaceBg)] p-4">
                <p className="text-sm leading-relaxed text-white/85">“{item.quote}”</p>
                <footer className="mt-3 text-xs uppercase tracking-[0.14em] text-white/50">
                  {item.author}
                  {item.detail ? ` · ${item.detail}` : ""}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[var(--surfaceBg)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
            <h2 className="text-xl font-semibold">Service area</h2>
            <ul className="flex flex-wrap gap-2">
              {conversion.serviceCities.map((city) => (
                <li key={city} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/80">
                  {city}
                </li>
              ))}
            </ul>
            <a href={telHref(conversion.displayPhone)} className="text-lg font-semibold text-[var(--primaryAccent)]">
              {conversion.displayPhone}
            </a>
            <a href={`mailto:${conversion.notificationEmail}`} className="text-sm text-white/60">
              {conversion.notificationEmail}
            </a>
            <button
              type="button"
              onClick={() => openBooking()}
              className="w-full rounded-full bg-[var(--primaryAccent)] px-5 py-3 text-sm font-semibold text-[#050507] sm:w-fit"
            >
              {conversion.primaryCtaLabel}
            </button>
          </div>
        </footer>
      </main>

      <ConversionDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        config={config}
        serviceId={drawer?.serviceId ?? null}
        urgency={drawer?.urgency ?? false}
      />
    </div>
  );
}

function TrustFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="truncate text-sm font-medium text-white/90">{value}</p>
    </div>
  );
}

function CompareCard({ project }: { project: BeforeAfterProject }) {
  const [split, setSplit] = useState(52);
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--surfaceBg)]">
      <div className="relative aspect-[4/5] sm:aspect-[5/4]">
        <img src={project.beforeUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={project.afterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 0 0 ${split}%)` }}
        />
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${split}%` }}>
          <span className="absolute top-0 h-full w-px -translate-x-1/2 bg-[var(--primaryAccent)]" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-[var(--canvasBg)]/80 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">Before</span>
        <span className="absolute right-3 top-3 rounded-full bg-[var(--canvasBg)]/80 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">After</span>
        <label className="absolute inset-x-3 bottom-3">
          <span className="sr-only">Compare before and after for {project.title}</span>
          <input
            type="range"
            min={8}
            max={92}
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            className="w-full accent-[var(--primaryAccent)]"
          />
        </label>
      </div>
      <figcaption className="p-4">
        <p className="font-semibold">{project.title}</p>
        {project.summary ? <p className="mt-1 text-sm text-white/65">{project.summary}</p> : null}
      </figcaption>
    </figure>
  );
}
