"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  trade: string;
  pricingMode: "fixed" | "range" | "starting_at";
  baseCents: number;
  minCents: number;
  maxCents: number;
  depositCents: number;
  durationMin: number;
  active: boolean;
};

function dollars(cents: number): string {
  return (cents / 100).toFixed(0);
}

export function PriceBookCard({ slug, readonly = false }: { slug: string; readonly?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [voiceAnswerMode, setVoiceAnswerMode] = useState("immediate");
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"fixed" | "range" | "starting_at">("range");
  const [min, setMin] = useState("180");
  const [max, setMax] = useState("450");
  const [deposit, setDeposit] = useState("75");
  const [minutes, setMinutes] = useState("90");

  async function reload() {
    const response = await fetch(`/api/admin/services?slug=${encodeURIComponent(slug)}`);
    const json = (await response.json()) as { items?: Item[]; voiceAnswerMode?: string };
    setItems(json.items || []);
    if (json.voiceAnswerMode) setVoiceAnswerMode(json.voiceAnswerMode);
  }

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [slug]);

  async function saveItem() {
    setStatus("");
    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug,
        name,
        trade: items[0]?.trade || "plumbing",
        pricingMode: mode,
        baseCents: Math.round(Number(min) * 100),
        minCents: Math.round(Number(min) * 100),
        maxCents: Math.round(Number(max) * 100),
        depositCents: Math.round(Number(deposit) * 100),
        durationMin: Number(minutes) || 90,
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!response.ok) {
      setStatus(json.error || "Could not save.");
      return;
    }
    setName("");
    setStatus("Saved to the live receptionist book.");
    await reload();
  }

  async function remove(id: string) {
    await fetch("/api/admin/services", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, id }),
    });
    await reload();
  }

  async function saveVoice() {
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, voiceAnswerMode }),
    });
    setStatus("Voice routing saved.");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00f2fe]">Service &amp; price book</p>
      <p className="mt-2 text-sm text-white/70">
        The 24/7 live AI receptionist quotes only these lines, then locks a real calendar slot and texts a Stripe
        deposit (1.5% Connect fee).
      </p>
      <label className="mt-3 block text-xs uppercase tracking-[0.14em] text-white/50">
        Inbound voice
        <select
          className="mt-1 w-full rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm text-[#f4f7fb]"
          value={voiceAnswerMode}
          disabled={readonly}
          onChange={(event) => setVoiceAnswerMode(event.target.value)}
        >
          <option value="immediate">Answer live immediately</option>
          <option value="ring_overflow">Ring the shop, then AI on no-answer</option>
        </select>
      </label>
      {readonly ? null : (
        <button
          type="button"
          className="mt-2 min-h-9 rounded-full border border-[#00f2fe]/40 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#00f2fe]"
          onClick={() => void saveVoice()}
        >
          Save routing
        </button>
      )}
      <ul className="mt-4 space-y-2">
        {items.filter((row) => row.active).map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
            <span>
              <b className="text-white">{row.name}</b>
              <span className="ml-2 font-mono text-[11px] text-[#00ffcc]">
                {row.pricingMode} · ${dollars(row.minCents || row.baseCents)}
                {row.maxCents > row.minCents ? `–${dollars(row.maxCents)}` : ""} · {row.durationMin}m
                {row.depositCents ? ` · deposit $${dollars(row.depositCents)}` : ""}
              </span>
            </span>
            {readonly ? null : (
              <button type="button" className="text-xs text-white/40 hover:text-[#ff2a3d]" onClick={() => void remove(row.id)}>
                Hide
              </button>
            )}
          </li>
        ))}
      </ul>
      {readonly ? null : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm"
            placeholder="Service name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <select
            className="rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm"
            value={mode}
            onChange={(event) => setMode(event.target.value as typeof mode)}
          >
            <option value="fixed">fixed</option>
            <option value="range">range</option>
            <option value="starting_at">starting_at</option>
          </select>
          <input className="rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min $" />
          <input className="rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max $" />
          <input className="rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Deposit $" />
          <input className="rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="Minutes" />
          <button
            type="button"
            className="min-h-11 rounded-full bg-[#00f2fe] px-4 text-sm font-semibold text-[#050507] sm:col-span-2"
            onClick={() => void saveItem()}
          >
            Add to price book
          </button>
        </div>
      )}
      {status ? <p className="mt-2 text-sm text-[#00ffcc]">{status}</p> : null}
    </section>
  );
}
