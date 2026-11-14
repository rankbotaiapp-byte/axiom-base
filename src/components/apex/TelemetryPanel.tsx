"use client";

import { memo } from "react";
import styles from "./apex.module.css";
import { telemetryBaseline } from "./config";
import { CornerBrackets, cx, glassPanel, Icon, PanelLabel } from "./ui";
import type { TelemetryChannel, TelemetryState } from "./useTelemetry";

function Sparkline({ history, min, max, hot }: { history: number[]; min: number; max: number; hot: boolean }) {
  const w = 120;
  const h = 28;
  const span = Math.max(1e-6, max - min);
  const pts = history
    .map((v, i) => `${((i / (history.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-6 w-full" aria-hidden="true">
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={hot ? "rgba(34,211,238,0.18)" : "rgba(34,211,238,0.08)"} stroke="none" />
      <polyline
        points={pts}
        fill="none"
        stroke={hot ? "#67e8f9" : "#22d3ee"}
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface ReadoutProps {
  label: string;
  channel: TelemetryChannel;
  unit: string;
  decimals: number;
  min: number;
  max: number;
  hot: boolean;
}

function Readout({ label, channel, unit, decimals, min, max, hot }: ReadoutProps) {
  const up = channel.trend >= 0;
  const fill = Math.min(1, Math.max(0, (channel.value - min) / (max - min)));
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-[10px]">{label}</span>
        <span
          className={cx(
            "hidden items-center gap-0.5 text-[10px] sm:flex",
            styles.mono,
            up ? "text-cyan-300" : "text-slate-400",
          )}
        >
          {up ? <Icon.ArrowUp /> : <Icon.ArrowDown />}
          {Math.abs(channel.trend).toFixed(1)}%
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={cx(
            "text-xl font-semibold leading-none tracking-tight text-white sm:text-[28px]",
            styles.mono,
            hot && "text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.85)]",
          )}
        >
          {channel.value.toFixed(decimals)}
        </span>
        <span className={cx("text-[10px] text-cyan-300/80 sm:text-xs", styles.mono)}>{unit}</span>
      </div>
      <div className="mt-1.5 h-[3px] w-full bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-[width] duration-150"
          style={{ width: `${(fill * 100).toFixed(1)}%` }}
        />
      </div>
      <div className="mt-1 hidden sm:block">
        <Sparkline history={channel.history} min={min} max={max} hot={hot} />
      </div>
    </div>
  );
}

function TelemetryPanel({ telemetry }: { telemetry: TelemetryState }) {
  const { whp, boost, egt } = telemetryBaseline;
  const hot = telemetry.launching;
  return (
    <section
      aria-label="Live performance telemetry"
      data-rig-ignore
      className={cx(glassPanel, "p-3 sm:p-4", hot && "border-cyan-300/80 shadow-[0_0_45px_rgba(34,211,238,0.45)]")}
    >
      <CornerBrackets />
      <PanelLabel right={<span className={styles.mono}>{hot ? "LAUNCH MAP" : "ECU · 50 Hz"}</span>}>
        Live Telemetry
      </PanelLabel>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:gap-4" aria-live="off">
        <Readout label="WHP Output" channel={telemetry.whp} unit={whp.unit} decimals={0} min={600} max={760} hot={hot} />
        <Readout label="Boost" channel={telemetry.boost} unit={boost.unit} decimals={1} min={15} max={30} hot={hot} />
        <Readout label="Exhaust Temp" channel={telemetry.egt} unit={egt.unit} decimals={0} min={700} max={950} hot={hot} />
      </div>
    </section>
  );
}

export default memo(TelemetryPanel);
