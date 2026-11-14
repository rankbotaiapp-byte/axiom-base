"use client";

import { motion, type Variants } from "framer-motion";
import ApexHero from "./ApexHero";
import ConciergeSheet from "./ConciergeSheet";
import { openConcierge } from "./conciergeEvents";
import { LatencyProvider } from "./LatencyProvider";
import TacticalCard from "./TacticalCard";
import type { ShopConfig } from "./config";

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.1, ease: EASE } }),
};

/** Shared page container so every section snaps to the same 12-col grid. */
const GRID = "mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6 px-5 md:px-10";

export default function HyperMotoLanding({ config }: { config: ShopConfig }) {
  return (
    <LatencyProvider>
      <main className="min-h-screen bg-[#030712] text-slate-100 selection:bg-[#00ffcc]/30">
        <ApexHero config={config} />

        {/* ========================= BUILD TIERS ======================== */}
        <section id="tiers" className="relative py-24">
          <div className={`${GRID} gap-y-10`}>
            <motion.header
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={reveal}
              className="col-span-12 flex flex-wrap items-end justify-between gap-4"
            >
              <div>
                <p className="font-mono text-xs tracking-[0.3em] text-red-400 uppercase">03 // Build Tiers</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Pick your power band.</h2>
              </div>
              <p className="max-w-sm text-sm text-slate-400">
                Every tier ships with a before-and-after dyno sheet. Prices are starting points; your build is quoted
                after the consultation.
              </p>
            </motion.header>

            {config.tiers.map((tier, i) => (
              <motion.article
                key={tier.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                custom={i}
                variants={reveal}
                className="col-span-12 md:col-span-4"
              >
                <TacticalCard
                  code={`T${i + 1}`}
                  label={tier.turnaround}
                  featured={tier.featured}
                  aside={
                    tier.featured ? (
                      <span className="rounded-full bg-red-500 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-white uppercase shadow-[0_0_14px_rgba(239,68,68,0.8)]">
                        Most booked
                      </span>
                    ) : undefined
                  }
                  className="h-full transition-transform duration-300 hover:-translate-y-1.5"
                  bodyClassName="flex flex-col p-6"
                >
                  <h3 className="text-lg font-bold text-slate-100">{tier.name}</h3>
                  <p className="mt-4 font-mono text-5xl font-black text-[#00ffcc] tabular-nums">
                    {tier.headlineHp}
                    <span className="ml-1 text-base text-slate-500">whp</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{tier.price}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-sm text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-cyan-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={openConcierge}
                    className={`mt-8 rounded-xl px-4 py-3 text-center text-sm font-bold tracking-wide transition-colors ${
                      tier.featured
                        ? "bg-[#00ffcc] text-[#030712] hover:bg-[#66ffe0]"
                        : "border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                    }`}
                  >
                    Book a consultation
                  </button>
                </TacticalCard>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ========================== PORTFOLIO ========================= */}
        <section id="portfolio" className="relative pb-24">
          <div className={`${GRID} gap-y-10`}>
            <motion.header
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={reveal}
              className="col-span-12"
            >
              <p className="font-mono text-xs tracking-[0.3em] text-red-400 uppercase">04 // Portfolio</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Dyno-proven builds.</h2>
            </motion.header>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={reveal}
              className="col-span-12"
            >
              <TacticalCard code="LOG" label="Build Registry" bodyClassName="p-0">
                <div className="hidden grid-cols-[2fr_2fr_1fr_1fr] gap-4 border-b border-cyan-500/15 px-6 py-2.5 font-mono text-[10px] tracking-[0.25em] text-slate-500 uppercase sm:grid">
                  <span>Build</span>
                  <span>Spec</span>
                  <span>Dyno</span>
                  <span>Boost</span>
                </div>
                <ul className="divide-y divide-cyan-500/10">
                  {config.portfolio.map((b) => (
                    <li
                      key={b.id}
                      className="grid grid-cols-2 items-center gap-x-4 gap-y-1 px-6 py-5 transition-colors hover:bg-cyan-500/[0.04] sm:grid-cols-[2fr_2fr_1fr_1fr]"
                    >
                      <p className="font-bold text-slate-100">{b.bike}</p>
                      <p className="text-sm text-slate-400">{b.spec}</p>
                      <p className="font-mono text-[#00ffcc] tabular-nums">
                        {b.dynoHp} <span className="text-xs text-slate-500">whp</span>
                      </p>
                      <p className="font-mono text-red-400 tabular-nums">
                        {b.boostPsi > 0 ? (
                          <>
                            {b.boostPsi.toFixed(1)} <span className="text-xs text-slate-500">psi</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">Naturally aspirated</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </TacticalCard>
            </motion.div>
          </div>
        </section>

        <footer className="border-t border-cyan-500/15 px-6 py-10 text-center md:px-12">
          <p className="font-mono text-xs tracking-[0.3em] text-slate-500 uppercase">
            {config.brand} ·{" "}
            <a href={config.concierge.phoneHref} className="text-[#00ffcc] hover:text-cyan-300">
              {config.concierge.phoneDisplay}
            </a>
          </p>
        </footer>
      </main>
      <ConciergeSheet concierge={config.concierge} brand={config.brand} />
    </LatencyProvider>
  );
}
