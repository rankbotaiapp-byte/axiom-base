/** Timed overlay lines for `/media/Axiom_24_7 Booking for Contractors_720p_caption.mp4`. `at` is seconds from start. */
export type IntroCaptionCue = { at: number; text: string };

export const INTRO_CAPTION_CUES: readonly IntroCaptionCue[] = [
  { at: 0, text: "Hi. I’m Eric — welcome to Axiom." },
  { at: 4.8, text: "I built this so a plumbing shop never loses another after-hours call." },
  { at: 11.6, text: "The page answers, texts back, and books the job while you’re on a truck." },
  { at: 18.4, text: "Watch the Medford demo below — live capture, dispatch, and a $1 trial." },
  { at: 26.2, text: "Name Your Price: $1 today, then $150 a month on day 31." },
  { at: 33.0, text: "Go live for $1 below." },
];

export function captionAtTime(timeSec: number, cues: readonly IntroCaptionCue[] = INTRO_CAPTION_CUES): string {
  const t = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  let text = cues[0]?.text ?? "";
  for (const cue of cues) {
    if (t + 0.04 >= cue.at) text = cue.text;
    else break;
  }
  return text;
}
