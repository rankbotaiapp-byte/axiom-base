"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import AxiomHeroStage from "./AxiomHeroStage";
import DemoShowcase from "./DemoShowcase";
import AxiomIntroVideo from "./AxiomIntroVideo";
import AxiomStudioFunnel from "./AxiomStudioFunnel";
import { AxiomPageSpecks } from "./AxiomAtmosphere";
import { startAxiomTrial } from "./axiomCheckout";
import type { AxiomStudioApi, OnboardPayload } from "./types";
import { RunwayStrips } from "@/components/autopilot/RunwayStrips";
import ap from "@/components/autopilot/autopilot.module.css";
import "./axiom.css";

interface AxiomLandingProps {
  api?: AxiomStudioApi;
  onCheckout?: (payload: OnboardPayload, files: File[]) => Promise<string | void> | string | void;
}

/** Hero → 60s intro → Studio. Mount this as the whole home page. */
export default function AxiomLanding({ api, onCheckout = startAxiomTrial }: AxiomLandingProps) {
  const reduce = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  const videoWrap = useRef<HTMLElement>(null);
  const studioRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLElement>(null);

  // Video slides up + fades as its bottom edge leaves the viewport.
  const { scrollYProgress } = useScroll({ target: videoWrap, offset: ["end 0.9", "end 0.1"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  useEffect(() => {
    setMotionReady(true);
  }, []);

  const motionOn = motionReady && !reduce;

  const scrollTo = useCallback(
    (el: HTMLElement | null) => el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }),
    [reduce]
  );

  return (
    <main className={`ax-root ${ap.stack}`} id="top">
      <RunwayStrips />
      <AxiomPageSpecks />
      <div className="relative z-[1]">
      <header className={ap.nav}>
        <a className={ap.navMark} href="#top">
          AXIOM
        </a>
        <button type="button" className={ap.navCta} onClick={() => scrollTo(studioRef.current)}>
          Start for $1
        </button>
      </header>
      <AxiomHeroStage onStart={() => scrollTo(studioRef.current)} />
      <DemoShowcase />

      <motion.section
        ref={(el) => {
          videoWrap.current = el;
          introRef.current = el;
        }}
        id="intro"
        aria-label="60-second intro"
        className="relative py-10 will-change-transform"
        style={motionOn ? { opacity, y, scale } : undefined}
      >
        <AxiomIntroVideo onSkip={() => scrollTo(studioRef.current)} />
      </motion.section>

      {/* Slides in once, then sits perfectly still (y:0, scale:1) so inputs never drift. */}
      <motion.section
        ref={studioRef}
        id="studio"
        aria-label="Axiom Studio"
        className="relative scroll-mt-4 pb-24 pt-12"
        initial={motionOn ? { opacity: 0, y: 90, scale: 0.97 } : false}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <AxiomStudioFunnel api={api} onCheckout={onCheckout} />
      </motion.section>

      <footer className="border-t border-white/5 px-5 py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
        Axiom · by New Era Apps · Rogue Valley, Oregon
      </footer>
      </div>
    </main>
  );
}
