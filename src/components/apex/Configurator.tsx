"use client";

import type { ReactNode } from "react";
import styles from "./apex.module.css";
import { resolveBuild, type BuildSelection } from "./build";
import { aeroPacks, currency, exhaustTones, paints, trims, wheels, type ConfigOption } from "./config";
import GlassModal from "./GlassModal";
import { cx, Icon } from "./ui";

interface ConfiguratorProps {
  open: boolean;
  onClose: () => void;
  selection: BuildSelection;
  onChange: (next: BuildSelection) => void;
  onBook: () => void;
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2.5 flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
        <span>{title}</span>
        {note && <span className="tracking-[0.12em] text-slate-500 normal-case">{note}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function OptionCard({ option, selected, onSelect, name }: { option: ConfigOption; selected: boolean; onSelect: () => void; name: string }) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-center justify-between gap-3 border px-3.5 py-3 transition",
        selected
          ? "border-cyan-300/90 bg-cyan-500/15 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
          : "border-slate-700/80 bg-slate-900/40 hover:border-cyan-500/60",
      )}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{option.name}</span>
        <span className="block text-xs text-slate-400">{option.detail}</span>
      </span>
      <span className={cx("shrink-0 text-xs", styles.mono, selected ? "text-cyan-200" : "text-slate-400")}>
        {option.price === 0 ? "Included" : `+${currency.format(option.price)}`}
      </span>
    </label>
  );
}

function CarPreview({ paint, wheel, flame }: { paint: string; wheel: string; flame: string }) {
  return (
    <svg viewBox="0 0 320 120" className="h-auto w-full" role="img" aria-label="Build preview">
      <defs>
        <linearGradient id="cfg-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={paint} stopOpacity="1" />
          <stop offset="1" stopColor="#020617" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="cfg-flame">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor={flame} />
          <stop offset="1" stopColor={flame} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="104" rx="140" ry="7" fill="rgba(34,211,238,0.12)" />
      <path
        d="M24 88 C 30 76, 52 70, 82 66 C 104 46, 134 34, 172 34 C 204 34, 230 46, 252 60 L 286 66 C 296 70, 300 80, 298 92 L 24 92 Z"
        fill="url(#cfg-body)"
        stroke="rgba(165,243,252,0.55)"
        strokeWidth="1.2"
      />
      <path d="M112 62 C 126 46, 146 40, 170 40 C 192 40, 208 48, 222 60 Z" fill="rgba(2,6,23,0.85)" stroke="rgba(165,243,252,0.35)" />
      <path d="M244 50 L 292 46 L 292 52 L 248 56 Z" fill="#0f172a" stroke="rgba(165,243,252,0.4)" />
      <rect x="282" y="72" width="12" height="4" rx="2" fill="#ef4444" opacity="0.85" />
      {[78, 244].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="92" r="17" fill="#020617" />
          <circle cx={cx} cy="92" r="12" fill="none" stroke={wheel} strokeWidth="5" />
          <circle cx={cx} cy="92" r="3" fill={wheel} />
        </g>
      ))}
      <ellipse cx="306" cy="88" rx="14" ry="6" fill="url(#cfg-flame)" />
    </svg>
  );
}

const WHEEL_TONES: Record<string, string> = {
  "forged-black": "#1e293b",
  "forged-bronze": "#a16207",
  magnesium: "#94a3b8",
};

export default function Configurator({ open, onClose, selection, onChange, onBook }: ConfiguratorProps) {
  const build = resolveBuild(selection);
  const set = (patch: Partial<BuildSelection>) => onChange({ ...selection, ...patch });

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      variant="drawer"
      eyebrow="Build Configurator"
      title="Spec Your GT3"
      footer={
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Estimated build</span>
            <span className={cx("text-2xl font-semibold text-white", styles.mono)}>{currency.format(build.total)}</span>
          </div>
          <button
            type="button"
            onClick={onBook}
            className={cx(
              styles.sheen,
              styles.display,
              "mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/90 bg-cyan-500/25 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:bg-cyan-400/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
            )}
          >
            <Icon.Mic /> Book this build with the concierge
          </button>
        </div>
      }
    >
      <div className="mb-6 border border-cyan-500/25 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-3">
        <CarPreview paint={build.paint.hex} wheel={WHEEL_TONES[build.wheel.id] ?? "#1e293b"} flame={build.exhaust.swatch} />
      </div>

      <Section title="Build stage">
        <div className="space-y-2">
          {trims.map((o) => (
            <OptionCard key={o.id} name="trim" option={o} selected={selection.trim === o.id} onSelect={() => set({ trim: o.id })} />
          ))}
        </div>
      </Section>

      <Section title="Paint" note={build.paint.name}>
        <div className="flex flex-wrap gap-3">
          {paints.map((p) => (
            <label key={p.id} className="cursor-pointer" title={`${p.name}${p.price ? ` · +${currency.format(p.price)}` : ""}`}>
              <input type="radio" name="paint" className="peer sr-only" checked={selection.paint === p.id} onChange={() => set({ paint: p.id })} />
              <span className="sr-only">{p.name}</span>
              <span
                className={cx(
                  "block h-11 w-11 rounded-full border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300",
                  selection.paint === p.id ? "scale-110 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.6)]" : "border-slate-600 hover:border-cyan-500",
                )}
                style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), ${p.hex} 45%, #020617 100%)` }}
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Exhaust flame" note="Live on the hero">
        <div className="grid grid-cols-3 gap-2">
          {exhaustTones.map((t) => (
            <label
              key={t.id}
              className={cx(
                "flex cursor-pointer flex-col items-center gap-2 border px-2 py-3 text-center transition",
                selection.exhaust === t.id ? "border-cyan-300/90 bg-cyan-500/15" : "border-slate-700/80 bg-slate-900/40 hover:border-cyan-500/60",
              )}
            >
              <input type="radio" name="exhaust" className="sr-only" checked={selection.exhaust === t.id} onChange={() => set({ exhaust: t.id })} />
              <span className="h-3 w-full rounded-full" style={{ background: `linear-gradient(90deg, #fff, ${t.swatch}, transparent)`, boxShadow: `0 0 14px ${t.swatch}` }} />
              <span className="text-xs font-medium text-white">{t.name}</span>
              <span className={cx("text-[10px] text-slate-400", styles.mono)}>{t.price ? `+${currency.format(t.price)}` : "Included"}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Wheels">
        <div className="space-y-2">
          {wheels.map((o) => (
            <OptionCard key={o.id} name="wheel" option={o} selected={selection.wheel === o.id} onSelect={() => set({ wheel: o.id })} />
          ))}
        </div>
      </Section>

      <Section title="Aero">
        <div className="space-y-2">
          {aeroPacks.map((o) => (
            <OptionCard key={o.id} name="aero" option={o} selected={selection.aero === o.id} onSelect={() => set({ aero: o.id })} />
          ))}
        </div>
      </Section>

      <dl className="space-y-1.5 border-t border-cyan-500/20 pt-4 text-xs">
        {build.lines.map((l) => (
          <div key={l.label} className="flex justify-between gap-4">
            <dt className="text-slate-400">
              {l.label} · <span className="text-slate-200">{l.name}</span>
            </dt>
            <dd className={cx("text-slate-200", styles.mono)}>{currency.format(l.price)}</dd>
          </div>
        ))}
      </dl>
    </GlassModal>
  );
}
