"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  CATALOG,
  CATALOG_BY_ID,
  isCatalogNiche,
  tradeLoopUrl,
  type CatalogNiche,
} from "@/config/catalog";
import { Magnetic } from "@/components/magnetic";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  clearInboundPending,
  readInboundPending,
  writeInboundPending,
} from "@/lib/axiom/inbound-signup";
import { createShopFromNiche } from "@/lib/axiom/server";
import { cn } from "@/lib/utils";

/** Quick-pick trades shown before expanding the full catalog. */
export const HERO_FEATURED_NICHES = [
  { id: "plumbing", label: "Plumbing" },
  { id: "auto", label: "Auto" },
  { id: "contractor", label: "Construction" },
  { id: "barber", label: "Barber" },
] as const satisfies ReadonlyArray<{ id: CatalogNiche; label: string }>;

const FEATURED_IDS = new Set<CatalogNiche>(HERO_FEATURED_NICHES.map((row) => row.id));

function displayLabel(id: CatalogNiche): string {
  if (id === "contractor") return "Construction";
  return CATALOG_BY_ID[id]?.label ?? id;
}

type InboundSignupProps = {
  className?: string;
  /** Auto-focus the business name field in the hero. */
  autoFocus?: boolean;
};

/**
 * Spontaneous inbound CTA: business name + any catalog niche → provision shop → brand studio.
 * Uses existing `createShopFromNiche` (auth-gated). Unsigned visitors stash intent and sign in first.
 */
