'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Phone } from 'lucide-react';
import { site } from './config/site';

/** Thumb-reach call/estimate bar on phones, shown once the hero scrolls away. */
export default function MobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const contact = document.getElementById('contact');
    let contactVisible = false;
    const io = new IntersectionObserver(([entry]) => {
      contactVisible = entry.isIntersecting;
      update();
    });
    if (contact) io.observe(contact);

    function update() {
      setShow(window.scrollY > window.innerHeight * 0.7 && !contactVisible);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-white/10 bg-ink-950/85 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
        >
          <a
            href={site.phoneHref}
            className="flex items-center justify-center gap-2 border border-amber/60 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-amber"
          >
            <Phone className="h-4 w-4" /> Call now
          </a>
          <a
            href="#top"
            className="flex animate-pulse-amber items-center justify-center gap-2 bg-amber py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-ink-950"
          >
            <Crosshair className="h-4 w-4" /> Get estimate
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
