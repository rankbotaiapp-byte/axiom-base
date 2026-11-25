"use client";

/**
 * AxiomScrollFunnel — 6 pitch beats under the Axiom hero, then the live Axiom Studio.
 *
 * Each beat is a 220vh scroll track with a sticky stage. Its own scroll progress (0→1
 * from "track enters bottom" to "track leaves top") drives the motion:
 *   0.06 → 0.20  slide IN   (copy from beat.enterFrom, visual from the other side, staggered = layered depth)
 *   0.20 → 0.80  HOLD       (60% of the track: fully settled and readable)
 *   0.80 → 0.94  slide OUT  (lifts and fades as the next beat rises in)
 * Only transform + opacity animate. Mobile sideways offsets are capped at 24px.
 * prefers-reduced-motion → static sections, no scroll effects.
 * After beat 06 the inline studio slides in ONCE and then stays locked in place.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  FUNNEL_BEATS,
  type Beat,
  type CoreVisual,
  type EngineVisual,
  type FocusVisual,
  type FounderVisual,
  type FrictionVisual,
  type StudioHandoffVisual,
} from "./funnelBeats";
import AxiomInlineStudio, { type AxiomInlineStudioProps } from "./AxiomInlineStudio";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

export const FUNNEL_COLORS = {
  bg: "#050507",
  panel: "#07080C",
  line: "rgba(244,246,250,0.14)",
  lineStrong: "rgba(244,246,250,0.32)",
  blue: "#2f6bff",
  cyan: "#00f0ff",
  mint: "#00ffcc",
  text: "#f4f6fa",
  muted: "#9aa3b2",
  gold: "#FFE500",
} as const;
const C = FUNNEL_COLORS;

const IN_START = 0.06;
const IN_END = 0.2;
const OUT_START = 0.8;
const OUT_END = 0.94;
const STUDIO_ID = "axiom-studio-inline";

function useIsDesktop() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

/** Smooth-scroll the studio into view, then put the cursor in "Business name". */
export function launchStudio(reduce = false) {
  const el = document.getElementById(STUDIO_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  window.setTimeout(() => el.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }), reduce ? 0 : 900);
}

