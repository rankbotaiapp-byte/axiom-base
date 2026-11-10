import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  PLUMBING_DIAGNOSTIC_SRC,
  PLUMBING_DIAGNOSTIC_SRC_FALLBACK,
} from "@/lib/axiom-landing/storefront-films";
import { plumbingBeatFromFilm, plumbingTelemetryForBeat, type PlumbingBeat } from "@/lib/axiom/plumbing-sequence";
import { TelemetryLog } from "@/components/telemetry-log";

const SRC_CHAIN = [PLUMBING_DIAGNOSTIC_SRC, PLUMBING_DIAGNOSTIC_SRC_FALLBACK] as const;

/** System-check film + live locate → jet → clear → dispatch readouts. */
export function PlumbingDiagnosticStage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [srcIndex, setSrcIndex] = useState(0);
  const [sound, setSound] = useState(false);
  const [beat, setBeat] = useState<PlumbingBeat>("locate");
  const src = SRC_CHAIN[Math.min(srcIndex, SRC_CHAIN.length - 1)]!;

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const greetOpen = Boolean(document.querySelector(".founder-stage[data-expanded]"));
    node.muted = !sound || greetOpen;
    if (sound && !greetOpen) {
      void node.play().catch(() => {
        node.muted = true;
        setSound(false);
      });
    }
  }, [sound, src]);

  function toggleSound() {
    setSound((on) => !on);
  }

  return (
    <section id="diagnostic" className="pl-section bg-void">
      <div className="pl-section-head">
        <p className="pl-kicker">System check</p>
        <h2 className="pl-h2">Automated line diagnostic.</h2>
        <p className="pl-lede">
          PSI holds, the camera finds the clog, then the jet clears the main — the same loop that books the after-hours
          job while the crew is still on the previous call.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
        <div className="relative aspect-video w-full overflow-hidden bg-void">
          <video
            ref={videoRef}
            key={src}
            className="absolute inset-0 h-full w-full object-cover"
            src={src}
            autoPlay
            loop
            muted={!sound}
            playsInline
            preload="auto"
            aria-label="Plumbing diagnostic telemetry loop"
            onTimeUpdate={(event) => {
              const next = plumbingBeatFromFilm(event.currentTarget.currentTime);
              setBeat((current) => (current === next ? current : next));
            }}
            onError={() => setSrcIndex((i) => Math.min(i + 1, SRC_CHAIN.length - 1))}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/40" />
          <div className="absolute bottom-4 left-4 right-4 z-[2] max-w-md sm:bottom-6 sm:left-6">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 shadow-2xl backdrop-blur-xl">
              <TelemetryLog dataset={plumbingTelemetryForBeat(beat)} />
            </div>
          </div>
          <button
            type="button"
            className="absolute right-4 top-4 z-[3] inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/70 px-4 text-sm font-semibold text-fg backdrop-blur-xl"
            aria-pressed={sound}
            aria-label={sound ? "Mute diagnostic voiceover" : "Play diagnostic voiceover"}
            onClick={toggleSound}
          >
            {sound ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
            {sound ? "Sound on" : "Tap for sound"}
          </button>
        </div>
      </div>
    </section>
  );
}
