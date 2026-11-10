"use client";

import type { CSSProperties, ReactNode } from "react";
import styles from "./apex.module.css";
import { CornerBrackets, cx, glassPanel, Icon } from "./ui";

interface DockButtonProps {
  label: string;
  shortLabel: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

function DockButton({ label, shortLabel, hint, icon, onClick, primary, disabled, children }: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-keyshortcuts={hint}
      className={cx(
        styles.sheen,
        styles.display,
        "group relative flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full border px-2.5 py-3 sm:gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 sm:px-5 sm:text-xs",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        "active:scale-[0.96] active:shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)]",
        primary
          ? "border-cyan-300/90 bg-cyan-500/25 text-white shadow-[0_0_28px_rgba(34,211,238,0.45),inset_0_0_18px_rgba(34,211,238,0.25)] hover:bg-cyan-400/35 hover:shadow-[0_0_44px_rgba(34,211,238,0.7)]"
          : "border-cyan-500/50 bg-slate-950/50 text-cyan-50 hover:border-cyan-300 hover:bg-cyan-500/15 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]",
        disabled && "cursor-wait opacity-90",
      )}
    >
      <span className="text-cyan-300 transition-transform group-hover:scale-110">{icon}</span>
      <span className="whitespace-nowrap sm:hidden">{shortLabel}</span>
      <span className="hidden whitespace-nowrap sm:inline">{label}</span>
      <kbd
        className={cx(
          "ml-1 hidden rounded border border-cyan-500/40 px-1.5 py-0.5 text-[9px] text-cyan-300/70 lg:inline",
          styles.mono,
        )}
      >
        {hint}
      </kbd>
      {children}
    </button>
  );
}

interface ActionDockProps {
  onLaunch: () => void;
  onSpecs: () => void;
  onConfigure: () => void;
  launching: boolean;
  cooldownMs: number;
  launchKey: number;
}

export default function ActionDock({ onLaunch, onSpecs, onConfigure, launching, cooldownMs, launchKey }: ActionDockProps) {
  return (
    <nav aria-label="Vehicle actions" data-rig-ignore className={cx(glassPanel, "rounded-full p-1.5 sm:p-2")}>
      <CornerBrackets size={10} />
      <div className="flex gap-1.5 sm:gap-2">
        <DockButton
          primary
          label={launching ? "Launching" : "Activate Launch"}
          shortLabel={launching ? "Live" : "Launch"}
          hint="L"
          icon={<Icon.Bolt />}
          onClick={onLaunch}
          disabled={launching}
        >
          {launching && (
            <span className="pointer-events-none absolute inset-x-4 bottom-1.5 h-[2px] overflow-hidden rounded-full bg-cyan-900/60">
              <span
                key={launchKey}
                className={cx("block h-full bg-cyan-200 shadow-[0_0_8px_rgba(165,243,252,0.9)]", styles.charge)}
                style={{ "--apex-charge-ms": `${cooldownMs}ms` } as CSSProperties}
              />
            </span>
          )}
        </DockButton>
        <DockButton label="View Specs" shortLabel="Specs" hint="S" icon={<Icon.Gauge />} onClick={onSpecs} />
        <DockButton label="Configure" shortLabel="Build" hint="C" icon={<Icon.Sliders />} onClick={onConfigure} />
      </div>
    </nav>
  );
}
