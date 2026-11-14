"use client";

/**
 * Color-matching spark trail for mouse (desktop) and finger (touch).
 *
 * How the color sampling works — the browser can't read raw screen pixels, so we
 * sample the two things that actually paint the page:
 *   1. <video data-sample> elements: the current frame is drawn into a tiny offscreen
 *      canvas (refreshed ~12x/sec) and the pixel under the pointer is read, with the
 *      object-fit (contain | cover) mapping respected so it lines up exactly.
 *   2. Everything else: the element under the pointer is walked up to its first
 *      non-transparent background color. Gradient/imagery elements can declare
 *      `data-sample-color="#hex"` to tell the trail what they look like.
 *
 * Perf: one fixed canvas, one rAF loop that sleeps when no particles are alive,
 * sampling throttled to ~40Hz, particle cap, DPR-aware, paused when the tab is hidden,
 * disabled entirely for prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";

type RGB = [number, number, number];
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; c: RGB };

const MAX_PARTICLES = 96;
const SAMPLE_W = 64;
const FRAME_REFRESH_MS = 120;
const SAMPLE_INTERVAL_MS = 40;
const FALLBACK: RGB = [63, 216, 255];

type FrameCache = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; data: Uint8ClampedArray | null; at: number; w: number; h: number };

export default function ParticleTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    if (saveData) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const particles: Particle[] = [];
    const frames = new WeakMap<HTMLVideoElement, FrameCache>();
    let dpr = 1;
    let raf = 0;
    let running = false;
    let lastSample = 0;
    let lastColor: RGB = FALLBACK;
    let last: { x: number; y: number } | null = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();

    // ---------- Color sampling ----------
    const readVideoPixel = (v: HTMLVideoElement, x: number, y: number): RGB | null => {
      if (v.readyState < 2 || !v.videoWidth) return null;
      const r = v.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;

      const fit = v.dataset.sampleFit === "cover" ? "cover" : "contain";
      const scale =
        fit === "cover"
          ? Math.max(r.width / v.videoWidth, r.height / v.videoHeight)
          : Math.min(r.width / v.videoWidth, r.height / v.videoHeight);
      const dw = v.videoWidth * scale;
      const dh = v.videoHeight * scale;
      const ox = r.left + (r.width - dw) / 2;
      const oy = r.top + (r.height - dh) / 2;
      const u = (x - ox) / dw;
      const w = (y - oy) / dh;
      if (u < 0 || u > 1 || w < 0 || w > 1) return null; // letterbox area — not the picture

      let fc = frames.get(v);
      if (!fc) {
        const c = document.createElement("canvas");
        const h = Math.round((SAMPLE_W * v.videoHeight) / v.videoWidth);
        c.width = SAMPLE_W;
        c.height = h;
        fc = { canvas: c, ctx: c.getContext("2d", { willReadFrequently: true })!, data: null, at: 0, w: SAMPLE_W, h };
        frames.set(v, fc);
      }
      const now = performance.now();
      if (!fc.data || now - fc.at > FRAME_REFRESH_MS) {
        try {
          fc.ctx.drawImage(v, 0, 0, fc.w, fc.h);
          fc.data = fc.ctx.getImageData(0, 0, fc.w, fc.h).data;
          fc.at = now;
        } catch {
          return null; // cross-origin video without CORS — fall through to DOM sampling
        }
      }
      const px = Math.min(fc.w - 1, Math.floor(u * fc.w));
      const py = Math.min(fc.h - 1, Math.floor(w * fc.h));
      const i = (py * fc.w + px) * 4;
      return [fc.data[i], fc.data[i + 1], fc.data[i + 2]];
    };

    // Resolve ANY CSS color (rgb, hex, hsl, oklab, oklch, color-mix…) by letting the browser paint it.
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const pctx = probe.getContext("2d", { willReadFrequently: true })!;
    const colorCache = new Map<string, [number, number, number, number] | null>();
    const parseColor = (str: string): [number, number, number, number] | null => {
      if (!str || str === "transparent" || str === "none") return null;
      if (colorCache.has(str)) return colorCache.get(str)!;
      pctx.clearRect(0, 0, 1, 1);
      pctx.fillStyle = "rgba(0,0,0,0)";
      pctx.fillStyle = str;
      pctx.fillRect(0, 0, 1, 1);
      const d = pctx.getImageData(0, 0, 1, 1).data;
      const out: [number, number, number, number] | null = d[3] ? [d[0], d[1], d[2], d[3] / 255] : null;
      if (colorCache.size > 400) colorCache.clear();
      colorCache.set(str, out);
      return out;
    };
    const COLOR_TOKEN = /(?:rgba?|hsla?|oklab|oklch|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;

    const readDomColor = (x: number, y: number): RGB | null => {
      let el = document.elementFromPoint(x, y) as HTMLElement | null;
      while (el && el !== document.documentElement) {
        const hint = el.dataset?.sampleColor;
        if (hint) {
          const c = parseColor(hint);
          if (c) return [c[0], c[1], c[2]];
        }
        const cs = getComputedStyle(el);
        const c = parseColor(cs.backgroundColor);
        if (c && c[3] > 0.35) return [c[0], c[1], c[2]];
        // Gradient backgrounds (buttons, badges): use the first solid-enough stop
        if (cs.backgroundImage.includes("gradient")) {
          for (const tok of cs.backgroundImage.match(COLOR_TOKEN) ?? []) {
            const g = parseColor(tok);
            if (g && g[3] > 0.35) return [g[0], g[1], g[2]];
          }
        }
        el = el.parentElement;
      }
      return null;
    };

    const sample = (x: number, y: number): RGB => {
      const vids = document.querySelectorAll<HTMLVideoElement>("video[data-sample]");
      // contain-fit (the real picture) wins over cover-fit (blurred fill behind it)
      let coverHit: RGB | null = null;
      for (const v of vids) {
        const c = readVideoPixel(v, x, y);
        if (!c) continue;
        if (v.dataset.sampleFit !== "cover") return c;
        coverHit ??= c;
      }
      return coverHit ?? readDomColor(x, y) ?? lastColor;
    };

    // Keep the hue the screen has, but lift very dark pixels so sparks stay visible on near-black.
    const vivid = ([r, g, b]: RGB): RGB => {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 510;
      if (l >= 0.5) return [r, g, b];
      if (max - min < 12) return [190, 205, 220]; // neutral greys → cool silver spark
      const k = 0.55 / Math.max(l, 0.02);
      return [Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k)];
    };

    // ---------- Particles ----------
    const spawn = (x: number, y: number, speed: number) => {
      const now = performance.now();
      if (now - lastSample > SAMPLE_INTERVAL_MS) {
        lastColor = vivid(sample(x, y));
        lastSample = now;
      }
      const n = Math.min(3, 1 + Math.floor(speed / 18));
      for (let i = 0; i < n; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const a = Math.random() * Math.PI * 2;
        const s = 0.3 + Math.random() * (1.2 + speed * 0.04);
        const max = 28 + Math.random() * 26;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.25, life: max, max, size: 0.8 + Math.random() * 2.2, c: lastColor });
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 1;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + 0.035; // slight gravity → reads as sparks
        p.x += p.vx;
        p.y += p.vy;
        const t = p.life / p.max;
        const [r, g, b] = p.c;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.18 * t})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.2 * t + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${Math.min(255, r + 90) | 0},${Math.min(255, g + 90) | 0},${Math.min(255, b + 90) | 0},${0.95 * t})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      if (particles.length) raf = requestAnimationFrame(tick);
      else running = false;
    };

    // ---------- Input ----------
    const move = (x: number, y: number) => {
      const speed = last ? Math.hypot(x - last.x, y - last.y) : 0;
      // interpolate on fast swipes so the trail stays continuous
      if (last && speed > 24) {
        const steps = Math.min(6, Math.floor(speed / 24));
        for (let i = 1; i <= steps; i++) spawn(last.x + ((x - last.x) * i) / (steps + 1), last.y + ((y - last.y) * i) / (steps + 1), speed);
      }
      spawn(x, y, speed);
      last = { x, y };
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // touch handled below (survives scroll)
      move(e.clientX, e.clientY);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    };
    const reset = () => (last = null);
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
        particles.length = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", reset, { passive: true });
    document.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", reset);
      document.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[100]" />;
}
