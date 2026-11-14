"use client";

import { ArrowRight, Play } from "lucide-react";
import { TEMPLATES } from "@/lib/axiom-landing/templates";
import { SHOWCASE, showcaseSrc, type ShowcaseBuild } from "@/lib/axiom-landing/showcase";
import { useFunnel } from "./FunnelProvider";
import { RippleButton } from "./RippleButton";
import { PRICING, buildPrice, fmt } from "@/lib/axiom-landing/pricing";

export default function ProofOfWork({ readyIds, showPending }: { readyIds: string[]; showPending: boolean }) {
  const { openPreview, openShowcase, startOnboarding } = useFunnel();
  const live = SHOWCASE.filter((b) => readyIds.includes(b.id));
  const pending = showPending ? SHOWCASE.filter((b) => !readyIds.includes(b.id)) : [];

  return (
    <section id="proof" className="relative overflow-hidden bg-slate py-24 sm:py-32">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-volt/10 blur-[120px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-volt">Proof of work</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              One engine. Every trade.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-mist">
              Wrenches, clippers, ladders or tattoo machines — Axiom ships a ready-built back office tuned to how your
              trade actually books and dispatches. Tap any template below to try the live demo.
            </p>
          </div>

          {/* Multi-trade master video — contained, never cropped, non-interactive */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink shadow-[0_40px_120px_-40px_rgb(63_216_255/0.45)]">
            <video
              className="pointer-events-none block aspect-video h-auto w-full object-contain"
              src="/media/gemini_generated_video_5d59539e.mp4"
              poster="/media/multi-trade-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              disablePictureInPicture
              tabIndex={-1}
              aria-hidden
              data-sample
            />
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openPreview(t.id)}
              className="niche-card group relative overflow-hidden rounded-2xl border border-white/10 bg-panel/70 p-6 text-left"
              style={{ ["--accent" as string]: t.accent }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
                style={{ background: t.accent }}
              />
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-2xl">{t.icon}</span>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-mist">
                  Live demo
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">{t.trade}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{t.tagline}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: t.accent }}>
                Preview template <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </span>
            </button>
          ))}
        </div>

        {(live.length > 0 || pending.length > 0) && (
          <div className="mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Cinematic builds</p>
                <h3 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Want something nobody in your town has? We build that too.
                </h3>
                <p className="mt-4 max-w-2xl text-mist">
                  These are not mockups. Play the missed-call sim, fire the crosshair, build a quote. Checkout stamps
                  your name, phone, and logo on that exact site — Lifetime Back Office included.{" "}
                  <span className="text-white">{fmt(PRICING.cinematic.price)} once. No monthly rent.</span>
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {live.map((b) => (
                <ShowcaseCard key={b.id} b={b} onOpen={() => openShowcase(b.id)} onBuy={() => startOnboarding({ plan: "cinematic", templateId: b.id })} />
              ))}
              {pending.map((b) => (
                <div key={b.id} className="rounded-2xl border border-dashed border-white/20 p-6 text-sm text-mist">
                  <p className="font-display text-lg font-semibold text-white">{b.name}</p>
                  <p className="mt-1">Dev only — hidden in production until these exist in <code className="text-ember">public/showcase/{b.id}/</code>:</p>
                  <ul className="mt-2 list-disc pl-5 font-mono text-xs">
                    {b.requires.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ShowcaseCard({ b, onOpen, onBuy }: { b: ShowcaseBuild; onOpen: () => void; onBuy: () => void }) {
  const play = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    e.currentTarget.querySelector("video")?.play().catch(() => {});
  };
  const stop = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.querySelector("video")?.pause();
  };
  const price = fmt(buildPrice(b.price));
  return (
    <div
      onPointerEnter={play}
      onPointerLeave={stop}
      className="niche-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/70"
      style={{ ["--accent" as string]: b.accent }}
    >
      <button type="button" onClick={onOpen} className="relative block aspect-video overflow-hidden bg-ink text-left" data-sample-color={b.accent} aria-label={`Launch ${b.name} live demo`}>
        {b.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={showcaseSrc(b, b.poster)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        {b.preview && (
          <video
            src={showcaseSrc(b, b.preview)}
            muted
            loop
            playsInline
            preload="none"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: b.accent }} /> Interactive
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-display text-sm font-bold text-white backdrop-blur">{price}</span>
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden /> Play live demo
          </span>
        </span>
      </button>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: b.accent }}>
          {b.niche}
        </p>
        <h4 className="mt-2 font-display text-xl font-semibold text-white">{b.name}</h4>
        <p className="mt-2 text-sm leading-relaxed text-mist">{b.blurb}</p>
        <p className="mt-3 text-xs leading-relaxed text-mist/90">{b.hook}</p>
        <div className="flex-1" />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <RippleButton variant="ghost" className="!px-3 !py-2.5 text-sm" onClick={onOpen}>
            Live Demo
          </RippleButton>
          <RippleButton variant="primary" className="!px-3 !py-2.5 text-sm" onClick={onBuy}>
            Make mine — {price}
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
