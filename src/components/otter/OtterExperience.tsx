"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Hand, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { OTTER_CONFIG } from "@/lib/otter/config";
import { playDive, playPop } from "@/lib/otter/audio";
import { ActionDock } from "./ActionDock";
import { ConservationModal } from "./ConservationModal";
import { HudBezel } from "./HudBezel";
import { TelemetryPanel } from "./TelemetryPanel";
import { VideoBackdrop } from "./VideoBackdrop";
import { VoiceConcierge } from "./VoiceConcierge";
import { WaterFXCanvas, type WaterFXHandle } from "./WaterFXCanvas";

const DIVE_SEQUENCE: ReadonlyArray<{ at: number; status: string | null }> = [
  { at: 0, status: "DESCENDING // -4M" },
  { at: 900, status: "DEEP DIVE // -12M" },
  { at: 2200, status: "SURFACING // -3M" },
  { at: 3200, status: null },
];

export function OtterExperience() {
  const { brand, media, bookingUrl, vapi, telemetry, habitat, facts } = OTTER_CONFIG;

  const fxRef = useRef<WaterFXHandle>(null);
  const [popped, setPopped] = useState(0);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [diving, setDiving] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const soundRef = useRef(soundOn);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const handlePop = useCallback(() => {
    setPopped((n) => n + 1);
    if (soundRef.current) playPop();
  }, []);

  const handleDive = useCallback(() => {
    if (diving) return;
    setDiving(true);
    fxRef.current?.surge();
    if (soundRef.current) playDive();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([30, 60, 30]);

    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = DIVE_SEQUENCE.map(({ at, status }) =>
      window.setTimeout(() => {
        setStatusOverride(status);
        if (status === null) setDiving(false);
      }, at),
    );
  }, [diving]);

  const openSpecs = useCallback(() => setSpecsOpen(true), []);
  const closeSpecs = useCallback(() => setSpecsOpen(false), []);

  return (
    <main
      className="fixed inset-0 h-[100dvh] w-full select-none overflow-hidden bg-[#030712] text-white"
      style={{ touchAction: "none", WebkitTapHighlightColor: "transparent" }}
    >
      <VideoBackdrop src={media.video} poster={media.poster} />
      <WaterFXCanvas ref={fxRef} onPop={handlePop} />
      <HudBezel brand={brand.name} unitId={brand.unitId} />

      {/* Sound toggle */}
      <motion.button
        data-fx-ignore
        type="button"
        onClick={() => setSoundOn((s) => !s)}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Mute sound effects" : "Unmute sound effects"}
        className="absolute right-5 top-12 z-40 flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-slate-950/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/90 backdrop-blur-xl transition hover:border-cyan-300/70 hover:text-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:right-10 sm:top-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        {soundOn ? <Volume2 className="h-3 w-3" aria-hidden="true" /> : <VolumeX className="h-3 w-3" aria-hidden="true" />}
        SFX
      </motion.button>

      {/* HUD layer */}
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col px-5 pb-5 pt-16 sm:px-10 sm:pb-10 sm:pt-28">
        {/* Hero copy */}
        <motion.div
          className="max-w-xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400 sm:text-xs">
            Wildlife Preservation<span className="hidden sm:inline"> // Aquatic Adventures</span>
          </p>
          <h1 className="mt-2 bg-gradient-to-br from-white via-cyan-100 to-cyan-400 bg-clip-text text-[1.75rem] font-black uppercase leading-[0.95] tracking-tight text-transparent drop-shadow-[0_0_25px_rgba(34,211,238,0.35)] sm:text-5xl lg:text-6xl">
            Aqua Otter
            <br />
            Advocates
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed sm:mt-3 text-slate-300 sm:text-base">{brand.tagline}</p>

          <AnimatePresence>
            {popped === 0 ? (
              <motion.p
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200 backdrop-blur-md"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.3 } }}
                transition={{ delay: 2 }}
              >
                <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                  <Hand className="h-3 w-3" aria-hidden="true" />
                </motion.span>
                Tap or swipe the bubbles
              </motion.p>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* Bottom cluster — stacks on mobile, spreads on desktop */}
        <div className="mt-auto flex flex-col gap-2 sm:gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-end lg:gap-6">
          <div className="order-1 lg:absolute lg:right-10 lg:top-1/2 lg:-translate-y-1/2">
            <ActionDock onDive={handleDive} onSpecs={openSpecs} bookingUrl={bookingUrl} diving={diving} />
          </div>

          <div className="order-2 lg:order-none lg:justify-self-start">
            <TelemetryPanel readings={telemetry} bubblesPopped={popped} statusOverride={statusOverride} />
          </div>

          <div className="order-3 lg:order-none lg:w-[22rem] xl:w-[25rem]">
            <VoiceConcierge publicKey={vapi.publicKey} assistantId={vapi.assistantId} fallbackHref={bookingUrl} />
          </div>
        </div>
      </div>

      <ConservationModal open={specsOpen} onClose={closeSpecs} metrics={habitat} facts={facts} bookingUrl={bookingUrl} />
    </main>
  );
}
