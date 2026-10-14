import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { CinematicHero } from "@/components/cinematic-hero";
import { ProofGallery } from "@/components/proof-gallery";
import { Wordmark } from "@/components/shop-chrome";
import { defaultProof } from "@/lib/axiom/gallery";
import { presetForShopNiche } from "@/config/nichePresets";
import { NICHE_MEDIA } from "@/lib/axiom/media";
import {
  DEFAULT_HOURS,
  formatOffer,
  NICHES,
  nicheCopy,
  PUBLIC_NICHE_ORDER,
  WEEKDAYS,
} from "@/lib/axiom/niches";
import { isShopNiche, type ShopNiche } from "@/lib/axiom/types";
import { initials } from "@/lib/utils";

const SAMPLE_TIMES = ["9:00 AM", "10:30 AM", "1:00 PM", "3:30 PM"];

export const Route = createFileRoute("/demo/$niche")({
  loader: ({ params }) => {
    const niche = params.niche;
    if (!isShopNiche(niche) || niche === "trade" || !PUBLIC_NICHE_ORDER.includes(niche)) throw notFound();
    return { niche };
  },
  component: NicheDemo,
  notFoundComponent: DemoMissing,
});

function claimSearch(niche: ShopNiche) {
  return { niche } as const;
}

function NicheDemo() {
  const { niche } = Route.useLoaderData();
  const template = NICHES[niche];
  const media = NICHE_MEDIA[niche];
  const copy = nicheCopy(niche);
  const bookLabel = presetForShopNiche(niche).bookingCta || copy.bookLabel;
  const hasOwnFilm = Boolean(template.heroVideoUrl || template.heroImageUrl);
  const videoUrl = template.heroVideoUrl || (hasOwnFilm ? "" : NICHE_MEDIA.trade.heroVideoUrl);
  const imageUrl = template.heroImageUrl || NICHE_MEDIA.trade.heroImageUrl;
  const hours = template.hours ?? DEFAULT_HOURS;
  const [picked, setPicked] = useState<{ service: string; time: string } | null>(null);
  const navigate = useNavigate();

  return (
    <main className="min-h-dvh bg-bg pb-28">
      <CinematicHero
        imageUrl={imageUrl}
        videoUrl={videoUrl || null}
        blendPercent={template.heroBlendPercent}
        introPreset={template.introPreset}
        introSpeed={template.introSpeed}
        introIntensity={template.introIntensity}
        tone={media.tone ?? null}
        fallbackImageUrl={NICHE_MEDIA.trade.heroImageUrl}
        fallbackVideoUrl={NICHE_MEDIA.trade.heroVideoUrl}
      >
        <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-10">
          <Wordmark />
          <label className="min-w-0">
            <span className="sr-only">Explore all industries</span>
            <select
              className="h-11 max-w-48 rounded-xl bg-surface/80 px-3 text-sm text-fg"
              value={niche}
              onChange={(event) => {
                const next = event.target.value;
                if (!isShopNiche(next) || next === "trade") return;
                void navigate({ to: "/demo/$niche", params: { niche: next } });
              }}
            >
              {PUBLIC_NICHE_ORDER.map((key) => (
                <option key={key} value={key}>
                  {NICHES[key].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-auto px-5 pb-16 pt-24 sm:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Live preview · {template.label}</p>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(3rem,10vw,6rem)] leading-[0.92]">
            {template.defaultName}
          </h1>
          <p className="mt-4 max-w-lg text-base text-fg/80 sm:text-lg">{template.tagline}</p>
          <a href="#book" className="glass-btn mt-8 inline-flex h-12 items-center rounded-xl px-5 text-sm font-medium">
            {bookLabel}
          </a>
        </div>
      </CinematicHero>

      <ProofGallery
        heading={copy.gallery}
        frames={defaultProof(niche)}
        note="Sample album for this trade. A claimed shop replaces it with the owner’s photos."
      />

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.menuKicker}</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">{copy.menuHeading}</h2>
        <p className="mt-4 max-w-xl text-muted">{template.description}</p>
        <ul className="mt-8 grid gap-3">
          {template.services.map((service, index) => {
            const previous = template.services[index - 1];
            const showGroup = service.group && service.group !== previous?.group;
            return (
              <li key={`${service.name}-${index}`}>
                {showGroup ? (
                  <p className="mb-3 mt-6 text-[11px] uppercase tracking-[0.18em] text-muted">{service.group}</p>
                ) : null}
                <div className="rounded-[24px] bg-surface px-5 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-medium">{service.name}</p>
                    <p className="shrink-0 text-sm text-muted">{formatOffer(service)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{service.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="book" className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.timeStep}</p>
        <h2 className="mt-2 font-display text-3xl">{copy.timeHint}</h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          These times show the book. They are not held. Claim the storefront to take real requests.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {template.services.slice(0, 4).map((service) => (
            <button
              key={service.name}
              type="button"
              className="h-11 rounded-xl px-4 text-sm"
              style={{
                boxShadow:
                  picked?.service === service.name
                    ? "0 0 0 1px var(--color-fg)"
                    : "0 0 0 1px rgba(243,241,235,0.1)",
              }}
              onClick={() => setPicked({ service: service.name, time: picked?.time ?? SAMPLE_TIMES[0] })}
            >
              {service.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              className="h-11 rounded-xl px-4 text-sm"
              style={{
                boxShadow:
                  picked?.time === time ? "0 0 0 1px var(--color-fg)" : "0 0 0 1px rgba(243,241,235,0.1)",
              }}
              onClick={() =>
                setPicked({
                  service: picked?.service ?? template.services[0]?.name ?? template.label,
                  time,
                })
              }
            >
              {time}
            </button>
          ))}
        </div>
        {picked ? (
          <p className="mt-4 text-sm text-muted">
            {picked.service} · {picked.time}. Claim the storefront to accept this on a real book.
          </p>
        ) : null}
      </section>

      {template.employees.length > 0 ? (
        <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.bench}</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">{copy.heading}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {template.employees.map((person) => (
              <div
                key={person.displayName}
                className="flex gap-4 rounded-[24px] bg-surface p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
              >
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt="" className="size-24 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-surface-2 font-display text-2xl">
                    {initials(person.displayName || "Staff")}
                  </div>
                )}
                <div className="py-2 pr-2">
                  <p className="font-display text-2xl leading-tight">{person.displayName}</p>
                  <p className="text-sm text-muted">{person.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{person.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
        <h2 className="font-display text-3xl">Hours</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {WEEKDAYS.map(([key, label]) => (
            <li key={key} className="flex justify-between rounded-xl bg-surface px-4 py-3 text-sm">
              <span>{label}</span>
              <span className="text-muted">{hours[key] || "closed"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">{template.address}</p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-bg/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-1px_0_rgba(243,241,235,0.08)] sm:pl-36">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {template.label} preview. The film, services, and book are this trade’s.
          </p>
          <Link
            to="/onboard"
            search={claimSearch(niche)}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg"
          >
            Claim This Storefront for Your Business
          </Link>
        </div>
      </div>
    </main>
  );
}

function DemoMissing() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div>
        <p className="font-display text-3xl">That industry is not on the book.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted hover:text-fg">
          Back to Axiom
        </Link>
      </div>
    </main>
  );
}