export interface AxiomScrollFunnelProps {
  beats?: Beat[];
  /** Passed straight to <AxiomInlineStudio /> (launchPath, onLaunch, initialNiche). */
  studio?: Omit<AxiomInlineStudioProps, "id">;
  /** HeyGen recording for the floating player. Set showVideo={false} to hide the player. */
  videoSrc?: string;
  videoPoster?: string;
  showVideo?: boolean;
  /** Anchor id for the pitch section (the studio is always #axiom-studio-inline). */
  id?: string;
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function AxiomScrollFunnel({
  beats = FUNNEL_BEATS,
  studio,
  videoSrc = "/media/welcome-to-axiom.mp4",
  videoPoster = "/videos/axiom-story-eric.jpg",
  showVideo = true,
  id = "axiom-funnel",
}: AxiomScrollFunnelProps) {
  const reduce = useReducedMotion() ?? false;
  const desktop = useIsDesktop();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: "-20% 0px -20% 0px" });
  const [active, setActive] = useState(0);
  const [jump, setJump] = useState<{ t: number; n: number } | null>(null);

  const watch = useCallback((beat: Beat) => setJump((j) => ({ t: beat.start, n: (j?.n ?? 0) + 1 })), []);

  return (
    // overflow-x: clip (NOT hidden) — hidden would turn this into a scroll container and kill the sticky stages
    <div className="relative w-full" style={{ overflowX: "clip", background: C.bg, color: C.text }}>
    <section
      ref={sectionRef}
      id={id}
      aria-label="How Axiom works"
      className="relative isolate w-full"
    >
      <HudGrid />
      {!reduce && <ProgressRail beats={beats} active={active} />}

      {beats.map((beat, i) => (
        <BeatScene
          key={beat.id}
          beat={beat}
          index={i}
          total={beats.length}
          reduce={reduce}
          desktop={desktop}
          onActive={setActive}
          onWatch={showVideo ? watch : undefined}
        />
      ))}

      {showVideo && (
        <StoryPlayer src={videoSrc} poster={videoPoster} visible={inView} activeBeat={beats[active]} jump={jump} />
      )}
    </section>

    <AxiomInlineStudio {...studio} id={STUDIO_ID} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One beat                                                            */
/* ------------------------------------------------------------------ */

interface BeatSceneProps {
  beat: Beat;
  index: number;
  total: number;
  reduce: boolean;
  desktop: boolean;
  onActive: (i: number) => void;
  onWatch?: (beat: Beat) => void;
}

function BeatScene({ beat, index, total, reduce, desktop, onActive, onWatch }: BeatSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end start"] });

  useMotionValueEvent(p, "change", (v) => {
    if (v > IN_END && v < OUT_START) onActive(index);
  });

  const side = beat.enterFrom === "left" ? -1 : beat.enterFrom === "right" ? 1 : 0;
  const fromBottom = beat.enterFrom === "bottom";
  const K = [IN_START, IN_END, OUT_START, OUT_END];
  // sideways travel: big on desktop, capped at 24px on mobile (no overflow, no jank)
  const XIN = desktop ? 160 : 24;
  const XOUT = desktop ? 90 : 16;
  const VXIN = desktop ? 200 : 24;
  const VXOUT = desktop ? 120 : 16;

  // copy layer
  const cx = useTransform(p, K, [side * XIN, 0, 0, side * -XOUT]);
  const cy = useTransform(p, K, [fromBottom ? 140 : 40, 0, 0, -110]);
  const co = useTransform(p, K, [0, 1, 1, 0]);
  // visual layer: opposite side, slightly later in / earlier out → layered parallax (still settled for >50%)
  const VK = [IN_START + 0.02, IN_END + 0.02, OUT_START - 0.02, OUT_END - 0.01];
  const vx = useTransform(p, VK, [side * -VXIN, 0, 0, side * VXOUT]);
  const vy = useTransform(p, VK, [fromBottom ? 200 : 60, 0, 0, -150]);
  const vs = useTransform(p, VK, [0.92, 1, 1, 0.94]);
  const vo = useTransform(p, VK, [0, 1, 1, 0]);
  // giant beat number drifts slower than everything else
  const ny = useTransform(p, [0, 1], [180, -180]);
  const no = useTransform(p, [0.08, 0.24, 0.76, 0.92], [0, 1, 1, 0]);
  // 0→1 while the beat settles in; drives the inner build of each visual (done well inside the hold)
  const build = useTransform(p, [IN_START + 0.04, IN_END + 0.08], [0, 1]);

  const flip = index % 2 === 1;

  return (
    <div ref={ref} className={reduce ? "relative py-20 sm:py-28" : "relative h-[220vh]"}>
      <div className={reduce ? "relative" : "sticky top-0 flex h-[100svh] items-center overflow-hidden"}>
        {/* giant number, deepest layer */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute select-none font-sans font-black leading-none tracking-tighter"
          style={{
            ...(reduce ? {} : { y: ny, opacity: no }),
            [flip ? "left" : "right"]: "-2vw",
            top: "8vh",
            fontSize: "clamp(9rem, 26vw, 24rem)",
            color: "transparent",
            WebkitTextStroke: `1px ${C.line}`,
          }}
        >
          {beat.number}
        </motion.span>

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12">
          {/* visual */}
          <motion.div
            className={`lg:col-span-7 ${flip ? "lg:order-1" : "lg:order-2"}`}
            style={reduce ? undefined : { x: vx, y: vy, scale: vs, opacity: vo }}
          >
            <BeatVisual beat={beat} build={build} reduce={reduce} />
          </motion.div>

          {/* copy */}
          <motion.div className={`lg:col-span-5 ${flip ? "lg:order-2" : "lg:order-1"}`} style={reduce ? undefined : { x: cx, y: cy, opacity: co }}>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: C.cyan }}>
              <span className="whitespace-nowrap" style={{ color: C.muted }}>
                {beat.number} / {String(total).padStart(2, "0")}
              </span>
              <span className="h-px w-8" style={{ background: C.lineStrong }} />
              {beat.kicker}
            </p>
            <h2 className="mt-3 text-[1.7rem] font-semibold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">{beat.title}</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed sm:mt-4 sm:text-base" style={{ color: C.muted }}>
              {beat.body}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 pb-14 sm:mt-6 lg:pb-0">
              {beat.visual.kind === "studio" && (
                <button
                  type="button"
                  onClick={() => launchStudio(reduce)}
                  className="hidden h-12 items-center rounded-lg px-6 text-sm font-bold uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 lg:inline-flex"
                  style={{ background: C.gold, boxShadow: `0 14px 40px -12px ${C.gold}` }}
                >
                  {beat.visual.launchLabel} ↓
                </button>
              )}
              {onWatch && (
                <button
                  type="button"
                  onClick={() => onWatch(beat)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg px-3 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-white/5"
                  style={{ color: C.text, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                >
                  <span style={{ color: C.cyan }}>▶</span> Watch this part · {fmt(beat.start)}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visuals                                                             */
/* ------------------------------------------------------------------ */

interface VisualProps {
  build: MotionValue<number>;
  reduce: boolean;
}

function BeatVisual({ beat, build, reduce }: { beat: Beat; build: MotionValue<number>; reduce: boolean }) {
  const v = beat.visual;
  switch (v.kind) {
    case "founder":
      return <FounderPanel v={v} build={build} reduce={reduce} />;
    case "friction":
      return <FrictionPanel v={v} build={build} reduce={reduce} />;
    case "engine":
      return <EnginePanel v={v} build={build} reduce={reduce} />;
    case "core":
      return <CorePanel v={v} build={build} reduce={reduce} />;
    case "focus":
      return <FocusPanel v={v} build={build} reduce={reduce} />;
    case "studio":
      return <StudioHandoffPanel v={v} build={build} reduce={reduce} />;
  }
}

/** Hairline HUD frame with corner ticks. */
function Frame({ children, className = "", label, right }: { children: ReactNode; className?: string; label?: string; right?: string }) {
  return (
    <div className={`relative rounded-[6px] p-4 sm:p-5 ${className}`} style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}, 0 40px 120px -40px rgba(47,107,255,0.35)` }}>
      {(["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"] as const).map((pos) => (
        <span key={pos} aria-hidden className={`absolute h-3 w-3 ${pos}`} style={{ borderColor: C.cyan }} />
      ))}
      {(label || right) && (
        <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
          <span>{label}</span>
          <span>{right}</span>
        </div>
      )}
      {children}
    </div>
  );
}

const useStagger = (build: MotionValue<number>, i: number, n: number) => {
  const a = Math.min(0.9, (i / Math.max(n, 1)) * 0.6);
  const opacity = useTransform(build, [a, a + 0.35], [0, 1]);
  const x = useTransform(build, [a, a + 0.35], [40, 0]);
  return { opacity, x };
};

function FounderPanel({ v, build, reduce }: VisualProps & { v: FounderVisual }) {
  const cardY = useTransform(build, [0.2, 0.9], [60, 0]);
  const cardO = useTransform(build, [0.2, 0.8], [0, 1]);
  return (
    <div className="relative h-[50svh] w-full overflow-hidden rounded-[6px] sm:h-[56svh] lg:h-[64vh]" style={{ boxShadow: `inset 0 0 0 1px ${C.line}` }}>
      <img src={v.portrait} alt={`${v.name}, ${v.role.toLowerCase()}`} className="absolute inset-0 h-full w-full object-cover object-top" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.bg} 2%, transparent 55%)` }} />
      <motion.div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6" style={reduce ? undefined : { y: cardY, opacity: cardO }}>
        <Frame label={v.location} className="backdrop-blur-md" >
          <p className="text-5xl font-black tracking-tight sm:text-6xl">{v.name}</p>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="px-2 py-1 text-white" style={{ background: C.blue }}>{v.role}</span>
            <span className="px-2 py-1" style={{ boxShadow: `inset 0 0 0 1px ${C.lineStrong}`, color: C.text }}>{v.coordinates}</span>
            <span className="px-2 py-1" style={{ color: C.cyan, boxShadow: `inset 0 0 0 1px ${C.cyan}55` }}>{v.region}</span>
          </div>
        </Frame>
      </motion.div>
    </div>
  );
}

function FrictionRow({ item, i, n, build, reduce }: { item: FrictionVisual["items"][number]; i: number; n: number; build: MotionValue<number>; reduce: boolean }) {
  const s = useStagger(build, i, n);
  return (
    <motion.li
      className="flex items-center justify-between gap-4 rounded-[4px] px-4 py-4 sm:py-5"
      style={{
        ...(reduce ? {} : s),
        background: item.hot ? C.blue : "transparent",
        boxShadow: item.hot ? `0 20px 60px -20px ${C.blue}` : `inset 0 0 0 1px ${C.line}`,
      }}
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: item.hot ? "#dbe6ff" : C.muted }}>{item.code}</p>
        <p className="mt-1 text-lg font-black uppercase leading-tight tracking-tight sm:text-2xl">
          {item.label}
          {item.detail && <span className="ml-2 font-mono text-base font-semibold">· {item.detail}</span>}
        </p>
      </div>
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-sm" style={{ boxShadow: `inset 0 0 0 1px ${item.hot ? "#fff" : C.lineStrong}` }}>
        {item.hot ? "!" : "—"}
      </span>
    </motion.li>
  );
}

function FrictionPanel({ v, build, reduce }: VisualProps & { v: FrictionVisual }) {
  return (
    <Frame label={v.target} right={`${String(v.items.length).padStart(2, "0")} OPEN`}>
      <ul className="space-y-3">
        {v.items.map((item, i) => (
          <FrictionRow key={item.code} item={item} i={i} n={v.items.length} build={build} reduce={reduce} />
        ))}
      </ul>
    </Frame>
  );
}

function EnginePanel({ v, build, reduce }: VisualProps & { v: EngineVisual }) {
  const clip = useTransform(build, [0.15, 0.75], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const spacing = useTransform(build, [0.15, 0.9], ["0.3em", "-0.02em"]);
  const glow = useTransform(build, [0.5, 1], [0, 1]);
  return (
    <Frame className="py-14 sm:py-20">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>{v.eyebrow}</p>
      <div className="mx-auto mt-6 w-fit p-3 sm:p-4" style={{ boxShadow: `inset 0 0 0 1px ${C.lineStrong}` }}>
        <motion.div className="relative px-6 py-2 sm:px-10" style={reduce ? { background: C.blue } : { clipPath: clip, background: C.blue }}>
          <motion.p className="text-6xl font-black leading-none text-white sm:text-8xl" style={reduce ? undefined : { letterSpacing: spacing }}>
            {v.word}
          </motion.p>
        </motion.div>
      </div>
      <motion.div aria-hidden className="mx-auto mt-8 h-px w-2/3" style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: reduce ? 1 : glow }} />
    </Frame>
  );
}

function CorePanel({ v, build, reduce }: VisualProps & { v: CoreVisual }) {
  const draw = useTransform(build, [0.25, 0.85], [0, 1]);
  const coreScale = useTransform(build, [0, 0.5], [0.85, 1]);
  const [n1, n2, n3] = v.nodes;
  const node = (n: typeof n1) => (
    <div className="px-3 py-3 sm:px-4" style={{ boxShadow: `inset 0 0 0 1px ${C.lineStrong}` }}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{n.code}</p>
      <p className="mt-1 text-sm font-black uppercase leading-tight sm:text-lg">{n.label}</p>
    </div>
  );
  return (
    <Frame label={v.header} right="03 NODES">
      <div className="mx-auto max-w-md">
        {node(n1)}
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="mx-auto block h-6 w-full" aria-hidden>
          <motion.path d="M50 0 V24" stroke={C.cyan} strokeWidth="0.6" fill="none" style={reduce ? undefined : { pathLength: draw }} />
        </svg>
        <motion.div className="py-6 text-center sm:py-8" style={{ boxShadow: `inset 0 0 0 1px ${C.lineStrong}`, ...(reduce ? {} : { scale: coreScale }) }}>
          <p className="text-6xl font-black tracking-tight sm:text-7xl">{v.core}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: C.muted }}>{v.coreLabel}</p>
        </motion.div>
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="mx-auto block h-6 w-full" aria-hidden>
          <motion.path d="M50 0 V10 M25 10 H75 M25 10 V24 M75 10 V24" stroke={C.cyan} strokeWidth="0.6" fill="none" style={reduce ? undefined : { pathLength: draw }} />
        </svg>
        <div className="grid grid-cols-2 gap-3">
          {node(n2)}
          {node(n3)}
        </div>
        <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.mint }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: C.mint }} />
          {v.status}
        </p>
      </div>
    </Frame>
  );
}

