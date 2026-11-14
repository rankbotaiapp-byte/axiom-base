'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { caseStudies } from './config/site';
import { SectionHeading } from './ui';

export default function CaseStudies() {
  return (
    <section id="cases" className="relative overflow-hidden bg-forest-950 py-24 sm:py-32">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.12] [filter:grayscale(1)_contrast(1.2)]"
        style={{ backgroundImage: 'url(/media/land-clearing-poster.jpg)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950 via-forest-950/85 to-forest-950" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          code="05 — Case Studies"
          title={
            <>
              Missions <span className="text-amber">completed.</span>
            </>
          }
          lede="A few recent deployments across the region, from fire-season prep to full build-site clears."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {caseStudies.map((c, i) => (
            <motion.article
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass hud-frame group flex flex-col p-7 transition-colors hover:border-amber/50"
            >
              <div className="flex items-center justify-between">
                <span className="border border-amber/50 bg-amber/10 px-2.5 py-1 font-mono text-[10.5px] tracking-tactical text-amber-glow">
                  {c.tag}
                </span>
                <span className="font-mono text-[11px] text-steel-500">OP-{String(i + 1).padStart(3, '0')}</span>
              </div>
              <h3 className="mt-6 font-stencil text-3xl font-black uppercase leading-none tracking-wide text-white">{c.title}</h3>
              <p className="mt-3 flex items-center gap-1.5 font-mono text-[12px] text-steel-400">
                <MapPin className="h-3.5 w-3.5 text-amber" /> {c.location}
              </p>
              <p className="mt-5 flex-1 leading-relaxed text-steel-300">{c.body}</p>
              <dl className="mt-7 grid grid-cols-3 border-t border-white/10 pt-5">
                {c.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="label text-[10px]">{m.label}</dt>
                    <dd className="mt-1 font-stencil text-3xl font-black text-white transition-colors group-hover:text-amber-glow">
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
