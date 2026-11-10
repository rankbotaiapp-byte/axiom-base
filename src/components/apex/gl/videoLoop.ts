import { videoCrop, type VideoCropConfig } from "../config";

/**
 * Seamless loop driver: two decoders of the same clip, cross-dissolved over the
 * last `fade` seconds of the loop window so the camera move never "jumps".
 * `weightB` is the blend weight of video B (0 → only A, 1 → only B).
 */
export class CrossfadeVideoLoop {
  readonly a: HTMLVideoElement;
  readonly b: HTMLVideoElement;
  weightB = 0;

  private active: "a" | "b" = "a";
  private fading = false;
  private readonly start: number;
  private readonly end: number;
  private readonly fade: number;

  constructor(src: string, loop: { start: number; end: number } = videoCrop.loop, fade = 0.55) {
    this.start = loop.start;
    this.end = loop.end;
    this.fade = fade;
    this.a = CrossfadeVideoLoop.createVideo(src);
    this.b = CrossfadeVideoLoop.createVideo(src);
    this.a.addEventListener("loadedmetadata", () => this.seek(this.a, this.start), { once: true });
    this.b.addEventListener("loadedmetadata", () => this.seek(this.b, this.start), { once: true });
  }

  static createVideo(src: string): HTMLVideoElement {
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.loop = false;
    return v;
  }

  private seek(v: HTMLVideoElement, t: number) {
    try {
      v.currentTime = t;
    } catch {
      /* metadata not ready — the loadedmetadata handler retries */
    }
  }

  private get current() {
    return this.active === "a" ? this.a : this.b;
  }

  private get other() {
    return this.active === "a" ? this.b : this.a;
  }

  /** Resolves true when playback started (false if autoplay was blocked). */
  async play(): Promise<boolean> {
    try {
      await this.current.play();
      return true;
    } catch {
      return false;
    }
  }

  setPlaybackRate(rate: number) {
    this.a.playbackRate = rate;
    this.b.playbackRate = rate;
  }

  /** Call once per animation frame. */
  update() {
    const cur = this.current;
    const fadeStart = this.end - this.fade;

    if (!this.fading && (cur.currentTime >= fadeStart || cur.ended)) {
      this.fading = true;
      this.seek(this.other, this.start);
      void this.other.play().catch(() => undefined);
    }

    let progress = 0;
    if (this.fading) {
      progress = Math.min(1, Math.max(0, (cur.currentTime - fadeStart) / this.fade));
      if (progress >= 1 || cur.ended) {
        cur.pause();
        this.active = this.active === "a" ? "b" : "a";
        this.fading = false;
        progress = 0;
      }
    }

    const towardsOther = progress * progress * (3 - 2 * progress);
    this.weightB = this.active === "a" ? towardsOther : 1 - towardsOther;
  }

  dispose() {
    for (const v of [this.a, this.b]) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
  }
}

export interface CoverWindow {
  ox: number;
  oy: number;
  fx: number;
  fy: number;
}

/**
 * Fit for the crop window: a log-space blend between object-fit "contain" and
 * "cover" (the garage is pure black, so any uncovered band is feathered into
 * black by the shader). The car is anchored at `screenAnchor` so the exhaust
 * flames clear the bottom HUD. Returns the visible window in crop-normalised
 * coordinates (y from the top); values outside 0–1 render as black.
 */
export function computeCoverWindow(
  viewAspect: number,
  lean: { x: number; y: number },
  zoom: number,
  config: VideoCropConfig = videoCrop,
): CoverWindow {
  const cropAspect = config.crop.w / config.crop.h;
  const coverX = viewAspect > cropAspect ? 1 : viewAspect / cropAspect;
  const coverY = viewAspect > cropAspect ? cropAspect / viewAspect : 1;
  const containX = viewAspect > cropAspect ? viewAspect / cropAspect : 1;
  const containY = viewAspect > cropAspect ? 1 : cropAspect / viewAspect;

  // Portrait screens lean further toward "contain" so the whole car stays in shot.
  const k = viewAspect < 1 ? config.fit.portrait : config.fit.landscape;
  const slack = 1.04 * zoom; // parallax headroom
  const frame = viewAspect < 1 ? config.frame.portrait : config.frame.landscape;
  const fx = (Math.pow(containX, 1 - k) * Math.pow(coverX, k) * frame) / slack;
  const fy = (Math.pow(containY, 1 - k) * Math.pow(coverY, k) * frame) / slack;

  const anchor = viewAspect < 1 ? config.screenAnchor.portrait : config.screenAnchor.landscape;
  const rawX = config.focal.x - fx * anchor.x + lean.x * fx * 0.035;
  const rawY = config.focal.y - fy * anchor.y - lean.y * fy * 0.03;
  // A "cover" axis (f < 1) must stay inside the clip; a letterboxed axis floats freely in the black.
  const clampAxis = (v: number, f: number) => (f < 1 ? Math.min(Math.max(v, 0), 1 - f) : v);
  return { ox: clampAxis(rawX, fx), oy: clampAxis(rawY, fy), fx, fy };
}

/** Converts a source-pixel point to NDC for the given cover window. */
export function sourcePointToNdc(
  point: { x: number; y: number },
  win: CoverWindow,
  config: VideoCropConfig = videoCrop,
): { x: number; y: number } {
  const cx = (point.x - config.crop.x) / config.crop.w;
  const cy = (point.y - config.crop.y) / config.crop.h;
  const sx = (cx - win.ox) / win.fx;
  const sy = (cy - win.oy) / win.fy;
  return { x: sx * 2 - 1, y: 1 - sy * 2 };
}
