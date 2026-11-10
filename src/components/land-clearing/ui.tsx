'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

/** Fade/slide-in on first scroll into view. */
export function Reveal({
  delay = 0,
  y = 28,
  className,
  children,
  ...rest
}: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  code,
  title,
  lede,
  align = 'left',
}: {
  code: string;
  title: React.ReactNode;
  lede?: string;
  align?: 'left' | 'center';
}) {
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className={`label mb-4 flex items-center gap-3 text-amber ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="inline-block h-2 w-2 rotate-45 bg-amber shadow-lc-glow-md" />
        {code}
      </p>
      <h2 className="font-stencil text-4xl font-black uppercase leading-[0.95] tracking-wide text-white sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {lede && <p className="mt-5 text-lg leading-relaxed text-steel-300">{lede}</p>}
    </Reveal>
  );
}
