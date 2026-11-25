"use client";

import { useEffect, useState } from "react";
import { ONBOARD_STORAGE_KEY } from "./useAxiomStudio";
import { startAxiomTrial } from "./axiomCheckout";
import type { OnboardPayload } from "./types";

/** Continues a Studio $1 handoff without replacing the existing /onboard page. */
export function OnboardTrialContinue() {
  const [payload, setPayload] = useState<OnboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    try {
      const raw = sessionStorage.getItem(ONBOARD_STORAGE_KEY);
      if (raw) {
        setPayload(JSON.parse(raw) as OnboardPayload);
        return;
      }
    } catch {
      /* ignore */
    }
    const biz = params.get("biz") || "";
    if (!biz) return;
    const accentParam = params.get("accent");
    const accent = accentParam === "amber" || accentParam === "magenta" ? accentParam : "cyan";
    setPayload({
      businessName: biz,
      niche: params.get("niche") || params.get("trade") || "",
      mode: params.get("mode") === "manual" ? "manual" : "autopilot",
      accent,
      heroMotion: true,
      slots: { hero: null, proof: null, services: null },
      photos: [],
      createdAt: new Date().toISOString(),
    });
  }, []);

  if (!payload?.businessName) return null;

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy}
        className="rounded-xl bg-[#00ffcc] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
        onClick={() => {
          setBusy(true);
          setError(null);
          void startAxiomTrial(payload, [])
            .then((url) => {
              window.location.assign(url);
            })
            .catch((err: unknown) => {
              setBusy(false);
              setError(err instanceof Error ? err.message : "Checkout failed");
            });
        }}
      >
        {busy ? "Opening checkout…" : `Continue $1 trial for ${payload.businessName}`}
      </button>
      {payload.niche ? <p className="mt-2 text-sm text-muted">{payload.niche} · {payload.mode}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
