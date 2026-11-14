'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ClipboardCheck, Map, ScanSearch, Truck, type LucideIcon } from 'lucide-react';
import { protocol } from './config/site';
import { SectionHeading } from './ui';

const stepIcons: LucideIcon[] = [ScanSearch, Map, Truck, ClipboardCheck];

export default function Protocol() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section className="relative overflow-hidden bg-ink-900 py-24 sm:py-32" aria-labelledby="protocol-title">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          code="04 — Deployment Protocol"
          title={
            <span id="protocol-title">
              From first call to <span className="text-amber">clean ground.</span>
            </span>
          }
        />

        <div ref={ref} className="relative mt-16">
          {/* progress rail */}
          <div className="absolute left-[27px] top-0 h-full w-px bg-white/10 lg:left-0 lg:top-[27px] lg:h-px lg:w-full" />
          <motion.div
            className="absolute left-[27px] top-0 h-full w-px origin-top bg-amber shadow-lc-glow-md lg:hidden"
            style={{ scaleY: progress }}
          />
          <motion.div
            className="absolute left-0 top-[27px] hidden h-px w-full origin-left bg-amber shadow-lc-glow-md lg:block"
            style={{ scaleX: progress }}
          />

          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
            {protocol.map((p, i) => {
              const Icon = stepIcons[i % stepIcons.length];
              return (
                <motion.li
                  key={p.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative grid grid-cols-[56px_1fr] gap-5 lg:block"
                >
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center border border-amber bg-ink-950 text-amber shadow-amber">
                    <Icon className="h-6 w-6" strokeWidth={1.6} />
                  </span>
                  <div className="lg:mt-7">
                    <p className="font-mono text-xs tracking-tactical text-amber">PHASE {p.step}</p>
                    <h3 className="mt-1 font-stencil text-3xl font-black uppercase tracking-wide text-white">{p.title}</h3>
                    <p className="mt-3 leading-relaxed text-steel-300">{p.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
