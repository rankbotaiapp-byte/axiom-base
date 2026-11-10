/**
 * WaterFXEngine — a single-canvas renderer for:
 *   • floating, poppable bubbles (tap or swipe through them)
 *   • cursor / touch-drag ripples with splash micro-particles
 *   • the START DIVE particle surge
 *
 * One canvas + one rAF loop + pre-rendered sprites keeps it at 60fps on mid-range phones.
 * No React in here — the component owns lifecycle, the engine owns pixels.
 */

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  phase: number;
  wobble: number;
  alpha: number;
  surge: boolean;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  speed: number;
  width: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface WaterFXOptions {
  onPop?: (x: number, y: number) => void;
  /** CSS selector; pointer events whose target matches (or is inside) are ignored. */
  ignoreSelector?: string;
}

const SPRITE_SIZE = 128;
const MAX_PARTICLES = 420;
const MAX_RIPPLES = 48;

export class WaterFXEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: WaterFXOptions;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private isCoarse = false;
  private reducedMotion = false;

  private bubbles: Bubble[] = [];
  private ripples: Ripple[] = [];
  private particles: Particle[] = [];

  private bubbleSprite: HTMLCanvasElement;
  private glowSprite: HTMLCanvasElement;

  private raf = 0;
  private lastTime = 0;
  private running = false;
  private surgeUntil = 0;

  private pointerActive = false;
  private lastPointer: { x: number; y: number; t: number } | null = null;
  private lastRippleAt: { x: number; y: number; t: number } = { x: -999, y: -999, t: 0 };

  private resizeObserver: ResizeObserver | null = null;
  private motionQuery: MediaQueryList | null = null;

  constructor(canvas: HTMLCanvasElement, opts: WaterFXOptions = {}) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("WaterFXEngine: 2D canvas context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.opts = opts;
    this.bubbleSprite = this.createBubbleSprite();
    this.glowSprite = this.createGlowSprite();
  }

  /* ------------------------------------------------------------------ lifecycle */

  start(): void {
    if (this.running) return;
    this.running = true;

    this.isCoarse = window.matchMedia("(pointer: coarse)").matches;
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = this.motionQuery.matches;
    this.motionQuery.addEventListener("change", this.onMotionChange);

    this.resize();
    this.seedBubbles();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);

    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this.onPointerUp, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);

    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.motionQuery?.removeEventListener("change", this.onMotionChange);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.bubbles = [];
    this.ripples = [];
    this.particles = [];
  }

  /* ------------------------------------------------------------------ public FX */

  /** START DIVE: a column of fast-rising bubbles + shockwave rings from the bottom edge. */
  surge(): void {
    const now = performance.now();
    this.surgeUntil = now + 2600;
    const count = this.reducedMotion ? 18 : this.isCoarse ? 46 : 72;

    for (let i = 0; i < count; i++) {
      this.bubbles.push({
        x: this.width * (0.15 + Math.random() * 0.7),
        y: this.height + 20 + Math.random() * this.height * 0.5,
        r: 4 + Math.random() * 16,
        vy: 180 + Math.random() * 320,
        phase: Math.random() * Math.PI * 2,
        wobble: 6 + Math.random() * 18,
        alpha: 0,
        surge: true,
      });
    }

    const cx = this.width / 2;
    for (let i = 0; i < 4; i++) {
      window.setTimeout(() => {
        this.addRipple(cx, this.height * 0.62, Math.max(this.width, this.height) * 0.75, 2.6, 520);
      }, i * 160);
    }
    this.emitParticles(cx, this.height * 0.62, this.reducedMotion ? 20 : 90, 420);
  }

  /* ------------------------------------------------------------------ setup */

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const cap = this.isCoarse ? 1.5 : 2;
    this.dpr = Math.min(window.devicePixelRatio || 1, cap);
    const prevW = this.width;
    const prevH = this.height;
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (prevW > 0 && prevH > 0) {
      const sx = this.width / prevW;
      const sy = this.height / prevH;
      for (const b of this.bubbles) {
        b.x *= sx;
        b.y *= sy;
      }
    }
  }

  private targetBubbleCount(): number {
    const area = this.width * this.height;
    const density = this.isCoarse ? 30000 : 24000;
    const n = Math.round(area / density);
    const capped = Math.min(Math.max(n, 12), this.isCoarse ? 26 : 44);
    return this.reducedMotion ? Math.ceil(capped / 2) : capped;
  }

  private makeAmbientBubble(anywhere: boolean): Bubble {
    // Bigger bubbles on touch screens so they're tappable.
    const minR = this.isCoarse ? 14 : 10;
    const maxR = this.isCoarse ? 30 : 28;
    const r = minR + Math.pow(Math.random(), 1.6) * (maxR - minR);
    return {
      x: Math.random() * this.width,
      y: anywhere ? Math.random() * this.height : this.height + r + Math.random() * 120,
      r,
      vy: 14 + Math.random() * 26 + (maxR - r) * 0.6,
      phase: Math.random() * Math.PI * 2,
      wobble: 4 + Math.random() * 14,
      alpha: anywhere ? 0.2 : 0,
      surge: false,
    };
  }

  private seedBubbles(): void {
    this.bubbles = [];
    const n = this.targetBubbleCount();
    for (let i = 0; i < n; i++) this.bubbles.push(this.makeAmbientBubble(true));
  }

  private createBubbleSprite(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE_SIZE;
    const g = c.getContext("2d");
    if (!g) return c;
    const R = SPRITE_SIZE / 2;

    // Body: transparent center, cyan rim
    const body = g.createRadialGradient(R, R, R * 0.15, R, R, R * 0.96);
    body.addColorStop(0, "rgba(165, 243, 252, 0.02)");
    body.addColorStop(0.68, "rgba(103, 232, 249, 0.08)");
    body.addColorStop(0.9, "rgba(103, 232, 249, 0.42)");
    body.addColorStop(1, "rgba(34, 211, 238, 0)");
    g.fillStyle = body;
    g.beginPath();
    g.arc(R, R, R, 0, Math.PI * 2);
    g.fill();

    // Thin rim line
    g.strokeStyle = "rgba(207, 250, 254, 0.55)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(R, R, R * 0.9, 0, Math.PI * 2);
    g.stroke();

    // Specular highlight
    const spec = g.createRadialGradient(R * 0.62, R * 0.55, 0, R * 0.62, R * 0.55, R * 0.34);
    spec.addColorStop(0, "rgba(255,255,255,0.95)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = spec;
    g.beginPath();
    g.arc(R * 0.62, R * 0.55, R * 0.34, 0, Math.PI * 2);
    g.fill();

    // Secondary reflection crescent
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(R, R, R * 0.72, Math.PI * 0.15, Math.PI * 0.55);
    g.stroke();
    return c;
  }

  private createGlowSprite(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (!g) return c;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(236, 254, 255, 1)");
    grad.addColorStop(0.3, "rgba(103, 232, 249, 0.75)");
    grad.addColorStop(1, "rgba(6, 182, 212, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  /* ------------------------------------------------------------------ input */

  private shouldIgnore(e: PointerEvent): boolean {
    if (!this.opts.ignoreSelector) return false;
    const target = e.target;
    return target instanceof Element && target.closest(this.opts.ignoreSelector) !== null;
  }

  private toLocal(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.shouldIgnore(e)) return;
    this.pointerActive = true;
    const p = this.toLocal(e);
    this.lastPointer = { ...p, t: performance.now() };
    this.addRipple(p.x, p.y, 90 + Math.random() * 40, 1.4, 180);
    this.emitParticles(p.x, p.y, this.reducedMotion ? 3 : 10, 160);
    this.hitTest(p.x, p.y, p.x, p.y);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const p = this.toLocal(e);
    const now = performance.now();
    const ignored = this.shouldIgnore(e);
    // Mouse: ripples follow hover. Touch: only while dragging.
    const dragging = this.pointerActive || e.pointerType === "mouse";
    if (!dragging || ignored) {
      this.lastPointer = { ...p, t: now };
      return;
    }

    const dx = p.x - this.lastRippleAt.x;
    const dy = p.y - this.lastRippleAt.y;
    const dist = Math.hypot(dx, dy);
    const minGap = this.pointerActive ? 22 : 38;
    if (dist > minGap && now - this.lastRippleAt.t > 28) {
      const speed = this.lastPointer ? Math.hypot(p.x - this.lastPointer.x, p.y - this.lastPointer.y) : 0;
      this.addRipple(p.x, p.y, 34 + Math.min(speed * 1.2, 70), 1, 120);
      if (this.pointerActive || speed > 18) {
        this.emitParticles(p.x, p.y, this.reducedMotion ? 1 : 2 + Math.min(Math.floor(speed / 10), 5), 90 + speed * 2);
      }
      this.lastRippleAt = { x: p.x, y: p.y, t: now };
    }

    if (this.pointerActive || e.pointerType === "mouse") {
      const from = this.lastPointer ?? { x: p.x, y: p.y };
      // Mouse hover only pops while a button is held; touch/pen pops on drag.
      if (this.pointerActive) this.hitTest(from.x, from.y, p.x, p.y);
    }
    this.lastPointer = { ...p, t: now };
  };

  private onPointerUp = (): void => {
    this.pointerActive = false;
  };

  private onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
    } else if (this.running) {
      this.lastTime = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  private onMotionChange = (e: MediaQueryListEvent): void => {
    this.reducedMotion = e.matches;
  };

  /** Segment-vs-circle test so fast swipes still catch bubbles between frames. */
  private hitTest(x1: number, y1: number, x2: number, y2: number): void {
    const tolerance = this.isCoarse ? 14 : 4;
    const sx = x2 - x1;
    const sy = y2 - y1;
    const lenSq = sx * sx + sy * sy;

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b.alpha < 0.15) continue;
      let t = 0;
      if (lenSq > 0) t = Math.max(0, Math.min(1, ((b.x - x1) * sx + (b.y - y1) * sy) / lenSq));
      const cx = x1 + sx * t;
      const cy = y1 + sy * t;
      if (Math.hypot(b.x - cx, b.y - cy) <= b.r + tolerance) {
        this.pop(i);
      }
    }
  }

  private pop(index: number): void {
    const b = this.bubbles[index];
    this.bubbles.splice(index, 1);
    this.addRipple(b.x, b.y, b.r * 4.2, 1.8, 140, 2);
    this.addRipple(b.x, b.y, b.r * 2.4, 2.2, 90, 1);
    const count = this.reducedMotion ? 4 : 10 + Math.round(b.r * 0.6);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const v = 60 + Math.random() * 160;
      this.pushParticle({
        x: b.x + Math.cos(a) * b.r * 0.8,
        y: b.y + Math.sin(a) * b.r * 0.8,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.4,
        size: 1.2 + Math.random() * 2.4,
      });
    }
    this.opts.onPop?.(b.x, b.y);
  }

  /* ------------------------------------------------------------------ emitters */

  private addRipple(x: number, y: number, maxR: number, lifeScale: number, speed: number, width = 1.5): void {
    if (this.ripples.length >= MAX_RIPPLES) this.ripples.shift();
    this.ripples.push({ x, y, r: 2, maxR, life: lifeScale, speed, width });
  }

  private emitParticles(x: number, y: number, count: number, force: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = force * (0.3 + Math.random() * 0.7);
      this.pushParticle({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - force * 0.35,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.6,
        size: 0.8 + Math.random() * 2.2,
      });
    }
  }

  private pushParticle(p: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push(p);
  }

  /* ------------------------------------------------------------------ loop */

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 20);
    this.lastTime = now;
    this.update(dt, now);
    this.draw(now);
    this.raf = requestAnimationFrame(this.tick);
  };

  private update(dt: number, now: number): void {
    const surging = now < this.surgeUntil;
    const speedMul = (this.reducedMotion ? 0.5 : 1) * (surging ? 2.2 : 1);

    // Bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.phase += dt * (1.2 + b.r * 0.02);
      b.y -= b.vy * dt * (b.surge ? 1 : speedMul);
      b.alpha = Math.min(1, b.alpha + dt * 1.6);
      if (b.y < -b.r * 2) this.bubbles.splice(i, 1);
    }

    // Maintain ambient population
    const ambient = this.bubbles.reduce((n, b) => (b.surge ? n : n + 1), 0);
    const target = this.targetBubbleCount();
    if (ambient < target && Math.random() < dt * 3) {
      this.bubbles.push(this.makeAmbientBubble(false));
    }

    // Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.r += r.speed * dt * (1 - (r.r / r.maxR) * 0.6);
      if (r.r >= r.maxR) this.ripples.splice(i, 1);
    }

    // Particles — slight buoyancy, water drag
    const drag = Math.pow(0.08, dt);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= drag;
      p.vy = p.vy * drag - 30 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private draw(now: number): void {
    const g = this.ctx;
    g.clearRect(0, 0, this.width, this.height);

    // Ripples — double ring for a refractive look
    for (const r of this.ripples) {
      const k = r.r / r.maxR;
      const a = (1 - k) * 0.55 * Math.min(r.life, 1.6);
      if (a <= 0.01) continue;
      g.lineWidth = r.width * (1 - k * 0.5);
      g.strokeStyle = `rgba(103, 232, 249, ${a})`;
      g.beginPath();
      g.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      g.stroke();
      if (r.r > 14) {
        g.strokeStyle = `rgba(236, 254, 255, ${a * 0.45})`;
        g.lineWidth = 1;
        g.beginPath();
        g.arc(r.x, r.y, r.r * 0.72, 0, Math.PI * 2);
        g.stroke();
      }
    }

    // Bubbles
    for (const b of this.bubbles) {
      const wx = Math.sin(b.phase) * b.wobble * 0.35;
      const squash = 1 + Math.sin(b.phase * 1.7) * 0.05;
      const w = b.r * 2 * squash;
      const h = (b.r * 2) / squash;
      g.globalAlpha = b.alpha * (b.surge ? 0.75 : 0.9);
      g.drawImage(this.bubbleSprite, b.x + wx - w / 2, b.y - h / 2, w, h);
    }
    g.globalAlpha = 1;

    // Particles (additive glow)
    if (this.particles.length) {
      g.globalCompositeOperation = "lighter";
      for (const p of this.particles) {
        const k = 1 - p.life / p.maxLife;
        const s = p.size * 4 * (0.5 + k * 0.5);
        g.globalAlpha = k * 0.9;
        g.drawImage(this.glowSprite, p.x - s / 2, p.y - s / 2, s, s);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }

    // Surge vignette pulse
    if (now < this.surgeUntil) {
      const k = (this.surgeUntil - now) / 2600;
      const grad = g.createRadialGradient(
        this.width / 2, this.height * 0.65, 0,
        this.width / 2, this.height * 0.65, Math.max(this.width, this.height) * 0.7,
      );
      grad.addColorStop(0, `rgba(34, 211, 238, ${0.16 * k})`);
      grad.addColorStop(1, "rgba(34, 211, 238, 0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, this.width, this.height);
    }
  }
}
