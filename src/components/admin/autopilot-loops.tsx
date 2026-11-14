import { useMemo, useState } from "react";
import { HERO_LIBRARY } from "@/config/HeroLibrary";
import {
  AUTOPILOT_LOOP_MAX,
  AUTOPILOT_LOOP_MIN,
  resolveAutopilotLoops,
} from "@/config/AutopilotContentEngine";
import { LoopVideo } from "@/components/cinematic-hero";
import { runShopAutopilotTick, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

export function AutopilotLoopsPanel({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload?: () => void;
}) {
  const fallback = useMemo(
    () =>
      resolveAutopilotLoops({
        shopConfig: shop.shopConfig,
        pinnedHeroUrl: shop.heroVideoUrl,
        niche: shop.niche,
      }),
    [shop.heroVideoUrl, shop.niche, shop.shopConfig],
  );
  const [picked, setPicked] = useState<string[]>(() => fallback.slice(0, AUTOPILOT_LOOP_MAX));
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return HERO_LIBRARY.filter((item) => {
      if (!needle) return true;
      return `${item.name} ${item.collection}`.toLowerCase().includes(needle);
    });
  }, [query]);

  function toggle(url: string) {
    if (readonly) return;
    setPicked((current) => {
      if (current.includes(url)) return current.filter((item) => item !== url);
      if (current.length >= AUTOPILOT_LOOP_MAX) return current;
      return [...current, url];
    });
  }

  async function save() {
    if (readonly || busy) return;
    if (picked.length < AUTOPILOT_LOOP_MIN) {
      setStatus(`Choose ${AUTOPILOT_LOOP_MIN} to ${AUTOPILOT_LOOP_MAX} loops.`);
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await updateShopBrand({ data: { slug: shop.slug, selectedAutopilotLoops: picked } });
      setStatus("Autopilot will rotate these films on social posts.");
      onReload?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save the rotation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Social film rotation</p>
      <h3 className="mt-1 font-display text-2xl text-fg">Autopilot loops</h3>
      <p className="mt-2 text-sm text-muted">
        Check {AUTOPILOT_LOOP_MIN} to {AUTOPILOT_LOOP_MAX} cinematic loops. Autopilot composites shop name, city, and a
        booking line over the next film in the set. Empty keeps the pinned storefront hero plus the category master.
      </p>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search loops"
        className="glass-field mt-4 h-11 w-full rounded-xl px-3 text-sm"
      />
      <div className="mt-4 grid max-h-[28rem] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3">
        {rows.map((item) => {
          const on = picked.includes(item.videoUrl);
          return (
            <label
              key={item.id}
              className={cn(
                "cursor-pointer overflow-hidden rounded-2xl bg-surface-2 text-left shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_10%,transparent)]",
                on && "shadow-[0_0_0_2px_var(--color-accent)]",
              )}
            >
              <span className="relative block aspect-video overflow-hidden bg-bg">
                <LoopVideo src={item.videoUrl} className="absolute inset-0 h-full w-full object-cover" />
              </span>
              <span className="flex items-start gap-2 px-2 py-2">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={readonly || (!on && picked.length >= AUTOPILOT_LOOP_MAX)}
                  onChange={() => toggle(item.videoUrl)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm text-fg">{item.name}</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-muted">{item.collection}</span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">
        {picked.length} selected · {AUTOPILOT_LOOP_MIN}–{AUTOPILOT_LOOP_MAX}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={readonly || busy}
          onClick={() => void save()}
          className="inline-flex h-11 items-center rounded-xl bg-fg px-4 text-sm font-medium text-bg disabled:opacity-50"
        >
          Save rotation
        </button>
        <button
          type="button"
          disabled={readonly || busy}
          onClick={() => {
            setBusy(true);
            setStatus("");
            void runShopAutopilotTick({ data: { slug: shop.slug } })
              .then((result) => {
                setStatus(
                  result.queued
                    ? `Queued a social clip for ${result.city}. ${result.caption}`
                    : `Tick ran for ${result.city}. Nothing new was queued.`,
                );
                onReload?.();
              })
              .catch((err) => {
                setStatus(err instanceof Error ? err.message : "Could not run the tick.");
              })
              .finally(() => setBusy(false));
          }}
          className="inline-flex h-11 items-center rounded-xl px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.12)] disabled:opacity-50"
        >
          Run Test Cron Tick
        </button>
      </div>
      {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
    </section>
  );
}

export function AutopilotClipPreview({
  src,
  shopName,
  city,
  cta,
}: {
  src: string;
  shopName: string;
  city: string;
  cta: string;
}) {
  return (
    <figure className="relative overflow-hidden rounded-[28px] bg-bg">
      <LoopVideo src={src} className="aspect-[9/16] w-full object-cover" />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/70 to-transparent p-5">
        <p className="font-display text-2xl text-fg">{shopName}</p>
        <p className="mt-1 text-sm text-muted">{city}</p>
        <p className="mt-3 inline-flex rounded-xl bg-fg px-3 py-2 text-sm text-bg">{cta}</p>
      </figcaption>
    </figure>
  );
}
