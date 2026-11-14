"use client";

import { useState } from "react";
import styles from "./apex.module.css";
import { aeroSpecs, engineSpecs } from "./config";
import DynoChart from "./DynoChart";
import GlassModal from "./GlassModal";
import { cx } from "./ui";

type Tab = "engine" | "dyno" | "aero";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "engine", label: "Engine" },
  { id: "dyno", label: "Dyno" },
  { id: "aero", label: "Aero" },
];

const HEADLINE_STATS = [
  { value: "742", unit: "WHP", label: "Peak wheel power" },
  { value: "598", unit: "LB-FT", label: "Peak torque" },
  { value: "2.4", unit: "SEC", label: "0–60 mph" },
  { value: "9.6", unit: "SEC", label: "¼ mile @ 151" },
];

interface SpecsModalProps {
  open: boolean;
  onClose: () => void;
  onConfigure: () => void;
}

export default function SpecsModal({ open, onClose, onConfigure }: SpecsModalProps) {
  const [tab, setTab] = useState<Tab>("dyno");

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      eyebrow="APEX R · Launch Spec"
      title="Performance Dossier"
      footer={
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-400">All figures verified on our in-house dyno and timing gear. Build slots are limited per month.</p>
          <button
            type="button"
            onClick={onConfigure}
            className={cx(
              styles.sheen,
              styles.display,
              "rounded-full border border-cyan-300/90 bg-cyan-500/25 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_24px_rgba(34,211,238,0.4)] transition hover:bg-cyan-400/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
            )}
          >
            Configure this build
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {HEADLINE_STATS.map((s) => (
          <div key={s.label} className="relative border border-cyan-500/25 bg-slate-900/50 px-3 py-3">
            <div className="flex items-baseline gap-1">
              <span className={cx("text-2xl font-semibold text-white sm:text-3xl", styles.mono)}>{s.value}</span>
              <span className={cx("text-[10px] text-cyan-300", styles.mono)}>{s.unit}</span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Spec sections" className="mt-5 flex gap-1 border-b border-cyan-500/20">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`spec-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`spec-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cx(
              styles.display,
              "relative -mb-px border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] transition",
              tab === t.id ? "border-cyan-300 text-cyan-100" : "border-transparent text-slate-400 hover:text-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`spec-panel-${tab}`} aria-labelledby={`spec-tab-${tab}`} className="pt-5">
        {tab === "engine" && (
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {engineSpecs.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 border-b border-slate-800/80 py-3">
                <dt className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">{row.label}</dt>
                <dd className="text-sm text-slate-100">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab === "dyno" && <DynoChart />}

        {tab === "aero" && (
          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <ul className="space-y-4">
              {aeroSpecs.map((row) => (
                <li key={row.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-300">{row.label}</span>
                    <span className={cx("text-sm text-white", styles.mono)}>{row.value}</span>
                  </div>
                  <div className="mt-1.5 h-1 bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-700 to-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                      style={{ width: `${row.meter * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <figure className="border border-cyan-500/25 bg-slate-900/40 p-4">
              <svg viewBox="0 0 260 140" className="h-auto w-full" role="img" aria-label="Airflow diagram over the car profile">
                {Array.from({ length: 7 }, (_, i) => (
                  <path
                    key={i}
                    d={`M0 ${30 + i * 13} C 70 ${30 + i * 13}, 90 ${22 + i * 9}, 150 ${20 + i * 9} S 230 ${28 + i * 12}, 260 ${34 + i * 12}`}
                    fill="none"
                    stroke="rgba(103,232,249,0.45)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                ))}
                <path
                  d="M18 108 C 40 104, 60 98, 84 80 C 110 62, 150 58, 178 66 L 206 76 L 236 80 L 244 98 L 240 108 Z"
                  fill="rgba(2,6,23,0.9)"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                />
                <path d="M196 60 L 240 58 L 238 64 L 200 66 Z" fill="#0e7490" />
                <circle cx="66" cy="110" r="13" fill="#020617" stroke="#67e8f9" strokeWidth="1.5" />
                <circle cx="202" cy="110" r="13" fill="#020617" stroke="#67e8f9" strokeWidth="1.5" />
              </svg>
              <figcaption className="mt-2 text-[11px] text-slate-400">
                Carbon Track Pack shifts balance rearward for high-speed stability without killing straight-line Cd.
              </figcaption>
            </figure>
          </div>
        )}
      </div>
    </GlassModal>
  );
}
