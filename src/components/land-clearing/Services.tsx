'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Axe, Flame, Route, Sprout, Tractor, Trees, type LucideIcon } from 'lucide-react';
import { services } from './config/site';
import { SectionHeading } from './ui';

const icons: Record<(typeof services)[number]['icon'], LucideIcon> = { Trees, Tractor, Flame, Route, Sprout, Axe };

export default function Services() {
  return (
    <section id="services" className="relative overflow-hidden bg-ink-900 py-24 sm:py-32">
      <div className="grid-overlay absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          code="02 — Capabilities"
          title={
            <>
              Six ways we <span className="text-amber">take ground</span> back.
            </>
          }
          lede="Overgrown, steep, wet or burned over — if a machine can stand on it, we can clear it. Every service is quoted fixed-price after recon."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = icons[s.icon];
            return (
              <motion.a
                key={s.title}
                href="#contact"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className="group relative flex flex-col overflow-hidden border border-white/10 bg-ink-800/80 p-7 transition-colors duration-300 hover:border-amber/70"
              >
                <span className="hazard absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber/0 blur-3xl transition-colors duration-500 group-hover:bg-amber/15" />
                <div className="relative mb-8 flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center border border-amber/40 bg-forest-900 text-amber transition-all duration-300 group-hover:border-amber group-hover:shadow-amber">
                    <Icon className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                  <span className="font-mono text-[11px] tracking-wider text-steel-500">{s.code}</span>
                </div>
                <h3 className="relative font-stencil text-[1.9rem] font-black uppercase leading-none tracking-wide text-white">
                  {s.title}
                </h3>
                <p className="relative mt-4 flex-1 leading-relaxed text-steel-300">{s.body}</p>
                <span className="relative mt-7 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-amber-glow">
                  Request this mission
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
