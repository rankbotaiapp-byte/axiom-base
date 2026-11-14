"use client";

import { useEffect, useRef, useState } from "react";
import { Droplets, Pipette } from "lucide-react";
import { PLUMBERS_DRAIN_SRC } from "@/lib/axiom-landing/storefront-films";
import {
  PLUMBING_SEQUENCE,
  plumbingBeatFromFilm,
  plumbingTelemetryForBeat,
  type PlumbingBeat,
} from "@/lib/axiom/plumbing-sequence";
import { TelemetryLog } from "@/components/telemetry-log";
import { RippleButton } from "./RippleButton";
import { useFunnel } from "./FunnelProvider";
import { CinematicStage } from "./CinematicStage";

export type DiagnosticMode = "idle" | "clog" | "flush";

function loopWindow(mode: DiagnosticMode): { start: number; end: number } | null {
  if (mode === "clog") return { start: 0.35, end: Math.max(1.2, PLUMBING_SEQUENCE.jetSec - 0.2) };
  if (mode === "flush") return { start: PLUMBING_SEQUENCE.jetSec, end: PLUMBING_SEQUENCE.dispatchSec };
  return null;
}

function statusCopy(mode: DiagnosticMode, beat: PlumbingBeat) {
  if (mode === "clog") return { kicker: "Clog simulated", title: "Standing water in the main." };
  if (mode === "flush") {
    if (beat === "clear" || beat === "dispatch") return { kicker: "Line restored", title: "Hydro-jet complete. Book the next job." };
    return { kicker: "Hydro-jet active", title: "3,000 psi moving the debris." };
  }
  return { kicker: "Pipeline diagnostic", title: "Run the drain before the after-hours call is lost." };
}

export function HeroPipelineDiagnostic({
  videoSrc = PLUMBERS_DRAIN_SRC,
  className = "",
}: {
  videoSrc?: string;
  className?: string;
}) {
  const { startOnboarding } = useFunnel();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<DiagnosticMode>("idle");
  const [beat, setBeat] = useState<PlumbingBeat>("locate");
  const copy = statusCopy(mode, beat);
  const telemetry = plumbingTelemetryForBeat(mode === "idle" ? beat : mode === "clog" ? "locate" : beat);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const windowed = loopWindow(mode);
    if (windowed) {
      node.currentTime = windowed.start;
    }
    void node.play().catch(() => {});
  }, [mode]);

  function runMode(next: DiagnosticMode) {
    setMode(next);
    setBeat(next === "flush" ? "jet" : "locate");
  }

  return (
    <CinematicStage id="diagnostic" className={className}>
      <div className="am-dark-stage">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-label="Plumbing drain diagnostic loop"
          onTimeUpdate={(event) => {
            const node = event.currentTarget;
            const nextBeat = plumbingBeatFromFilm(node.currentTime);
            setBeat((current) => (current === nextBeat ? current : nextBeat));
            const windowed = loopWindow(mode);
            if (windowed && node.currentTime >= windowed.end) {
              node.currentTime = windowed.start;
            }
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end gap-6 px-5 py-10 sm:px-8 sm:py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-volt">{copy.kicker}</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-5xl">{copy.title}</h2>
            <p className="mt-4 max-w-xl text-base text-mist sm:text-lg">
              Camera the line, simulate the clog, then hydro-jet it clear — the same state machine that books the emergency.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              aria-pressed={mode === "clog"}
              onClick={() => runMode("clog")}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold uppercase tracking-[0.12em] ${
                mode === "clog"
                  ? "border-ember bg-ember text-ink"
                  : "border-white/20 bg-void/70 text-fg hover:border-ember/70"
              }`}
            >
              <Pipette className="h-4 w-4" aria-hidden /> SIMULATE CLOG
            </button>
            <button
              type="button"
              aria-pressed={mode === "flush"}
              onClick={() => runMode("flush")}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold uppercase tracking-[0.12em] ${
                mode === "flush"
                  ? "border-volt bg-volt text-ink"
                  : "border-white/20 bg-void/70 text-fg hover:border-volt/70"
              }`}
            >
              <Droplets className="h-4 w-4" aria-hidden /> RUN HYDRO-JET FLUSH
            </button>
          </div>

          <div className="max-w-md rounded-2xl border border-white/10 bg-void/80 p-4 backdrop-blur-md">
            <TelemetryLog dataset={telemetry} />
          </div>

          <RippleButton variant="primary" className="w-fit text-base" onClick={() => startOnboarding({ plan: "free-setup" })}>
            Start Your Free Setup
          </RippleButton>
        </div>
      </div>
    </CinematicStage>
  );
}

export default HeroPipelineDiagnostic;
