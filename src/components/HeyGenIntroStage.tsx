"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";

const SRC = "/media/welcome-to-axiom.mp4";

/**
 * Scroll-scrubbed HeyGen intro. Mounted directly under the Axiom 3D hero.
 * The hero canvas stays mounted above this section; this block only owns its own frame.
 */
export function HeyGenIntroStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const reduce = useReducedMotion();
  const inView = useInView(sectionRef, { amount: 0.48 });

  useEffect(() => {
    setMotionReady(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 0.22, 0.72, 1], reduce ? ["0%", "0%", "0%", "0%"] : ["36%", "0%", "0%", "-28%"]);
  const x = useTransform(scrollYProgress, [0, 0.22, 0.72, 1], reduce ? ["0%", "0%", "0%", "0%"] : ["9%", "0%", "0%", "-7%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.14, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.22, 0.72, 1], reduce ? [1, 1, 1, 1] : [0.94, 1, 1, 0.95]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = !sound;
    if (inView) void node.play().catch(() => undefined);
    else node.pause();
  }, [inView, sound]);

  const toggleSound = () => {
    const node = videoRef.current;
    const next = !sound;
    setSound(next);
    if (!node) return;
    node.muted = !next;
    if (next) {
      node.volume = 1;
      void node.play().catch(() => undefined);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="heygen-intro"
      aria-label="HeyGen intro"
      className="relative z-30 min-h-[100svh] overflow-hidden"
      style={{ background: "#050507" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28"
        style={{ background: "linear-gradient(to bottom, #050507, transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36"
        style={{ background: "linear-gradient(to top, #050507, transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 42% at 50% 48%, rgba(0,242,254,0.14), transparent 70%), radial-gradient(28% 24% at 82% 78%, rgba(255,42,61,0.12), transparent 72%)",
        }}
        aria-hidden
      />

      <motion.div
        style={motionReady ? { y, x, opacity, scale } : undefined}
        className="relative flex min-h-[100svh] items-center justify-center px-4 py-16 sm:px-8"
      >
        <div className="relative w-full max-w-5xl">
          <p className="mb-4 text-center font-mono text-[11px] tracking-[0.32em] text-[#00f2fe]">FOUNDER INTRO</p>
          <div className="relative">
            <video
              ref={videoRef}
              src={SRC}
              playsInline
              muted
              loop
              preload="metadata"
              className="aspect-video w-full object-cover"
              style={{
                WebkitMaskImage: "radial-gradient(ellipse at center, #000 62%, transparent 100%)",
                maskImage: "radial-gradient(ellipse at center, #000 62%, transparent 100%)",
                filter: "saturate(1.05) contrast(1.04)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at center, transparent 50%, #050507 100%)",
                mixBlendMode: "normal",
              }}
              aria-hidden
            />
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={sound}
              className="absolute bottom-6 right-6 z-10 cursor-pointer rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-[#041016] sm:bottom-10 sm:right-10"
              style={{
                background: sound ? "#00f2fe" : "rgba(5,5,7,0.72)",
                color: sound ? "#041016" : "#00f2fe",
                boxShadow: "0 0 28px rgba(0,242,254,0.35)",
              }}
            >
              {sound ? "SOUND ON" : "UNMUTE"}
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
