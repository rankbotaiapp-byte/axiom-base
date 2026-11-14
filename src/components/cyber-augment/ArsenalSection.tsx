"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ARSENAL_HOTSPOTS, ASSETS, STILL_ASPECT, type ArsenalHotspot } from "./data";
import { SectionHeading } from "./SectionHeading";

function SpecCard({ h, onClose, onBook }: { h: ArsenalHotspot; onClose: () => void; onBook: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="w-full rounded-lg border border-neon-cyan/40 bg-slate-950/85 p-5 shadow-[0_0_40px_rgba(34,230,255,0.2)] backdrop-blur-2xl md:w-80"
      role="dialog"
      aria-label={h.title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-neon-red">{h.tag.toUpperCase()}</p>
          <h3 className="mt-1 text-lg font-bold text-white">{h.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close specification"
          className="rounded-sm p-1 text-slate-400 transition hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path stroke="currentColor" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-300">{h.description}</p>
      <dl className="mt-4 divide-y divide-white/10 border-y border-white/10">
        {h.specs.map((s) => (
          <div key={s.label} className="flex justify-between gap-4 py-2 text-sm">
            <dt className="font-mono text-[11px] tracking-[0.15em] text-slate-500">{s.label.toUpperCase()}</dt>
            <dd className="font-semibold text-neon-cyan">{s.value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={onBook}
        className="mt-4 w-full rounded-sm border border-neon-red/60 bg-neon-red/10 py-2 text-xs font-bold tracking-[0.25em] text-white transition hover:bg-neon-red/30"
      >
        REQUEST INTEGRATION
      </button>
    </motion.div>
  );
}

interface ArsenalSectionProps {
  onBook: () => void;
}

const PILLARS = [
  { title: "Custom Ballistic Gear", body: "Tailored carriers and plates that lock into your dermal weave." },
  { title: "Modular Hardware", body: "Universal rails, RED-10-paired optics and sub-30-second swaps." },
  { title: "Heavy-Duty Chassis", body: "Mobile power cores that flash, charge and stress-test every unit." },
] as const;

export function ArsenalSection({ onBook }: ArsenalSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = ARSENAL_HOTSPOTS.find((h) => h.id === activeId) ?? null;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1, 1.05]);
  const clip = useTransform(scrollYProgress, [0, 0.35], ["inset(12% 8% 12% 8% round 24px)", "inset(0% 0% 0% 0% round 12px)"]);

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActiveId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

  return (
    <section id="arsenal" ref={ref} className="relative bg-obsidian px-4 py-24 sm:px-8 sm:py-32">
      <div className="pointer-events-none absolute right-0 top-1/4 h-[50vh] w-[50vw] rounded-full bg-neon-red/[0.06] blur-[140px]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="03"
          eyebrow="TACTICAL ARSENAL & INTEGRATION"
          title="One armory. Fully integrated."
          description="Ballistic gear, modular hardware and upgrade chassis — engineered to work with your augments, not around them. Tap a marker to inspect."
        />
      </div>

      {/* Full-bleed cinematic showcase */}
      <motion.div style={{ clipPath: clip }} className="relative mx-auto max-w-[1600px] overflow-hidden">
        <div className="relative" style={{ aspectRatio: STILL_ASPECT }}>
          <motion.div style={{ scale }} className="absolute inset-0">
            <img
              src={ASSETS.armory}
              alt="Industrial armory rack with custom armored vests, modular hardware and glowing diagnostic gear"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/80" />
          <div className="hud-scanlines pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" />
          {/* Letterbox bars for a cinematic frame */}
          <div className="absolute inset-x-0 top-0 h-[4%] bg-obsidian" />
          <div className="absolute inset-x-0 bottom-0 h-[4%] bg-obsidian" />

          {ARSENAL_HOTSPOTS.map((h, i) => {
            const selected = h.id === activeId;
            return (
              <motion.button
                key={h.id}
                type="button"
                onClick={() => setActiveId(selected ? null : h.id)}
                aria-expanded={selected}
                aria-label={`Inspect ${h.title}`}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                className="group absolute z-10 -ml-4 -mt-4 flex h-8 w-8 items-center justify-center sm:-ml-5 sm:-mt-5 sm:h-10 sm:w-10"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span className="absolute inset-0 animate-ping-slow rounded-full border border-neon-cyan" />
                <span
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition sm:h-6 sm:w-6 ${
                    selected
                      ? "border-neon-red bg-neon-red shadow-[0_0_18px_var(--color-neon-red)]"
                      : "border-neon-cyan bg-slate-950/70 shadow-[0_0_14px_var(--color-neon-cyan)] group-hover:bg-neon-cyan/30"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-neon-cyan"}`} />
                </span>
              </motion.button>
            );
          })}

          {/* Desktop: pop-up anchored next to the marker */}
          <AnimatePresence>
            {active && (
              <div
                key={active.id}
                className="absolute z-20 hidden md:block"
                style={{
                  left: active.x > 60 ? undefined : `calc(${active.x}% + 28px)`,
                  right: active.x > 60 ? `calc(${100 - active.x}% + 28px)` : undefined,
                  top: `clamp(6%, calc(${active.y}% - 90px), 46%)`,
                }}
              >
                <SpecCard h={active} onClose={() => setActiveId(null)} onBook={onBook} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile: pop-up drops below the image */}
      <div className="mx-auto mt-4 max-w-xl md:hidden">
        <AnimatePresence mode="wait">
          {active && <SpecCard key={active.id} h={active} onClose={() => setActiveId(null)} onBook={onBook} />}
        </AnimatePresence>
      </div>

      <div className="relative mx-auto mt-10 grid max-w-7xl gap-4 sm:grid-cols-3 lg:gap-6">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="border-l-2 border-neon-red/60 pl-5"
          >
            <h3 className="font-bold uppercase tracking-wide text-white">{p.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
