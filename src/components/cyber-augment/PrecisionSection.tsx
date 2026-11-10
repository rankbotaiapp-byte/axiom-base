"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ASSETS, STILL_ASPECT, WORKSHOP_ANNOTATIONS, type Annotation } from "./data";
import { SectionHeading } from "./SectionHeading";

function Callout({ a, active, onHover }: { a: Annotation; active: boolean; onHover: (id: string | null) => void }) {
  const color = a.accent === "red" ? "var(--color-neon-red)" : "var(--color-neon-cyan)";
  const left = a.side === "left";
  return (
    <div
      className="absolute z-10"
      style={{ left: `${a.x}%`, top: `${a.y}%` }}
      onMouseEnter={() => onHover(a.id)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        type="button"
        aria-label={`${a.title}: ${a.detail}`}
        onFocus={() => onHover(a.id)}
        onBlur={() => onHover(null)}
        className="relative -ml-2 -mt-2 block h-4 w-4 rounded-full outline-none"
      >
        <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: color }} />
        <span
          className="absolute inset-[3px] rounded-full border-2 border-white"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </button>
      {/* Leader line + label (hidden on the smallest screens, shown as a list below instead) */}
      <motion.div
        className={`pointer-events-none absolute top-0 hidden -translate-y-1/2 items-center md:flex ${
          left ? "right-3 flex-row-reverse" : "left-3"
        }`}
        animate={{ opacity: active ? 1 : 0.85 }}
      >
        <motion.span
          className="h-px"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ width: active ? 48 : 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        />
        <motion.div
          className={`whitespace-nowrap rounded-sm border bg-slate-950/75 px-3 py-1.5 backdrop-blur-xl ${
            left ? "text-right" : ""
          }`}
          style={{ borderColor: color }}
          animate={{ scale: active ? 1.04 : 1 }}
        >
          <p className="text-[10px] font-bold tracking-[0.12em] text-white xl:text-[11px]">{a.title.toUpperCase()}</p>
          <AnimatePresence initial={false}>
            {active && (
              <motion.p
                className="overflow-hidden font-mono text-[10px] text-slate-400"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {a.detail}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

const STATS = [
  { value: "27", unit: "", label: "Micro-hydraulic actuators per limb" },
  { value: "0.2", unit: "mm", label: "Haptic fingertip resolution" },
  { value: "2,200", unit: "N", label: "Peak calibrated grip force" },
] as const;

const FEATURES = [
  {
    code: "01",
    title: "Hydraulic Joint Lattice",
    body: "Each knuckle, wrist and elbow runs a sealed micro-hydraulic coupling — smooth under load, silent at rest.",
  },
  {
    code: "02",
    title: "Micro-LED Health Array",
    body: "Per-joint indicators report load and sync state at a glance. Red means working hard; cyan means locked in.",
  },
  {
    code: "03",
    title: "Bench-Calibrated Fit",
    body: "Every assembly is stress-tested on our calibration bench before it ever meets your nervous system.",
  },
] as const;

export function PrecisionSection() {
  const ref = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section id="precision" ref={ref} className="relative overflow-hidden bg-obsidian px-4 py-24 sm:px-8 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[50vh] w-[80vw] -translate-x-1/2 rounded-full bg-neon-cyan/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="02"
          eyebrow="PRECISION ENGINEERING"
          title="Built joint by joint."
          description="A macro look inside the Hydraulic Limb Mk.IV — the same assembly we fit, tune and warranty in-house."
        />

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Feature image with annotations */}
          <motion.figure
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-xl border border-neon-cyan/30 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(34,230,255,0.12)] backdrop-blur-2xl transition-shadow duration-500 hover:shadow-[0_0_60px_rgba(34,230,255,0.25)] lg:col-span-2"
          >
            <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: STILL_ASPECT }}>
              <motion.div style={{ y: imgY }} className="absolute -inset-y-[5%] inset-x-0">
                <img
                  src={ASSETS.workshop}
                  alt="Macro close-up of a mechanical cyber-arm assembly on a workshop bench with calibration tools"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />
              {WORKSHOP_ANNOTATIONS.map((a) => (
                <Callout key={a.id} a={a} active={activeId === a.id} onHover={setActiveId} />
              ))}
              <figcaption className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.3em] text-slate-300">
                FIG. 02-A · HYDRAULIC LIMB MK.IV
              </figcaption>
            </div>
          </motion.figure>

          {/* Stat column */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-6">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 * i }}
                className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl transition hover:border-neon-red/50"
              >
                <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-neon-red/60" />
                <p className="text-4xl font-bold text-white sm:text-5xl">
                  {s.value}
                  <span className="ml-1 text-xl text-neon-red">{s.unit}</span>
                </p>
                <p className="mt-2 font-mono text-[11px] tracking-[0.15em] text-slate-400">{s.label.toUpperCase()}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile annotation legend */}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:hidden">
          {WORKSHOP_ANNOTATIONS.map((a) => (
            <li key={a.id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.accent === "red" ? "bg-neon-red" : "bg-neon-cyan"}`}
              />
              <span>
                <span className="block text-xs font-bold tracking-[0.12em] text-white">{a.title.toUpperCase()}</span>
                <span className="block font-mono text-[11px] text-slate-400">{a.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-4 md:grid-cols-3 lg:mt-6 lg:gap-6">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.code}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 * i }}
              whileHover={{ y: -6 }}
              className="group rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur-2xl transition-colors hover:border-neon-cyan/50"
            >
              <p className="font-mono text-xs text-neon-cyan">{f.code}</p>
              <h3 className="mt-3 text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              <span className="mt-5 block h-px w-10 bg-neon-red transition-all duration-500 group-hover:w-full" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
