"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MASTER_HERO_DEFAULTS } from "@/config/MasterHeroDefaults";
import { masterCategoryFor } from "@/config/NicheRegistry";
import {
  filterHistoricalHeroArchive,
  historicalArchiveCollections,
  LOOP_TAIL_TRIM_SEC,
  type HistoricalHeroAsset,
} from "@/lib/axiom/historical-hero-archive";
import { cn } from "@/lib/utils";

export function HeroCustomizer({
  niche,
  selectedUrl,
  disabled = false,
  onSelect,
}: {
  niche: string;
  selectedUrl: string;
  disabled?: boolean;
  onSelect: (url: string) => void;
}) {
  const category = MASTER_HERO_DEFAULTS[masterCategoryFor(niche)];
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("all");
  const [preview, setPreview] = useState<string | null>(null);
  const collections = useMemo(() => historicalArchiveCollections(), []);
  const items = useMemo(
    () => filterHistoricalHeroArchive(query, collection),
    [query, collection],
  );
  const active = selectedUrl || category.src;

  const selectValue =
    items.find((item) => item.src === active)?.src ??
    (active === category.src ? category.src : active || "");

  return (
    <section className="mt-6 rounded-2xl border border-[#00ffcc]/20 bg-[#030712]/55 p-4 backdrop-blur-md sm:p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00ffcc]/80">Media library</p>
      <p className="mt-1 font-display text-xl text-fg">Hero loop & content background</p>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Pick any indexed loop from public/media. Saving pins it to this shop and the live storefront updates immediately.
        {category.title} still has a category default. Playback cuts {LOOP_TAIL_TRIM_SEC.toFixed(2)}s before the end.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Quick pick · searchable dropdown
          </span>
          <select
            value={selectValue}
            disabled={disabled}
            onChange={(e) => {
              const next = e.target.value;
              if (!next) return;
              setPreview(next);
              onSelect(next === category.src ? "default" : next);
            }}
            className="h-11 w-full rounded-xl border border-white/10 bg-[#030712] px-3 text-sm text-fg outline-none focus:border-[#00ffcc]/50"
          >
            {!selectValue ? <option value="">Choose a loop…</option> : null}
            {(collection === "all" ? collections.filter((c) => c !== "all") : [collection]).map((group) => (
              <optgroup key={group} label={group}>
                {items
                  .filter((item) => item.collection === group)
                  .map((item) => (
                    <option key={`opt-${item.id}`} value={item.src}>
                      {item.name}
                      {item.src === category.src ? " · category default" : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search hero loops</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loops, niches, collections…"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#030712] px-3 text-sm text-fg outline-none focus:border-[#00ffcc]/50"
            />
          </label>
          <label className="shrink-0">
            <span className="sr-only">Collection</span>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-[#030712] px-3 text-sm text-fg outline-none focus:border-[#00ffcc]/50"
            >
              {collections.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All collections" : c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
        {items.length} asset{items.length === 1 ? "" : "s"} · click a tile to live-test and save
      </p>

      <div className="mt-4 grid max-h-[32rem] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <ArchiveTile
            key={item.id}
            item={item}
            selected={active === item.src}
            isCategoryDefault={item.src === category.src}
            disabled={disabled}
            previewing={preview === item.src}
            onPreview={() => setPreview(item.src)}
            onSelect={() => onSelect(item.src === category.src ? "default" : item.src)}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No loops match that search.</p>
      ) : null}
    </section>
  );
}

function ArchiveTile({
  item,
  selected,
  isCategoryDefault,
  disabled,
  previewing,
  onPreview,
  onSelect,
}: {
  item: HistoricalHeroAsset;
  selected: boolean;
  isCategoryDefault: boolean;
  disabled: boolean;
  previewing: boolean;
  onPreview: () => void;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Only attach media when hovered/selected — avoids loading every archive MP4 at once. */
  const live = previewing || selected;
  const mediaSrc = item.thumbnail.endsWith(".mp4") ? item.thumbnail : item.src;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!live) {
      v.pause();
      v.removeAttribute("src");
      v.load();
      return;
    }
    if (v.getAttribute("src") !== mediaSrc) {
      v.src = mediaSrc;
      v.load();
    }
    void v.play().catch(() => undefined);
    return () => {
      v.pause();
    };
  }, [live, mediaSrc]);

  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (!v) return;
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
  }, []);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-pressed={selected}
      className={cn(
        "overflow-hidden rounded-xl border bg-[#0a0f1a]/80 text-left backdrop-blur-md transition",
        selected
          ? "border-[#00ffcc]/70 shadow-[0_0_0_1px_#00ffcc,0_0_20px_rgba(0,255,204,0.2)]"
          : "border-white/10 hover:border-[#00ffcc]/35",
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#030712]">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          loop
          preload="none"
        />
        {!live ? (
          <span className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ffcc]/50">
            Preview
          </span>
        ) : null}
      </div>
      <span className="block px-2 py-2">
        <span className="block truncate text-sm text-fg">{item.name}</span>
        <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {item.collection}
          {isCategoryDefault ? " · default" : ""}
        </span>
      </span>
    </button>
  );
}
