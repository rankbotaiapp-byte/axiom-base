/**
 * Synthesized audio cues via Web Audio — zero asset downloads.
 * The AudioContext is created lazily on the first user gesture (browser autoplay rules).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getContext(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return master ? { ctx, master } : null;
}

let lastPop = 0;

/** Short, pitched "bloop" — rate-limited so a fast swipe doesn't clip. */
export function playPop(): void {
  const audio = getContext();
  if (!audio) return;
  const { ctx: c, master: out } = audio;
  const now = c.currentTime;
  if (now - lastPop < 0.035) return;
  lastPop = now;

  const osc = c.createOscillator();
  const gain = c.createGain();
  const base = 520 + Math.random() * 380;
  osc.type = "sine";
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 2.4, now + 0.06);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain).connect(out);
  osc.start(now);
  osc.stop(now + 0.14);
}

/** Deep submersion sweep: filtered noise wash + falling sub tone. */
export function playDive(): void {
  const audio = getContext();
  if (!audio) return;
  const { ctx: c, master: out } = audio;
  const now = c.currentTime;
  const duration = 1.8;

  // Noise wash
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + duration);
  filter.Q.value = 6;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.6, now + 0.12);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  noise.connect(filter).connect(noiseGain).connect(out);
  noise.start(now);
  noise.stop(now + duration);

  // Sub tone
  const sub = c.createOscillator();
  const subGain = c.createGain();
  sub.type = "triangle";
  sub.frequency.setValueAtTime(220, now);
  sub.frequency.exponentialRampToValueAtTime(48, now + duration);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  sub.connect(subGain).connect(out);
  sub.start(now);
  sub.stop(now + duration);

  // Bubble chatter trailing the dive
  for (let i = 0; i < 9; i++) {
    window.setTimeout(playPop, 120 + i * 90 + Math.random() * 60);
  }
}
