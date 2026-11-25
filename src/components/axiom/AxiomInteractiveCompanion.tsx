"use client";

/**
 * AxiomInteractiveCompanion — hero section with the live 3D Axiom companion.
 *  • Spring-physics cursor tracking (body tilt + parallax + eyes follow the cursor)
 *  • GPU particle stream: rises with turbulence, parts around the cursor, intensifies on scroll
 *  • Pulsing plasma boosters + color-shifting copper armor shader
 *  • LED visor: blinks, winks, mood cycle, hover + click reactions
 *  • Every value comes from the Axiom config → editable live in /axiom-studio
 *
 * Usage (server page):
 *   const cfg = await getAxiomConfig("default");
 *   <AxiomInteractiveCompanion slug="default" initialConfig={cfg} />
 */
import { motion } from "framer-motion";
import type { AxiomConfig } from "@/lib/axiom/landing/config";
import { useAxiomConfig } from "@/lib/axiom/landing/useAxiomConfig";
import { useAxiomRuntimeTracking } from "@/lib/axiom/landing/runtime";
import { CharacterCanvas, ParticleCanvas } from "./three/AxiomCanvases";
import { useIsWide } from "./useIsWide";

export interface AxiomInteractiveCompanionProps {
  slug?: string;
  initialConfig?: AxiomConfig;
  /** Pass a config directly (e.g. studio preview) to bypass fetching. */
  config?: AxiomConfig;
}

const rise = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.15 + i * 0.1, type: "spring" as const, stiffness: 140, damping: 20 },
  }),
};

export default function AxiomInteractiveCompanion({ slug = "default", initialConfig, config: forced }: AxiomInteractiveCompanionProps) {
  const live = useAxiomConfig(slug, initialConfig);
  const cfg = forced ?? live.config;
  const { theme, hero } = cfg;
  const wide = useIsWide();
  useAxiomRuntimeTracking();

  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden"
      style={{ background: theme.bg, color: theme.text }}
    >
      {/* atmosphere */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(60% 50% at ${wide ? "68%" : "50%"} 45%, ${theme.cyan}22 0%, transparent 70%), radial-gradient(40% 35% at 70% 85%, ${theme.crimson}1f 0%, transparent 70%)`,
        }}
      />
      <ParticleCanvas config={cfg} mode="hero" className="absolute inset-0 z-0" />

      {/* copy */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-end px-6 pb-16 pt-28 lg:items-center lg:pb-0">
        <div className="max-w-xl lg:max-w-[46%]">
          <motion.p
            custom={0}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.25em]"
            style={{ borderColor: `${theme.cyan}55`, color: theme.cyan, background: `${theme.cyan}0d` }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: theme.crimson }} />
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            custom={1}
            variants={rise}
            initial="hidden"
            animate="show"
            className="text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
          >
            {hero.headline}{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(100deg, ${theme.cyan}, #e0fbff 45%, ${theme.crimson})` }}
            >
              {hero.highlight}
            </span>
          </motion.h1>

          <motion.p custom={2} variants={rise} initial="hidden" animate="show" className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: theme.muted }}>
            {hero.subhead}
          </motion.p>

          <motion.div custom={3} variants={rise} initial="hidden" animate="show" className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={hero.primaryCta.href}
              className="group relative inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
              style={{ background: theme.cyan, boxShadow: `0 0 0 1px ${theme.cyan}, 0 10px 40px -8px ${theme.cyan}aa` }}
            >
              {hero.primaryCta.label}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center rounded-xl border px-6 py-3.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/5"
              style={{ borderColor: "#ffffff22", color: theme.text }}
            >
              {hero.secondaryCta.label}
            </a>
          </motion.div>

          {hero.statusChips.length > 0 && (
            <motion.ul custom={4} variants={rise} initial="hidden" animate="show" className="mt-8 flex flex-wrap gap-2 font-mono text-[11px]">
              {hero.statusChips.map((chip, i) => (
                <li
                  key={i}
                  className="rounded-md border px-2.5 py-1 backdrop-blur"
                  style={{ borderColor: "#ffffff14", background: "#ffffff06", color: i === 0 ? theme.cyan : theme.muted }}
                >
                  {chip}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>

      {/* Axiom — above the copy layer, pointer-events off so the CTAs underneath still work */}
      <CharacterCanvas
        config={cfg}
        className="absolute inset-0 z-20"
        fitHeight={wide ? 0.86 : 0.5}
        offset={wide ? [0.24, -0.01] : [0, 0.2]}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-32" style={{ background: `linear-gradient(to top, ${theme.bg}, transparent)` }} />
    </section>
  );
}
