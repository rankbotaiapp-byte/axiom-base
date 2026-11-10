'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { stats } from './config/site';

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${Math.round(v).toLocaleString('en-US')}${suffix}`;
      },
    });
    return controls.stop;
  }, [inView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function StatsBar() {
  return (
    <section aria-label="By the numbers" className="relative border-y border-white/10 bg-ink-900">
      <div className="hazard absolute inset-x-0 top-0 h-1 opacity-70" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-4 py-8 sm:px-8 sm:py-10 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} border-white/10 lg:border-l lg:first:border-l-0`}
          >
            <p className="font-stencil text-4xl font-black text-white sm:text-5xl">
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p className="label mt-2">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
