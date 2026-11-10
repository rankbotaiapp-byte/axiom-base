"use client";

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AudioToggle } from "./HudAudio";
import { SITE } from "./site";

function Pulse({ tone = "cyan" }: { tone?: "cyan" | "amber" }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full bg-current animate-[obsidian-hud-pulse_2.4s_ease-in-out_infinite] ${
        tone === "cyan" ? "text-[#00ffcc]" : "text-amber-400"
      }`}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-white/45">{children}</span>;
}

export function HudOverlay({ node = "NODE-07", depth = "SURFACE" }: { node?: string; depth?: string }) {
  const [ping, setPing] = useState(14);
  const [sync, setSync] = useState(99.2);
  const [spark, setSpark] = useState<number[]>(() => Array.from({ length: 18 }, () => 0.5));
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      setPing(Math.round(9 + Math.random() * 14));
      setSync((s) => Math.min(99.99, Math.max(97.1, s + (Math.random() - 0.5) * 0.6)));
      setSpark((arr) => [...arr.slice(1), 0.2 + Math.random() * 0.8]);
      setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const sparkPath = spark
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / (spark.length - 1)) * 64},${18 - v * 16}`)
    .join(" ");

  const corner =
    "obsidian-glass pointer-events-auto rounded-xl border border-white/10 px-3 py-2 font-mono text-[10px] leading-relaxed tracking-[0.18em] backdrop-blur-md sm:text-[11px]";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 p-3 sm:p-6"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="absolute left-3 top-3 sm:left-6 sm:top-6" style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}>
        <Link to="/obsidian-core" className={`${corner} block`}>
          <div className="font-display text-[11px] font-bold tracking-[0.3em] text-white sm:text-xs">{SITE.brand}</div>
          <div className="mt-1 flex items-center gap-2">
            <Pulse /> <Label>{node}</Label> <span className="text-[#00ffcc]">ONLINE</span>
          </div>
          <div className="hidden sm:block">
            <Label>DEPTH</Label> <span className="text-white/80">{depth}</span>
          </div>
        </Link>
      </div>

      <div
        className="absolute right-3 top-3 flex items-center gap-2 sm:right-6 sm:top-6"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className={`${corner} hidden sm:block`}>
          <Label>T+</Label> <span className="tabular-nums text-white/80">{clock}</span>
        </div>
        <div className="pointer-events-auto">
          <AudioToggle />
        </div>
      </div>

      <div
        className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className={corner}>
          <div className="flex items-center gap-2">
            <Pulse tone="amber" /> <Label>SECURE HANDSHAKE</Label>
          </div>
          <div>
            <Label>PING</Label> <span className="tabular-nums text-amber-300">{ping}ms</span>{" "}
            <span className="hidden text-white/40 sm:inline">· TLS 1.3 · AES-256</span>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className={`${corner} flex items-center gap-3`}>
          <div>
            <div className="flex items-center gap-2">
              <Pulse /> <Label>ZERO-POINT SYNC</Label>
            </div>
            <span className="tabular-nums text-[#00ffcc]">{sync.toFixed(2)}%</span>
          </div>
          <svg width="64" height="20" viewBox="0 0 64 20" className="hidden overflow-visible sm:block" aria-hidden>
            <path
              d={sparkPath}
              fill="none"
              stroke="#00ffcc"
              strokeWidth="1.25"
              style={{ filter: "drop-shadow(0 0 3px #00ffcc)" }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
