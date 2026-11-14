import { uiAudioEnabled } from "../ui-audio.ts";
import type { CompanionPulse } from "./companion-archetypes.ts";

/** Heartbeat double-pulse for inbound lead lock. */
export const LEAD_CAPTURE_HAPTIC = [20, 50, 40, 50, 120] as const;
/** Weighted thud for Gear Guardian 1.5% settlement. */
export const STRIPE_SETTLEMENT_HAPTIC = 140;
export const VIDEO_BRUSH_LIGHT = [6, 25, 12, 25, 6] as const;
export const VIDEO_BRUSH_HEAVY = [35, 15, 50, 15, 90] as const;

const BRUSH_THROTTLE_MS = 180;

export type VideoBrushIntensity = "light" | "heavy";
export type TactileCue = "lead" | "stripe" | "brush";

export function clampStereoPan(pan: number): number {
  if (!Number.isFinite(pan)) return 0;
  return Math.max(-1, Math.min(1, pan));
}

export function panFromClientX(clientX: number, width = typeof window !== "undefined" ? window.innerWidth : 1): number {
  return clampStereoPan((clientX / Math.max(1, width)) * 2 - 1);
}

export function brushIntensityFromVelocity(pxPerMs: number): VideoBrushIntensity {
  return pxPerMs > 1.6 ? "heavy" : "light";
}

export function tactileCueForPulse(pulse: CompanionPulse): TactileCue | null {
  if (pulse === "emergency") return "lead";
  if (pulse === "trial") return "stripe";
  return null;
}

function motionQuiet() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Vibration API is optional */
  }
}

class AxiomTactileEngine {
  private audioContext: AudioContext | null = null;
  private armed = false;
  private lastBrush = 0;

  /** Resume Web Audio on the first pointer / key so later cues are not policy-blocked. */
  public primeOnGesture() {
    if (this.armed || typeof window === "undefined") return;
    this.armed = true;
    const wake = () => {
      this.initAudio();
      window.removeEventListener("pointerdown", wake, true);
      window.removeEventListener("keydown", wake, true);
    };
    window.addEventListener("pointerdown", wake, true);
    window.addEventListener("keydown", wake, true);
  }

  private initAudio() {
    if (!this.audioContext && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.audioContext = new AudioCtx();
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }
  }

  private audioLive() {
    return !motionQuiet() && uiAudioEnabled();
  }

  /** Inbound lead captured — heartbeat double-pulse + low mechanical hum. */
  public triggerLeadCapture() {
    if (typeof window === "undefined" || motionQuiet()) return;
    vibrate([...LEAD_CAPTURE_HAPTIC]);
    if (!this.audioLive()) return;
    this.playSynthTone(150, 0.15, "sine");
    this.playSynthTone(58, 0.42, "sawtooth", 0.07);
  }

  /** Stripe 1.5% Gear Guardian settlement — weighted single thud. */
  public triggerStripeSettlement() {
    if (typeof window === "undefined" || motionQuiet()) return;
    vibrate(STRIPE_SETTLEMENT_HAPTIC);
    if (!this.audioLive()) return;
    this.playSynthTone(65, 0.25, "triangle");
  }

  /** 3D video brush-by — sweeping haptic + HRTF pan. */
  public triggerVideoBrushBy(intensity: VideoBrushIntensity = "light", panPosition = 0) {
    if (typeof window === "undefined" || motionQuiet()) return;
    const now = performance.now();
    if (now - this.lastBrush < BRUSH_THROTTLE_MS) return;
    this.lastBrush = now;
    vibrate(intensity === "light" ? [...VIDEO_BRUSH_LIGHT] : [...VIDEO_BRUSH_HEAVY]);
    if (!this.audioLive()) return;
    this.playPannedNoise(panPosition, intensity === "heavy" ? 0.3 : 0.15);
  }

  public dispatchCue(cue: TactileCue, pan = 0) {
    if (cue === "lead") this.triggerLeadCapture();
    else if (cue === "stripe") this.triggerStripeSettlement();
    else this.triggerVideoBrushBy("light", pan);
  }

  private playSynthTone(frequency: number, duration: number, type: OscillatorType = "sine", peak = 0.2) {
    try {
      this.initAudio();
      if (!this.audioContext) return;
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(Math.max(0.0002, peak), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      /* Ignore audio policy blocks prior to user gesture */
    }
  }

  /** HRTF spatial woosh. pan -1 = far left, 1 = far right. */
  private playPannedNoise(pan: number, duration: number) {
    try {
      this.initAudio();
      if (!this.audioContext) return;
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 400;
      filter.Q.value = 1.1;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);

      const x = clampStereoPan(pan);
      if (ctx.createPanner) {
        const hrtf = ctx.createPanner();
        hrtf.panningModel = "HRTF";
        hrtf.distanceModel = "inverse";
        hrtf.refDistance = 1;
        hrtf.rolloffFactor = 1;
        if (hrtf.positionX) {
          hrtf.positionX.setValueAtTime(x, now);
          hrtf.positionY.setValueAtTime(0, now);
          hrtf.positionZ.setValueAtTime(-0.35, now);
        } else {
          hrtf.setPosition(x, 0, -0.35);
        }
        gain.connect(hrtf);
        hrtf.connect(ctx.destination);
      } else if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(x, now);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        gain.connect(ctx.destination);
      }

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      /* Fallback: keep UI alive if Web Audio graph fails */
    }
  }
}

export const axiomTactile = new AxiomTactileEngine();

export function isTactileFilmTarget(node: EventTarget | null): boolean {
  if (!(node instanceof Element)) return false;
  return Boolean(node.closest("[data-tactile-film], video, canvas, .cinematic-hero-canvas"));
}
