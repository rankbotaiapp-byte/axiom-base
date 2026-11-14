"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ASSETS } from "./data";
import { HudBezel } from "./HudBezel";
import { Telemetry } from "./Telemetry";
import { VoiceConcierge } from "./VoiceConcierge";

interface HeroSectionProps {
  burstKey: number;
  glitching: boolean;
  onFireTest: () => void;
  onOpenSpecs: () => void;
  onBook: () => void;
}

interface DockButtonProps {
  label: string;
  code: string;
  tone: "red" | "cyan";
  onClick: () => void;
  icon: React.ReactNode;
  delay: number;
}

function DockButton({ label, code, tone, onClick, icon, delay }: DockButtonProps) {
  const toneCls =
    tone === "red"
      ? "border-neon-red/50 hover:border-neon-red hover:shadow-[0_0_24px_rgba(255,42,61,0.45)] text-neon-red"
      : "border-neon-cyan/40 hover:border-neon-cyan hover:shadow-[0_0_24px_rgba(34,230,255,0.4)] text-neon-cyan";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.97 }}
      className={`group flex min-w-0 flex-col items-center gap-1.5 rounded-sm border bg-slate-950/50 px-2 py-2.5 text-center backdrop-blur-2xl transition-[border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-neon-cyan sm:flex-row sm:gap-3 sm:px-4 sm:py-3 sm:text-left ${toneCls}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold leading-tight tracking-[0.1em] text-white sm:whitespace-nowrap sm:text-sm sm:tracking-[0.18em]">{label}</span>
        <span className="hidden font-mono text-[10px] tracking-[0.2em] text-slate-500 sm:block">{code}</span>
      </span>
    </motion.button>
  );
}

export function HeroSection({ burstKey, glitching, onFireTest, onOpenSpecs, onBook }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shake = useAnimationControls();
  const reduced = useReducedMotion();
  const [clock, setClock] = useState("");

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Some mobile browsers ignore the autoplay attribute until play() is called explicitly.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
    return () => {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const fmt = () => new Date().toISOString().slice(11, 19);
    setClock(fmt());
    const id = setInterval(() => setClock(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (burstKey === 0 || reduced) return;
    void shake.start({
      x: [0, -10, 9, -7, 6, -3, 0],
      y: [0, 6, -5, 4, -2, 1, 0],
      transition: { duration: 0.5 },
    });
  }, [burstKey, reduced, shake]);

  return (
    <section ref={sectionRef} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-obsidian">
      <motion.div animate={shake} className="absolute inset-0">
        {/* Edge-to-edge looping video */}
        <motion.video
          ref={videoRef}
          style={{ scale: videoScale }}
          className="absolute inset-0 h-full w-full object-cover object-[62%_center] lg:object-center"
          src={ASSETS.heroVideo}
          poster={ASSETS.heroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />

        {/* Obsidian gradient: dense at the edges where text sits, open in the middle so the footage reads */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-transparent to-slate-950/50" />

        {/* Red / cyan smoke scrim */}
        <div className="pointer-events-none absolute inset-0 mix-blend-screen">
          <div className="absolute -left-1/4 top-1/4 h-[70vh] w-[70vw] animate-drift rounded-full bg-neon-red/15 blur-[120px]" />
          <div
            className="absolute -right-1/4 bottom-0 h-[60vh] w-[60vw] animate-drift rounded-full bg-neon-cyan/10 blur-[120px]"
            style={{ animationDelay: "-9s" }}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,23,0.85)_100%)]" />
      </motion.div>

      <HudBezel />

      {/* Top status bar */}
      <div className="absolute inset-x-6 top-6 z-30 flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-slate-300 sm:inset-x-10 sm:top-9">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 bg-neon-red shadow-[0_0_10px_var(--color-neon-red)]" />
          CYBER-AUGMENT LABS
        </span>
        <span className="hidden sm:inline">SECURE FEED · {clock} UTC</span>
        <a href="#book" className="text-neon-cyan transition hover:text-white">
          BOOK →
        </a>
      </div>

      {/* Headline */}
      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="absolute inset-x-6 top-[13%] z-30 max-w-3xl sm:inset-x-10 sm:top-[18%] lg:left-14"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4 inline-flex items-center gap-3 border border-neon-cyan/40 bg-neon-cyan/5 px-3 py-1 font-mono text-[9px] tracking-[0.2em] sm:text-[10px] sm:tracking-[0.35em] text-neon-cyan backdrop-blur-2xl"
        >
          ELITE CYBERWARE · PERSONAL PROTECTION
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl ${
            glitching ? "glitch-active" : ""
          }`}
        >
          Become the
          <br />
          <span className="bg-gradient-to-r from-neon-red via-rose-400 to-neon-cyan bg-clip-text text-transparent">
            last line
          </span>{" "}
          of defense.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-5 hidden max-w-lg text-base text-slate-300 min-[380px]:block sm:text-lg"
        >
          Precision-fitted augments, ballistic integration and neural-sync hardware — engineered, installed and
          calibrated by one lab.
        </motion.p>
      </motion.div>

      {/* Bottom control deck */}
      <div className="absolute inset-x-6 bottom-6 z-30 grid grid-cols-[minmax(0,1fr)] gap-3 sm:inset-x-10 sm:bottom-10 sm:gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
        <div className="order-3 lg:order-1">
          <div className="sm:hidden">
            <Telemetry burstKey={burstKey} compact />
          </div>
          <div className="hidden sm:block">
            <Telemetry burstKey={burstKey} />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <VoiceConcierge onFallback={onBook} />
        </div>
        <div className="order-2 grid grid-cols-3 gap-2 sm:flex sm:flex-col sm:items-end lg:order-3">
          <DockButton
            label="ENGAGE FIRE TEST"
            code="SYS // LIVE-FIRE SIM"
            tone="red"
            onClick={onFireTest}
            delay={0.9}
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              </svg>
            }
          />
          <DockButton
            label="HARDWARE SPECS"
            code="DB // MANIFEST"
            tone="cyan"
            onClick={onOpenSpecs}
            delay={1}
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
          />
          <DockButton
            label="BOOK UPGRADE"
            code="OPS // SCHEDULE"
            tone="red"
            onClick={onBook}
            delay={1.1}
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <rect x="4" y="5" width="16" height="15" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#precision"
        aria-label="Scroll to Precision Engineering"
        style={{ opacity: fade }}
        className="absolute left-1/2 top-[calc(100%-1.5rem)] z-30 hidden -translate-x-1/2 lg:block"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <span className="block h-6 w-px bg-gradient-to-b from-neon-cyan to-transparent" />
      </motion.a>
    </section>
  );
}
