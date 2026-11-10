'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Construction, Gauge, ShieldCheck, Truck } from 'lucide-react';
import { fleet } from './config/site';
import { SectionHeading } from './ui';

const schematicIcon = { ctl: Truck, excavator: Construction } as Record<string, typeof Truck>;

export default function Fleet() {
  const [activeId, setActiveId] = useState(fleet[0].id);
  const active = fleet.find((f) => f.id === activeId) ?? fleet[0];
  const Schematic = schematicIcon[active.id] ?? Truck;

  return (
    <section id="fleet" className="relative bg-forest-950 py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(31,66,56,.55),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          code="03 — Our Fleet"
          title={
            <>
              Iron built for <span className="text-amber">the worst ground</span> you own.
            </>
          }
          lede="Low ground-pressure tracks protect soil and root zones. Every unit is serviced in-house and inspected before every deployment."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Unit selector */}
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1" role="tablist" aria-label="Fleet units">
            {fleet.map((unit) => {
              const on = unit.id === activeId;
              return (
                <button
                  key={unit.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveId(unit.id)}
                  className={`relative border p-5 text-left transition ${
                    on ? 'border-amber bg-ink-900/90' : 'border-white/10 bg-ink-900/40 hover:border-white/25'
                  }`}
                >
                  {on && (
                    <motion.span layoutId="fleet-active" className="absolute inset-y-0 left-0 w-1 bg-amber shadow-lc-glow-lg" />
                  )}
                  <p className="label mb-1.5">{unit.role}</p>
                  <p className={`font-stencil text-2xl font-black uppercase tracking-wide ${on ? 'text-white' : 'text-steel-300'}`}>
                    {unit.name}
                  </p>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-steel-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber" /> READINESS {unit.readiness}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* Unit display */}
          <div className="hud-frame relative min-h-[420px] overflow-hidden border border-white/10 bg-ink-950 sm:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                {active.image ? (
                  <img
                    src={active.image}
                    alt={`${active.name} clearing timber in a Pacific Northwest forest`}
                    className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
                  />
                ) : (
                  <div className="grid-overlay flex h-full items-center justify-center bg-forest-950">
                    <Schematic className="h-40 w-40 text-amber/30" strokeWidth={0.75} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
                <div className="scanlines absolute inset-0 opacity-30" />
              </motion.div>
            </AnimatePresence>

            <div className="absolute left-4 top-4 flex items-center gap-2 bg-ink-950/70 px-3 py-1.5 font-mono text-[11px] tracking-wider text-amber-glow backdrop-blur-md">
              <Gauge className="h-3.5 w-3.5" /> UNIT PROFILE · {active.id.toUpperCase()}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <motion.div
                key={`${active.id}-specs`}
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                className="grid grid-cols-2 gap-2 md:grid-cols-4"
              >
                {active.specs.map((spec) => (
                  <motion.div
                    key={spec.label}
                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                    className="glass p-3 sm:p-4"
                  >
                    <p className="label mb-1 text-[10px]">{spec.label}</p>
                    <p className="font-stencil text-xl font-black uppercase tracking-wide text-white sm:text-2xl">{spec.value}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
