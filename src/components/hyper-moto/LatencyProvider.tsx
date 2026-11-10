"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type LatencyState = {
  /** Smoothed real round-trip to the ping route, in ms. null until the first sample. */
  latencyMs: number | null;
  online: boolean;
};

const LatencyContext = createContext<LatencyState>({ latencyMs: null, online: true });

/**
 * One shared ping loop for the whole page (telemetry bar + profile board),
 * updating at most every 3s so consumers don't re-render on every frame.
 */
export function LatencyProvider({
  children,
  pingUrl = "/api/hyper-moto/ping",
  intervalMs = 3000,
}: {
  children: ReactNode;
  pingUrl?: string;
  intervalMs?: number;
}) {
  const [state, setState] = useState<LatencyState>({ latencyMs: null, online: true });

  useEffect(() => {
    let cancelled = false;
    let smoothed: number | null = null;
    const sample = async () => {
      const start = performance.now();
      try {
        const res = await fetch(pingUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const rtt = performance.now() - start;
        smoothed = smoothed === null ? rtt : smoothed * 0.6 + rtt * 0.4;
        if (!cancelled) setState({ latencyMs: smoothed, online: true });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, online: false }));
      }
    };
    void sample();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void sample();
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pingUrl, intervalMs]);

  return <LatencyContext.Provider value={state}>{children}</LatencyContext.Provider>;
}

export const useLatency = (): LatencyState => useContext(LatencyContext);
