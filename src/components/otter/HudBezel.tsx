"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface HudBezelProps {
  brand: string;
  unitId: string;
}

const corner =
  "absolute h-8 w-8 border-cyan-400/80 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] sm:h-12 sm:w-12";

function useClock(): string {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setTime(fmt());
    const id = window.setInterval(() => setTime(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

/** Tactical monitor frame: neon bezel, corner brackets, header strip. Purely decorative. */
export function HudBezel({ brand, unitId }: HudBezelProps) {
  const time = useClock();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      {/* Bezel frame */}
      <motion.div
        className="absolute inset-2 rounded-[18px] border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2),inset_0_0_60px_rgba(6,182,212,0.08)] sm:inset-4 sm:rounded-[26px]"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Corner brackets */}
      <motion.div
        className="absolute inset-2 sm:inset-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <span className={`${corner} left-0 top-0 rounded-tl-[18px] border-l-2 border-t-2 sm:rounded-tl-[26px]`} />
        <span className={`${corner} right-0 top-0 rounded-tr-[18px] border-r-2 border-t-2 sm:rounded-tr-[26px]`} />
        <span className={`${corner} bottom-0 left-0 rounded-bl-[18px] border-b-2 border-l-2 sm:rounded-bl-[26px]`} />
        <span className={`${corner} bottom-0 right-0 rounded-br-[18px] border-b-2 border-r-2 sm:rounded-br-[26px]`} />
      </motion.div>

      {/* Edge tick marks */}
      <div className="absolute left-1/2 top-2 hidden h-2 w-40 -translate-x-1/2 bg-[repeating-linear-gradient(90deg,rgba(34,211,238,0.6)_0px,rgba(34,211,238,0.6)_1px,transparent_1px,transparent_8px)] sm:top-4 sm:block" />
      <div className="absolute bottom-2 left-1/2 hidden h-2 w-40 -translate-x-1/2 bg-[repeating-linear-gradient(90deg,rgba(34,211,238,0.6)_0px,rgba(34,211,238,0.6)_1px,transparent_1px,transparent_8px)] sm:bottom-4 sm:block" />

      {/* Header strip */}
      <motion.header
        className="absolute inset-x-5 top-5 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-200/80 sm:inset-x-10 sm:top-9 sm:text-xs"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]"
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span className="text-cyan-100">LIVE</span>
          <span className="hidden text-cyan-500/70 sm:inline">// {unitId}</span>
        </div>
        <span className="hidden truncate text-cyan-100/90 md:inline">{brand}</span>
        <span className="tabular-nums text-cyan-300">{time}</span>
      </motion.header>
    </div>
  );
}
