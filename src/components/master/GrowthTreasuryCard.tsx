"use client";

import { useCallback, useEffect, useState } from "react";
import { masterDeskFetch } from "@/lib/axiom/master-desk-client";

type Slice = {
  key?: string;
  clickToUnlock: number;
  dropOff: string;
  revenuePerLead: number;
  counts: { sent: number; clicked: number; dollar_unlocked: number; mrr_active: number; revenueCents: number };
};

type Shot = {
  overall?: Slice;
  byTrade?: Slice[];
  byGeo?: Slice[];
  byVariant?: Slice[];
  seasonalNiche?: string;
  bandit?: Array<{ variantId: string; alpha: number; beta: number; conversions: number; impressions: number }>;
  creatives?: Array<{ id: string; variant_id: string; status: string; body: string }>;
  treasury?: {
    inflowCents: number;
    twilioCents: number;
    resendCents: number;
    aiCents: number;
    connectFeeCents: number;
    totalSpendCents: number;
    marginCents: number;
    pause: boolean;
    paused: boolean;
    reason: string;
    twilioDailyCapCents: number;
    totalDailyCapCents: number;
  };
};

function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function pct(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

export function GrowthTreasuryCard({ attached }: { attached: boolean }) {
  const [shot, setShot] = useState<Shot | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!attached) return;
    const res = await masterDeskFetch("/api/master/growth");
    if (!res.ok) {
      setNote(`Growth desk ${res.status}`);
      return;
    }
    setShot((await res.json()) as Shot);
    setNote("");
  }, [attached]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(id);
  }, [load]);

  async function resume() {
    await masterDeskFetch("/api/master/growth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resume: true }),
    });
    await load();
  }

  async function queueAd() {
    await masterDeskFetch("/api/master/growth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        queueCreative: true,
        variantId: shot?.bandit?.[0]?.variantId || "trial_autopilot",
        body: "Public ad creative from the winning hook — waiting on owner sign-off.",
      }),
    });
    await load();
  }

  const t = shot?.treasury;
  const overall = shot?.overall;

  return (
    <section className="mt-4 rounded-2xl border border-[#00f2fe]/25 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00f2fe]">Autonomous growth & treasury</p>
      <h2 className="mt-1 text-lg font-semibold">Funnel health, seasonal batches, margin watchdog</h2>
      {!attached ? (
        <p className="mt-3 text-sm text-white/50">Attach the master session to load live telemetry.</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Click → $1 unlock" value={overall ? pct(overall.clickToUnlock) : "—"} />
            <Stat label="Drop-off" value={overall?.dropOff || "—"} />
            <Stat label="Revenue / lead" value={overall ? money(Math.round(overall.revenuePerLead)) : "—"} />
            <Stat label="Seasonal niche" value={shot?.seasonalNiche || "plumbing"} />
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">By trade / geo / variant</p>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-white/70">
                {(shot?.byTrade || []).slice(0, 6).map((row) => (
                  <li key={row.key} className="flex justify-between gap-2">
                    <span>{row.key}</span>
                    <span className="text-[#00ffcc]">{pct(row.clickToUnlock)} · {money(Math.round(row.revenuePerLead))}</span>
                  </li>
                ))}
                {(shot?.byGeo || []).slice(0, 4).map((row) => (
                  <li key={row.key} className="flex justify-between gap-2">
                    <span>{row.key}</span>
                    <span>{pct(row.clickToUnlock)}</span>
                  </li>
                ))}
                {(shot?.byVariant || []).slice(0, 4).map((row) => (
                  <li key={row.key} className="flex justify-between gap-2">
                    <span>{row.key}</span>
                    <span>{row.counts.dollar_unlocked}/{row.counts.clicked} unlocks</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Treasury today</p>
              <p className="mt-2 text-sm text-white/70">
                Inflow {money(t?.inflowCents || 0)} (incl. $1 / $150 / 1.5% Connect {money(t?.connectFeeCents || 0)})
              </p>
              <p className="mt-1 font-mono text-[11px] text-white/55">
                Twilio {money(t?.twilioCents || 0)} · Resend {money(t?.resendCents || 0)} · AI {money(t?.aiCents || 0)} ·
                spend {money(t?.totalSpendCents || 0)} / cap {money(t?.totalDailyCapCents || 0)}
              </p>
              <p className={`mt-2 font-mono text-sm ${(t?.marginCents || 0) >= 0 ? "text-[#00ffcc]" : "text-[#ff2a3d]"}`}>
                Margin {money(t?.marginCents || 0)}
                {t?.paused || t?.pause ? ` · PAUSED ${t.reason || ""}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[#00ffcc]/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#00ffcc]"
                  onClick={() => void resume()}
                >
                  Resume outreach
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70"
                  onClick={() => void queueAd()}
                >
                  Queue public ad (pending approval)
                </button>
              </div>
            </div>
          </div>
          {(shot?.creatives || []).length ? (
            <ul className="mt-4 space-y-1 font-mono text-[11px] text-white/50">
              {shot?.creatives?.map((row) => (
                <li key={row.id}>
                  {row.status} · {row.variant_id} · {row.body.slice(0, 72)}
                </li>
              ))}
            </ul>
          ) : null}
          {note ? <p className="mt-2 text-xs text-[#ffb020]">{note}</p> : null}
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#050507]/60 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-2 font-mono text-xl text-[#00ffcc]">{value}</p>
    </article>
  );
}
