import { COMPANION_HAPTICS, type CompanionPulse } from "./companion-archetypes.ts";

/** Browser speakerphone + radio resonance + haptic pulse. Safe no-ops off the client. */

let radioCtx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!radioCtx) radioCtx = new Ctor();
  return radioCtx;
}

export function companionHaptic(pattern: number | number[] = [28, 40, 28]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/** Short band-passed burst so speech reads as a radio handset, not a laptop speaker. */
export function companionRadioBurst(intensity = 0.07): boolean {
  const ctx = audioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.22), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.45));
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1750;
    filter.Q.value = 2.4;
    const tone = ctx.createOscillator();
    tone.type = "square";
    tone.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.02, intensity), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    tone.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    tone.start(now);
    noise.stop(now + 0.22);
    tone.stop(now + 0.12);
    return true;
  } catch {
    return false;
  }
}

export function companionSpeak(text: string): boolean {
  const line = text.replace(/\s+/g, " ").trim().slice(0, 280);
  if (!line || typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    window.speechSynthesis.cancel();
    companionRadioBurst();
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.rate = 0.96;
    utterance.pitch = 0.78;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const radio = voices.find((voice) => /en[-_]US/i.test(voice.lang) && /male|david|mark|fred/i.test(voice.name))
      ?? voices.find((voice) => /en/i.test(voice.lang));
    if (radio) utterance.voice = radio;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function companionPulseSpeak(text: string, pulse?: CompanionPulse): void {
  companionHaptic(pulse ? COMPANION_HAPTICS[pulse] : [28, 40, 28]);
  companionSpeak(text);
}
