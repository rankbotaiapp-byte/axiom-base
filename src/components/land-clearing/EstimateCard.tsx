'use client';

import { useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, Check, Crosshair, Phone, Timer } from 'lucide-react';
import { estimator, site, type DensityKey, type ServiceKey, type TerrainKey } from './config/site';
import { calculateEstimate, describeEstimate, usd } from './lib/estimate';
import { useEstimate } from './EstimateContext';

function AnimatedUsd({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => usd(Math.round(v / 50) * 50));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

function Segmented<K extends string>({
  label,
  options,
  value,
  onChange,
  cols,
}: {
  label: string;
  options: Readonly<Record<K, { label: string; short?: string }>>;
  value: K;
  onChange: (k: K) => void;
  cols: string;
}) {
  return (
    <fieldset>
      <legend className="label mb-2">{label}</legend>
      <div className={`grid gap-1.5 ${cols}`}>
        {(Object.keys(options) as K[]).map((k) => (
          <button
            key={k}
            type="button"
            className="seg"
            data-active={value === k}
            aria-pressed={value === k}
            aria-label={options[k].label}
            title={options[k].label}
            onClick={() => onChange(k)}
          >
            {options[k].short ?? options[k].label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function EstimateCard() {
  const { lock } = useEstimate();
  const [service, setService] = useState<ServiceKey>('mulching');
  const [acres, setAcres] = useState(estimator.acres.default);
  const [density, setDensity] = useState<DensityKey>('medium');
  const [terrain, setTerrain] = useState<TerrainKey>('rolling');
  const [locked, setLocked] = useState(false);

  const input = { service, acres, density, terrain };
  const result = useMemo(() => calculateEstimate({ service, acres, density, terrain }), [service, acres, density, terrain]);
  const fill = ((acres - estimator.acres.min) / (estimator.acres.max - estimator.acres.min)) * 100;

  useEffect(() => setLocked(false), [service, acres, density, terrain]);

  const onLock = () => {
    lock({ summary: describeEstimate(input, result), service, acres });
    setLocked(true);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="glass hud-frame w-full max-w-[560px] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <h2 className="flex items-center gap-2.5 font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-white">
          <Crosshair className="h-4 w-4 shrink-0 text-amber" />
          Get an instant deployment estimate
        </h2>
      </div>
      <p className="-mt-2 mb-4 font-mono text-[10.5px] uppercase tracking-wider text-steel-500">
        Ballpark only · fixed price after a free site recon
      </p>

      <div className="grid gap-4">
        <Segmented
          label="Mission type"
          options={estimator.services}
          value={service}
          onChange={setService}
          cols="grid-cols-2 sm:grid-cols-4"
        />

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="acres" className="label">
              Acreage
            </label>
            <span className="font-mono text-lg text-amber-glow">
              {acres.toFixed(acres % 1 ? 2 : 0)} <span className="text-xs text-steel-400">AC</span>
            </span>
          </div>
          <input
            id="acres"
            type="range"
            min={estimator.acres.min}
            max={estimator.acres.max}
            step={estimator.acres.step}
            value={acres}
            onChange={(e) => setAcres(Number(e.target.value))}
            className="h-5 w-full cursor-pointer"
            style={{ ['--fill' as string]: `${fill}%` }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented label="Vegetation" options={estimator.density} value={density} onChange={setDensity} cols="grid-cols-3" />
          <Segmented label="Terrain" options={estimator.terrain} value={terrain} onChange={setTerrain} cols="grid-cols-3" />
        </div>

        <div className="flex items-end justify-between gap-4 border border-amber/25 bg-forest-950/70 px-4 py-3.5">
          <div>
            <p className="label mb-1">Ballpark range</p>
            <p className="font-stencil text-[1.9rem] font-black leading-none tracking-wide text-white sm:text-4xl">
              <AnimatedUsd value={result.low} />
              <span className="mx-1.5 text-amber">–</span>
              <AnimatedUsd value={result.high} />
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 font-mono text-sm text-steel-100">
              <Timer className="h-4 w-4 text-amber" />
              {result.days} day{result.days > 1 ? 's' : ''}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-steel-500">on site · est.</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={onLock}
            className="bg-amber px-5 py-3.5 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-ink-950 shadow-amber transition hover:bg-amber-hot hover:shadow-amber-lg"
          >
            {locked ? (
              <span className="inline-flex items-center justify-center gap-2">
                Estimate locked <Check className="h-4 w-4" aria-hidden />
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                Lock in this estimate <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            )}
          </button>
          <a
            href={site.phoneHref}
            className="flex items-center justify-center gap-2 border border-white/15 px-4 py-3.5 font-mono text-[12px] tracking-wider text-steel-100 transition hover:border-amber hover:text-amber-glow"
          >
            <Phone className="h-4 w-4" /> Call now
          </a>
        </div>
      </div>
    </div>
  );
}
