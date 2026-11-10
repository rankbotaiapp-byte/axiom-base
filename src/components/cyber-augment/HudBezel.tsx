"use client";

import { motion } from "framer-motion";

type Corner = "tl" | "tr" | "bl" | "br";

const cornerPos: Record<Corner, string> = {
  tl: "top-3 left-3 sm:top-5 sm:left-5",
  tr: "top-3 right-3 sm:top-5 sm:right-5 rotate-90",
  br: "bottom-3 right-3 sm:bottom-5 sm:right-5 rotate-180",
  bl: "bottom-3 left-3 sm:bottom-5 sm:left-5 -rotate-90",
};

function Reticle({ corner, color }: { corner: Corner; color: "red" | "cyan" }) {
  const stroke = color === "red" ? "var(--color-neon-red)" : "var(--color-neon-cyan)";
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 64 64"
      className={`absolute h-10 w-10 sm:h-16 sm:w-16 ${cornerPos[corner]}`}
      style={{ filter: `drop-shadow(0 0 6px ${stroke})` }}
      initial={{ opacity: 0, scale: 1.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <path d="M2 26 V2 H26" fill="none" stroke={stroke} strokeWidth="2.5" />
      <path d="M8 18 V8 H18" fill="none" stroke={stroke} strokeWidth="1" opacity="0.6" />
      <rect x="2" y="32" width="2.5" height="6" fill={stroke} opacity="0.7" />
      <rect x="32" y="2" width="6" height="2.5" fill={stroke} opacity="0.7" />
    </motion.svg>
  );
}

/** Tactical monitor frame: blurred edge strips, corner reticles, telemetry rules and a moving scan line. */
export function HudBezel() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {/* Blurred bezel edges — the "glass" of the monitor */}
      <div className="absolute inset-x-0 top-0 h-3 bg-slate-950/40 backdrop-blur-2xl sm:h-5" />
      <div className="absolute inset-x-0 bottom-0 h-3 bg-slate-950/40 backdrop-blur-2xl sm:h-5" />
      <div className="absolute inset-y-0 left-0 w-3 bg-slate-950/40 backdrop-blur-2xl sm:w-5" />
      <div className="absolute inset-y-0 right-0 w-3 bg-slate-950/40 backdrop-blur-2xl sm:w-5" />

      {/* Inner hairline frame */}
      <div className="absolute inset-3 border border-white/10 sm:inset-5" />

      <Reticle corner="tl" color="red" />
      <Reticle corner="tr" color="cyan" />
      <Reticle corner="br" color="red" />
      <Reticle corner="bl" color="cyan" />

      {/* Telemetry rules with tick marks */}
      <div className="absolute left-1/2 top-3 hidden h-5 w-[40%] -translate-x-1/2 items-end gap-[6px] sm:top-5 md:flex">
        {Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            className={`w-px ${i % 6 === 0 ? "h-3 bg-neon-cyan/80" : "h-1.5 bg-white/25"}`}
          />
        ))}
      </div>
      <div className="absolute right-3 top-1/2 hidden w-5 -translate-y-1/2 flex-col items-end gap-[6px] sm:right-5 lg:flex">
        {Array.from({ length: 32 }).map((_, i) => (
          <span key={i} className={`h-px ${i % 4 === 0 ? "w-3 bg-neon-red/80" : "w-1.5 bg-white/25"}`} />
        ))}
      </div>

      {/* Scan line */}
      <div className="absolute inset-x-3 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-neon-cyan/[0.06] to-transparent sm:inset-x-5" />
      {/* Scanline texture */}
      <div className="hud-scanlines absolute inset-0 opacity-60 mix-blend-overlay" />
    </div>
  );
}
