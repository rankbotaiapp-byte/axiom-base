"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TelemetryReading } from "@/lib/otter/config";
import { GlassPanel } from "./GlassPanel";

interface TelemetryPanelProps {
  readings: readonly TelemetryReading[];
  bubblesPopped: number;
  /** Overrides the CURRENT STATUS value while a dive is in progress. */
  statusOverride: string | null;
}

const toneClass: Record<TelemetryReading["tone"], string> = {
  cyan: "text-cyan-200",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
};

const dotClass: Record<TelemetryReading["tone"], string> = {
  cyan: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]",
  emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]",
  amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]",
};

function Row({ label, value, tone }: TelemetryReading) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-3">
      <dt className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400 xl:whitespace-nowrap sm:text-[10px] sm:tracking-[0.22em]">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass[tone]}`} aria-hidden="true" />
        {label}
      </dt>
      <dd className={`font-mono text-[11px] font-semibold leading-tight sm:text-right tracking-wide xl:whitespace-nowrap sm:text-sm sm:tracking-wider ${toneClass[tone]}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={value}
            className="inline-block"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </dd>
    </div>
  );
}

export function TelemetryPanel({ readings, bubblesPopped, statusOverride }: TelemetryPanelProps) {
  const rows = readings.map((r) =>
    r.label === "CURRENT STATUS" && statusOverride ? { ...r, value: statusOverride, tone: "amber" as const } : r,
  );

  return (
    <GlassPanel
      label="Telemetry"
      className="w-full lg:w-72 xl:w-[22rem]"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <dl className="grid grid-cols-3 gap-2 px-3 py-2.5 sm:grid-cols-1 sm:gap-2.5 sm:px-4 sm:py-3">
        {rows.map((r) => (
          <Row key={r.label} {...r} />
        ))}

        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-3">
          <dt className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400 xl:whitespace-nowrap sm:text-[10px] sm:tracking-[0.22em]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.9)]" aria-hidden="true" />
            BUBBLES POPPED
          </dt>
          <dd className="relative font-mono text-[11px] font-semibold tabular-nums tracking-wider text-sky-200 sm:text-sm" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={bubblesPopped}
                className="inline-block"
                initial={{ opacity: 0, y: 10, scale: 1.4, color: "#ecfeff" }}
                animate={{ opacity: 1, y: 0, scale: 1, color: "#bae6fd" }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                {bubblesPopped.toString().padStart(4, "0")}
              </motion.span>
            </AnimatePresence>
          </dd>
        </div>
      </dl>

      {/* Sonar bar */}
      <div className="relative mx-4 mb-3 hidden h-1 overflow-hidden rounded-full bg-cyan-950/80 sm:block" aria-hidden="true">
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </GlassPanel>
  );
}
