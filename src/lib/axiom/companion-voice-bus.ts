/**
 * Shared companion voice bus: speechSynthesis + optional MediaStream / HTMLMediaElement
 * feed a Web Audio AnalyserNode so UI can react to amplitude/FFT in real time.
 */

export type CompanionVoiceSource = "speech" | "media" | "stream" | "idle";

type VoiceListener = (state: {
  speaking: boolean;
  intensityHint: number;
  source: CompanionVoiceSource;
}) => void;

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let speechGain: GainNode | null = null;
let speechNoise: AudioBufferSourceNode | null = null;
let speechOsc: OscillatorNode | null = null;
let mediaElementSource: MediaElementAudioSourceNode | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
let speaking = false;
let intensityHint = 0;
let source: CompanionVoiceSource = "idle";
const listeners = new Set<VoiceListener>();

function Ctor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

function ensureGraph(): { ctx: AudioContext; analyser: AnalyserNode } | null {
  const AudioCtor = Ctor();
  if (!AudioCtor) return null;
  if (!ctx) ctx = new AudioCtor();
  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    // Tap-only — do not route analysis into speakers (speech proxy stays silent).
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, analyser };
}

function emit() {
  const payload = { speaking, intensityHint, source };
  for (const listener of listeners) listener(payload);
}

function stopSpeechProxy() {
  try {
    speechNoise?.stop();
  } catch {
    /* already stopped */
  }
  try {
    speechOsc?.stop();
  } catch {
    /* already stopped */
  }
  speechNoise?.disconnect();
  speechOsc?.disconnect();
  speechGain?.disconnect();
  speechNoise = null;
  speechOsc = null;
  speechGain = null;
}

function startSpeechProxy() {
  const graph = ensureGraph();
  if (!graph) return;
  stopSpeechProxy();
  const { ctx: audio, analyser: node } = graph;
  const now = audio.currentTime;

  speechGain = audio.createGain();
  speechGain.gain.setValueAtTime(0.0001, now);
  speechGain.gain.exponentialRampToValueAtTime(0.045, now + 0.05);
  speechGain.connect(node);

  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 2), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.55;
  speechNoise = audio.createBufferSource();
  speechNoise.buffer = buffer;
  speechNoise.loop = true;
  const band = audio.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 980;
  band.Q.value = 1.6;
  speechNoise.connect(band);
  band.connect(speechGain);
  speechNoise.start(now);

  speechOsc = audio.createOscillator();
  speechOsc.type = "triangle";
  speechOsc.frequency.value = 165;
  const oscGain = audio.createGain();
  oscGain.gain.value = 0.35;
  speechOsc.connect(oscGain);
  oscGain.connect(speechGain);
  speechOsc.start(now);
}

/** Resume audio graph on a user gesture so later speech analysis is not blocked. */
export function primeCompanionVoiceAudio(): void {
  ensureGraph();
}

export function getCompanionAnalyser(): AnalyserNode | null {
  return ensureGraph()?.analyser ?? null;
}

export function subscribeCompanionVoice(listener: VoiceListener): () => void {
  listeners.add(listener);
  listener({ speaking, intensityHint, source });
  return () => listeners.delete(listener);
}

export function companionVoiceBeginSpeech(): void {
  speaking = true;
  source = "speech";
  intensityHint = 0.35;
  startSpeechProxy();
  emit();
}

export function companionVoiceSpeechBoundary(charIndex = 0): void {
  if (!speaking) return;
  intensityHint = Math.min(1, 0.45 + ((charIndex % 17) / 17) * 0.55);
  if (speechGain && ctx) {
    const now = ctx.currentTime;
    speechGain.gain.cancelScheduledValues(now);
    speechGain.gain.setValueAtTime(Math.max(0.02, speechGain.gain.value), now);
    speechGain.gain.exponentialRampToValueAtTime(0.08 + intensityHint * 0.06, now + 0.02);
    speechGain.gain.exponentialRampToValueAtTime(0.03, now + 0.14);
  }
  emit();
}

export function companionVoiceEndSpeech(): void {
  speaking = false;
  intensityHint = 0;
  source = "idle";
  if (speechGain && ctx) {
    const now = ctx.currentTime;
    speechGain.gain.cancelScheduledValues(now);
    speechGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  }
  window.setTimeout(() => stopSpeechProxy(), 160);
  emit();
}

export function companionVoiceIsSpeaking(): boolean {
  return speaking || (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking);
}

export function attachCompanionMediaElement(el: HTMLMediaElement | null): void {
  const graph = ensureGraph();
  if (!graph) return;
  mediaElementSource?.disconnect();
  mediaElementSource = null;
  if (!el) {
    if (source === "media") {
      speaking = false;
      source = "idle";
      emit();
    }
    return;
  }
  try {
    mediaElementSource = graph.ctx.createMediaElementSource(el);
    mediaElementSource.connect(graph.analyser);
    mediaElementSource.connect(graph.ctx.destination);
    const sync = () => {
      speaking = !el.paused && !el.ended;
      source = speaking ? "media" : "idle";
      intensityHint = speaking ? 0.4 : 0;
      emit();
    };
    el.addEventListener("play", sync);
    el.addEventListener("pause", sync);
    el.addEventListener("ended", sync);
    sync();
  } catch {
    /* Element already connected elsewhere — analyser still usable via stream path. */
  }
}

export function attachCompanionMediaStream(stream: MediaStream | null): void {
  const graph = ensureGraph();
  if (!graph) return;
  mediaStreamSource?.disconnect();
  mediaStreamSource = null;
  if (!stream) {
    if (source === "stream") {
      speaking = false;
      source = "idle";
      emit();
    }
    return;
  }
  mediaStreamSource = graph.ctx.createMediaStreamSource(stream);
  mediaStreamSource.connect(graph.analyser);
  speaking = true;
  source = "stream";
  intensityHint = 0.4;
  emit();
}

export function readCompanionAnalyserIntensity(): number {
  const node = getCompanionAnalyser();
  if (!node) return intensityHint;
  const bins = new Uint8Array(node.frequencyBinCount);
  node.getByteFrequencyData(bins);
  let sum = 0;
  let bass = 0;
  const bassEnd = Math.max(2, Math.floor(bins.length * 0.18));
  for (let i = 0; i < bins.length; i += 1) {
    sum += bins[i] ?? 0;
    if (i < bassEnd) bass += bins[i] ?? 0;
  }
  const avg = sum / (bins.length * 255);
  const bassAvg = bass / (bassEnd * 255);
  const mixed = Math.min(1, avg * 1.35 + bassAvg * 0.85);
  return Math.max(mixed, speaking ? intensityHint * 0.55 : 0);
}
