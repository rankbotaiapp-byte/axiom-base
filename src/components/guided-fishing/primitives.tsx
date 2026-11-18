'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Fades and lifts children into place the first time they scroll into view. */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Fills its (relative, sized) parent. Local /public files go through
 * next/image; tenant-uploaded remote URLs fall back to a plain <img> so an
 * un-allowlisted host can never crash the page.
 */
export function Media({ src, alt, sizes, priority = false }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  if (src.startsWith('/')) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
  );
}

export function Eyebrow({ children, ...rest }: { children: ReactNode } & Record<`data-${string}`, string>) {
  return (
    <p {...rest} className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
      {children}
    </p>
  );
}

export const formatPrice = (price: number, suffix = '') => `$${price.toLocaleString('en-US')}${suffix}`;

export const telHref = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
};
