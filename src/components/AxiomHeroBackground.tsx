"use client";

import { useEffect, useRef } from "react";

/**
 * Full-hero black Axiom logo + particle stage on Cyber-Obsidian `#030712`.
 * Viewport-wide, dead-center core, continuous loop — never clipped by UI.
 */

const OBSIDIAN = "#030712";
const LOGO_DEFAULT = "/media/axiom/axiom-logo-loop.mp4";
const LOGO_POSTER = "/media/axiom/axiom-logo-poster.jpg";
const LOGO_FALLBACK = "/media/axiom/obsidian-burst.mp4";

type ParticleKind = "metal" | "ember" | "quartz" | "shard";

type Particle = {
  theta: number;
  phi: number;
  restR: number;
  depth: number;
  kind: ParticleKind;
  size: number;
  phase: number;
  spin: number;
  t: number;
  duration: number;
  delay: number;
  breath: number;
  burst: number;
};

const COUNT = 160;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function spawn(i: number, total: number): Particle {
  const kindRoll = Math.random();
  const kind: ParticleKind =
    kindRoll < 0.28 ? "ember" : kindRoll < 0.55 ? "metal" : kindRoll < 0.78 ? "quartz" : "shard";
  return {
    theta: (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
    phi: (Math.random() - 0.5) * 1.15,
    restR: 0.22 + Math.random() * 0.72,
    depth: 0.12 + Math.random() * 0.88,
    kind,
    size: kind === "ember" ? 1.3 + Math.random() * 2.4 : 1.5 + Math.random() * 4,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.6,
    t: 0,
    duration: 1.7 + Math.random() * 2.5,
    delay: Math.random() * 1.0,
    breath: 0.004 + Math.random() * 0.012,
    burst: 0.9 + Math.random() * 0.55,
  };
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  p: Particle,
  scale: number,
  alpha: number,
  time: number,
) {
  const s = p.size * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(p.phase + time * p.spin * 0.18);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.globalCompositeOperation = "lighter";

  if (p.kind === "ember") {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.4);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(226,232,240,0.9)");
    g.addColorStop(0.55, "rgba(148,163,184,0.4)");
    g.addColorStop(1, "rgba(3,7,18,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, s * 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "quartz") {
    ctx.fillStyle = "rgba(226,232,240,0.55)";
    ctx.strokeStyle = "rgba(248,250,252,0.85)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.55, s * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (p.kind === "shard") {
    const g = ctx.createLinearGradient(-s, 0, s, 0);
    g.addColorStop(0, "rgba(148,163,184,0)");
    g.addColorStop(0.45, "rgba(241,245,249,0.9)");
    g.addColorStop(1, "rgba(100,116,139,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-s * 2, -s * 0.15, s * 4, s * 0.3);
  } else {
    const g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, "rgba(71,85,105,0.4)");
    g.addColorStop(0.45, "rgba(203,213,225,0.85)");
    g.addColorStop(1, "rgba(15,23,42,0.5)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, -s * 0.2);
    ctx.lineTo(s * 0.3, -s * 0.8);
    ctx.lineTo(s, s * 0.15);
    ctx.lineTo(-s * 0.2, s * 0.7);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export type AxiomHeroBackgroundProps = {
  className?: string;
  videoSrc?: string;
  posterSrc?: string;
  /** @deprecated ignored */
  fluidSrc?: string;
};

export function AxiomHeroBackground({
  className = "",
  videoSrc = LOGO_DEFAULT,
  posterSrc = LOGO_POSTER,
}: AxiomHeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const start = performance.now();
    const particles = Array.from({ length: COUNT }, (_, i) => spawn(i, COUNT));

    const resize = () => {
      const parent = canvas.parentElement;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (now: number) => {
      if (!running) return;
      const elapsed = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const base = Math.min(w, h);

      for (const p of particles) {
        const local = Math.max(0, elapsed - p.delay);
        if (p.t < 1) p.t = Math.min(1, local / p.duration);
        const u = easeOutCubic(p.t);

        const originX = cx + Math.cos(p.theta) * base * 0.02;
        const originY = cy + Math.sin(p.theta) * base * 0.015;
        const restR = base * p.restR * p.burst;
        const restX = cx + Math.cos(p.theta) * Math.cos(p.phi) * restR;
        const restY = cy + Math.sin(p.theta) * restR * 0.78 + Math.sin(p.phi) * restR * 0.28;
        const overshoot = 1 + (1 - u) * 0.32 * Math.sin(u * Math.PI);
        const x = originX + (restX - originX) * u * overshoot;
        const y = originY + (restY - originY) * u * overshoot;
        const breathe = p.t >= 1 ? Math.sin(elapsed * 0.7 + p.phase) * p.breath * base : 0;
        const bx = x + Math.cos(p.theta + Math.PI / 2) * breathe;
        const by = y + Math.sin(p.theta + Math.PI / 2) * breathe * 0.55;
        const scale = (0.35 + p.depth * 1.05) * (0.22 + u * 0.88);
        const alpha = (0.22 + p.depth * 0.78) * (0.22 + u * 0.78);
        drawParticle(ctx, bx, by, p, scale, alpha, elapsed);
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("resize", resize, { passive: true });
    raf = requestAnimationFrame(tick);

    const vid = logoRef.current;
    if (vid) {
      vid.loop = true;
      void vid.play().catch(() => undefined);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-hidden ${className}`}
      aria-hidden
      data-axiom-hero-background=""
    >
      <div className="absolute inset-0 bg-[#030712]" data-layer="obsidian-floor" />

      <div
        className="absolute inset-0"
        data-layer="silver-stage-glow"
        style={{
          background: [
            "radial-gradient(ellipse 70% 58% at 50% 50%, rgba(226,232,240,0.1), transparent 72%)",
            `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 48%, ${OBSIDIAN} 100%)`,
          ].join(","),
        }}
      />

      {/* Full-bleed centered black logo particle loop */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        data-layer="axiom-logo-center"
      >
        {videoSrc ? (
          <video
            ref={logoRef}
            src={videoSrc}
            poster={posterSrc}
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center"
            style={{
              filter: "grayscale(1) contrast(1.28) brightness(1.15) saturate(0)",
            }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            data-layer="axiom-logo-particles"
            onError={(e) => {
              const el = e.currentTarget;
              if (!el.src.includes("obsidian-burst")) {
                el.src = LOGO_FALLBACK;
              } else {
                el.style.display = "none";
              }
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{
              filter: "grayscale(1) contrast(1.28) brightness(1.15) saturate(0)",
            }}
            data-layer="axiom-hero-still"
            draggable={false}
          />
        )}
      </div>

      <div
        className="absolute inset-0"
        data-layer="edge-vignette"
        style={{
          background: [
            `radial-gradient(ellipse 92% 82% at 50% 50%, transparent 0%, transparent 58%, rgba(3,7,18,0.4) 84%, ${OBSIDIAN} 100%)`,
            `linear-gradient(180deg, rgba(3,7,18,0.25) 0%, transparent 14%, transparent 78%, rgba(3,7,18,0.75) 100%)`,
          ].join(","),
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[1] h-full w-full"
        data-layer="debris-burst-2d"
        style={{ mixBlendMode: "screen", filter: "grayscale(1) saturate(0)" }}
      />
    </div>
  );
}

export default AxiomHeroBackground;
