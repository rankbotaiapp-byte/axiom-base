"use client";

import { useEffect, useState } from "react";
import type { DynoBaseline } from "./config";
import { useLatency } from "./LatencyProvider";

export type TelemetryState = {
  /** Replays the shop's last real dyno pull once on load, then holds at peak. */
  hp: number;
  boostPsi: number;
  /** True while the replay is still climbing (drives the ↑ indicators). */
  rising: boolean;
  /** Real measured round-trip to /api/hyper-moto/ping, in ms. null until first sample. */
  latencyMs: number | null;
  online: boolean;
};

const PULL_MS = 2200;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useTelemetry(baseline: DynoBaseline): TelemetryState {
  const { latencyMs, online } = useLatency();
  const [dyno, setDyno] = useState({ hp: baseline.peakHp, boostPsi: baseline.peakBoostPsi, rising: false });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const origin = performance.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min((performance.now() - origin) / PULL_MS, 1);
      const eased = easeOutCubic(t);
      const boost = Math.max(0, (eased - 0.18) / 0.82); // turbo spools late
      setDyno({ hp: baseline.peakHp * eased, boostPsi: baseline.peakBoostPsi * boost, rising: t < 1 });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [baseline.peakHp, baseline.peakBoostPsi]);

  return { ...dyno, latencyMs, online };
}
