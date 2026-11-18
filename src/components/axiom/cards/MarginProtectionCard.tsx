"use client";

import { useMemo, useState } from "react";

const FOOTER = "*Guarantees zero negative balance by hard-capping AI credits at breakeven.";

type Params = {
  trialFee: number;
  costPerGen: number;
  creditCap: number;
  generations: number;
};

const DEFAULTS: Params = {
  trialFee: 1,
  costPerGen: 0.08,
  creditCap: 10,
  generations: 10,
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** trial_fee - (Math.min(generations, credit_cap) * cost_per_gen) */
export function marginNetProfit(
  generations: number,
  trialFee: number,
  creditCap: number,
  costPerGen: number,
): number {
  return trialFee - Math.min(generations, creditCap) * costPerGen;
}

function money(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const span = max - min;
  const fill = span === 0 ? 0 : ((value - min) / span) * 100;
  return (
    <label htmlFor={id} className="block rounded-lg border border-white/10 bg-zinc-900/70 p-3">
      <span className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
        {label}
        <span className="text-[#00f0ff]">{display}</span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
        className="margin-prot-slider mt-1 h-11 w-full cursor-pointer appearance-none bg-transparent"
        style={{ ["--fill" as string]: `${fill}%` }}
      />
    </label>
  );
}

export function MarginProtectionCard() {
  const [params, setParams] = useState<Params>(DEFAULTS);

  const live = useMemo(() => {
    const trialRevenue = roundMoney(params.trialFee);
    const maxApiExposure = roundMoney(params.creditCap * params.costPerGen);
    const minGuaranteed = roundMoney(
      marginNetProfit(params.creditCap, params.trialFee, params.creditCap, params.costPerGen),
    );
    const simulated = roundMoney(
      marginNetProfit(params.generations, params.trialFee, params.creditCap, params.costPerGen),
    );
    return { trialRevenue, maxApiExposure, minGuaranteed, simulated };
  }, [params]);

  function set<K extends keyof Params>(key: K, value: Params[K]) {
    setParams((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-5 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <style>{`
        .margin-prot-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, #00f0ff var(--fill), #27272a var(--fill));
        }
        .margin-prot-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          margin-top: -7px;
          height: 20px;
          width: 20px;
          border-radius: 999px;
          border: 2px solid #10b981;
          background: #09090b;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.16);
        }
        .margin-prot-slider::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: #27272a;
        }
        .margin-prot-slider::-moz-range-progress {
          height: 6px;
          border-radius: 999px;
          background: #00f0ff;
        }
        .margin-prot-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 999px;
          border: 2px solid #10b981;
          background: #09090b;
        }
      `}</style>

      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00f0ff]">Simulation</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Trial Unit Economics & Margin Protection</h2>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="grid gap-3">
          <RangeSlider
            id="margin-trial-fee"
            label="Trial entry fee"
            value={params.trialFee}
            min={1}
            max={10}
            step={1}
            display={money(params.trialFee)}
            onChange={(value) => set("trialFee", value)}
          />
          <RangeSlider
            id="margin-cost-per-gen"
            label="API cost per AI asset"
            value={params.costPerGen}
            min={0.01}
            max={0.5}
            step={0.01}
            display={money(params.costPerGen)}
            onChange={(value) => set("costPerGen", value)}
          />
          <RangeSlider
            id="margin-credit-cap"
            label="Hard trial credit cap"
            value={params.creditCap}
            min={1}
            max={50}
            step={1}
            display={`${params.creditCap} gens`}
            onChange={(value) => set("creditCap", value)}
          />
          <RangeSlider
            id="margin-generations"
            label="Generations simulated"
            value={params.generations}
            min={1}
            max={50}
            step={1}
            display={`${params.generations} gens`}
            onChange={(value) => set("generations", value)}
          />
        </div>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-lg border border-[#00f0ff]/20 bg-zinc-900/70 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">Trial Revenue</p>
              <p className="mt-2 font-mono text-2xl text-[#00f0ff]">{money(live.trialRevenue)}</p>
            </article>
            <article className="rounded-lg border border-white/10 bg-zinc-900/70 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">Max API Exposure</p>
              <p className="mt-2 font-mono text-2xl text-[#ffb020]">{money(live.maxApiExposure)}</p>
            </article>
            <article className="rounded-lg border border-[#10b981]/25 bg-zinc-900/70 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">Min Guaranteed Net Profit</p>
              <p
                className={`mt-2 font-mono text-2xl ${
                  live.minGuaranteed >= 0 ? "text-[#10b981]" : "text-[#ff2a3d]"
                }`}
              >
                {money(live.minGuaranteed)}
              </p>
            </article>
          </div>

          <p className="mt-4 font-mono text-[11px] text-zinc-400">
            Simulated net at {params.generations} gens:{" "}
            <span className={live.simulated >= 0 ? "text-[#10b981]" : "text-[#ff2a3d]"}>{money(live.simulated)}</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">{FOOTER}</p>
        </div>
      </div>
    </section>
  );
}
