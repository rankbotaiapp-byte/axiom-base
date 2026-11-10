"use client";

import { useState } from "react";
import { RippleButton } from "./RippleButton";
import { useFunnel } from "./FunnelProvider";

const FAQ = [
  {
    q: "Is it really a one-time payment?",
    a: "Yes. Lifetime Access is a single payment for your back office and admin dashboard. Things that cost money per use — like text messages — are billed at cost only if you turn them on.",
  },
  {
    q: "How fast can I be live?",
    a: "Your trade's template is already built. Add your logo, services, prices and hours from the admin dashboard and you can share your booking link the same day.",
  },
  {
    q: "Do I need to be techy?",
    a: "No. If you can post on Facebook, you can run Axiom. Everything is editable from your phone, and the app installs to your home screen like any other app.",
  },
  {
    q: "What if my trade isn't listed?",
    a: "Start the free setup anyway — we'll match you to the closest template and tune the services and job flow to how you work.",
  },
  {
    q: "Who owns my customer data?",
    a: "You do. Export your customers and job history any time.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-slate py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Straight answers</h2>
        <div className="mt-12 divide-y divide-white/10 rounded-2xl border border-white/10 bg-panel/50">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-white transition-colors hover:bg-white/[0.02]"
                aria-expanded={open === i}
              >
                <span className="font-medium">{f.q}</span>
                <span className={`text-copper transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <p className="overflow-hidden px-6 text-mist">
                  <span className="block pb-5">{f.a}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { startOnboarding, selectedTemplateId } = useFunnel();
  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-32" data-sample-color="#1b140d">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(224_138_60/0.18),transparent_60%)]" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Stop doing the office work at 10 PM.
        </h2>
        <p className="mt-5 text-lg text-mist">Let Axiom book, route and dispatch — you do the work you&apos;re actually paid for.</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <RippleButton variant="primary" className="text-base" onClick={() => startOnboarding({ plan: "free-setup", templateId: selectedTemplateId })}>
            Start Your Free Setup →
          </RippleButton>
          <RippleButton variant="ghost" className="text-base" onClick={() => startOnboarding({ plan: "lifetime", templateId: selectedTemplateId })}>
            Pay Once — Own It Forever
          </RippleButton>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-mist sm:flex-row sm:px-8">
        <p className="font-display font-bold tracking-[0.2em] text-white">AXIOM</p>
        <p>© {new Date().getFullYear()} New Era Apps · A Gear Guardian LLC company</p>
      </div>
    </footer>
  );
}
