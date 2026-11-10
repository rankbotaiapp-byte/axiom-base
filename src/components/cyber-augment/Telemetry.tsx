"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const MAG_SIZE = 30;

interface TelemetryProps {
  /** Increments every time a fire test runs; each increment adds a burst to the counter. */
  burstKey: number;
  /** Single-row strip for small screens. */
  compact?: boolean;
}

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone: "red" | "cyan" }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="text-[10px] tracking-[0.25em] text-slate-400">{label}</span>
      <span className={`font-semibold ${tone === "red" ? "text-neon-red" : "text-neon-cyan"}`}>{value}</span>
    </div>
  );
}

export function Telemetry({ burstKey, compact = false }: TelemetryProps) {
  const [total, setTotal] = useState(4812);
  const [mag, setMag] = useState(MAG_SIZE);
  const [sync, setSync] = useState(99.8);
  const lastBurst = useRef(burstKey);

  const fire = (rounds: number) => {
    setTotal((t) => t + rounds);
    setMag((m) => {
      const next = m - rounds;
      return next <= 0 ? MAG_SIZE + (next % MAG_SIZE) : next;
    });
  };

  // Ambient ticker: short bursts timed to feel like the hero footage.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      fire(1 + Math.floor(Math.random() * 3));
      timer = setTimeout(loop, 650 + Math.random() * 1600);
    };
    timer = setTimeout(loop, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Neural sync jitters within its stable band.
  useEffect(() => {
    const id = setInterval(() => setSync(99.6 + Math.round(Math.random() * 3) / 10), 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (burstKey !== lastBurst.current) {
      lastBurst.current = burstKey;
      fire(12);
    }
  }, [burstKey]);

  if (compact) {
    return (
      <div
        role="status"
        aria-label="Live telemetry"
        className="grid grid-cols-3 divide-x divide-white/10 rounded-sm border border-white/10 bg-slate-950/50 font-mono backdrop-blur-2xl"
      >
        {[
          { k: "NEURAL SYNC", v: `${sync.toFixed(1)}%`, c: "text-neon-cyan" },
          { k: "OCULAR CORE", v: "RED-10 IR", c: "text-neon-red animate-flicker" },
          { k: "ROUNDS", v: total.toLocaleString("en-US"), c: "text-neon-cyan tabular-nums" },
        ].map((cell) => (
          <div key={cell.k} className="px-2 py-1.5">
            <p className="text-[8px] tracking-[0.2em] text-slate-500">{cell.k}</p>
            <p className={`text-[11px] font-semibold ${cell.c}`}>{cell.v}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full overflow-hidden rounded-sm border border-white/10 bg-slate-950/50 p-4 font-mono text-xs backdrop-blur-2xl sm:w-72"
      role="status"
      aria-label="Live telemetry"
    >
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
        <span className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-slate-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-red opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon-red" />
          </span>
          LIVE TELEMETRY
        </span>
        <span className="text-[10px] text-slate-500">CH-07</span>
      </div>
      <div className="space-y-2">
        <Row label="NEURAL SYNC" value={`${sync.toFixed(1)}% STABLE`} tone="cyan" />
        <Row label="OCULAR CORE" value={<span className="animate-flicker">RED-10 IR ACTIVE</span>} tone="red" />
        <Row
          label="ROUND COUNTER"
          tone="cyan"
          value={<span className="tabular-nums">{total.toLocaleString("en-US").padStart(6, "0")}</span>}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] tracking-[0.2em] text-slate-500">MAG</span>
        <div className="flex flex-1 gap-[2px]" aria-label={`${mag} of ${MAG_SIZE} rounds in magazine`}>
          {Array.from({ length: MAG_SIZE }).map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 transition-colors duration-150 ${
                i < mag ? (mag <= 6 ? "bg-neon-red" : "bg-neon-cyan/80") : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="w-6 text-right tabular-nums text-slate-300">{mag}</span>
      </div>
    </motion.div>
  );
}
