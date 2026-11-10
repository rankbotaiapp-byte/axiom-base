import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Car, Fence, PawPrint, Sparkles, Zap } from "lucide-react";
import {
  MASTER_CATEGORY_CARDS,
  type MasterCategoryCard,
  type MasterCategoryId,
} from "@/config/MasterCategoryDefaults";
import { CatalogCardVisual, type CardVisualMode } from "@/components/catalog-card-visual";
import { HoloCard } from "@/components/holo-card";
import { MagneticCard } from "@/components/magnetic-card";
import { Reveal } from "@/components/reveal";
import { StatusPill, toneAt } from "@/components/status-pill";
import { PUBLIC_LANDING_MODULE_SLUGS } from "@/config/catalog";
import { STAGED_EXPERIENCES } from "@/lib/axiom/staged-experiences";
import { cn } from "@/lib/utils";

/** Public landing modules — only the newly integrated packs (legacy staged demos stay off the hub). */
const PUBLIC_STAGED_MODULES = STAGED_EXPERIENCES.filter((row) =>
  (PUBLIC_LANDING_MODULE_SLUGS as readonly string[]).includes(row.slug),
);

type View = "cards" | "list" | "strip";

const CATEGORY_ICON = {
  "automotive-mobile": Car,
  "residential-outdoor": Fence,
  "urgent-response": Zap,
  "personal-lifestyle": Sparkles,
  "specialty-local": PawPrint,
} as const;

const VISUAL_MODE_KEY = "axiom.catalog.visualMode";

function readVisualMode(fallback: CardVisualMode): CardVisualMode {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(VISUAL_MODE_KEY);
  return raw === "canvas" || raw === "video" ? raw : fallback;
}

