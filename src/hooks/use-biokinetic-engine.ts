import { useEffect, useRef, useState } from "react";
import { useSpring, type MotionValue } from "framer-motion";

/** Inclusive bounds for the Intent & Hesitation Index. */
export const IHI_MIN = 0;
export const IHI_MAX = 1;
export const IHI_DECISIVE_AT = 0.66;
export const IHI_HESITANT_AT = 0.34;

export const DOLLY_MIN = 1;
export const DOLLY_MAX = 1.16;
export const BLUR_MIN = 0;
export const BLUR_MAX = 10;

const NEUTRAL = 0.5;
const MAX_SPEED = 4000;
const MAX_ACCEL = 12000;

export type GazeDwell = {
  /** Seconds the gaze has stayed inside the current region. */
  dwellSec: number;
  /** 0 is a wandering look, 1 is a locked look. */
  stability: number;
};

export type BiokineticOptions = {
  /** False when permission is denied. Gaze is ignored and the fallback path runs. */
  cameraGranted?: boolean;
  /** Latest MediaPipe dwell. Read without rendering. Ignored on the fallback path. */
  gazeRef?: { readonly current: GazeDwell | null };
  reducedMotion?: boolean | null;
};

export type BiokineticEngine = {
  ihiScore: number;
  isDecisive: boolean;
  isHesitating: boolean;
  cameraDollyScale: MotionValue<number>;
  backdropBlurAmount: MotionValue<number>;
};

type PointerKin = {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  accel: number;
  reversal: boolean;
  decel: number;
};

type ScrollKin = {
  t: number;
  y: number;
  speed: number;
  decay: number;
};

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function clampUnit(value: number) {
  return Math.max(IHI_MIN, Math.min(IHI_MAX, finite(value, NEUTRAL)));
}

export function classifyIhi(score: number): Pick<BiokineticEngine, "ihiScore" | "isDecisive" | "isHesitating"> {
  const ihiScore = clampUnit(score);
  return {
    ihiScore,
    isDecisive: ihiScore >= IHI_DECISIVE_AT,
    isHesitating: ihiScore <= IHI_HESITANT_AT,
  };
}

export function dollyFromIhi(score: number) {
  const unit = clampUnit(score);
  return DOLLY_MIN + unit * (DOLLY_MAX - DOLLY_MIN);
}

export function blurFromIhi(score: number) {
  const unit = clampUnit(score);
  return BLUR_MIN + (1 - unit) * (BLUR_MAX - BLUR_MIN);
}

/** Second derivative of pointer travel, clamped so a spike cannot leave the unit interval. */
export function stepPointer(sample: { t: number; x: number; y: number }, prev: PointerKin | null): PointerKin {
  if (!prev || sample.t <= prev.t) {
    return { t: sample.t, x: sample.x, y: sample.y, vx: 0, vy: 0, speed: 0, accel: 0, reversal: false, decel: 0 };
  }
  const dt = Math.max(0.008, (sample.t - prev.t) / 1000);
  const vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (sample.x - prev.x) / dt));
  const vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (sample.y - prev.y) / dt));
  const speed = Math.hypot(vx, vy);
  const accel = Math.max(0, Math.min(MAX_ACCEL, Math.hypot((vx - prev.vx) / dt, (vy - prev.vy) / dt)));
  const reversal = prev.speed > 40 && speed > 40 && vx * prev.vx + vy * prev.vy < 0;
  const decel = Math.max(0, Math.min(MAX_ACCEL, (prev.speed - speed) / dt));
  return { t: sample.t, x: sample.x, y: sample.y, vx, vy, speed, accel, reversal, decel };
}

export function stepScroll(y: number, t: number, prev: ScrollKin | null): ScrollKin {
  if (!prev || t <= prev.t) return { t, y, speed: 0, decay: 0 };
  const dt = Math.max(0.008, (t - prev.t) / 1000);
  const speed = Math.max(0, Math.min(MAX_SPEED, Math.abs(y - prev.y) / dt));
  const decay = prev.speed > 1 ? Math.max(0, Math.min(1, 1 - speed / prev.speed)) : 0;
  return { t, y, speed, decay };
}

/** Pointer intent from acceleration. Reversals pull the score down; a clean stop pulls it up. */
export function pointerIntent(kin: PointerKin) {
  if (kin.decel > 280 && !kin.reversal) return clampUnit(0.64 + kin.decel / MAX_ACCEL);
  if (kin.reversal) return clampUnit(0.36 - kin.accel / MAX_ACCEL);
  if (kin.speed < 12) return NEUTRAL;
  return clampUnit(0.5 - Math.min(0.16, kin.accel / (MAX_ACCEL * 1.6)));
}