export function InboundSignup({ className, autoFocus = false }: InboundSignupProps) {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const nameId = useId();
  const nicheId = useId();
  const searchId = useId();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState<CatalogNiche>("plumbing");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const filteredCatalog = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = CATALOG.filter((row) => !FEATURED_IDS.has(row.id));
    if (!needle) return rows;
    return CATALOG.filter((row) => {
      const hay = `${row.id} ${row.label} ${row.blurb}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query]);

  const nicheCount = CATALOG.length;

  async function provision(businessName: string, selected: CatalogNiche) {
    setBusy(true);
    setError(null);
    try {
      const result = await createShopFromNiche({
        data: {
          niche: selected,
          name: businessName.trim(),
          solo: true,
          ownerName: user?.displayName ?? "",
          heroFilm: tradeLoopUrl(selected),
        },
      });
      clearInboundPending();
      await navigate({
        to: "/$shopSlug/admin/brand-studio",
        params: { shopSlug: result.slug },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate your app");
      setBusy(false);
    }
  }

  // Resume after `/login?next=/` once the visitor is signed in.
  useEffect(() => {
    if (isPending || !user || resuming || busy) return;
    const pending = readInboundPending();
    if (!pending || !isCatalogNiche(pending.niche)) return;
    setResuming(true);
    setName(pending.name);
    setNiche(pending.niche);
    void provision(pending.name, pending.niche);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot resume
  }, [busy, isPending, resuming, user]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter your business name");
      return;
    }
    if (!isCatalogNiche(niche)) {
      setError("Select a trade niche");
      return;
    }
    setError(null);
    if (!user) {
      writeInboundPending({ name: trimmed, niche });
      if (typeof window !== "undefined") {
        window.location.assign(`/login?next=${encodeURIComponent("/")}`);
      }
      return;
    }
    void provision(trimmed, niche);
  }

  function pickNiche(selected: CatalogNiche) {
    setNiche(selected);
    setError(null);
    if (!FEATURED_IDS.has(selected)) setExpanded(true);
  }

  return (
    <Magnetic className={cn("relative z-0 block w-full max-w-xl shrink-0", className)}>
      <div className="instant-preview-shell">
        <form
          onSubmit={onSubmit}
          className={cn(
            "glass-card relative overflow-hidden rounded-[1.05rem] p-3 backdrop-blur-md sm:p-4",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
          )}
          aria-busy={busy || resuming}
        >
          <span className="film-bracket film-bracket-nw text-accent" aria-hidden />
          <span className="film-bracket film-bracket-ne text-amber" aria-hidden />
          <span className="film-bracket film-bracket-sw text-amber" aria-hidden />
          <span className="film-bracket film-bracket-se text-accent" aria-hidden />

          <div className="relative z-[1] space-y-3 px-1 pt-2 sm:px-1.5 sm:pt-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/85">
                Instant preview · {nicheCount} trades
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber/80">
                {displayLabel(niche)}
              </span>
            </div>

            <label htmlFor={nameId} className="sr-only">
              Business name
            </label>
            <input
              id={nameId}
              type="text"
              autoFocus={autoFocus}
              autoComplete="organization"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your business name"
              disabled={busy || resuming}
              className={cn(
                "h-12 w-full rounded-xl border border-line bg-obsidian/85 px-4 text-sm text-fg outline-none",
                "placeholder:text-faint backdrop-blur-md transition-[border-color,box-shadow] duration-200",
                "focus:border-accent/60 focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_35%,transparent),0_0_24px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]",
                "disabled:opacity-60",
              )}
            />

            <fieldset disabled={busy || resuming} className="min-w-0">
              <legend className="sr-only">Trade niche</legend>
              <p id={nicheId} className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Select trade
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-labelledby={nicheId}>
                {HERO_FEATURED_NICHES.map((row) => {
                  const active = niche === row.id;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => pickNiche(row.id)}
                      className={cn(
                        "trade-chip inline-flex h-11 items-center justify-center rounded-xl border px-2 text-center text-xs font-medium backdrop-blur-md",
                        active
                          ? "border-accent/70 bg-accent/12 text-fg shadow-[0_0_22px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]"
                          : "border-line bg-obsidian/55 text-muted",
                      )}
                    >
                      {row.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((open) => !open)}
                className={cn(
                  "trade-chip mt-3 inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-obsidian/55 px-3 backdrop-blur-md",
                  "font-mono text-[10px] uppercase tracking-[0.18em] text-muted hover:text-fg",
                )}
              >
                <span>{expanded ? "Hide full catalog" : `Browse all ${nicheCount} niches`}</span>
                <ChevronDown
                  className={cn("size-4 text-accent transition-transform duration-200", expanded && "rotate-180")}
                  aria-hidden
                />
              </button>

              {expanded ? (
                <div className="mt-3 space-y-2 rounded-xl border border-line/80 bg-obsidian/70 p-2.5 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-fg)_8%,transparent),0_12px_32px_color-mix(in_srgb,var(--color-obsidian)_40%,transparent)] backdrop-blur-md">
                  <label htmlFor={searchId} className="sr-only">
                    Search trades
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" aria-hidden />
                    <input
                      id={searchId}
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search HVAC, roofing, landscaping…"
                      autoComplete="off"
                      className={cn(
                        "h-10 w-full rounded-lg border border-line bg-obsidian/90 pl-9 pr-3 text-sm text-fg outline-none",
                        "placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-accent/50 focus:shadow-[0_0_18px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]",
                      )}
                    />
                  </div>
                  <div
                    className="max-h-48 overflow-y-auto overscroll-contain sm:max-h-56"
                    role="listbox"
                    aria-label="All Axiom niches"
                  >
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {filteredCatalog.map((row) => {
                        const active = niche === row.id;
                        return (
                          <button
                            key={row.id}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => pickNiche(row.id)}
                            className={cn(
                              "trade-chip rounded-lg border px-3 py-2.5 text-left backdrop-blur-sm",
                              active
                                ? "border-accent/65 bg-accent/10 text-fg shadow-[0_0_18px_color-mix(in_srgb,var(--color-accent)_16%,transparent)]"
                                : "border-transparent bg-transparent text-muted",
                            )}
                          >
                            <span className="block text-xs font-medium text-fg">{displayLabel(row.id)}</span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-muted line-clamp-2">{row.blurb}</span>
                          </button>
                        );
                      })}
                    </div>
                    {filteredCatalog.length === 0 ? (
                      <p className="px-2 py-4 text-center text-xs text-muted">No trades match that search.</p>
                    ) : null}
                  </div>
                  <p className="px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    Every local trade on the book — pick yours
                  </p>
                </div>
              ) : null}
            </fieldset>

            <button
              type="submit"
              disabled={busy || isPending || resuming}
              className={cn(
                "inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold",
                "bg-fg text-bg transition-[transform,opacity,box-shadow] duration-200 disabled:opacity-60",
                "hover:opacity-95 hover:shadow-[0_0_28px_color-mix(in_srgb,var(--color-fg)_18%,transparent)]",
                "active:scale-[0.985]",
              )}
            >
              {busy || resuming ? "Provisioning storefront…" : "Generate my storefront"}
            </button>

            {busy || resuming ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent/80">
                Claiming niche · wiring booking desk…
              </p>
            ) : null}
          </div>
        </form>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </Magnetic>
  );
}
