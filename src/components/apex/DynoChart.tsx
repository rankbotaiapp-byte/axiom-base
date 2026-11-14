"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import styles from "./apex.module.css";
import { buildDynoCurve, type DynoPoint } from "./config";
import { cx } from "./ui";

const W = 640;
const H = 320;
const PAD = { l: 48, r: 48, t: 18, b: 34 };
const RPM_MIN = 2000;
const RPM_MAX = 9000;
const Y_MAX = 800;

const x = (rpm: number) => PAD.l + ((rpm - RPM_MIN) / (RPM_MAX - RPM_MIN)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - (v / Y_MAX) * (H - PAD.t - PAD.b);

/** Factory baseline (naturally aspirated) for comparison. */
const stockWhp = (rpm: number) => Math.round(430 * Math.sin(Math.min(1, (rpm - 1200) / 7400) * (Math.PI / 2)) ** 1.15);

export default function DynoChart() {
  const curve = useMemo<DynoPoint[]>(() => buildDynoCurve(), []);
  const [hover, setHover] = useState<DynoPoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const path = (key: "whp" | "tq") => curve.map((p, i) => `${i ? "L" : "M"}${x(p.rpm).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const stockPath = curve.map((p, i) => `${i ? "L" : "M"}${x(p.rpm).toFixed(1)},${y(stockWhp(p.rpm)).toFixed(1)}`).join(" ");
  const areaPath = `${path("whp")} L${x(RPM_MAX)},${y(0)} L${x(RPM_MIN)},${y(0)} Z`;

  const peak = curve.reduce((a, b) => (b.whp > a.whp ? b : a));
  const peakTq = curve.reduce((a, b) => (b.tq > a.tq ? b : a));

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const rpm = RPM_MIN + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (RPM_MAX - RPM_MIN);
    let best = curve[0] ?? null;
    for (const p of curve) if (best && Math.abs(p.rpm - rpm) < Math.abs(best.rpm - rpm)) best = p;
    setHover(best);
  };

  const active = hover ?? peak;

  return (
    <figure className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.18em]">
        <span className="flex items-center gap-2 text-cyan-200">
          <span className="h-0.5 w-5 bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" /> Wheel HP
        </span>
        <span className="flex items-center gap-2 text-violet-200">
          <span className="h-0.5 w-5 bg-violet-400" /> Torque lb-ft
        </span>
        <span className="flex items-center gap-2 text-slate-400">
          <span className="h-0 w-5 border-t border-dashed border-slate-400" /> Factory WHP
        </span>
        <span className={cx("ml-auto text-slate-300", styles.mono)}>
          {active.rpm.toLocaleString()} rpm · <span className="text-cyan-200">{active.whp} whp</span> ·{" "}
          <span className="text-violet-200">{active.tq} lb-ft</span>
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Dyno chart. Peak ${peak.whp} wheel horsepower at ${peak.rpm} rpm, peak ${peakTq.tq} lb-ft torque at ${peakTq.rpm} rpm.`}
      >
        <defs>
          <linearGradient id="dyno-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(34,211,238,0.35)" />
            <stop offset="1" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <filter id="dyno-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 200, 400, 600, 800].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(148,163,184,0.15)" />
            <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
              {v}
            </text>
            <text x={W - PAD.r + 8} y={y(v) + 4} className="fill-slate-600 text-[10px]">
              {v}
            </text>
          </g>
        ))}
        {[2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000].map((r) => (
          <g key={r}>
            <line x1={x(r)} x2={x(r)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(148,163,184,0.08)" />
            <text x={x(r)} y={H - PAD.b + 18} textAnchor="middle" className="fill-slate-500 text-[10px]">
              {r / 1000}k
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#dyno-area)" />
        <path d={stockPath} fill="none" stroke="rgba(148,163,184,0.7)" strokeWidth="1.5" strokeDasharray="5 5" />
        <path d={path("tq")} fill="none" stroke="#a78bfa" strokeWidth="2" />
        <path d={path("whp")} fill="none" stroke="#67e8f9" strokeWidth="2.5" filter="url(#dyno-glow)" />

        <g>
          <line x1={x(active.rpm)} x2={x(active.rpm)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(165,243,252,0.5)" strokeDasharray="2 3" />
          <circle cx={x(active.rpm)} cy={y(active.whp)} r="4.5" fill="#020617" stroke="#67e8f9" strokeWidth="2" />
          <circle cx={x(active.rpm)} cy={y(active.tq)} r="4" fill="#020617" stroke="#a78bfa" strokeWidth="2" />
        </g>
      </svg>
      <figcaption className="mt-2 text-xs text-slate-400">
        Load-bearing chassis dyno, SAE J1349 corrected, E85 flex-fuel blend. Hover or drag across the chart for a live readout.
      </figcaption>
    </figure>
  );
}
