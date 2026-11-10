'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Phone, Radio, X } from 'lucide-react';
import RadarLogo from './RadarLogo';
import { nav, site } from './config/site';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`border-b transition-colors duration-500 ${
          scrolled ? 'border-white/10 bg-ink-900/70 backdrop-blur-md' : 'border-transparent bg-ink-900/20 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="group flex items-center gap-3" aria-label={`${site.legalName} home`}>
            <RadarLogo size={40} />
            <span className="leading-none">
              <span className="block font-stencil text-[26px] font-black tracking-[0.12em] text-amber">{site.name}</span>
              <span className="mt-1 block font-mono text-[9.5px] tracking-tactical text-steel-300">{site.tagline}</span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative px-4 py-2 font-mono text-[12px] uppercase tracking-[0.16em] text-steel-200 transition hover:text-white"
              >
                {item.label}
                <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-amber transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={site.phoneHref}
              className="hidden items-center gap-2 font-mono text-[13px] tracking-wider text-steel-100 transition hover:text-amber-glow md:flex"
            >
              <Phone className="h-4 w-4 text-amber" />
              {site.phoneDisplay}
            </a>
            <a
              href="#contact"
              className="hidden animate-pulse-amber items-center gap-2 bg-amber px-4 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-ink-950 transition hover:bg-amber-hot sm:flex"
            >
              <Radio className="h-4 w-4" />
              Request Deployment
            </a>
            <a
              href={site.phoneHref}
              aria-label={`Call ${site.phoneDisplay}`}
              className="flex h-10 w-10 items-center justify-center border border-amber/60 text-amber md:hidden"
            >
              <Phone className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center border border-white/15 text-steel-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex h-[72px] items-center justify-between px-4 sm:px-6">
              <span className="flex items-center gap-3">
                <RadarLogo size={36} />
                <span className="font-stencil text-2xl font-black tracking-[0.12em] text-amber">{site.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center border border-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="hazard h-1.5 w-full opacity-80" />
            <nav className="flex flex-1 flex-col justify-center gap-2 px-6" aria-label="Mobile">
              {nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.06 }}
                  className="flex items-baseline gap-4 border-b border-white/10 py-4 font-stencil text-4xl font-black uppercase tracking-wide text-white"
                >
                  <span className="font-mono text-xs text-amber">0{i + 1}</span>
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <div className="grid gap-3 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <a href={site.phoneHref} className="flex items-center justify-center gap-2 border border-amber/60 py-4 font-mono tracking-wider text-amber">
                <Phone className="h-4 w-4" /> {site.phoneDisplay}
              </a>
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="animate-pulse-amber bg-amber py-4 text-center font-mono font-bold uppercase tracking-[0.14em] text-ink-950"
              >
                Request Deployment
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
