"use client";

import { useEffect, useState } from "react";
import { readMotionStudio, saveRenderWallet, startAiCreditPack, startRenderCardSetup } from "@/lib/axiom/server";
import {
  RENDER_CREDIT_PACK,
  RENDER_CREDIT_PACK_CENTS,
  RENDER_SPEND_LIMIT_MAX_CENTS,
  RENDER_SPEND_LIMIT_MIN_CENTS,
  clampMonthlySpendLimitCents,
  spendLimitPacks,
} from "@/lib/axiom/render-credits";
import { HUD_CARD } from "@/components/admin/admin-hud";
import { CinematicHeroCanvas } from "@/components/canvas/CinematicHeroCanvas";
import { defaultNicheFilm } from "@/config/catalog";
import { cn } from "@/lib/utils";
import type { Shop } from "@/lib/axiom/types";

export function HeroAnimationStudio({ shop, readonly }: { shop: Shop; readonly: boolean }) {
  const shopKey = { slug: shop.slug, shopId: shop.id };
  const [credits, setCredits] = useState(0);
  const [limit, setLimit] = useState(RENDER_CREDIT_PACK_CENTS);
  const [spent, setSpent] = useState(0);
  const [autoReload, setAutoReload] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  const [billing, setBilling] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    void readMotionStudio({ data: shopKey })
      .then((desk) => {
        if (cancelled) return;
        setCredits(desk.credits);
        setLimit(clampMonthlySpendLimitCents(desk.monthlySpendLimitCents ?? RENDER_CREDIT_PACK_CENTS));
        setSpent(Number(desk.monthSpendCents ?? 0));
        setAutoReload(Boolean(desk.autoReload));
        setHasCard(Boolean(desk.hasCard));
        setBilling(desk.billing);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load render wallet");
      });
    return () => {
      cancelled = true;
    };
  }, [shop.id, shop.slug]);

  async function persistWallet(nextLimit: number, nextAuto: boolean) {
    setBusy("wallet");
    setError("");
    try {
      const saved = await saveRenderWallet({
        data: { ...shopKey, monthlySpendLimitCents: nextLimit, autoReload: nextAuto },
      });
      setLimit(saved.monthlySpendLimitCents);
      setAutoReload(saved.autoReload);
      setHasCard(saved.hasCard);
      setCredits(saved.balance);
      if (saved.setupUrl) {
        window.location.href = saved.setupUrl;
        return;
      }
      setNote(nextAuto ? "Auto-reload armed on the saved card." : "Spend limit saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the wallet");
    } finally {
      setBusy("");
    }
  }

  async function buyPack() {
    setBusy("pack");
    setError("");
    try {
      const pack = await startAiCreditPack({ data: shopKey });
      window.location.href = pack.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setBusy("");
    }
  }

  async function saveCard() {
    setBusy("card");
    setError("");
    try {
      const setup = await startRenderCardSetup({ data: shopKey });
      window.location.href = setup.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open card setup");
      setBusy("");
    }
  }

  const packs = spendLimitPacks(limit);
  const dollars = (limit / 100).toFixed(0);

  return (
    <section className={cn(HUD_CARD, "grid gap-4 p-4 sm:p-5")} aria-label="Render credit wallet">
      <CinematicHeroCanvas
        brandTitle={shop.name}
        niche={shop.niche}
        loopSrc={shop.heroVideoUrl || defaultNicheFilm(shop.niche)}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-hud">Render wallet</p>
          <h3 className="mt-1 font-display text-xl text-fg">${(RENDER_CREDIT_PACK_CENTS / 100).toFixed(0)} · {RENDER_CREDIT_PACK} hero animations</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Prepaid credits. Autopilot deducts one unit per Blender / AI loop after the GPU cost floor, so every render keeps a profit margin.
          </p>
        </div>
        <p className="font-mono text-sm text-hud">{credits} credits</p>
      </div>

      <label className="grid gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Monthly spend limit · ${dollars} ({packs} pack{packs === 1 ? "" : "s"}) · used ${(spent / 100).toFixed(0)}
        </span>
        <input
          type="range"
          min={RENDER_SPEND_LIMIT_MIN_CENTS}
          max={RENDER_SPEND_LIMIT_MAX_CENTS}
          step={RENDER_CREDIT_PACK_CENTS}
          value={limit}
          disabled={readonly || Boolean(busy)}
          onChange={(event) => setLimit(clampMonthlySpendLimitCents(event.target.value))}
          onMouseUp={() => {
            if (!readonly) void persistWallet(limit, autoReload);
          }}
          onTouchEnd={() => {
            if (!readonly) void persistWallet(limit, autoReload);
          }}
        />
      </label>

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-hud/25 bg-obsidian/50 px-3">
        <span className="text-sm text-fg">Auto-reload credits when low</span>
        <input
          type="checkbox"
          className="size-5 accent-cyan-400"
          checked={autoReload}
          disabled={readonly || Boolean(busy)}
          onChange={(event) => {
            const on = event.target.checked;
            setAutoReload(on);
            void persistWallet(limit, on);
          }}
        />
      </label>
      <p className="text-xs text-muted">
        {hasCard
          ? "Card on file via Stripe. Low balance charges another $15 pack off-session, inside the monthly cap."
          : "Turning auto-reload on opens Stripe Checkout (Elements) to save a card for frictionless top-ups."}
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="studio-save" disabled={readonly || !billing || busy === "pack"} onClick={() => void buyPack()}>
          {busy === "pack" ? "Opening checkout" : "Buy $15 / 20 renders"}
        </button>
        <button type="button" className="studio-switch" disabled={readonly || !billing || busy === "card"} onClick={() => void saveCard()}>
          {busy === "card" ? "Opening Stripe" : hasCard ? "Replace saved card" : "Save card for auto-reload"}
        </button>
      </div>
      {!billing ? <p className="motion-help">Stripe is off in this workspace. Generation still deducts prepaid credits first.</p> : null}
      {error ? <p className="motion-error">{error}</p> : null}
      {note ? <p className="motion-status">{note}</p> : null}
    </section>
  );
}
