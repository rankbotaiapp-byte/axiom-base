"use client";

/**
 * AxiomLayeredCROLanding — high-conversion landing for trades/contractors.
 *
 * Stack (bottom → top):
 *   z-0   GPU particle atmosphere (fixed) — intensifies with scroll velocity
 *   z-10  Sticky copy stage — ad copy layers snap/slide in from top & sides; giant backdrop word sits here
 *   z-20  Fixed 3D Axiom on his booster stage (pointer-events off → copy & CTAs below stay clickable)
 *   z-30  Obsidian HUD: live dispatch ticker, layer progress, persistent $1 CTA
 *
 * All copy, CTAs, pricing, colors, particle/booster/face settings are read from the Axiom config,
 * edited + persisted from /axiom-studio (or <AxiomStudioPanel/> inside the Master Admin Dashboard).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, type Variants } from "framer-motion";
import { accentColor, type AxiomConfig, type AxiomExpression, type CroLayer, type SlideFrom } from "@/lib/axiom/landing/config";
import { useAxiomConfig } from "@/lib/axiom/landing/useAxiomConfig";
import { useAxiomRuntimeTracking } from "@/lib/axiom/landing/runtime";
import { CharacterCanvas, ParticleCanvas } from "./three/AxiomCanvases";
import { AxiomPageSpecks, AxiomTopGlow } from "./AxiomAtmosphere";
import { useIsWide } from "./useIsWide";
import { HeyGenIntroStage } from "@/components/HeyGenIntroStage";
import AxiomScrollFunnel from "@/components/axiom-landing/AxiomScrollFunnel";
import { ProofOfWorkStage } from "@/components/proof-of-work-stage";

export interface AxiomLayeredCROLandingProps {
  slug?: string;
  initialConfig?: AxiomConfig;
  config?: AxiomConfig;
}

const SNAP = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };

const offsetFor = (from: SlideFrom, dist = 140) =>
  from === "top" ? { x: 0, y: -dist } : from === "bottom" ? { x: 0, y: dist } : from === "left" ? { x: -dist, y: 0 } : { x: dist, y: 0 };

const opposite = (f: SlideFrom): SlideFrom => (f === "left" ? "right" : f === "right" ? "left" : f === "top" ? "bottom" : "top");

function slide(from: SlideFrom, delay = 0, dist?: number): Variants {
  const o = offsetFor(from, dist);
  return {
    enter: { ...o, opacity: 0, filter: "blur(8px)" },
    center: { x: 0, y: 0, opacity: 1, filter: "blur(0px)", transition: { ...SNAP, delay } },
    exit: { x: -o.x * 0.5, y: -o.y * 0.5 - 30, opacity: 0, filter: "blur(6px)", transition: { duration: 0.22 } },
  };
}

export default function AxiomLayeredCROLanding({ slug = "default", initialConfig, config: forced }: AxiomLayeredCROLandingProps) {
  const live = useAxiomConfig(slug, initialConfig);
  const cfg = forced ?? live.config;
  const { theme, cro, hero } = cfg;
  const wide = useIsWide();
  useAxiomRuntimeTracking();

  const layers = useMemo(() => cro.layers.filter((l) => l.enabled), [cro.layers]);
  const stageCount = Math.max(layers.length, 1);

  const heroRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [inPricing, setInPricing] = useState(false);
  const [heroLeave, setHeroLeave] = useState(0);
  const [layerEnter, setLayerEnter] = useState(0);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!layers.length) return;
    setStage(Math.min(layers.length - 1, Math.max(0, Math.floor(p * layers.length * 0.9999))));
  });
  const { scrollYProgress: pricingProgress } = useScroll({ target: pricingRef, offset: ["start end", "start 40%"] });
  useMotionValueEvent(pricingProgress, "change", (p) => setInPricing(p > 0.5));
  const { scrollYProgress: heroLeaveProgress } = useScroll({ target: heroRef, offset: ["end end", "end start"] });
  useMotionValueEvent(heroLeaveProgress, "change", setHeroLeave);
  const { scrollYProgress: layerEnterProgress } = useScroll({ target: trackRef, offset: ["start end", "start start"] });
  useMotionValueEvent(layerEnterProgress, "change", setLayerEnter);

  // Video + proof sit between the hero and the copy layers. Park the fixed character
  // only while those sections own the viewport — the canvas stays mounted, so cursor tracking keeps running.
  const handOff = heroLeave > 0.42 && layerEnter < 0.55;

  // optional CSS scroll-snap so each layer locks into place
  useEffect(() => {
    if (!cro.scrollSnap) return;
    const html = document.documentElement;
    const prev = html.style.scrollSnapType;
    html.style.scrollSnapType = "y proximity";
    return () => void (html.style.scrollSnapType = prev);
  }, [cro.scrollSnap]);

  const layer: CroLayer | null = layers[stage] ?? null;
  const expression: AxiomExpression | undefined = inPricing ? "happy" : layerEnter >= 0.55 ? layer?.axiomExpression : undefined;
  const trialCta = cro.plans.find((p) => p.enabled)?.cta ?? hero.primaryCta;
  const onLayers = layerEnter >= 0.55;

  const jumpTo = (i: number) => {
    const el = onLayers ? trackRef.current : heroRef.current;
    if (!el) return;
    const count = onLayers ? stageCount : 1;
    const top = el.offsetTop + (i / count) * Math.max(0, el.offsetHeight - window.innerHeight) + 4;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <main className="relative isolate w-full" style={{ background: theme.bg, color: theme.text }}>
      <AxiomPageSpecks />
      <AxiomTopGlow />
      {/* z-0 atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(55% 45% at 50% 48%, ${theme.cyan}1c 0%, transparent 70%), radial-gradient(35% 30% at 50% 92%, ${theme.crimson}22 0%, transparent 70%)`,
        }}
      />
      <ParticleCanvas config={cfg} mode="page" className="fixed inset-0 z-0" />

      {/* z-20 Axiom on his stage */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-20"
        animate={
          inPricing
            ? { y: wide ? "-34vh" : "-36vh", scale: 0.36, opacity: 1 }
            : handOff
              ? { y: wide ? "-18vh" : "-12vh", scale: 0.92, opacity: 0 }
              : { y: 0, scale: 1, opacity: 1 }
        }
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      >
        <CharacterCanvas
          config={cfg}
          expression={expression}
          className="absolute inset-0"
          fitHeight={wide ? 0.78 : 0.48}
          offset={wide ? [0, -0.02] : [0, 0.17]}
        />
        {/* stage halo under the boosters */}
        <div
          className="absolute left-1/2 h-24 w-[min(520px,70vw)] -translate-x-1/2 rounded-[50%] blur-2xl"
          style={{ top: wide ? "84%" : "58%", background: `radial-gradient(closest-side, ${theme.cyan}40, transparent)` }}
        />
      </motion.div>

      {/* z-30 HUD */}
      <Hud
        cfg={cfg}
        stage={onLayers ? stage : 0}
        stageCount={onLayers ? stageCount : 1}
        onJump={jumpTo}
        trialCta={trialCta}
        hidden={inPricing || handOff}
      />

      {/* Top hero only. Intro copy is untouched; the character canvas stays fixed above it. */}
      <div ref={heroRef} className="relative z-10" style={{ height: `calc(100svh + ${cro.layerScrollVh}vh)` }}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <IntroStage cfg={cfg} wide={wide} />
        </div>
      </div>

      <HeyGenIntroStage />
      <div className="relative z-30">
        <AxiomScrollFunnel
          studio={{ launchPath: "/onboard" }}
          showVideo={false}
          videoSrc="/media/welcome-to-axiom.mp4"
          videoPoster="/videos/axiom-story-eric.jpg"
        />
      </div>
      <ProofOfWorkStage />

      {/* Copy layers resume after the film and the proof carousel. */}
      {layers.length > 0 && (
        <div ref={trackRef} className="relative z-10" style={{ height: `${stageCount * cro.layerScrollVh}vh` }}>
          {Array.from({ length: stageCount }).map((_, i) => (
            <div key={i} aria-hidden className="pointer-events-none absolute inset-x-0 snap-start" style={{ top: `${(i / stageCount) * 100}%`, height: 1 }} />
          ))}
          <div className="sticky top-0 h-[100svh] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {layer && <LayerStage key={layer.id} layer={layer} cfg={cfg} wide={wide} index={stage + 1} />}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* pricing */}
      <section ref={pricingRef} className="relative z-10 snap-start px-6 pb-24" style={{ paddingTop: wide ? "38vh" : "34vh" }}>
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">{cro.pricingHeadline}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg" style={{ color: theme.muted }}>
            {cro.pricingSubhead}
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr">
          {cro.plans
            .filter((p) => p.enabled)
            .map((plan, i) => {
              const ac = accentColor(cfg, plan.accent);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ ...SNAP, delay: i * 0.08 }}
                  className="relative flex flex-col rounded-2xl border p-7 backdrop-blur-xl"
                  style={{
                    borderColor: plan.highlight ? ac : "#ffffff14",
                    background: plan.highlight ? `linear-gradient(180deg, ${ac}1a, #0a0a0ecc)` : "#0a0a0ecc",
                    boxShadow: plan.highlight ? `0 0 60px -20px ${ac}` : undefined,
                  }}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-7 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-black" style={{ background: ac }}>
                      MOST BOOKED
                    </span>
                  )}
                  <p className="font-mono text-xs tracking-[0.2em]" style={{ color: ac }}>
                    {plan.name.toUpperCase()}
                  </p>
                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-5xl font-semibold tracking-tight">{plan.price}</span>
                    <span style={{ color: theme.muted }}>{plan.cadence}</span>
                  </p>
                  <p className="mt-3 text-sm" style={{ color: theme.muted }}>
                    {plan.blurb}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span style={{ color: ac }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={plan.cta.href}
                    className="mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                    style={
                      plan.highlight
                        ? { background: ac, color: "#000", boxShadow: `0 10px 40px -10px ${ac}` }
                        : { border: `1px solid ${ac}66`, color: theme.text }
                    }
                  >
                    {plan.cta.label}
                  </a>
                </motion.div>
              );
            })}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs" style={{ color: theme.muted }}>
          {cro.finePrint}
        </p>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Backdrop({ word, color, from }: { word: string; color: string; from: SlideFrom }) {
  if (!word || word.trim().toUpperCase() === "MISSED") return null;
  return (
    <motion.div
      variants={slide(from === "top" || from === "bottom" ? "top" : from, 0, 80)}
      className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
      aria-hidden
    >
      <span
        className="max-w-[92vw] text-center font-black leading-none tracking-tight"
        style={{
          fontSize: "clamp(3rem, 12vw, 8rem)",
          color: "transparent",
          WebkitTextStroke: `1px ${color}66`,
        }}
      >
        {word}
      </span>
    </motion.div>
  );
}

