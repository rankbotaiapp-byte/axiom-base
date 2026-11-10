/**
 * Synthesised flat-six engine (Web Audio, no samples).
 * Firing frequency of a 6-cylinder 4-stroke = rpm / 20 Hz.
 * Layers: detuned saw harmonics → waveshaper → resonant low-pass, plus
 * band-passed noise for intake/exhaust roar and crackle bursts on overrun.
 */

type AudioContextCtor = typeof AudioContext;

const IDLE_RPM = 950;
const REDLINE_RPM = 8900;

function makeDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

export class EngineAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private rpm = IDLE_RPM;
  private enabled = false;
  private readonly harmonics = [1, 1.5, 2, 3];

  get isEnabled() {
    return this.enabled;
  }

  get currentRpm() {
    return this.rpm;
  }

  private ensureGraph(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const w = window as Window & { webkitAudioContext?: AudioContextCtor };
    const Ctor: AudioContextCtor | undefined = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 6;
    master.connect(compressor).connect(ctx.destination);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDriveCurve(18);
    shaper.oversample = "2x";

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 6;
    filter.frequency.value = 320;
    shaper.connect(filter).connect(master);

    this.oscillators = this.harmonics.map((h, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sawtooth" : i === 3 ? "square" : "sawtooth";
      osc.frequency.value = (IDLE_RPM / 20) * h;
      osc.detune.value = (i - 1.5) * 7;
      const g = ctx.createGain();
      g.gain.value = [0.5, 0.22, 0.28, 0.08][i] ?? 0.1;
      osc.connect(g).connect(shaper);
      osc.start();
      return osc;
    });

    // Noise bed for roar + overrun crackle.
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 600;
    noiseFilter.Q.value = 0.9;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();

    this.ctx = ctx;
    this.master = master;
    this.filter = filter;
    this.noiseFilter = noiseFilter;
    this.noiseGain = noiseGain;
    this.noiseBuffer = buffer;
    return ctx;
  }

  /** Must be called from a user gesture (autoplay policy). */
  async enable(): Promise<boolean> {
    const ctx = this.ensureGraph();
    if (!ctx || !this.master) return false;
    if (ctx.state === "suspended") await ctx.resume();
    this.enabled = true;
    this.master.gain.setTargetAtTime(0.32, ctx.currentTime, 0.25);
    this.applyRpm(IDLE_RPM, ctx.currentTime, 0.2);
    return true;
  }

  disable() {
    if (!this.ctx || !this.master) return;
    this.enabled = false;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
  }

  private applyRpm(rpm: number, at: number, timeConstant: number) {
    if (!this.ctx || !this.filter || !this.noiseFilter || !this.noiseGain) return;
    this.rpm = rpm;
    const base = rpm / 20;
    this.oscillators.forEach((osc, i) => {
      osc.frequency.setTargetAtTime(base * (this.harmonics[i] ?? 1), at, timeConstant);
    });
    const load = (rpm - IDLE_RPM) / (REDLINE_RPM - IDLE_RPM);
    this.filter.frequency.setTargetAtTime(320 + load * 3600, at, timeConstant);
    this.noiseFilter.frequency.setTargetAtTime(500 + load * 2600, at, timeConstant);
    this.noiseGain.gain.setTargetAtTime(0.05 + load * 0.22, at, timeConstant);
  }

  private crackle(at: number, count: number) {
    if (!this.ctx || !this.master || !this.noiseBuffer) return;
    for (let i = 0; i < count; i++) {
      const t = at + i * (0.07 + Math.random() * 0.12);
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900 + Math.random() * 1400;
      bp.Q.value = 2.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.55 + Math.random() * 0.35, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06 + Math.random() * 0.05);
      src.connect(bp).connect(g).connect(this.master);
      src.start(t, Math.random() * 1.5, 0.15);
    }
  }

  /** Full launch-control rev: build → hold on the limiter → drop with overrun pops. */
  async rev(): Promise<void> {
    if (!this.enabled) {
      const ok = await this.enable();
      if (!ok) return;
    }
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    this.applyRpm(4200, now, 0.08); // launch-control hold
    this.applyRpm(REDLINE_RPM, now + 0.55, 0.22);
    // Limiter bounce.
    for (let i = 0; i < 4; i++) {
      this.applyRpm(REDLINE_RPM - 650, now + 1.25 + i * 0.09, 0.02);
      this.applyRpm(REDLINE_RPM, now + 1.3 + i * 0.09, 0.02);
    }
    this.applyRpm(IDLE_RPM, now + 1.75, 0.45);
    this.crackle(now + 1.8, 7);
    window.setTimeout(() => {
      this.rpm = IDLE_RPM;
    }, 3200);
  }

  dispose() {
    this.oscillators.forEach((o) => o.stop());
    this.oscillators = [];
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.enabled = false;
  }
}
