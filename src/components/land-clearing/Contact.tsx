'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, Crosshair, Loader2, Mail, MapPin, Phone, Send, X } from 'lucide-react';
import { estimator, site, type ServiceKey } from './config/site';
import { useEstimate } from './EstimateContext';
import { Reveal, SectionHeading } from './ui';

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; ref: string } | { kind: 'error'; message: string };

export default function Contact() {
  const { locked, clear } = useEstimate();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [service, setService] = useState<ServiceKey>('mulching');
  const [acres, setAcres] = useState('');

  useEffect(() => {
    if (!locked) return;
    setService(locked.service);
    setAcres(String(locked.acres));
  }, [locked]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    setStatus({ kind: 'sending' });
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, estimate: locked?.summary ?? '' }),
      });
      const json = (await res.json()) as { ok: boolean; ref?: string; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || 'Request failed');
      setStatus({ kind: 'done', ref: json.ref ?? '' });
      form.reset();
      setAcres('');
      clear();
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Request failed' });
    }
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-ink-900 py-24 sm:py-32">
      <div className="grid-overlay absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_bottom,black_25%,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          code="06 — Request Deployment"
          title={
            <>
              Tell us the ground. <span className="text-amber">We bring the iron.</span>
            </>
          }
          lede="Send the basics and we'll call within one business day to schedule a free site recon."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Reveal className="glass hud-frame relative p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {status.kind === 'done' ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[420px] flex-col items-center justify-center text-center"
                >
                  <CheckCircle2 className="h-16 w-16 text-amber drop-shadow-[0_0_14px_rgba(0,255,204,0.75)]" strokeWidth={1.4} />
                  <h3 className="mt-6 font-stencil text-4xl font-black uppercase tracking-wide text-white">Request received</h3>
                  <p className="mt-3 max-w-sm text-steel-300">
                    Your deployment request is logged{status.ref ? ` as ${status.ref}` : ''}. Expect a call from our crew lead within one business day.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus({ kind: 'idle' })}
                    className="mt-8 border border-white/15 px-5 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-steel-200 hover:border-amber hover:text-amber-glow"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={onSubmit} noValidate={false} initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 sm:grid-cols-2">
                  <AnimatePresence>
                    {locked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sm:col-span-2"
                      >
                        <div className="flex items-start gap-3 border border-amber/50 bg-amber/10 p-4">
                          <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                          <p className="flex-1 font-mono text-[12px] leading-relaxed text-amber-glow">
                            <span className="block text-[10px] tracking-tactical text-steel-300">LOCKED ESTIMATE ATTACHED</span>
                            {locked.summary}
                          </p>
                          <button type="button" onClick={clear} aria-label="Remove estimate" className="text-steel-400 hover:text-white">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <label className="grid gap-1.5">
                    <span className="label">Name *</span>
                    <input name="name" required autoComplete="name" className="field" placeholder="Full name" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="label">Phone *</span>
                    <input name="phone" required type="tel" autoComplete="tel" className="field" placeholder="(541) 000-0000" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="label">Email</span>
                    <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="label">Property location *</span>
                    <input name="location" required className="field" placeholder="Town or address" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="label">Mission type</span>
                    <select
                      name="service"
                      value={service}
                      onChange={(e) => setService(e.target.value as ServiceKey)}
                      className="field appearance-none bg-[linear-gradient(45deg,transparent_50%,#00ffcc_50%),linear-gradient(135deg,#00ffcc_50%,transparent_50%)] bg-[length:6px_6px] bg-[position:calc(100%-22px)_50%,calc(100%-16px)_50%] bg-no-repeat"
                    >
                      {(Object.keys(estimator.services) as ServiceKey[]).map((k) => (
                        <option key={k} value={k} className="bg-ink-900">
                          {estimator.services[k].label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="label">Approx. acreage</span>
                    <input
                      name="acres"
                      inputMode="decimal"
                      value={acres}
                      onChange={(e) => setAcres(e.target.value)}
                      className="field"
                      placeholder="e.g. 3"
                    />
                  </label>
                  <label className="grid gap-1.5 sm:col-span-2">
                    <span className="label">Ground intel</span>
                    <textarea
                      name="details"
                      rows={4}
                      className="field resize-y"
                      placeholder="What's growing, access/gate width, slope, anything that must stay standing…"
                    />
                  </label>
                  {/* Honeypot: hidden from people, filled by bots */}
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-mono text-[11px] text-steel-500">* Required. We never share your info.</p>
                    <button
                      type="submit"
                      disabled={status.kind === 'sending'}
                      className="inline-flex animate-pulse-amber items-center justify-center gap-2 bg-amber px-7 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-ink-950 transition hover:bg-amber-hot disabled:opacity-70"
                    >
                      {status.kind === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {status.kind === 'sending' ? 'Transmitting…' : 'Request deployment'}
                    </button>
                  </div>
                  {status.kind === 'error' && (
                    <p role="alert" className="font-mono text-[12px] text-red-400 sm:col-span-2">
                      Transmission failed ({status.message}). Call us at {site.phoneDisplay}.
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-4">
            <a
              href={site.phoneHref}
              className="group relative overflow-hidden border border-amber bg-amber/10 p-7 transition hover:bg-amber/20"
            >
              <span className="hazard absolute inset-x-0 top-0 h-1" />
              <p className="label text-amber-glow">Direct line · fastest response</p>
              <p className="mt-3 flex items-center gap-3 font-stencil text-4xl font-black tracking-wide text-white sm:text-5xl">
                <Phone className="h-8 w-8 text-amber transition-transform group-hover:rotate-12" />
                {site.phoneDisplay}
              </p>
            </a>
            <div className="glass grid gap-5 p-7">
              {[
                { Icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
                { Icon: MapPin, label: 'Service area', value: site.serviceArea },
                { Icon: Clock, label: 'Field hours', value: site.hours },
              ].map(({ Icon, label, value, href }) => (
                <div key={label} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 text-amber">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="label">{label}</p>
                    {href ? (
                      <a href={href} className="mt-1 block break-all text-steel-100 hover:text-amber-glow">
                        {value}
                      </a>
                    ) : (
                      <p className="mt-1 text-steel-100">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative flex-1 overflow-hidden border border-white/10 bg-forest-950 p-6">
              <div className="grid-overlay absolute inset-0" />
              <div className="relative flex items-center gap-5">
                <span className="relative h-24 w-24 shrink-0 rounded-full border border-amber/40">
                  <span className="absolute inset-3 rounded-full border border-amber/25" />
                  <span className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,rgba(0,255,204,.55),transparent_70deg)]" />
                  <span className="absolute left-[62%] top-[30%] h-2 w-2 animate-blink rounded-full bg-amber shadow-lc-glow" />
                </span>
                <div className="font-mono text-[11px] leading-relaxed tracking-wider text-steel-300">
                  <p className="text-amber-glow">BASE OF OPERATIONS</p>
                  <p>{site.baseCoords}</p>
                  <p className="mt-2 text-steel-500">Crews mobilize within ~90 mi radius.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
