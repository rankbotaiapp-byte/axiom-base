/** Seconds cut from the tail so CapCut / export watermarks never draw. */
export const LOOP_TAIL_TRIM_SEC = 1.75;

/** Need a little body after the trim, otherwise a 2s clip would vanish. */
const MIN_PLAYABLE_AFTER_TRIM = 0.35;

export function loopTailCutTime(duration: number, trimSec = LOOP_TAIL_TRIM_SEC): number | null {
  if (!Number.isFinite(duration) || duration <= trimSec + MIN_PLAYABLE_AFTER_TRIM) return null;
  return duration - trimSec;
}

export type LoopTailTrimOptions = {
  trimSec?: number;
  /** Default true. When false, playback holds at the cut instead of rewinding. */
  loop?: boolean;
  /** Playlist: fire once at the cut instead of rewinding this clip. */
  onAdvance?: () => void;
};

const advanced = new WeakSet<HTMLVideoElement>();

export function applyLoopTailTrim(video: HTMLVideoElement, options: LoopTailTrimOptions = {}): boolean {
  if (video.seeking) return false;
  const cut = loopTailCutTime(video.duration, options.trimSec);
  if (cut == null || video.currentTime < cut) return false;
  if (options.onAdvance) {
    if (advanced.has(video)) return false;
    advanced.add(video);
    options.onAdvance();
    return true;
  }
  if (options.loop === false) {
    video.pause();
    if (video.currentTime > cut) video.currentTime = cut;
    return true;
  }
  video.currentTime = 0;
  return true;
}

export function attachLoopTailTrim(video: HTMLVideoElement, options: LoopTailTrimOptions = {}): () => void {
  const onTime = () => {
    applyLoopTailTrim(video, options);
  };
  const onMeta = () => {
    advanced.delete(video);
  };
  video.addEventListener("timeupdate", onTime);
  video.addEventListener("loadedmetadata", onMeta);
  video.addEventListener("emptied", onMeta);
  return () => {
    video.removeEventListener("timeupdate", onTime);
    video.removeEventListener("loadedmetadata", onMeta);
    video.removeEventListener("emptied", onMeta);
    advanced.delete(video);
  };
}