function JobRow({ job, i, n, build, reduce }: { job: FocusVisual["jobs"][number]; i: number; n: number; build: MotionValue<number>; reduce: boolean }) {
  const s = useStagger(build, i, n);
  return (
    <motion.li className="flex items-center justify-between gap-3 py-3 text-sm" style={{ ...(reduce ? {} : s), borderBottom: `1px solid ${C.line}` }}>
      <span className="flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full text-[11px] text-black" style={{ background: C.mint }}>✓</span>
        {job.name}
      </span>
      <span className="font-mono">{job.amount}</span>
    </motion.li>
  );
}

function FocusPanel({ v, build, reduce }: VisualProps & { v: FocusVisual }) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <Frame label={v.focusLabel} className="sm:col-span-3">
        <ul>
          {v.jobs.map((job, i) => (
            <JobRow key={job.name} job={job} i={i} n={v.jobs.length} build={build} reduce={reduce} />
          ))}
        </ul>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Closed by you · sample day</p>
      </Frame>
      <Frame label={v.statusLabel} className="flex flex-col sm:col-span-2">
        <div className="relative mx-auto my-3 grid h-20 w-20 place-items-center">
          {!reduce && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `inset 0 0 0 1px ${C.cyan}` }}
              animate={{ scale: [0.6, 1.3], opacity: [0.9, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <span className="h-8 w-8 rounded-full" style={{ boxShadow: `inset 0 0 0 1px ${C.text}` }} />
          <span className="absolute h-2.5 w-2.5 rounded-full" style={{ background: C.text }} />
        </div>
        <p className="mt-auto px-3 py-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-white" style={{ background: C.blue }}>
          {v.status}
        </p>
      </Frame>
    </div>
  );
}

function StudioHandoffPanel({ v, build, reduce }: VisualProps & { v: StudioHandoffVisual }) {
  const priceScale = useTransform(build, [0.1, 0.7], [0.7, 1]);
  const priceO = useTransform(build, [0.1, 0.5], [0, 1]);
  return (
    <Frame label={v.header} right={v.pager}>
      <div className="p-4 sm:p-6" style={{ boxShadow: `inset 0 0 0 1px ${C.lineStrong}` }}>
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
          <span style={{ color: C.cyan }}>{v.panelLabel}</span>
          <span>LIVE</span>
        </div>
        <div className="my-5 flex flex-wrap items-center gap-5 sm:my-10">
          <motion.p className="text-8xl font-black leading-none tracking-tight sm:text-9xl" style={reduce ? undefined : { scale: priceScale, opacity: priceO }}>
            {v.price}
          </motion.p>
          <p className="max-w-[11rem] px-4 py-3 text-base font-bold uppercase leading-tight text-black sm:text-lg" style={{ background: C.gold }}>{v.pitch}</p>
        </div>
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
          <span>{v.footer}</span>
          <span>1 / 1</span>
        </div>
      </div>
      <div className="my-4 flex flex-col items-center" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="-mt-2 font-mono text-xl leading-none"
            style={{ color: C.text }}
            animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
          >
            ⌄
          </motion.span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => launchStudio(reduce)}
          className="block w-full py-4 text-center text-lg font-black uppercase tracking-tight text-white transition-transform hover:-translate-y-0.5 sm:text-xl"
          style={{ background: C.blue, boxShadow: `0 20px 60px -20px ${C.blue}` }}
        >
          {v.launchLabel} ↓
        </button>
        <button
          type="button"
          onClick={() => launchStudio(reduce)}
          className="block w-full py-4 text-center text-lg font-black uppercase tracking-tight text-black transition-transform hover:-translate-y-0.5 sm:text-xl"
          style={{ background: C.gold, boxShadow: `0 20px 60px -20px ${C.gold}` }}
        >
          {v.trialLabel}
        </button>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Chrome: grid, progress rail, floating player                         */
/* ------------------------------------------------------------------ */

function HudGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        opacity: 0.35,
        WebkitMaskImage: "radial-gradient(80% 60% at 50% 50%, #000 30%, transparent 85%)",
        maskImage: "radial-gradient(80% 60% at 50% 50%, #000 30%, transparent 85%)",
      }}
    />
  );
}

