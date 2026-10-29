import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CATALOG, catalogFilmUrl, type CatalogNiche } from "@/config/catalog";
import { LoopVideo } from "@/components/cinematic-hero";
import { HoloCard } from "@/components/holo-card";
import { MagneticCard } from "@/components/magnetic-card";
import { Reveal } from "@/components/reveal";
import { StatusPill, toneAt } from "@/components/status-pill";
import { nicheIcon } from "@/components/niche-icon";
import { cn } from "@/lib/utils";

type View = "cards" | "list" | "strip";

export function AxiomCatalogHub({
  view = "cards",
  className,
  linkTo = "demo",
}: {
  view?: View;
  className?: string;
  /** `demo` opens `/demo/$niche`. `onboard` opens `/onboard?niche=`. */
  linkTo?: "demo" | "onboard";
}) {
  if (view === "strip") {
    return (
      <div className={cn("flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3", className)}>
        {CATALOG.map((entry) => (
          <CatalogStripCard key={entry.id} niche={entry.id} linkTo={linkTo} />
        ))}
      </div>
    );
  }

  if (view === "list") {
    return (
      <Reveal stagger className={cn("grid gap-2", className)}>
        {CATALOG.map((entry) => (
          <div key={entry.id} className="min-w-0">
            <MagneticCard>
              <CatalogLink
                niche={entry.id}
                linkTo={linkTo}
                className="glass-panel lift-card relative flex min-h-20 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 hover:text-fg"
              >
                <FilmThumb niche={entry.id} className="size-14 shrink-0 rounded-xl" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{entry.label}</span>
                  <span className="mt-1 block text-sm text-muted">{entry.blurb}</span>
                </span>
              </CatalogLink>
            </MagneticCard>
          </div>
        ))}
      </Reveal>
    );
  }

  return (
    <Reveal stagger className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {CATALOG.map((entry, index) => {
        const Icon = nicheIcon(entry.id);
        return (
          <div key={entry.id} className="min-w-0">
            <HoloCard className="glass-panel lift-card h-full overflow-hidden rounded-2xl">
              <CatalogLink niche={entry.id} linkTo={linkTo} className="block hover:text-fg">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg">
                  <LoopVideo
                    src={catalogFilmUrl(entry.id)}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
                  <span className="absolute bottom-3 left-3 grid size-10 place-items-center rounded-xl bg-bg/70 backdrop-blur">
                    <Icon className="size-4" />
                  </span>
                </div>
                <span className="block p-4">
                  <span className="block text-sm font-medium">{entry.label}</span>
                  <span className="mt-1 block text-sm text-muted">{entry.blurb}</span>
                  <StatusPill tone={toneAt(index)} className="mt-3" />
                </span>
              </CatalogLink>
            </HoloCard>
          </div>
        );
      })}
    </Reveal>
  );
}

function CatalogStripCard({
  niche,
  linkTo,
}: {
  niche: CatalogNiche;
  linkTo: "demo" | "onboard";
}) {
  const entry = CATALOG.find((row) => row.id === niche)!;
  const Icon = nicheIcon(niche);
  return (
    <CatalogLink
      niche={niche}
      linkTo={linkTo}
      className="relative w-72 shrink-0 snap-start overflow-hidden rounded-[24px] bg-surface text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <LoopVideo src={catalogFilmUrl(niche)} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
      </div>
      <div className="relative -mt-10 space-y-2 px-4 pb-4 pt-2">
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          <Icon className="size-3.5" />
          {entry.label}
        </span>
        <p className="font-display text-2xl leading-none text-fg">{entry.label}</p>
        <p className="text-sm text-muted">{entry.blurb}</p>
      </div>
    </CatalogLink>
  );
}

function FilmThumb({ niche, className }: { niche: CatalogNiche; className?: string }) {
  return (
    <span className={cn("relative overflow-hidden bg-bg", className)}>
      <LoopVideo src={catalogFilmUrl(niche)} className="absolute inset-0 h-full w-full object-cover" />
    </span>
  );
}

function CatalogLink({
  niche,
  linkTo,
  className,
  children,
}: {
  niche: CatalogNiche;
  linkTo: "demo" | "onboard";
  className?: string;
  children: ReactNode;
}) {
  if (linkTo === "onboard") {
    return (
      <Link to="/onboard" search={{ niche }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/demo/$niche" params={{ niche }} className={className}>
      {children}
    </Link>
  );
}

/** Options for selects — verified catalog only. */
export function catalogSelectOptions() {
  return CATALOG.map((row) => ({ value: row.id, label: row.label }));
}
