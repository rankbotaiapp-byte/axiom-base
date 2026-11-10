import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { CinematicHero } from "@/components/cinematic-hero";
import { defaultHeroSrcForNiche } from "@/config/NicheRegistry";
import {
  filterHistoricalHeroArchive,
  historicalArchiveCollections,
  type HistoricalHeroAsset,
} from "@/lib/axiom/historical-hero-archive";
import { shopTradeLabel } from "@/lib/axiom/niches";
import { readMasterTelemetry } from "@/lib/axiom/hero-films";
import { writeHeroDraft } from "@/lib/axiom/hero-studio-state";
import { revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

const FILTERS = () =>
  historicalArchiveCollections().map((id) => ({
    id,
    label: id === "all" ? "All" : id,
  }));

export function HeroLibraryBench({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload?: () => void;
}) {
  const router = useRouter();
  const fallback = defaultHeroSrcForNiche(shop.niche);
  const live = shop.heroVideoUrl?.split("?")[0] || fallback;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(live);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const filters = useMemo(() => FILTERS(), []);
  const rows = useMemo(() => filterHistoricalHeroArchive(query, filter), [filter, query]);

  const active = rows.find((item) => item.src === selected) ?? filterHistoricalHeroArchive("", "all").find((item) => item.src === selected);
  const pinned = selected === live;

  async function pin() {
    if (readonly && !shop.isShowcase) {
      setStatus("Preview only. A shop you own can pin this loop.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await updateShopBrand({
        data: {
          slug: shop.slug,
          heroFilm: selected,
          overrideHeroVideoUrl: selected,
          markHero: true,
        },
      });
      writeHeroDraft(shop.slug, { hero_video_url: selected, tagline: shop.tagline });
      try {
        await revalidateStorefront({ data: shop.slug });
      } catch {
        /* hosted cache is optional */
      }
      await router.invalidate();
      setStatus("Pinned to the live storefront.");
      onReload?.();
    } catch {
      try {
        writeHeroDraft(shop.slug, { hero_video_url: selected, tagline: shop.tagline });
        setStatus("Pinned on this desk. The hosted book did not take the write.");
      } catch {
        setStatus("That loop did not save.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Hero animation library</p>
        <h2 className="mt-1 font-display text-3xl text-fg">Live test-bench</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Click a loop to preview it on {shop.name}. Pin writes the shop override and the public page picks it up.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search loops"
            className="glass-field h-11 min-w-0 flex-1 rounded-xl px-3 text-sm"
          />
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Library collections">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={cn(
                  "h-11 rounded-full px-3 text-sm",
                  filter === item.id ? "bg-fg text-bg" : "text-muted shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_12%,transparent)]",
                )}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid max-h-[36rem] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              selected={item.src === selected}
              live={item.src === live}
              onSelect={() => setSelected(item.src)}
            />
          ))}
        </div>
        {rows.length === 0 ? <p className="mt-4 text-sm text-muted">No loops in that filter.</p> : null}
      </div>

      <aside className="min-w-0">
        <div
          className="relative overflow-hidden rounded-[28px] bg-bg shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_10%,transparent)]"
          style={{ ["--neon" as string]: shop.neonAccent || shop.ringColor }}
        >
          <div className="relative aspect-[9/16] max-h-[36rem] w-full sm:aspect-[16/10] xl:aspect-[9/16]">
            <CinematicHero
              key={selected}
              imageUrl=""
              videoUrl={selected}
              blendPercent={shop.heroBlendPercent}
              introPreset={shop.introPreset}
              introSpeed={shop.introSpeed}
              introIntensity={shop.introIntensity}
              previewMode
              brand={{
                name: shop.name,
                accent: shop.neonAccent || shop.ringColor,
                city: shop.address,
                trade: shopTradeLabel(shop),
              }}
              telemetry={readMasterTelemetry()}
              hud={shop.heroHud}
              bookHref={`/${shop.slug}/book`}
              className="absolute inset-0 min-h-full"
              shopConfig={{ overrideHeroVideoUrl: selected, heroVideoUrl: shop.heroVideoUrl, niche: shop.niche }}
            >
              <p className="pointer-events-none absolute bottom-4 left-4 max-w-[12rem] font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                Live storefront
              </p>
            </CinematicHero>
          </div>
        </div>
        <p className="mt-3 text-sm text-fg">{active?.name ?? "Loop"}</p>
        <p className="text-sm text-muted">
          {active?.collection}
        </p>
        <button
          type="button"
          disabled={busy || pinned}
          onClick={() => void pin()}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-fg px-4 text-sm font-medium text-bg disabled:opacity-50"
        >
          {pinned ? "Pinned to my storefront" : "Pin to my storefront"}
        </button>
        {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
      </aside>
    </section>
  );
}

function LibraryCard({
  item,
  selected,
  live,
  onSelect,
}: {
  item: HistoricalHeroAsset;
  selected: boolean;
  live: boolean;
  onSelect: () => void;
}) {
  const still = item.thumbnail && !item.thumbnail.endsWith(".mp4") ? item.thumbnail : "";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "overflow-hidden rounded-2xl bg-surface-2 text-left shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_10%,transparent)]",
        selected && "shadow-[0_0_0_2px_var(--color-accent)]",
      )}
    >
      <span className="relative block aspect-video overflow-hidden bg-bg">
        {still ? (
          <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Loop
          </span>
        )}
      </span>
      <span className="block px-2 py-2">
        <span className="block truncate text-sm text-fg">{item.name}</span>
        <span className="block text-[11px] uppercase tracking-[0.14em] text-muted">
          {live ? "Live pin" : item.collection}
        </span>
      </span>
    </button>
  );
}