/** Scroll speed that is dying down reads as a decision. A lingering crawl reads as hesitation. */
export function scrollDecayScore(kin: ScrollKin) {
  if (kin.speed > 140 && kin.decay > 0.45) return clampUnit(0.72 + kin.decay * 0.28);
  if (kin.speed > 24 && kin.speed < 160 && kin.decay < 0.2) return 0.3;
  return NEUTRAL;
}

export function gazeIntent(gaze: GazeDwell) {
  const dwell = Math.max(0, Math.min(3, finite(gaze.dwellSec, 0)));
  const stability = Math.max(0, Math.min(1, finite(gaze.stability, 0)));
  if (dwell > 0.7 && stability > 0.65) return clampUnit(0.7 + dwell * 0.1);
  if (dwell > 0.25 && stability < 0.4) return 0.22;
  return NEUTRAL;
}

/**
 * Camera denied or a touch-only device: IHI comes only from scroll-speed decay
 * and pointer deceleration. Gaze and raw acceleration jitter are left out.
 */
export function fallbackIhi(scroll: ScrollKin, pointer: PointerKin) {
  const decelScore = pointer.decel > 200 ? clampUnit(0.58 + pointer.decel / MAX_ACCEL) : 0.42;
  return clampUnit(scrollDecayScore(scroll) * 0.55 + decelScore * 0.45);
}

export function blendIhi(pointer: number, gaze: number | null) {
  if (gaze == null) return clampUnit(pointer);
  return clampUnit(pointer * 0.5 + gaze * 0.5);
}

function touchOnlyDevice() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches;
}

/**
 * Tracks pointer acceleration and optional gaze dwell, then springs a camera
 * dolly and a backdrop blur. Listeners never block paint; denied cameras and
 * touch screens stay on the scroll and deceleration fallback.
 */
export function useBiokineticEngine(options: BiokineticOptions = {}): BiokineticEngine {
  const cameraDollyScale = useSpring(dollyFromIhi(NEUTRAL), { stiffness: 140, damping: 22, mass: 0.55 });
  const backdropBlurAmount = useSpring(blurFromIhi(NEUTRAL), { stiffness: 140, damping: 22, mass: 0.55 });
  const [band, setBand] = useState(() => classifyIhi(NEUTRAL));
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let dead = false;
    let raf = 0;
    let ema = NEUTRAL;
    let pointer: PointerKin | null = null;
    let scroll: ScrollKin = { t: 0, y: 0, speed: 0, decay: 0 };
    let queued: { t: number; x: number; y: number } | null = null;
    let queuedScroll: { t: number; y: number } | null = null;
    const coarse = touchOnlyDevice();

    const publish = (score: number) => {
      const next = classifyIhi(ema * 0.84 + clampUnit(score) * 0.16);
      ema = next.ihiScore;
      const dolly = dollyFromIhi(ema);
      const blur = blurFromIhi(ema);
      if (optionsRef.current.reducedMotion) {
        cameraDollyScale.jump(dolly);
        backdropBlurAmount.jump(blur);
      } else {
        cameraDollyScale.set(dolly);
        backdropBlurAmount.set(blur);
      }
      if (dead) return;
      setBand((prev) => {
        if (
          prev.isDecisive === next.isDecisive &&
          prev.isHesitating === next.isHesitating &&
          Math.abs(prev.ihiScore - next.ihiScore) < 0.035
        ) {
          return prev;
        }
        return next;
      });
    };

    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      if (queued) {
        pointer = stepPointer(queued, pointer);
        queued = null;
      } else if (pointer && performance.now() - pointer.t > 280) {
        pointer = {
          ...pointer,
          t: performance.now(),
          speed: pointer.speed * 0.82,
          accel: pointer.accel * 0.82,
          decel: pointer.decel * 0.82,
          reversal: false,
        };
      }
      if (queuedScroll) {
        scroll = stepScroll(queuedScroll.y, queuedScroll.t, scroll.t ? scroll : null);
        queuedScroll = null;
      }
      if (!pointer && scroll.t === 0) return;
      const kin = pointer ?? { t: 0, x: 0, y: 0, vx: 0, vy: 0, speed: 0, accel: 0, reversal: false, decel: 0 };
      const granted = optionsRef.current.cameraGranted !== false;
      const gaze = granted && !coarse ? optionsRef.current.gazeRef?.current ?? null : null;
      const score = !granted || coarse ? fallbackIhi(scroll, kin) : blendIhi(pointerIntent(kin), gaze ? gazeIntent(gaze) : null);
      publish(score);
    };

    const onPointer = (event: PointerEvent) => {
      queued = { t: performance.now(), x: event.clientX, y: event.clientY };
    };
    const onScroll = () => {
      queuedScroll = { t: performance.now(), y: window.scrollY };
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [backdropBlurAmount, cameraDollyScale]);

  return {
    ihiScore: band.ihiScore,
    isDecisive: band.isDecisive,
    isHesitating: band.isHesitating,
    cameraDollyScale,
    backdropBlurAmount,
  };
}