export function AxiomCatalogHub({
  view = "cards",
  className,
  linkTo = "demo",
  /** Tenant `frontendTemplate.animate` — true = video loops, false = interactive Aether pack. */
  animate,
}: {
  view?: View;
  className?: string;
  /** `demo` opens `/demo/$niche`. `onboard` opens `/onboard?niche=`. */
  linkTo?: "demo" | "onboard";
  animate?: boolean;
}) {
  const tenantMode: CardVisualMode = animate === false ? "canvas" : "video";
  const [mode, setMode] = useState<CardVisualMode>(tenantMode);

  useEffect(() => {
    if (typeof animate === "boolean") {
      setMode(animate ? "video" : "canvas");
      return;
    }
    setMode(readVisualMode("video"));
  }, [animate]);

  const setVisualMode = (next: CardVisualMode) => {
    setMode(next);
    if (typeof animate === "boolean") return;
    try {
      window.localStorage.setItem(VISUAL_MODE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const modeToggle =
    typeof animate === "boolean" ? null : (
      <div
        role="tablist"
        aria-label="Card media"
        className="glass-panel mb-4 inline-flex rounded-full p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "video"}
          className={cn(
            "pressable h-9 rounded-full px-3 text-xs",
            mode === "video" ? "bg-fg text-bg" : "text-muted",
          )}
          onClick={() => setVisualMode("video")}
        >
          Video loops
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "canvas"}
          className={cn(
            "pressable h-9 rounded-full px-3 text-xs",
            mode === "canvas" ? "bg-fg text-bg" : "text-muted",
          )}
          onClick={() => setVisualMode("canvas")}
        >
          Interactive canvas
        </button>
      </div>
    );

  if (view === "strip") {
    return (
      <div className={cn("space-y-3", className)}>
        {modeToggle}
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
          {MASTER_CATEGORY_CARDS.map((entry) => (
            <CatalogStripCard key={entry.id} entry={entry} linkTo={linkTo} mode={mode} />
          ))}
        </div>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {modeToggle}
        <Reveal stagger className="grid gap-2">
          {MASTER_CATEGORY_CARDS.map((entry) => {
            const Icon = CATEGORY_ICON[entry.id];
            return (
              <div key={entry.id} className="min-w-0">
                <MagneticCard>
                  <CatalogLink
                    entry={entry}
                    linkTo={linkTo}
                    className="glass-panel lift-card relative flex min-h-20 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 hover:text-fg"
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                      <CatalogCardVisual
                        mode={mode}
                        videoSrc={entry.src}
                        poster={entry.poster}
                        className="absolute inset-0"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="size-3.5 shrink-0" />
                        {entry.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted">{entry.blurb}</span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-faint">
                        {entry.modules.map((m) => m.label).join(" · ")}
                      </span>
                    </span>
                  </CatalogLink>
                </MagneticCard>
              </div>
            );
          })}
        </Reveal>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      <div className="space-y-3">
        {modeToggle}
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00ffcc]/75">Core niches</p>
        <Reveal stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {MASTER_CATEGORY_CARDS.map((entry, index) => {
            const Icon = CATEGORY_ICON[entry.id];
            return (
              <div key={entry.id} className="min-w-0">
                <HoloCard className="glass-panel lift-card h-full overflow-hidden rounded-2xl">
                  <CatalogLink entry={entry} linkTo={linkTo} className="block hover:text-fg">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg">
                      <CatalogCardVisual mode={mode} videoSrc={entry.src} poster={entry.poster} />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
                      <span className="absolute bottom-3 left-3 grid size-10 place-items-center rounded-xl bg-bg/70 backdrop-blur-md">
                        <Icon className="size-4" />
                      </span>
                      {mode === "canvas" ? (
                        <span className="absolute right-3 top-3 rounded-full bg-bg/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent backdrop-blur-md">
                          Aether
                        </span>
                      ) : null}
                    </div>
                    <span className="block p-4">
                      <span className="block text-sm font-medium">{entry.title}</span>
                      <span className="mt-1 block text-sm text-muted">{entry.blurb}</span>
                      <span className="mt-2 flex flex-wrap gap-1">
                        {entry.modules.map((mod) => (
                          <span
                            key={mod.niche}
                            className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted"
                          >
                            {mod.label}
                          </span>
                        ))}
                      </span>
                      <StatusPill tone={toneAt(index)} className="mt-3" />
                    </span>
                  </CatalogLink>
                </HoloCard>
              </div>
            );
          })}
        </Reveal>
      </div>

      {PUBLIC_STAGED_MODULES.length > 0 ? (
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/80">Staged modules</p>
          <Reveal stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PUBLIC_STAGED_MODULES.map((exp, index) => {
              const loop = exp.media.find((m) => /\.mp4$/i.test(m)) ?? "";
              const poster = exp.media.find((m) => /\.(jpe?g|png|webp)$/i.test(m)) ?? "";
              return (
                <div key={exp.slug} className="min-w-0">
                  <HoloCard className="glass-panel lift-card h-full overflow-hidden rounded-2xl">
                    <a href={exp.path} className="block hover:text-fg">
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#030712]">
                        {loop ? (
                          <CatalogCardVisual mode={mode === "canvas" ? "video" : mode} videoSrc={loop} poster={poster} />
                        ) : (
                          <div className="absolute inset-0 bg-[#030712]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/95 via-[#030712]/25 to-transparent" />
                        <span className="absolute right-3 top-3 rounded-full border border-[#00ffcc]/35 bg-[#030712]/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00ffcc] backdrop-blur-md">
                          Module
                        </span>
                      </div>
                      <span className="block p-4">
                        <span className="block text-sm font-medium">{exp.title}</span>
                        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                          {exp.path}
                        </span>
                        <StatusPill tone={toneAt(index + 5)} className="mt-3" />
                      </span>
                    </a>
                  </HoloCard>
                </div>
              );
            })}
          </Reveal>
        </div>
      ) : null}
    </div>
  );
}

function CatalogStripCard({
  entry,
  linkTo,
  mode,
}: {
  entry: MasterCategoryCard;
  linkTo: "demo" | "onboard";
  mode: CardVisualMode;
}) {
  const Icon = CATEGORY_ICON[entry.id];
  return (
    <CatalogLink
      entry={entry}
      linkTo={linkTo}
      className="relative w-72 shrink-0 snap-start overflow-hidden rounded-[24px] bg-surface text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg">
        <CatalogCardVisual mode={mode} videoSrc={entry.src} poster={entry.poster} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
      </div>
      <div className="relative -mt-10 space-y-2 px-4 pb-4 pt-2">
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          <Icon className="size-3.5" />
          Master category
        </span>
        <p className="font-display text-2xl leading-none text-fg">{entry.title}</p>
        <p className="text-sm text-muted">{entry.blurb}</p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-faint">
          {entry.modules.map((m) => m.label).join(" · ")}
        </p>
      </div>
    </CatalogLink>
  );
}

function CatalogLink({
  entry,
  linkTo,
  className,
  children,
}: {
  entry: MasterCategoryCard;
  linkTo: "demo" | "onboard";
  className?: string;
  children: ReactNode;
}) {
  if (linkTo === "onboard") {
    return (
      <Link to="/onboard" search={{ niche: entry.seedNiche }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/demo/$niche" params={{ niche: entry.seedNiche }} className={className}>
      {children}
    </Link>
  );
}

/** Landing selects — five parent categories only. */
export function catalogSelectOptions() {
  return MASTER_CATEGORY_CARDS.map((row) => ({ value: row.seedNiche, label: row.title }));
}

export function isLandingCategory(id: string): id is MasterCategoryId {
  return MASTER_CATEGORY_CARDS.some((row) => row.id === id);
}
