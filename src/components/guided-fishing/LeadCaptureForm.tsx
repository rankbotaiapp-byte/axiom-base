'use client';

import { useState, type FormEvent } from 'react';
import { haptic } from '@/lib/axiom/haptics';
import { field } from '@/lib/axiom/guided-fishing/useStudioPreview';
import type { GuidedFishingConfig, TripSelection } from '@/lib/axiom/guided-fishing/types';
import { formatPrice, telHref } from './primitives';

interface LeadCaptureFormProps {
  config: GuidedFishingConfig;
  selection: TripSelection;
  /** Studio preview: render the form but never send real leads. */
  disabled?: boolean;
}

type Status = 'idle' | 'sending' | 'sent' | 'failed';

const inputClass =
  'mt-2 w-full rounded-xl border bg-black/40 px-4 py-3 text-base text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-300/30';

export default function LeadCaptureForm({ config, selection, disabled = false }: LeadCaptureFormProps) {
  const { lead, business, pricing } = config;
  const tier = pricing.tiers.find((t) => t.id === selection.tierId);

  const [status, setStatus] = useState<Status>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    haptic('tap');

    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();

    const errors: Record<string, string> = {};
    if (value('name').length < 2) errors.name = 'Please enter your name.';
    const digits = value('phone').replace(/\D/g, '');
    if (value('phone') && digits.length !== 10 && !(digits.length === 11 && digits.startsWith('1'))) {
      errors.phone = 'Enter a 10-digit US phone number.';
    }
    if (!value('phone') && !value('email')) errors.phone = 'Add a phone number or an email so we can reach you.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      haptic('error');
      return;
    }

    if (disabled) {
      setStatus('sent');
      return;
    }

    setStatus('sending');
    setErrorMessage('');
    try {
      const res = await fetch(lead.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: config.tenantId,
          name: value('name'),
          phone: value('phone'),
          email: value('email'),
          message: value('message'),
          company: value('company'), // honeypot
          smsConsent: form.get('smsConsent') === 'on',
          trip: tier ? { tierId: tier.id, date: selection.date, anglers: selection.anglers } : null,
          page: window.location.href,
          referrer: document.referrer,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !data.ok) {
        setFieldErrors(data.fields ?? {});
        throw new Error(data.error ?? 'Something went wrong.');
      }
      setStatus('sent');
      haptic('success');
    } catch (error) {
      setStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
      haptic('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-3xl border border-amber-300/30 bg-amber-300/[0.06] p-8 text-center backdrop-blur-xl sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-300 text-stone-950">
          <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 {...field('lead.successTitle')} className="mt-5 font-serif text-3xl text-stone-50">
          {lead.successTitle}
        </h3>
        <p {...field('lead.successBody')} className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-300">
          {lead.successBody}
        </p>
        {tier?.depositUrl ? (
          <a
            href={tier.depositUrl}
            onClick={() => haptic('tap')}
            className="mt-6 inline-flex rounded-full bg-amber-300 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-stone-950 transition hover:bg-amber-200"
          >
            Pay deposit to lock your date
          </a>
        ) : null}
        {disabled ? <p className="mt-4 text-xs text-stone-500">Preview mode: no lead was sent.</p> : null}
      </div>
    );
  }

  const border = (name: string) => (fieldErrors[name] ? 'border-red-400/70' : 'border-white/10 focus:border-amber-300/70');

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      {tier ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
          <span className="text-stone-200">
            {tier.name}
            <span className="text-stone-500">
              {' · '}
              {selection.anglers} {selection.anglers === 1 ? 'angler' : 'anglers'}
              {selection.date ? ` · ${selection.date}` : ''}
            </span>
          </span>
          <span className="font-serif text-lg text-amber-200">{formatPrice(tier.price, tier.priceSuffix)}</span>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 sm:col-span-2">
          Name
          <input name="name" autoComplete="name" required aria-invalid={Boolean(fieldErrors.name)} className={`${inputClass} ${border('name')}`} />
          {fieldErrors.name ? <span className="mt-1.5 block normal-case tracking-normal text-red-300">{fieldErrors.name}</span> : null}
        </label>
        <label className="block text-xs font-medium uppercase tracking-wider text-stone-400">
          Mobile phone
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(541) 555-0100" aria-invalid={Boolean(fieldErrors.phone)} className={`${inputClass} ${border('phone')}`} />
          {fieldErrors.phone ? <span className="mt-1.5 block normal-case tracking-normal text-red-300">{fieldErrors.phone}</span> : null}
        </label>
        <label className="block text-xs font-medium uppercase tracking-wider text-stone-400">
          Email
          <input name="email" type="email" autoComplete="email" placeholder="you@email.com" aria-invalid={Boolean(fieldErrors.email)} className={`${inputClass} ${border('email')}`} />
          {fieldErrors.email ? <span className="mt-1.5 block normal-case tracking-normal text-red-300">{fieldErrors.email}</span> : null}
        </label>
        <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 sm:col-span-2">
          Anything we should know? <span className="normal-case tracking-normal text-stone-600">(optional)</span>
          <textarea name="message" rows={3} placeholder="Experience level, target species, flexible dates…" className={`${inputClass} resize-none border-white/10 focus:border-amber-300/70`} />
        </label>
      </div>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="smsConsent" className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/20 bg-black/40 accent-amber-300" />
        <span {...field('lead.smsConsentText')} className="text-[11px] leading-relaxed text-stone-400">
          {lead.smsConsentText}
        </span>
      </label>

      <button
        type="submit"
        disabled={status === 'sending'}
        {...field('lead.submitLabel')}
        className="mt-6 w-full rounded-full bg-amber-300 px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-stone-950 transition hover:bg-amber-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        {status === 'sending' ? 'Sending…' : lead.submitLabel}
      </button>

      {status === 'failed' ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {errorMessage} Call or text us instead:{' '}
          <a href={telHref(business.phone)} className="font-semibold underline underline-offset-2">
            {business.phone}
          </a>
        </p>
      ) : null}
    </form>
  );
}