function IntroStage({ cfg, wide }: { cfg: AxiomConfig; wide: boolean }) {
  const { hero, theme, cro } = cfg;
  const headline = (
    <motion.h1 variants={slide(wide ? "left" : "bottom", 0.1, 80)} className="mt-3 text-3xl font-semibold leading-[1.03] tracking-tight sm:text-5xl xl:text-6xl">
      {hero.headline}{" "}
      <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(100deg, ${theme.cyan}, #e0fbff 50%, ${theme.crimson})` }}>
        {hero.highlight}
      </span>
    </motion.h1>
  );
  const eyebrow = (
    <motion.p variants={slide("top", 0.05, 60)} className="font-mono text-[11px] tracking-[0.3em]" style={{ color: theme.cyan }}>
      {hero.eyebrow}
    </motion.p>
  );
  const action = (
    <>
      <motion.p variants={slide(wide ? "right" : "bottom", 0.18, 80)} className="text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
        {hero.subhead}
      </motion.p>
      <motion.div variants={slide(wide ? "right" : "bottom", 0.26, 60)} className={`mt-5 flex items-center gap-4 ${wide ? "justify-end" : "justify-center"}`}>
        <a href={hero.primaryCta.href} className="rounded-xl px-5 py-3 text-sm font-semibold text-black" style={{ background: theme.cyan, boxShadow: `0 10px 40px -10px ${theme.cyan}` }}>
          {hero.primaryCta.label} →
        </a>
        <span className="flex items-center gap-2 font-mono text-[11px]" style={{ color: theme.muted }}>
          <motion.span animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            ↓
          </motion.span>
          scroll
        </span>
      </motion.div>
      {hero.statusChips.length > 0 && (
        <motion.ul variants={slide(wide ? "right" : "bottom", 0.32, 40)} className={`mt-5 flex flex-wrap gap-2 font-mono text-[11px] ${wide ? "justify-end" : "justify-center"}`}>
          {hero.statusChips.map((c, i) => (
            <li key={i} className="rounded-md border px-2.5 py-1" style={{ borderColor: "#ffffff14", background: "#05050799", color: i === 0 ? theme.cyan : theme.muted }}>
              {c}
            </li>
          ))}
        </motion.ul>
      )}
    </>
  );
  return (
    <motion.div className="absolute inset-0" initial="enter" animate="center" exit="exit">
      <Backdrop word={cro.brandName} color={theme.cyan} from="top" />
      {wide ? (
        <>
          <div className={`absolute ${COL_LEFT}`}>
            {eyebrow}
            {headline}
          </div>
          <div className={`absolute ${COL_RIGHT} text-right`}>{action}</div>
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
          <div className="absolute inset-x-0 bottom-0 -z-10 h-[140%]" style={{ background: `linear-gradient(to top, ${theme.bg} 60%, transparent)` }} />
          {eyebrow}
          {headline}
          <div className="mt-3">{action}</div>
        </div>
      )}
    </motion.div>
  );
}

const COL_LEFT = "left-[max(5.5vw,76px)] top-1/2 -translate-y-1/2 w-[min(31vw,500px)]";
const COL_RIGHT = "right-[max(5.5vw,76px)] top-1/2 -translate-y-1/2 w-[min(31vw,500px)]";

function LayerStage({ layer, cfg, wide, index }: { layer: CroLayer; cfg: AxiomConfig; wide: boolean; index: number }) {
  const { theme } = cfg;
  const ac = accentColor(cfg, layer.accent);
  const side = layer.align;
  const columnPos = wide
    ? side === "left"
      ? COL_LEFT
      : `${COL_RIGHT} text-right`
    : "inset-x-0 bottom-0 px-5 pb-[max(env(safe-area-inset-bottom),20px)]";
  const bodyFrom: SlideFrom = wide ? opposite(layer.from === "top" || layer.from === "bottom" ? (side === "left" ? "right" : "left") : layer.from) : "bottom";

  return (
    <motion.div className="absolute inset-0" initial="enter" animate="center" exit="exit">
      <Backdrop word={layer.backdropWord} color={ac} from={layer.from} />

      {!wide && <div className="absolute inset-x-0 bottom-0 h-[62%]" style={{ background: `linear-gradient(to top, ${theme.bg} 55%, transparent)` }} />}

      <div className={`absolute ${columnPos}`}>
        <motion.p variants={slide("top", 0.02, 70)} className="font-mono text-[11px] tracking-[0.28em]" style={{ color: ac }}>
          <span className="mr-2 opacity-60">{String(index).padStart(2, "0")}</span>
          {layer.kicker}
        </motion.p>
        <motion.h2
          variants={slide(wide ? layer.from : "bottom", 0.08)}
          className="mt-3 text-[1.75rem] font-semibold leading-[1.05] tracking-tight sm:text-4xl xl:text-5xl"
        >
          {layer.headline}
        </motion.h2>
        <motion.div variants={slide(bodyFrom, 0.16, 100)} className={`mt-4 ${wide ? "rounded-2xl border p-5 backdrop-blur-md" : ""}`} style={wide ? { borderColor: `${ac}2e`, background: "#07070bb3" } : undefined}>
          <p className="text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
            {layer.body}
          </p>
          {layer.bullets.length > 0 && (
            <ul className={`mt-4 space-y-2 text-sm ${side === "right" && wide ? "flex flex-col items-end" : ""}`}>
              {layer.bullets.map((b, i) => (
                <motion.li key={i} variants={slide(bodyFrom, 0.22 + i * 0.06, 40)} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ac, boxShadow: `0 0 10px ${ac}` }} />
                  {b}
                </motion.li>
              ))}
            </ul>
          )}
          {layer.cta && (
            <a
              href={layer.cta.href}
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
              style={{ background: ac, boxShadow: `0 10px 40px -12px ${ac}` }}
            >
              {layer.cta.label} →
            </a>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function Hud({
  cfg,
  stage,
  stageCount,
  onJump,
  trialCta,
  hidden,
}: {
  cfg: AxiomConfig;
  stage: number;
  stageCount: number;
  onJump: (i: number) => void;
  trialCta: { label: string; href: string };
  hidden: boolean;
}) {
  const { theme, cro } = cfg;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!cro.hudTicker.length) return;
    const id = setInterval(() => setTick((t) => (t + 1) % cro.hudTicker.length), 3200);
    return () => clearInterval(id);
  }, [cro.hudTicker.length]);
  const line = cro.hudTicker[tick % Math.max(1, cro.hudTicker.length)];

  const corner = "absolute h-6 w-6 border-[1.5px]";
  return (
    <motion.div
      animate={{ opacity: hidden ? 0 : 1 }}
      className="pointer-events-none fixed inset-0 z-30"
      style={{ visibility: hidden ? "hidden" : "visible" }}
    >
      {/* frame brackets */}
      <div className="absolute inset-3 sm:inset-5" style={{ color: `${theme.cyan}66` }}>
        <span className={`${corner} left-0 top-0 border-b-0 border-r-0`} style={{ borderColor: "currentColor" }} />
        <span className={`${corner} right-0 top-0 border-b-0 border-l-0`} style={{ borderColor: "currentColor" }} />
        <span className={`${corner} bottom-0 left-0 border-r-0 border-t-0`} style={{ borderColor: "currentColor" }} />
        <span className={`${corner} bottom-0 right-0 border-l-0 border-t-0`} style={{ borderColor: "currentColor" }} />
      </div>

      {/* top bar */}
      <div className="absolute inset-x-6 top-6 flex items-center justify-between gap-4 sm:inset-x-9 sm:top-8">
        <span className="font-mono text-sm font-semibold tracking-[0.35em]">{cro.brandName}</span>
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <div className="flex max-w-[52ch] items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 font-mono text-[11px] backdrop-blur" style={{ borderColor: "#ffffff14", background: "#05050799" }}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: theme.crimson }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: theme.crimson }} />
            </span>
            <AnimatePresence mode="wait">
              <motion.span key={tick} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="truncate" style={{ color: theme.muted }}>
                {line}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <a href={trialCta.href} className="pointer-events-auto rounded-lg px-3.5 py-2 text-xs font-semibold text-black" style={{ background: theme.cyan }}>
          {trialCta.label}
        </a>
      </div>

      {/* progress rail */}
      <motion.div animate={{ opacity: hidden ? 0 : 1 }} className="absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 sm:flex sm:left-9">
        {Array.from({ length: stageCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => onJump(i)}
            aria-label={`Go to section ${i + 1}`}
            className="pointer-events-auto h-6 w-1 rounded-full transition-all"
            style={{ background: i === stage ? theme.cyan : "#ffffff26", boxShadow: i === stage ? `0 0 12px ${theme.cyan}` : undefined, height: i === stage ? 32 : 18 }}
          />
        ))}
      </motion.div>

      {/* counter */}
      <motion.div animate={{ opacity: hidden ? 0 : 1 }} className="absolute bottom-7 right-7 hidden font-mono text-xs sm:block sm:bottom-9 sm:right-10" style={{ color: theme.muted }}>
        <span style={{ color: theme.text }}>{String(stage + 1).padStart(2, "0")}</span> / {String(stageCount).padStart(2, "0")}
      </motion.div>
    </motion.div>
  );
}
