"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ParamKey = "trial_fee" | "cost_per_gen" | "credit_cap" | "generations";

type ParamSpec = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: "money" | "count";
};

export type UnitEconomicsParams = Record<ParamKey, ParamSpec>;

const DEFAULT_PARAMS: UnitEconomicsParams = {
  trial_fee: { label: "Trial fee", value: 1, min: 0, max: 20, step: 0.5, format: "money" },
  cost_per_gen: { label: "Cost per generation", value: 0.08, min: 0.01, max: 0.5, step: 0.01, format: "money" },
  credit_cap: { label: "Credit cap", value: 10, min: 0, max: 80, step: 1, format: "count" },
  generations: { label: "Generations used", value: 10, min: 0, max: 80, step: 1, format: "count" },
};

const FOOTER = "*Guarantees zero negative balance by hard-capping AI credits at breakeven.";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Net Profit = trial_fee - (Math.min(generations, credit_cap) * cost_per_gen) */
export function netProfit(generations: number, trialFee: number, creditCap: number, costPerGen: number): number {
  return trialFee - Math.min(generations, creditCap) * costPerGen;
}

function money(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function buildSeries(trialFee: number, creditCap: number, costPerGen: number) {
  const breakeven = costPerGen > 0 ? trialFee / costPerGen : creditCap;
  const end = Math.max(creditCap, breakeven, 1);
  const steps = 48;
  const marks = new Set<number>([0, creditCap, end]);
  if (breakeven > 0 && breakeven < end) marks.add(breakeven);
  for (let index = 0; index <= steps; index += 1) marks.add((end * index) / steps);
  return [...marks]
    .sort((a, b) => a - b)
    .map((generations) => ({
      generations: roundMoney(generations),
      netProfit: roundMoney(netProfit(generations, trialFee, creditCap, costPerGen)),
    }));
}

function Slider({
  id,
  min,
  max,
  step,
  value,
  onValueChange,
}: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const span = max - min;
  const fill = span === 0 ? 0 : ((value - min) / span) * 100;
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onChange={(event) => onValueChange(Number(event.target.value))}
      className="axiom-econ-slider h-11 w-full cursor-pointer appearance-none bg-transparent"
      style={{ ["--fill" as string]: `${fill}%` }}
    />
  );
}

const PARAM_ORDER: ParamKey[] = ["trial_fee", "cost_per_gen", "credit_cap", "generations"];

export function UnitEconomicsSimulator({
  initialParams = DEFAULT_PARAMS,
}: {
  initialParams?: UnitEconomicsParams;
} = {}) {
  const [params, setParams] = useState(initialParams);

  const trialFee = params.trial_fee.value;
  const costPerGen = params.cost_per_gen.value;
  const creditCap = params.credit_cap.value;
  const generations = params.generations.value;

  const live = useMemo(() => {
    const trialRevenue = roundMoney(trialFee);
    const maxApiExposure = roundMoney(creditCap * costPerGen);
    const minGuaranteedMargin = roundMoney(netProfit(creditCap, trialFee, creditCap, costPerGen));
    const currentNet = roundMoney(netProfit(generations, trialFee, creditCap, costPerGen));
    return {
      trialRevenue,
      maxApiExposure,
      minGuaranteedMargin,
      currentNet,
      series: buildSeries(trialFee, creditCap, costPerGen),
    };
  }, [trialFee, costPerGen, creditCap, generations]);

  function setParam(key: ParamKey, value: number) {
    setParams((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
  }

  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl border border-[#00f0ff]/25 bg-zinc-950/90 p-5 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_40px_rgba(0,240,255,0.08)] backdrop-blur-xl">
      <style>{`
        .axiom-econ-slider { --track: #27272a; }
        .axiom-econ-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, #00f0ff var(--fill), #27272a var(--fill));
        }
        .axiom-econ-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          margin-top: -7px;
          height: 20px;
          width: 20px;
          border-radius: 999px;
          border: 2px solid #10b981;
          background: #09090b;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18), 0 0 12px rgba(0, 240, 255, 0.35);
        }
        .axiom-econ-slider::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: #27272a;
        }
        .axiom-econ-slider::-moz-range-progress {
          height: 6px;
          border-radius: 999px;
          background: #00f0ff;
        }
        .axiom-econ-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 999px;
          border: 2px solid #10b981;
          background: #09090b;
        }
        .axiom-econ-positive { color: #10b981; }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/70 to-transparent"
      />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00f0ff]">Simulation</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Unit economics</h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Live net {money(live.currentNet)}
        </p>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,17rem)_1fr]">
        <div className="grid gap-3">
          {PARAM_ORDER.map((key) => {
            const spec = params[key];
            const inputId = `econ-${key}`;
            const shown = spec.format === "count" ? String(spec.value) : money(spec.value);
            return (
              <label
                key={key}
                htmlFor={inputId}
                className="block rounded-xl border border-white/10 bg-zinc-900/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <span className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                  {spec.label}
                  <span className="text-[#00f0ff]">{shown}</span>
                </span>
                <Slider
                  id={inputId}
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={spec.value}
                  onValueChange={(next) => setParam(key, next)}
                />
              </label>
            );
          })}
        </div>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-[#00f0ff]/20 bg-zinc-900/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">Trial Revenue</p>
              <p className="mt-2 font-mono text-2xl text-[#00f0ff]">{money(live.trialRevenue)}</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-zinc-900/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">Max API Exposure</p>
              <p className="mt-2 font-mono text-2xl text-[#ffb020]">{money(live.maxApiExposure)}</p>
            </article>
            <article className="rounded-xl border border-[#10b981]/25 bg-zinc-900/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">Min Guaranteed Margin</p>
              <p className={`mt-2 font-mono text-2xl ${live.minGuaranteedMargin >= 0 ? "axiom-econ-positive" : "text-[#ff2a3d]"}`}>
                {money(live.minGuaranteedMargin)}
              </p>
            </article>
          </div>

          <div className="mt-4 h-64 rounded-xl border border-[#00f0ff]/15 bg-zinc-900/70 p-2 shadow-[inset_0_0_30px_rgba(0,0,0,0.45)]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={live.series} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="generations"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickFormatter={(value: number) => String(Math.round(value))}
                  stroke="rgba(255,255,255,0.12)"
                  label={{
                    value: "AI Generations Used",
                    position: "insideBottom",
                    offset: -2,
                    fill: "#a1a1aa",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickFormatter={(value: number) => money(value)}
                  stroke="rgba(255,255,255,0.12)"
                  width={56}
                />
                <Tooltip
                  formatter={(value) => [money(Number(value)), "Net Profit / Loss per User"]}
                  labelFormatter={(label) => `AI Generations Used: ${label}`}
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid rgba(0,240,255,0.25)",
                    borderRadius: 12,
                    color: "#f4f4f5",
                    boxShadow: "0 0 24px rgba(0,240,255,0.12)",
                  }}
                />
                <ReferenceLine y={0} stroke="#d4a348" strokeDasharray="4 4" />
                <Line type="linear" dataKey="netProfit" stroke="#00f0ff" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-zinc-500">{FOOTER}</p>
        </div>
      </div>
    </section>
  );
}
