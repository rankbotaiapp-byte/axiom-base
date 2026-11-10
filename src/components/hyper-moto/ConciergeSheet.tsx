"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AiVoiceManager, { type ConciergeState } from "./AiVoiceManager";
import { OPEN_CONCIERGE_EVENT } from "./conciergeEvents";
import { StatusPill } from "./TacticalCard";
import { useLatency } from "./LatencyProvider";
import type { ShopConfig } from "./config";

type Props = { concierge: ShopConfig["concierge"]; brand: string };

/**
 * Booking panel opened by "Speak with Chief Engineer" (and every "Book a consultation").
 * Sequence: AXIOM's greeting clip plays with sound (the click allows audio), then the
 * voice/text intake starts. If the clip can't play with sound, intake starts right away.
 */
export default function ConciergeSheet({ concierge, brand }: Props) {
  const { online } = useLatency();
  const [open, setOpen] = useState(false);
  const [intakeStarted, setIntakeStarted] = useState(false);
  const [greetingPlayed, setGreetingPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const intakeOpenedRef = useRef(false);

  const close = useCallback(() => {
    videoRef.current?.pause();
    setOpen(false);
  }, []);

  const startIntake = useCallback((afterGreeting: boolean) => {
    videoRef.current?.pause();
    setGreetingPlayed(afterGreeting);
    setIntakeStarted(true);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      intakeOpenedRef.current = false;
      setIntakeStarted(false);
      setGreetingPlayed(false);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONCIERGE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONCIERGE_EVENT, onOpen);
  }, []);

  // Play the greeting with sound as soon as the panel mounts (still within the click's activation window).
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.play().catch(() => startIntake(false));
    return () => {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {
        /* ignore */
      }
    };
  }, [open, startIntake]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  // The intake's own ✕ closes the whole panel.
  const onIntakeState = useCallback(
    (s: ConciergeState) => {
      if (s.open) intakeOpenedRef.current = true;
      else if (intakeOpenedRef.current) close();
    },
    [close],
  );

  const intakeConcierge = greetingPlayed ? { ...concierge, greeting: concierge.postGreeting } : concierge;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="concierge"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#030712]/70 backdrop-blur-sm sm:items-center sm:justify-end sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${concierge.name}, ${concierge.role}`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-2xl border border-cyan-500/30 bg-[#0b1220]/90 shadow-[0_0_44px_rgba(6,182,212,0.25)] backdrop-blur-xl sm:w-[420px] sm:rounded-2xl"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

            <div className="flex h-11 items-center justify-between border-b border-cyan-500/15 px-5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] font-bold tracking-widest text-red-400">CE</span>
                <span aria-hidden className="h-3 w-px bg-cyan-500/30" />
                <span className="font-mono text-[11px] tracking-[0.25em] text-slate-300 uppercase">Chief Engineer Line</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill online={online} />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="rounded-md px-2 py-1 text-slate-400 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* AXIOM identity + greeting clip */}
            <div className={`flex items-center px-5 pt-5 ${intakeStarted ? "gap-4" : "flex-col text-center"}`}>
              <motion.div
                layout
                className={`relative shrink-0 rounded-full ${intakeStarted ? "h-16 w-16" : "h-48 w-48"}`}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              >
                <span
                  aria-hidden
                  className={`absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,#22d3ee,#a855f7,#22d3ee,#a855f7,#22d3ee)] opacity-80 blur-[2px] ${
                    playing ? "animate-[spin_3s_linear_infinite]" : "animate-[spin_14s_linear_infinite]"
                  }`}
                />
                <span className="absolute inset-0 overflow-hidden rounded-full bg-[#030712] shadow-[0_0_0_2px_#030712]">
                  <img src={concierge.greetingVideo.poster} alt={concierge.avatarAlt} className="absolute inset-0 h-full w-full scale-[1.12] object-cover" />
                  <video
                    ref={videoRef}
                    className={`absolute inset-0 h-full w-full scale-[1.12] object-cover transition-opacity duration-300 ${
                      playing ? "opacity-100" : "opacity-0"
                    }`}
                    poster={concierge.greetingVideo.poster}
                    playsInline
                    preload="auto"
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onError={() => startIntake(false)}
                    onEnded={() => {
                      setPlaying(false);
                      startIntake(true);
                    }}
                  >
                    <source src={concierge.greetingVideo.src} type="video/mp4" />
                  </video>
                </span>
              </motion.div>
              <div className={intakeStarted ? "min-w-0" : "mt-4"}>
                <p className="font-mono text-[10px] tracking-[0.35em] text-[#00ffcc]/80 uppercase">
                  AI Assistant // {playing ? "Speaking" : online ? "Online" : "Reconnecting"}
                </p>
                <p className={`font-black tracking-[0.18em] text-slate-50 ${intakeStarted ? "text-xl" : "mt-1 text-2xl"}`}>
                  {concierge.name}
                </p>
                <p className="text-sm text-slate-400">
                  {concierge.role} · <span className="text-slate-300">{brand}</span>
                </p>
                {!intakeStarted && (
                  <button
                    type="button"
                    onClick={() => startIntake(true)}
                    className="mt-3 font-mono text-[10px] tracking-[0.25em] text-slate-500 uppercase hover:text-cyan-300"
                  >
                    Skip intro →
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 border-t border-cyan-500/15">
              {intakeStarted ? (
                <AiVoiceManager
                  concierge={intakeConcierge}
                  brand={brand}
                  framed={false}
                  openSignal={1}
                  onStateChange={onIntakeState}
                  launcher={() => null}
                />
              ) : (
                <p className="px-5 py-4 text-center text-xs text-slate-500">
                  Your booking starts right after {concierge.name}&apos;s intro.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
