const STORAGE_KEY = "axiom:ui-audio";

let ctx: AudioContext | null = null;
let enabled = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function uiAudioEnabled() {
  return enabled;
}

export function subscribeUiAudio(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* private mode */
  }
}

export function readStoredUiAudio() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

async function unlock() {
  const Ctor = window.AudioContext;
  if (!Ctor) return;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") await ctx.resume();
}

export async function setUiAudio(on: boolean) {
  enabled = on;
  persist(on);
  emit();
  if (on) await unlock();
}

function tone(duration: number, peak: number) {
  if (!enabled || !ctx) return null;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(ctx.destination);
  return { gain, now };
}

function motionQuiet() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function playUiClick() {
  if (motionQuiet()) return;
  const bus = tone(0.07, 0.04);
  if (!bus || !ctx) return;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(780, bus.now);
  osc.frequency.exponentialRampToValueAtTime(240, bus.now + 0.06);
  osc.connect(bus.gain);
  osc.start(bus.now);
  osc.stop(bus.now + 0.08);
}

export function playUiHover() {
  if (motionQuiet()) return;
  const bus = tone(0.045, 0.018);
  if (!bus || !ctx) return;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, bus.now);
  osc.frequency.exponentialRampToValueAtTime(690, bus.now + 0.04);
  osc.connect(bus.gain);
  osc.start(bus.now);
  osc.stop(bus.now + 0.05);
}
