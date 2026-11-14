'use client';

import { useState } from 'react';
import { haptic } from '@/lib/axiom/haptics';
import { field, useStudioPreview } from '@/lib/axiom/guided-fishing/useStudioPreview';
import type { GuidedFishingConfig, ImageBlock, TripSelection } from '@/lib/axiom/guided-fishing/types';
import BookingWidget from './BookingWidget';
import LeadCaptureForm from './LeadCaptureForm';
import SyncedHeroPlayer from './SyncedHeroPlayer';
import { Eyebrow, Media, Reveal, telHref } from './primitives';

const primaryButton =
  'inline-flex items-center justify-center rounded-full bg-amber-300 px-7 py-4 text-sm font-bold uppercase tracking-[0.14em] text-stone-950 transition hover:bg-amber-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300';
const ghostButton =
  'inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-bold uppercase tracking-[0.14em] text-stone-50 backdrop-blur-md transition hover:bg-white/15 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300';

function scrollToId(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** Image + copy row; `flip` puts the image on the right at desktop widths. */
function FeatureRow({
  block,
  path,
  flip = false,
  children,
}: {
  block: Omit<ImageBlock, 'body'> & { body?: string };
  path: 'guide' | 'fleet' | 'gear' | 'success';
  flip?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-14 md:py-24">
      <Reveal className={flip ? 'md:order-2' : ''}>
        <div {...field(`${path}.imageSrc`)} className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
          <Media src={block.imageSrc} alt={block.imageAlt} sizes="(min-width: 768px) 50vw, 100vw" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#05070a]/50 to-transparent" />
        </div>
      </Reveal>
      <Reveal delay={120}>
        <Eyebrow {...field(`${path}.eyebrow`)}>{block.eyebrow}</Eyebrow>
        <h2 {...field(`${path}.heading`)} className="mt-3 font-serif text-3xl leading-tight text-stone-50 sm:text-4xl">
          {block.heading}
        </h2>
        {block.body ? (
          <p {...field(`${path}.body`)} className="mt-4 text-base leading-relaxed text-stone-300">
            {block.body}
          </p>
        ) : null}
        {children}
      </Reveal>
    </section>
  );
}

export default function GuidedFishingStorefront({ initialConfig }: { initialConfig: GuidedFishingConfig }) {
  const { config, isPreview } = useStudioPreview(initialConfig);
  const { business, hero, stats, pricing, guide, fleet, gear, success, lead } = config;

  const [selection, setSelection] = useState<TripSelection>(() => ({
    tierId: (pricing.tiers.find((t) => t.featured) ?? pricing.tiers[0])?.id ?? '',
    date: '',
    anglers: Math.min(2, pricing.maxAnglers),
  }));

  const go = (id: string) => () => {
    haptic('tap');
    scrollToId(id);
  };

  return (
    <main
      className={`min-h-screen bg-[#05070a] pb-24 font-sans text-stone-200 antialiased selection:bg-amber-300 selection:text-stone-950 md:pb-0 ${
        isPreview
          ? '[&_[data-axiom-field]]:cursor-pointer [&_[data-axiom-field]:hover]:outline-dashed [&_[data-axiom-field]:hover]:outline-1 [&_[data-axiom-field]:hover]:outline-offset-4 [&_[data-axiom-field]:hover]:outline-amber-300'
          : ''
      }`}
    >
      {/* ───────────── Hero ───────────── */}
      <SyncedHeroPlayer videoSrc={hero.videoSrc} posterSrc={hero.posterSrc}>
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-28 sm:px-8 sm:pb-20">
          <p {...field('business.name')} className="font-serif text-lg tracking-wide text-stone-50 sm:text-xl">
            {business.name}
          </p>
          <div className="mt-6 max-w-3xl">
            <Eyebrow {...field('hero.eyebrow')}>{hero.eyebrow}</Eyebrow>
            <h1 {...field('hero.headline')} className="mt-4 font-serif text-4xl leading-[1.08] text-stone-50 sm:text-5xl lg:text-6xl">
              {hero.headline}
            </h1>
            <p {...field('hero.subhead')} className="mt-5 max-w-xl text-base leading-relaxed text-stone-200/90 sm:text-lg">
              {hero.subhead}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={go('book')} {...field('hero.primaryCta')} className={primaryButton}>
              {hero.primaryCta}
            </button>
            <a href={telHref(business.phone)} onClick={() => haptic('tap')} {...field('hero.secondaryCta')} className={ghostButton}>
              {hero.secondaryCta}
            </a>
          </div>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <ul className="flex flex-wrap gap-2">
              {business.locationTags.map((tag, index) => (
                <li
                  key={tag}
                  {...field(`business.locationTags.${index}`)}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-medium text-stone-200"
                >
                  {tag}
                </li>
              ))}
            </ul>
            <p className="text-sm text-stone-300">
              <span {...field('business.tagline')}>{business.tagline}</span>{' '}
              <a href={telHref(business.phone)} {...field('business.phone')} className="whitespace-nowrap font-semibold text-amber-200 underline-offset-4 hover:underline">
                {business.phone}
              </a>
            </p>
          </div>
        </div>
      </SyncedHeroPlayer>

      {/* ───────────── Proof strip ───────────── */}
      <section className="border-y border-white/5 bg-gradient-to-b from-[#0a0e12] to-[#05070a]">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 sm:px-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 80} className="py-8 md:py-10">
              <dd {...field(`stats.${index}.value`)} className="font-serif text-3xl text-amber-200 sm:text-4xl">
                {stat.value}
              </dd>
              <dt {...field(`stats.${index}.label`)} className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                {stat.label}
              </dt>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* ───────────── Pricing + booking ───────────── */}
      <section id="book" className="scroll-mt-6 bg-gradient-to-b from-[#05070a] via-[#0b1014] to-[#05070a]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
          <Reveal className="max-w-2xl">
            <Eyebrow {...field('pricing.eyebrow')}>{pricing.eyebrow}</Eyebrow>
            <h2 {...field('pricing.heading')} className="mt-3 font-serif text-3xl text-stone-50 sm:text-5xl">
              {pricing.heading}
            </h2>
            <p {...field('pricing.subhead')} className="mt-4 text-base leading-relaxed text-stone-300">
              {pricing.subhead}
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-10">
            <BookingWidget pricing={pricing} selection={selection} onChange={setSelection} onReserve={() => scrollToId('contact')} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── Story sections ───────────── */}
      <FeatureRow block={guide} path="guide">
        <p {...field('guide.name')} className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
          {guide.name}
        </p>
        <div className="mt-4 space-y-4">
          {guide.bio.map((paragraph, index) => (
            <p key={index} {...field(`guide.bio.${index}`)} className="text-base leading-relaxed text-stone-300">
              {paragraph}
            </p>
          ))}
        </div>
      </FeatureRow>

      <FeatureRow block={fleet} path="fleet" flip />

      <FeatureRow block={gear} path="gear">
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {gear.items.map((item, index) => (
            <li key={item} {...field(`gear.items.${index}`)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-200">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
              {item}
            </li>
          ))}
        </ul>
      </FeatureRow>

      <FeatureRow block={success} path="success" flip>
        <button type="button" onClick={go('book')} className={`${primaryButton} mt-7`}>
          {hero.primaryCta}
        </button>
      </FeatureRow>

      {/* ───────────── Lead capture ───────────── */}
      <section id="contact" className="scroll-mt-6 bg-gradient-to-b from-[#05070a] to-[#0b1014]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1fr_1.1fr] md:gap-14 md:py-24">
          <Reveal>
            <Eyebrow {...field('lead.eyebrow')}>{lead.eyebrow}</Eyebrow>
            <h2 {...field('lead.heading')} className="mt-3 font-serif text-3xl leading-tight text-stone-50 sm:text-4xl">
              {lead.heading}
            </h2>
            <p {...field('lead.subhead')} className="mt-4 text-base leading-relaxed text-stone-300">
              {lead.subhead}
            </p>
            <a href={telHref(business.phone)} onClick={() => haptic('tap')} className="mt-8 inline-flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Rather talk? Call or text</span>
              <span className="font-serif text-3xl text-amber-200">{business.phone}</span>
            </a>
            <p {...field('business.serviceArea')} className="mt-6 text-sm text-stone-400">
              {business.serviceArea}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <LeadCaptureForm config={config} selection={selection} disabled={isPreview} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="border-t border-white/5 bg-[#05070a]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-xs text-stone-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-serif text-base text-stone-200">{business.name}</p>
            <p {...field('business.licenseLine')} className="mt-1 max-w-xl leading-relaxed">
              {business.licenseLine}
            </p>
          </div>
          <div className="md:text-right">
            <p>{business.locationTags.join(' · ')}</p>
            <a href={`mailto:${business.email}`} {...field('business.email')} className="mt-1 inline-block hover:text-stone-300">
              {business.email}
            </a>
          </div>
        </div>
      </footer>

      {/* ───────────── Sticky mobile action bar ───────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#05070a]/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <div className="flex gap-3">
          <a href={telHref(business.phone)} onClick={() => haptic('tap')} className={`${ghostButton} flex-1 !px-4 !py-3.5`}>
            Call
          </a>
          <button type="button" onClick={go('book')} className={`${primaryButton} flex-[2] !px-4 !py-3.5`}>
            {hero.primaryCta}
          </button>
        </div>
      </div>
    </main>
  );
}
