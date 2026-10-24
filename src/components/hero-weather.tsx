import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import type { HeroEffect } from "@/lib/axiom/hero-brand";
import { OrbGenesisHero } from "@/components/OrbGenesisHero";

type Drift = { x: number; y: number; z: number; s: number };

function seed(count: number): Drift[] {
  const rows: Drift[] = [];
  for (let i = 0; i < count; i += 1) {
    rows.push({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 1000) / 1000,
      z: 0.35 + ((i * 17) % 65) / 100,
      s: 0.6 + ((i * 13) % 18) / 10,
    });
  }
  return rows;
}

function paint(effect: HeroEffect, ctx: CanvasRenderingContext2D, width: number, height: number, drifts: Drift[], frame: number, still: boolean) {
  ctx.clearRect(0, 0, width, height);
  if (effect === "water") {
    ctx.strokeStyle = "rgba(46, 230, 214, 0.28)";
    ctx.lineWidth = 1.25;
    for (let band = 0; band < 7; band += 1) {
      ctx.beginPath();
      const y0 = ((band + 1) / 8) * height;
      for (let x = 0; x <= width; x += 8) {
        const wave = Math.sin(x * 0.02 + frame * 0.04 + band) * (still ? 2 : 7 + band);
        const y = y0 + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return;
  }
  for (const drop of drifts) {
    const speed = still ? 0 : effect === "smoke" ? 0.15 : effect === "snow" ? 0.35 : 1.1;
    const y = (drop.y + frame * 0.002 * speed * drop.z) % 1;
    const sway = still ? 0 : Math.sin(frame * 0.01 + drop.x * 12) * (effect === "rain" ? 0.008 : 0.02);
    const x = (drop.x + sway + 1) % 1;
    const px = x * width;
    const py = y * height;
    if (effect === "rain") {
      ctx.strokeStyle = "rgba(186, 214, 224, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 1.5, py + 10 * drop.s);
      ctx.stroke();
      continue;
    }
    if (effect === "snow") {
      ctx.fillStyle = "rgba(243, 241, 235, 0.85)";
      ctx.beginPath();
      ctx.arc(px, py, drop.s * 1.3, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const radius = 18 * drop.s;
    const fog = ctx.createRadialGradient(px, py, 0, px, py, radius);
    fog.addColorStop(0, "rgba(214, 214, 208, 0.22)");
    fog.addColorStop(1, "rgba(214, 214, 208, 0)");
    ctx.fillStyle = fog;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function HeroWeather({ effect }: { effect: HeroEffect }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drifts = seed(effect === "smoke" ? 28 : 70);
    let frame = 0;
    let raf = 0;
    const draw = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      paint(effect, ctx, width, height, drifts, frame, Boolean(reduce));
      if (reduce) return;
      frame += 1;
      raf = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(raf);
  }, [effect, reduce]);

  return <canvas ref={canvasRef} className="hero-weather" aria-hidden />;
}

export function HeroBrandFrame({
  effect,
  tagline,
  sticker,
  prompt = "",
  morphDurationSec = 4.5,
  name = "",
}: {
  effect: HeroEffect;
  tagline?: string;
  sticker?: string;
  prompt?: string;
  morphDurationSec?: number;
  name?: string;
}) {
  const orb = effect === "orb_genesis_transform";
  return (
    <div className="hero-brand-frame" data-effect={effect}>
      {orb ? (
        <OrbGenesisHero prompt={prompt} durationSec={morphDurationSec} name={name} tagline={tagline} />
      ) : (
        <HeroWeather effect={effect} />
      )}
      <div className="hero-brand-rings" aria-hidden>
        <span className="is-nw" />
        <span className="is-ne" />
        <span className="is-sw" />
        <span className="is-se" />
      </div>
      {sticker ? <p className="hero-brand-sticker">{sticker}</p> : null}
      {tagline ? <p className="hero-brand-badge">{tagline}</p> : null}
    </div>
  );
}
