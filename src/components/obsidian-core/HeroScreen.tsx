"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AccessModal } from "./AccessModal";
import { GlassButton } from "./GlassButton";
import { HudAudioProvider } from "./HudAudio";
import { HudOverlay } from "./HudOverlay";
import { OrbitStage } from "./OrbitStage";
import type { Tone } from "./site";
import "./obsidian-core.css";

type Readout = { label: string; value: string; tone: Tone };

type HeroScreenProps = {
  video: string;
  poster: string;
  eyebrow: string;
  title: readonly [string, string];
  sub: string;
  node: string;
  depth: string;
  secondary: { label: string; href: string };
  readouts?: readonly Readout[];
};

const rise = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.25 + i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function HeroScreen({
  video,
  poster,
  eyebrow,
  title,
  sub,
  node,
  depth,
  secondary,
  readouts,
}: HeroScreenProps) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [warping, setWarping] = useState(false);

  const warpTo = () => {
    setWarping(true);
    window.setTimeout(() => {
      if (secondary.href === "/obsidian-core/core") {
        void navigate({ to: "/obsidian-core/core" });
      } else if (secondary.href === "/obsidian-core") {
        void navigate({ to: "/obsidian-core" });
      } else if (secondary.href === "/shops") {
        void navigate({ to: "/shops" });
      } else if (secondary.href === "/admin/master-dashboard") {
        void navigate({ to: "/admin/master-dashboard" });
      } else if (secondary.href === "/login") {
        void navigate({ to: "/login" });
      } else {
        window.location.assign(secondary.href);
      }
    }, 520);
  };

  return (
    <HudAudioProvider>
      <main className="obsidian-core relative h-[100svh] w-full overflow-hidden bg-[#030712] text-white">
        <OrbitStage src={video} poster={poster}>
          <div className="flex h-full w-full flex-col items-center justify-center px-5 text-center">
            <motion.p
              custom={0}
              variants={rise}
              initial="hidden"
              animate="show"
              className="obsidian-glass-3d mb-5 max-w-full rounded-full border border-[#00ffcc]/30 px-4 py-1.5 font-mono text-[9px] tracking-[0.2em] text-[#00ffcc] sm:text-[11px] sm:tracking-[0.32em]"
            >
              {eyebrow}
            </motion.p>

            <h1 className="font-display text-[13vw] font-black leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
              <motion.span
                custom={1}
                variants={rise}
                initial="hidden"
                animate="show"
                className="block text-[#00ffcc] [text-shadow:0_0_18px_rgba(0,255,204,0.55)]"
              >
                {title[0]}
              </motion.span>
              <motion.span
                custom={2}
                variants={rise}
                initial="hidden"
                animate="show"
                className="block text-amber-300 [text-shadow:0_0_18px_rgba(245,158,11,0.55)]"
              >
                {title[1]}
              </motion.span>
            </h1>

            <motion.p
              custom={3}
              variants={rise}
              initial="hidden"
              animate="show"
              className="obsidian-glass-3d mt-6 max-w-md rounded-2xl border border-white/10 px-5 py-3 text-sm leading-relaxed text-white/85 sm:text-base"
            >
              {sub}
            </motion.p>

            <motion.div
              custom={4}
              variants={rise}
              initial="hidden"
              animate="show"
              className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4"
            >
              <GlassButton tone="cyan" onClick={() => setModalOpen(true)} icon={<span className="text-base">◈</span>}>
                INITIALIZE PROTOCOL
              </GlassButton>
              <GlassButton tone="amber" onClick={warpTo} icon={<span className="text-base">⟁</span>}>
                {secondary.label}
              </GlassButton>
            </motion.div>

            {readouts ? (
              <motion.div
                custom={5}
                variants={rise}
                initial="hidden"
                animate="show"
                className="mt-8 hidden gap-3 sm:flex"
              >
                {readouts.map((r) => (
                  <div
                    key={r.label}
                    className="obsidian-glass-3d min-w-36 rounded-xl border border-white/10 px-4 py-3 text-left font-mono"
                  >
                    <div className="text-[10px] tracking-[0.25em] text-white/45">{r.label}</div>
                    <div
                      className={`mt-1 text-lg font-semibold ${r.tone === "cyan" ? "text-[#00ffcc]" : "text-amber-300"}`}
                    >
                      {r.value}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : null}
          </div>
        </OrbitStage>

        <HudOverlay node={node} depth={depth} />
        <AccessModal open={modalOpen} onClose={() => setModalOpen(false)} />

        <AnimatePresence>
          {warping ? (
            <motion.div className="pointer-events-none fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div
                className="absolute inset-y-0 w-[40%] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent blur-xl"
                initial={{ left: "-40%" }}
                animate={{ left: "110%" }}
                transition={{ duration: 0.5, ease: "easeIn" }}
              />
              <motion.div
                className="absolute inset-0 bg-[#030712]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </HudAudioProvider>
  );
}
