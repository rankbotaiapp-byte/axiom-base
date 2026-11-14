"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { telemetryBaseline } from "./config";

export interface TelemetryChannel {
  value: number;
  /** Percent change versus ~3 s ago. */
  trend: number;
  history: number[];
}

export interface TelemetryState {
  whp: TelemetryChannel;
  boost: TelemetryChannel;
  egt: TelemetryChannel;
  launching: boolean;
}

const HISTORY = 48;
const TICK_MS = 120;

const seedChannel = (v: number): TelemetryChannel => ({ value: v, trend: 0, history: Array(HISTORY).fill(v) });

/**
 * Live mock telemetry. Each channel follows a smoothed random walk toward a
 * target; `spike()` pushes the targets to launch values and lets them decay back.
 */
export function useTelemetry(active: boolean) {
  const [state, setState] = useState<TelemetryState>({
    whp: seedChannel(telemetryBaseline.whp.idle),
    boost: seedChannel(telemetryBaseline.boost.idle),
    egt: seedChannel(telemetryBaseline.egt.idle),
    launching: false,
  });
  const launchUntil = useRef(0);
  const surge = useRef(0);

  const spike = useCallback(() => {
    surge.current = 1;
    launchUntil.current = performance.now() + 1900;
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const now = performance.now();
      const launching = now < launchUntil.current;
      surge.current = launching ? Math.min(1, surge.current + 0.25) : surge.current * 0.9;
      const s = surge.current;

      setState((prev) => {
        const step = (ch: TelemetryChannel, key: keyof typeof telemetryBaseline, jitter: number, ease: number) => {
          const base = telemetryBaseline[key];
          const target = base.idle + (base.launch - base.idle) * s;
          const noise = (Math.random() - 0.5) * jitter * (1 + s * 2);
          const next = ch.value + (target - ch.value) * ease + noise;
          const clamped = Math.max(base.min, next);
          const history = [...ch.history.slice(1), clamped];
          const ref = history[history.length - 25] ?? clamped;
          return { value: clamped, trend: ((clamped - ref) / ref) * 100, history };
        };
        return {
          whp: step(prev.whp, "whp", 3.2, 0.22),
          boost: step(prev.boost, "boost", 0.35, 0.25),
          egt: step(prev.egt, "egt", 4.5, 0.12),
          launching,
        };
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [active]);

  return { telemetry: state, spike };
}
