'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import EstimateCard from './EstimateCard';
import { site } from './config/site';

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const time = useClock();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  // Respect reduced motion: hold on the poster frame instead of looping footage.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (mq.matches) v.pause();
      else v.play().catch(() => undefined);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
  }, []);

  return (
    <section id="top" ref={ref} className="relative isolate min-h-[100svh] overflow-hidden bg-ink-950">
      {/* Background footage */}
      <motion.div className="absolute inset-0 -z-20" style={{ scale: videoScale, y: videoY }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover object-[62%_center] [filter:contrast(1.15)_saturate(1.1)_brightness(.9)]"
          src="/media/land-clearing-loop.mp4"
          poster="/media/land-clearing-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      </motion.div>

      {/* Legibility vignettes + texture */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/55 to-ink-950/90 md:bg-gradient-to-r md:from-ink-950/95 md:via-ink-950/45 md:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-900 via-ink-900/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/80 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,transparent_35%,rgba(8,19,15,.65)_100%)]" />
        <div className="scanlines absolute inset-0 opacity-40" />
        <div className="grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
        <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-[rgba(0,255,204,0.05)] to-transparent" />
      </div>

      {/* HUD readouts */}
      <div className="pointer-events-none absolute right-4 top-[92px] hidden flex-col items-end gap-1.5 font-mono text-[11px] tracking-wider text-steel-300 md:flex lg:right-8">
        <span className="flex items-center gap-2 text-amber-glow">
          <span className="h-2 w-2 animate-blink rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /> LIVE FEED · UNIT AX-1
        </span>
        <span>{site.baseCoords}</span>
        <span suppressHydrationWarning>T {time || '--:--:--'} PST</span>
      </div>
      <div className="pointer-events-none absolute bottom-8 right-4 hidden w-56 font-mono text-[10.5px] tracking-wider text-steel-300 lg:right-8 xl:block">
        {[
          ['DRUM RPM', '2,400', 92],
          ['HYD PRESSURE', '4,950 PSI', 81],
          ['SLOPE', '22°', 49],
        ].map(([k, v, pct]) => (
          <div key={k as string} className="mb-2.5">
            <div className="mb-1 flex justify-between">
              <span>{k}</span>
              <span className="text-amber-glow">{v}</span>
            </div>
            <div className="h-1 bg-white/10">
              <motion.div
                className="h-full bg-amber shadow-lc-glow"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.6, delay: 1.2, ease }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-8 lg:pt-[88px]">
        <div className="max-w-[640px]">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="label mb-4 inline-flex items-center gap-3 border border-amber/40 bg-ink-950/50 px-3 py-1.5 text-amber-glow backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 animate-blink bg-amber" />
            Now booking winter &amp; spring deployments
          </motion.p>

          <h1 className="font-stencil text-[3.4rem] font-black uppercase leading-[0.86] tracking-wide text-white drop-shadow-[0_4px_30px_rgba(0,0,0,.6)] sm:text-7xl lg:text-[5.1rem]">
            {['Conquer', 'the', 'Wilderness'].map((word, i) => (
              <span key={word} className="mr-[0.22em] inline-block overflow-hidden align-bottom last:mr-0">
                <motion.span
                  className="inline-block"
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 0.45 + i * 0.12, ease }}
                >
                  {word}
                  {i === 2 && <span className="text-amber">.</span>}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease }}
            className="mt-4 max-w-lg text-lg leading-relaxed text-steel-200 sm:text-xl"
          >
            Tactical, high-impact land clearing and forestry mulching for impossible terrain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease }}
            className="mt-6"
          >
            <EstimateCard />
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#services"
        aria-label="Scroll to services"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 font-mono text-[10px] tracking-tactical text-steel-400 lg:flex"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        SCROLL
        <ChevronDown className="h-4 w-4 text-amber" />
      </motion.a>
    </section>
  );
}
