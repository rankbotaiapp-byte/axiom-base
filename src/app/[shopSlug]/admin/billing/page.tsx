"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import StripeConnectDashboard from "@/components/StripeConnectDashboard";

type BillingHub = {
  slug: string;
  shopName: string;
  status: "trialing" | "active" | "canceled" | "none";
  headline: string;
  canCancel: boolean;
  stripe?: string;
};

const FEE_NOTE =
  "Axiom subscription is $150/mo after Name Your Price month 1. Online customer bookings carry a secure 1.5% platform processing split managed via Stripe Connect (application_fee_amount). Field-collected cash and checks carry 0% platform fees.";

export default function AdminBillingPage() {
  const params = useParams<{ shopSlug: string }>();
  const shopSlug = params.shopSlug || "";
  const [hub, setHub] = useState<BillingHub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [namedPrice, setNamedPrice] = useState("1");
  const [checkoutBusy, setCheckoutBusy] = useState<"trial" | "lifetime" | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopSlug) return;
    let cancelled = false;
    void fetch(`/api/admin/billing?slug=${encodeURIComponent(shopSlug)}`)
      .then(async (response) => {
        const json = (await response.json()) as BillingHub & { error?: string };
        if (!response.ok) throw new Error(json.error || "Billing could not load");
        if (!cancelled) setHub(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Billing could not load");
      });
    return () => {
      cancelled = true;
    };
  }, [shopSlug]);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: shopSlug, action: "cancel" }),
      });
      const json = (await response.json()) as BillingHub & { error?: string };
      if (!response.ok) throw new Error(json.error || "Cancel did not finish");
      setHub(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel did not finish");
    } finally {
      setBusy(false);
    }
  }

  async function startCheckout(planId: "trial" | "lifetime") {
    setCheckoutBusy(planId);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          planId,
          namedPriceDollars: planId === "trial" ? namedPrice : undefined,
          businessName: hub?.shopName,
          origin: window.location.origin,
        }),
      });
      const json = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !json.url) throw new Error(json.error || "Checkout did not start");
      window.location.href = json.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout did not start");
      setCheckoutBusy(null);
    }
  }

  return (
    <main className="min-h-dvh bg-obsidian px-4 py-8 text-fg">
      <div className="mx-auto grid max-w-2xl gap-5">
        <header className="rounded-2xl border border-hud/25 bg-field px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-hud">Admin billing</p>
          <h1 className="mt-2 font-display text-3xl">{hub?.shopName || shopSlug}</h1>
          <p className="mt-2 text-sm text-muted">Gear Guardian LLC · subscription, Connect payouts, platform fees</p>
        </header>

        <section className="rounded-2xl border border-line bg-surface px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Current subscription</p>
          <p className="mt-3 text-lg leading-snug text-fg">{hub ? hub.headline : "Loading billing status…"}</p>
          <button
            type="button"
            onClick={() => void cancel()}
            disabled={busy || !hub?.canCancel}
            className="mt-5 min-h-12 w-full rounded-xl bg-frame text-sm font-bold tracking-wide text-white disabled:opacity-40"
          >
            {busy ? "Canceling…" : "[ CANCEL SUBSCRIPTION ]"}
          </button>
          {hub?.status === "canceled" ? (
            <p className="mt-3 text-sm text-muted">
              {hub.stripe === "unavailable"
                ? "Axiom marked this canceled. Stripe did not confirm, so check the card is not set to renew."
                : "Canceled. This plan will not renew."}
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        </section>

        <section className="axiom-glass rounded-2xl border border-white/10 px-5 py-5 backdrop-blur-md">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-hud">Name Your Price · tiers</p>
          <p className="mt-2 text-sm text-muted">
            Month 1 from $1, then $150/mo on day 31 — or Founder&apos;s Lifetime ($1,500 once). Checkout metadata
            carries <span className="font-mono text-fg/80">shopSlug</span> + user id for webhook provisioning.
          </p>
          <label className="mt-4 block">
            <span className="text-xs text-muted">Month 1 amount (USD)</span>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-lg text-muted">$</span>
              <input
                type="number"
                min={1}
                step={1}
                value={namedPrice}
                onChange={(e) => setNamedPrice(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-fg outline-none focus:border-hud/50"
              />
            </div>
          </label>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={Boolean(checkoutBusy)}
              onClick={() => void startCheckout("trial")}
              className="min-h-12 rounded-xl bg-hud text-sm font-bold tracking-wide text-obsidian disabled:opacity-50"
            >
              {checkoutBusy === "trial" ? "Opening…" : "Start Name Your Price"}
            </button>
            <button
              type="button"
              disabled={Boolean(checkoutBusy)}
              onClick={() => void startCheckout("lifetime")}
              className="min-h-12 rounded-xl border border-hud/40 text-sm font-bold tracking-wide text-hud disabled:opacity-50"
            >
              {checkoutBusy === "lifetime" ? "Opening…" : "Founder's Lifetime · $1,500"}
            </button>
          </div>
          {checkoutError ? <p className="mt-3 text-sm text-danger">{checkoutError}</p> : null}
        </section>

        <StripeConnectDashboard shopSlug={shopSlug} />

        <section className="rounded-2xl border border-white/10 bg-field px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-hud">Fees</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{FEE_NOTE}</p>
          <Link href="/terms" className="mt-4 inline-flex min-h-11 items-center text-sm text-hud">
            Terms of Service
          </Link>
        </section>

        <Link href={`/${shopSlug}/admin`} className="inline-flex min-h-11 items-center text-sm text-muted">
          Back to the desk
        </Link>
      </div>
    </main>
  );
}
