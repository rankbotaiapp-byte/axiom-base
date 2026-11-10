/**
 * Synthesized muzzle report + digital glitch, generated with the Web Audio API.
 * No audio files to ship, and nothing plays until the user presses the button
 * (browsers block audio without a gesture).
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(ac: AudioContext, seconds: number): AudioBuffer {
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function shot(ac: AudioContext, at: number, master: GainNode) {
  // Crack: filtered noise with a fast decay
  const crack = ac.createBufferSource();
  crack.buffer = noiseBuffer(ac, 0.35);
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  const crackGain = ac.createGain();
  crackGain.gain.setValueAtTime(0.9, at);
  crackGain.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
  crack.connect(hp).connect(crackGain).connect(master);
  crack.start(at);
  crack.stop(at + 0.35);

  // Thump: pitch-dropping sine for body
  const thump = ac.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(140, at);
  thump.frequency.exponentialRampToValueAtTime(38, at + 0.22);
  const thumpGain = ac.createGain();
  thumpGain.gain.setValueAtTime(1, at);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
  thump.connect(thumpGain).connect(master);
  thump.start(at);
  thump.stop(at + 0.32);
}

function glitch(ac: AudioContext, at: number, master: GainNode) {
  const osc = ac.createOscillator();
  osc.type = "square";
  const g = ac.createGain();
  g.gain.value = 0;
  osc.connect(g).connect(master);
  // Stuttering random-pitch blips
  for (let i = 0; i < 14; i++) {
    const t = at + i * 0.028;
    osc.frequency.setValueAtTime(200 + Math.random() * 2400, t);
    g.gain.setValueAtTime(i % 2 === 0 ? 0.12 : 0, t);
  }
  g.gain.setValueAtTime(0, at + 14 * 0.028);
  osc.start(at);
  osc.stop(at + 0.45);
}

export function playFireTest(volume = 0.5): void {
  const ac = getContext();
  if (!ac) return;
  const master = ac.createGain();
  master.gain.value = volume;
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);

  const now = ac.currentTime + 0.01;
  shot(ac, now, master);
  shot(ac, now + 0.11, master);
  shot(ac, now + 0.22, master);
  glitch(ac, now + 0.3, master);
}
