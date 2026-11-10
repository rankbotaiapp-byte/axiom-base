"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface GlassPanelProps extends HTMLMotionProps<"section"> {
  children: ReactNode;
  label?: string;
  className?: string;
}

/** Shared glass HUD surface: heavy blur, cyan border, inner glow, mini corner ticks. */
export function GlassPanel({ children, label, className = "", ...motionProps }: GlassPanelProps) {
  return (
    <motion.section
      data-fx-ignore
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950/45 shadow-[0_0_35px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(165,243,252,0.12)] backdrop-blur-2xl ${className}`}
      {...motionProps}
    >
      {/* Top sheen */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      {/* Corner ticks */}
      <span aria-hidden="true" className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t border-cyan-300/80" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r border-cyan-300/80" />
      {label ? (
        <div className="hidden items-center justify-between border-b sm:flex border-cyan-500/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/80">
          <span>{label}</span>
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1 w-1 rounded-full bg-cyan-400/80" />
            <span className="h-1 w-1 rounded-full bg-cyan-400/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-400/25" />
          </span>
        </div>
      ) : null}
      {children}
    </motion.section>
  );
}
