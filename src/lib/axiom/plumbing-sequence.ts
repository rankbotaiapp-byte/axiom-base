/** Timed drain-hero beats that drive the plumbing telemetry HUD. */
export const PLUMBING_DRAIN_SRC = "/media/plumbers-outreach-hero-animation.mp4";

export const PLUMBING_SEQUENCE = {
  /** Camera finds the clog / camera snake in the line. */
  jetSec: 6.4,
  /** Line clears; water runs. */
  clearSec: 13.2,
  /** Dispatch / booked overlay. */
  dispatchSec: 19.8,
} as const;

export type PlumbingBeat = "locate" | "jet" | "clear" | "dispatch";

export function isPlumbingDrainFilm(src: string | undefined | null): boolean {
  if (!src) return false;
  return /plumbers-outreach-hero-animation(\.mp4)+$|pplubers-outreach-hero-animation(\.mp4)+$|plumbers-hero-animation(\.mp4)+$/i.test(
    src.split("?")[0] ?? "",
  );
}

export function plumbingBeatFromFilm(filmSec: number): PlumbingBeat {
  if (filmSec >= PLUMBING_SEQUENCE.dispatchSec) return "dispatch";
  if (filmSec >= PLUMBING_SEQUENCE.clearSec) return "clear";
  if (filmSec >= PLUMBING_SEQUENCE.jetSec) return "jet";
  return "locate";
}

const LINES: Record<PlumbingBeat, readonly string[]> = {
  locate: [
    "CAM  snake in the main — locating the clog",
    "SCOPE  18 ft · standing water in the trap",
    "CREW  drain tech staged at the truck",
  ],
  jet: [
    "JET  hydro line at 3,000 psi",
    "PSI  working pressure holds at 3,000",
    "FLOW  debris moving toward the stack",
    "LINK  homeowner on the missed-call loop",
  ],
  clear: [
    "CLEAR  line restored · camera confirm",
    "PROOF  before/after stills queued",
    "SMS  “we’re wrapping — invoice in 2 min”",
  ],
  dispatch: [
    "BOOKED  next emergency in the same zip",
    "ROUTE  tech 2 rolling from the shop",
    "DESK  Axiom logged the job without a callback",
  ],
};

export function plumbingTelemetryForBeat(beat: PlumbingBeat): readonly string[] {
  return LINES[beat];
}
