"use client";

import { useState } from "react";

type UnlockCheckoutButtonProps = {
  slug: string;
  businessName: string;
  niche?: string;
  phone?: string;
  email?: string;
  city?: string;
  leadId?: string;
  className?: string;
};

export function UnlockCheckoutButton({
  slug,
  businessName,
  niche,
  phone,
  email,
  city,
  leadId,
  className,
}: UnlockCheckoutButtonProps) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug: slug,
          planId: "unlock",
          businessName,
          niche,
          phone,
          email,
          city,
          leadId: leadId || slug,
          origin: window.location.origin,
        }),
      });
      const json = (await response.json()) as { url?: string; signInUrl?: string; error?: string };
      if (response.status === 401 && json.signInUrl) {
        window.location.assign(json.signInUrl);
        return;
      }
      if (!response.ok || !json.url) throw new Error(json.error || "Checkout did not open.");
      window.location.assign(json.url);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Checkout did not open.");
    }
  }

  return (
    <span className="inline-flex flex-col items-stretch">
      <button
        type="button"
        onClick={() => void unlock()}
        disabled={busy}
        className={className ?? "rounded-full bg-[#00f2fe] px-3 py-2 text-sm font-semibold text-[#050507] disabled:opacity-60"}
      >
        {busy ? "Opening checkout…" : "Unlock for $1"}
      </button>
      {error ? <span className="mt-1 text-xs text-[#ff2a3d]">{error}</span> : null}
    </span>
  );
}