function ProgressRail({ beats, active }: { beats: Beat[]; active: number }) {
  return (
    // sticky overlay that rides the whole section without taking layout space
    <div className="pointer-events-none sticky top-0 z-20 -mb-[100svh] h-[100svh]">
      <div className="absolute left-3 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex lg:left-6">
        {beats.map((b, i) => (
          <span
            key={b.id}
            className="block w-[2px] rounded-full transition-all duration-500"
            style={{ height: i === active ? 34 : 14, background: i === active ? C.cyan : C.lineStrong, boxShadow: i === active ? `0 0 12px ${C.cyan}` : undefined }}
          />
        ))}
      </div>
      <p className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] sm:right-6 sm:top-6" style={{ color: C.muted }}>
        Beat <span style={{ color: C.text }}>{beats[active]?.number}</span> / {String(beats.length).padStart(2, "0")}
      </p>
    </div>
  );
}

function StoryPlayer({
  src,
  poster,
  visible,
  activeBeat,
  jump,
}: {
  src: string;
  poster: string;
  visible: boolean;
  activeBeat?: Beat;
  jump: { t: number; n: number } | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [sync, setSync] = useState(true);
  const [muted, setMuted] = useState(false);

  // "Watch this part" → open + seek + play with sound (it's a user gesture)
  useEffect(() => {
    if (!jump) return;
    setOpen(true);
    const v = ref.current;
    if (!v) return;
    v.currentTime = jump.t;
    v.muted = false;
    setMuted(false);
    void v.play().catch(() => {});
  }, [jump]);

  // keep the clip on the beat being read while sync is on
  useEffect(() => {
    const v = ref.current;
    if (!open || !sync || !v || !activeBeat) return;
    if (v.currentTime < activeBeat.start - 0.2 || v.currentTime > activeBeat.end + 0.5) {
      v.currentTime = activeBeat.start;
      void v.play().catch(() => {});
    }
  }, [activeBeat, open, sync]);

  const start = () => {
    setOpen(true);
    requestAnimationFrame(() => {
      const v = ref.current;
      if (!v) return;
      v.muted = false;
      setMuted(false);
      if (activeBeat) v.currentTime = activeBeat.start;
      void v.play().catch(() => {});
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          {/* video stays mounted so seeking is instant; it's just hidden while collapsed */}
          <div
            className={`overflow-hidden rounded-[8px] transition-all duration-300 ${open ? "w-[150px] sm:w-[200px]" : "pointer-events-none h-0 w-0 opacity-0"}`}
            style={{ boxShadow: open ? `0 0 0 1px ${C.lineStrong}, 0 30px 80px -20px #000` : undefined, background: C.panel }}
          >
            <video ref={ref} src={src} poster={poster} playsInline preload="metadata" className="block aspect-[720/1122] w-full object-cover" />
            {open && (
              <div className="flex items-center gap-1 p-1.5 font-mono text-[10px] uppercase">
                <button type="button" onClick={() => { const v = ref.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }} className="flex-1 rounded px-1.5 py-1 hover:bg-white/10" style={{ color: C.text }}>
                  {muted ? "Sound on" : "Mute"}
                </button>
                <button type="button" onClick={() => setSync((s) => !s)} aria-pressed={sync} className="flex-1 rounded px-1.5 py-1 hover:bg-white/10" style={{ color: sync ? C.cyan : C.muted }}>
                  Sync
                </button>
                <button type="button" aria-label="Close video" onClick={() => { ref.current?.pause(); setOpen(false); }} className="rounded px-1.5 py-1 hover:bg-white/10" style={{ color: C.muted }}>
                  ✕
                </button>
              </div>
            )}
          </div>
          {!open && (
            <button
              type="button"
              onClick={start}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white"
              style={{ background: C.blue, boxShadow: `0 14px 40px -12px ${C.blue}` }}
            >
              ▶ Watch Eric's 60s intro
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
