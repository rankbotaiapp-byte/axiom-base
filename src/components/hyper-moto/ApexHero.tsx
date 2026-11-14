"use client";

import { lazy, Suspense, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { openConcierge } from "./conciergeEvents";
import { useTelemetry } from "./useTelemetry";
import type { ShopConfig } from "./config";

const EmberField = lazy(() => import("./EmberField"));

/*
 * Layout: desktop is a fixed-ratio stage (1366 × 715, the mockup's screen) and every
 * element is placed in % of that stage and sized in container units (cqw), so the
 * composition stays identical at any desktop width. Below lg it re-flows into a stack.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.1 + i * 0.08, ease: EASE } }),
};

const CYAN = "text-[#00ffcc]";
const GLASS =
  "rounded-[0.9cqw] border border-slate-400/20 bg-slate-800/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl max-lg:rounded-xl";

const NAV = [
  { href: "#overview", label: "Overview" },
  { href: "#tiers", label: "Build Tiers" },
  { href: "#portfolio", label: "Portfolio" },
] as const;

/* ------------------------------------------------------------------ */

function GarageScreen({ src, poster }: ShopConfig["heroVideo"]) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduce) v.pause();
    else void v.play().catch(() => undefined);
    return () => {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {
        /* ignore */
      }
    };
  }, [reduce]);

  return (
    <div className="absolute top-0 right-0 h-[58%] w-[78%] overflow-hidden rounded-md border border-slate-300/15 bg-[#0b0e13] shadow-[0_20px_60px_rgba(0,0,0,0.6)] lg:top-[13.3%] lg:right-auto lg:left-[64.4%] lg:h-[37.8%] lg:w-[34.4%] lg:rounded-[0.35cqw]">
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover brightness-[1.25] saturate-[1.1]" />
      <video
        ref={ref}
        className={`absolute inset-0 h-full w-full object-cover brightness-[1.25] saturate-[1.1] transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
        poster={poster}
        autoPlay={!reduce}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        onPlaying={() => setPlaying(true)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {/* Screen glass: light falloff + top reflection */}
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_35%,rgba(3,7,18,0.15))]" />
      <span aria-hidden className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.45)]" />
    </div>
  );
}

function Engine({ image, alt }: ShopConfig["heroCenterpiece"]) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-x-[6%] top-[8%] bottom-0 lg:inset-auto lg:top-[16%] lg:left-[31%] lg:h-[72.7%] lg:w-[36.4%]"
      animate={reduce ? undefined : { y: ["0%", "-1.6%", "0%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative h-full w-full [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_60%,transparent_100%)]">
        <img src={image} alt={alt} className="absolute inset-0 h-full w-full object-contain" />
        {/* Neon fin pulse */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-0 mix-blend-screen"
            animate={{ opacity: [0, 0.28, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-contain [filter:saturate(1.8)_brightness(1.25)_hue-rotate(-8deg)]" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TelemetryPanel({ baseline }: { baseline: ShopConfig["dyno"] }) {
  const t = useTelemetry(baseline);
  const rows: { label: string; value: string; up: boolean }[] = [
    { label: "Dyno HP:", value: `${t.hp.toFixed(0)} whp`, up: true },
    { label: "Boost PSI:", value: t.boostPsi.toFixed(1), up: true },
    {
      label: "System Latency:",
      value: !t.online ? "offline" : t.latencyMs === null ? "-- ms" : `${Math.round(t.latencyMs)}ms`,
      up: false,
    },
  ];
  return (
    <motion.div
      initial="hidden"
      animate="show"
      custom={4}
      variants={rise}
      className={`${GLASS} relative z-10 flex flex-col px-[1.1cqw] pt-[1.3cqw] max-lg:p-4 lg:absolute lg:top-[57.1%] lg:left-[2.5%] lg:h-[32.2%] lg:w-[15.8%]`}
      role="group"
      aria-label="Live telemetry"
    >
      <p className="text-[1.2cqw] font-medium text-slate-100 [font-stretch:100%] max-lg:text-[4cqw]">Live Telemetry</p>
      <dl className="mt-[0.9cqw] flex flex-1 flex-col max-lg:mt-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex flex-1 items-center justify-between gap-2 border-t border-slate-400/15 max-lg:py-2"
          >
            <dt className="text-[0.98cqw] whitespace-nowrap text-slate-400 uppercase [font-stretch:100%] max-lg:text-[3cqw]">
              {r.label}
            </dt>
            <dd className={`flex items-center gap-[0.3cqw] text-[1.32cqw] font-medium whitespace-nowrap tabular-nums [font-stretch:100%] ${CYAN} max-lg:text-[4.2cqw]`}>
              {r.value}
              {r.up && (
                <motion.svg
                  viewBox="0 0 12 16"
                  className="h-[1.3cqw] w-[1cqw] max-lg:h-[3.8cqw] max-lg:w-[3cqw]"
                  aria-hidden
                  animate={t.rising ? { y: [1, -1, 1] } : { y: 0 }}
                  transition={{ duration: 0.6, repeat: t.rising ? Infinity : 0 }}
                >
                  <path d="M6 1v14M1 6l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </motion.div>
  );
}

function LauncherCard({ launcher }: { launcher: ShopConfig["concierge"]["launcher"] }) {
  return (
    <motion.button
      type="button"
      onClick={openConcierge}
      initial="hidden"
      animate="show"
      custom={5}
      variants={rise}
      whileHover={{ y: -3 }}
      className={`${GLASS} group relative z-10 flex flex-col items-center overflow-hidden px-[0.8cqw] pt-[0.6cqw] pb-[1.4cqw] text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] max-lg:px-3 max-lg:pb-4 lg:absolute lg:top-[54.1%] lg:left-[19.8%] lg:h-[34%] lg:w-[10.6%]`}
      aria-label={`${launcher.lines.join(" ")}: open the booking concierge`}
    >
      <span className="relative block aspect-[360/340] w-[92%] [mask-image:radial-gradient(ellipse_60%_58%_at_50%_45%,black_55%,transparent_100%)]">
        <img src={launcher.image} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-screen" />
      </span>
      <span className="mt-[0.2cqw] text-[1.15cqw] leading-tight text-slate-100 max-lg:text-[3.4cqw]">
        {launcher.lines[0]}
        <br />
        {launcher.lines[1]}
      </span>
      <span className="relative mt-auto flex h-[4cqw] w-[4cqw] items-center justify-center pt-[0.6cqw] max-lg:mt-3 max-lg:h-[12cqw] max-lg:w-[12cqw]">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-[0.12cqw] border-[#00ffcc]/50 max-lg:border-2"
          animate={{ scale: [1, 1.3], opacity: [0.7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="absolute inset-0 rounded-full border-[0.32cqw] border-[#00ffcc] shadow-[0_0_1.4cqw_rgba(0,255,204,0.9),inset_0_0_1cqw_rgba(0,255,204,0.6)] transition-transform group-hover:scale-110 max-lg:border-[4px]" />
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */

export default function ApexHero({ config }: { config: ShopConfig }) {
  const reduce = useReducedMotion();
  const [webgl, setWebgl] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 14 });
  const sy = useSpring(my, { stiffness: 60, damping: 14 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const shiftX = useTransform(sx, [-0.5, 0.5], ["-1.2%", "1.2%"]);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(Boolean(c.getContext("webgl2") ?? c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      id="overview"
      onPointerMove={onPointerMove}
      className="relative isolate overflow-hidden bg-[#151920] font-['Saira_Variable',ui-sans-serif,system-ui] [font-stretch:112%] text-slate-100 lg:flex lg:min-h-[100svh] lg:items-center"
    >
      {/* Ambient garage + lighting (full-bleed, outside the stage) */}
      <div aria-hidden className="absolute inset-0">
        <img src={config.heroVideo.poster} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.16] blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_46%_at_49.5%_53%,rgba(58,64,77,0.75),rgba(40,45,55,0.35)_55%,transparent_80%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#1c2029] via-[#171b23]/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,9,13,0.75)_100%)]" />
        {/* Hand-off into the page's obsidian shell below */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#030712] to-transparent lg:h-[9%]" />
      </div>

      <div className="@container relative mx-auto flex w-full flex-col gap-5 px-5 pt-6 pb-10 lg:block lg:aspect-[1366/715] lg:max-w-[calc(100svh*1.91)] lg:gap-0 lg:p-0">
        {/* Frame lines (desktop) */}
        <svg
          aria-hidden
          viewBox="0 0 1366 715"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        >
          <path d="M45 86 H272 L314 50 H912" fill="none" stroke="rgba(148,163,184,0.28)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <path d="M6 86 H45" fill="none" stroke="#ef4444" strokeWidth="2.4" vectorEffect="non-scaling-stroke" style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.9))" }} />
          <path d="M1348 140 V380" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M8 200 V420" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M120 684 H1336" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M34 684 H120" fill="none" stroke="#ef4444" strokeWidth="2.6" vectorEffect="non-scaling-stroke" style={{ filter: "drop-shadow(0 0 5px rgba(239,68,68,0.9))" }} />
        </svg>

        {/* Brand */}
        <motion.div initial="hidden" animate="show" variants={rise} className="relative z-10 lg:absolute lg:top-[2.4%] lg:left-[2.6%]">
          <p className="text-[1.4cqw] leading-none text-slate-400/80 [font-stretch:104%] max-lg:text-[3.6cqw]">{config.eyebrow}</p>
          <p className={`mt-[0.35cqw] text-[2.2cqw] leading-none font-bold [font-stretch:104%] ${CYAN} drop-shadow-[0_0_10px_rgba(56,217,236,0.35)] max-lg:text-[6.4cqw]`}>
            {config.brand}
          </p>
          <p className="mt-[0.95cqw] flex items-center gap-[0.55cqw] text-[1.1cqw] [font-stretch:100%] text-slate-300 max-lg:mt-1 max-lg:gap-2 max-lg:text-[3.4cqw]">
            <span className="h-[0.75cqw] w-[0.75cqw] rounded-full bg-[#38d9ec] shadow-[0_0_0.8cqw_rgba(56,217,236,1)] max-lg:h-2 max-lg:w-2" />
            {config.statusLabel}
          </p>
        </motion.div>

        {/* Top nav */}
        <motion.nav
          initial="hidden"
          animate="show"
          custom={1}
          variants={rise}
          aria-label="Primary"
          className="relative z-10 flex items-stretch gap-[0.4cqw] rounded-[0.9cqw] border border-slate-400/25 bg-slate-800/35 p-[0.35cqw] backdrop-blur-xl max-lg:rounded-xl max-lg:p-1 lg:absolute lg:top-[3.6%] lg:left-[68.9%] lg:h-[6.9%] lg:w-[28.5%]"
        >
          {NAV.map((n, i) => (
            <a
              key={n.href}
              href={n.href}
              className={`flex flex-1 items-center justify-center rounded-[0.65cqw] text-[1.3cqw] transition-colors max-lg:rounded-lg max-lg:py-2 max-lg:text-[3.6cqw] ${
                i === 0
                  ? "border border-cyan-400/50 bg-cyan-500/15 text-slate-100 shadow-[0_0_1.2cqw_rgba(0,255,204,0.25)]"
                  : "text-slate-300/80 hover:text-cyan-200"
              }`}
            >
              {n.label}
            </a>
          ))}
        </motion.nav>

        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          custom={2}
          variants={rise}
          className={`relative z-10 text-[3.7cqw] leading-[0.95] font-bold tracking-[-0.005em] [font-stretch:100%] ${CYAN} drop-shadow-[0_0_1.6cqw_rgba(56,217,236,0.28)] max-lg:mt-2 max-lg:text-[10.6cqw] lg:absolute lg:top-[20.8%] lg:left-[2.6%]`}
        >
          {config.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </motion.h1>
        <p className="sr-only">{config.subhead}</p>

        {/* Centerpiece: garage screen behind, floating engine in front */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="pointer-events-none relative aspect-[1/0.95] w-full lg:contents"
        >
          <GarageScreen {...config.heroVideo} />

          {/* Smoke */}
          {!reduce && (
            <>
              <motion.span
                aria-hidden
                className="absolute top-[22%] left-[10%] h-[45%] w-[55%] rounded-full bg-[radial-gradient(closest-side,rgba(148,163,184,0.22),transparent)] blur-2xl lg:top-[24%] lg:left-[33%] lg:h-[45%] lg:w-[24%]"
                animate={{ x: ["0%", "8%", "0%"], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                aria-hidden
                className="absolute top-[40%] right-[8%] h-[40%] w-[45%] rounded-full bg-[radial-gradient(closest-side,rgba(148,163,184,0.16),transparent)] blur-2xl lg:top-[44%] lg:right-auto lg:left-[48%] lg:h-[38%] lg:w-[20%]"
                animate={{ x: ["0%", "-10%", "0%"], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}

          {/* Floor shadow */}
          <span
            aria-hidden
            className="absolute bottom-[2%] left-1/2 h-[7%] w-[50%] -translate-x-1/2 rounded-[100%] bg-black/60 blur-xl lg:top-[84%] lg:bottom-auto lg:left-[49.5%] lg:h-[4.5%] lg:w-[20%]"
          />

          {/* Engine with mouse-reactive tilt */}
          <motion.div
            className="pointer-events-none absolute inset-0 [perspective:1200px]"
            style={{ x: shiftX }}
          >
            <motion.div className="absolute inset-0" style={{ rotateX, rotateY }}>
              <Engine {...config.heroCenterpiece} />
            </motion.div>
          </motion.div>

          {/* Embers over the centerpiece */}
          {webgl && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <Suspense fallback={null}>
                <EmberField density={1.7} />
              </Suspense>
            </div>
          )}
        </motion.div>

        {/* Telemetry + launcher (row on mobile, placed cards on desktop) */}
        <div className="grid grid-cols-[1.45fr_1fr] gap-3 lg:contents">
          <TelemetryPanel baseline={config.dyno} />
          <LauncherCard launcher={config.concierge.launcher} />
        </div>

        {/* Right quick-nav stack (desktop) */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={6}
          variants={rise}
          className="relative z-10 hidden flex-col gap-[0.75cqw] lg:absolute lg:top-[63.4%] lg:left-[84.2%] lg:flex lg:w-[13.3%]"
        >
          {NAV.map((n, i) => (
            <a
              key={n.href}
              href={n.href}
              className={`flex h-[3.8cqw] items-center justify-center rounded-[0.6cqw] border text-[1.5cqw] backdrop-blur-xl transition-colors ${
                i === 0
                  ? "border-cyan-400/70 bg-cyan-500/15 text-slate-100 shadow-[0_0_1.6cqw_rgba(0,255,204,0.35),inset_0_0_1cqw_rgba(0,255,204,0.12)]"
                  : "border-slate-400/25 bg-slate-800/35 text-slate-200/90 hover:border-cyan-400/40"
              }`}
            >
              {n.label}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
