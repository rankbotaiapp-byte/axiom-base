"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AXIOM_HUD_CYAN, AXIOM_VISUAL_LOCK } from "@/lib/axiom/visual-design";

void AXIOM_VISUAL_LOCK;

type ConnectTx = {
  id: string;
  amountCents: number;
  created: number;
  description: string;
};

type ConnectStatus = {
  shopSlug: string;
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  connectStatus: string;
  accountId: string | null;
  transactions: ConnectTx[];
  processorReady?: boolean;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatWhen(unix: number) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type StripeConnectDashboardProps = {
  shopSlug: string;
  readonly?: boolean;
  className?: string;
};

export default function StripeConnectDashboard({
  shopSlug,
  readonly = false,
  className = "",
}: StripeConnectDashboardProps) {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"onboard" | "login" | "refresh" | null>(null);

  const load = useCallback(async () => {
    if (!shopSlug) return;
    setError(null);
    try {
      const res = await fetch(`/api/stripe/connect?shopSlug=${encodeURIComponent(shopSlug)}`);
      const json = (await res.json()) as ConnectStatus & { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) throw new Error(json.error || "Could not load Connect status");
      setStatus(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Connect status");
    }
  }, [shopSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: "onboard" | "login" | "refresh") {
    if (readonly) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shopSlug, action, origin: window.location.origin }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        url?: string;
      } & Partial<ConnectStatus>;
      if (!res.ok || json.ok === false) throw new Error(json.error || "Stripe Connect request failed");
      if (json.url && (action === "onboard" || action === "login")) {
        window.location.href = json.url;
        return;
      }
      setStatus((prev) => ({
        shopSlug,
        connected: Boolean(json.connected ?? prev?.connected),
        chargesEnabled: Boolean(json.chargesEnabled ?? prev?.chargesEnabled),
        payoutsEnabled: Boolean(json.payoutsEnabled ?? prev?.payoutsEnabled),
        detailsSubmitted: Boolean(json.detailsSubmitted ?? prev?.detailsSubmitted),
        connectStatus: String(json.connectStatus ?? prev?.connectStatus ?? "none"),
        accountId: (json.accountId ?? prev?.accountId ?? null) as string | null,
        transactions: (json.transactions ?? prev?.transactions ?? []) as ConnectTx[],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stripe Connect request failed");
    } finally {
      setBusy(null);
    }
  }

  const standing = status?.chargesEnabled
    ? "Payouts live"
    : status?.connected
      ? "Finish bank verification"
      : "Not connected";

  return (
    <section
      className={`axiom-glass rounded-2xl border border-white/10 backdrop-blur-md ${className}`}
      aria-labelledby="stripe-connect-title"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: AXIOM_HUD_CYAN }}>
            Stripe Connect · Express
          </p>
          <h2 id="stripe-connect-title" className="mt-1 font-display text-2xl text-white">
            Merchant payouts
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Link a bank account, check payout standing, and review recent booking charges. Online
            bookings take a 1.5% platform fee via <code className="text-white/70">application_fee_amount</code>.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Standing</p>
            <p className="mt-1 text-lg text-white">{status ? standing : "…"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Charges</p>
            <p className="mt-1 text-lg text-white">{status?.chargesEnabled ? "Enabled" : "Off"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Payouts</p>
            <p className="mt-1 text-lg text-white">{status?.payoutsEnabled ? "Enabled" : "Pending"}</p>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {!readonly ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void run("onboard")}
              className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-[#030712] disabled:opacity-50"
              style={{ background: AXIOM_HUD_CYAN }}
            >
              {busy === "onboard"
                ? "Opening…"
                : status?.connected
                  ? "Update bank / verification"
                  : "Connect Stripe Express"}
            </button>
            <button
              type="button"
              disabled={Boolean(busy) || !status?.connected}
              onClick={() => void run("login")}
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm text-white/85 disabled:opacity-40"
            >
              {busy === "login" ? "Opening…" : "Stripe payout dashboard"}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void run("refresh")}
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm text-white/70 disabled:opacity-40"
            >
              {busy === "refresh" ? "Refreshing…" : "Refresh status"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-white/45">Preview mode — Connect actions are locked.</p>
        )}

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            Recent transactions
          </p>
          {!status?.transactions?.length ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/40">
              No connected-account charges yet. Booking checkouts with destination charges appear here.
            </p>
          ) : (
            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {status.transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 bg-black/20 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{tx.description}</p>
                    <p className="font-mono text-[10px] text-white/40">
                      {tx.id} · {formatWhen(tx.created)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm" style={{ color: AXIOM_HUD_CYAN }}>
                    {money(tx.amountCents)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
