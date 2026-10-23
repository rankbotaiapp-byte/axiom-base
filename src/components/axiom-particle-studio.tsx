"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { coveredShare, createCover, particleStudioModel, revealStroke } from "@/lib/axiom/particle-brand";
import { NICHE_MEDIA } from "@/lib/axiom/media";
import { NICHES } from "@/lib/axiom/niches";
import type { ShopNiche } from "@/lib/axiom/types";

const COLS = 96;
const ROWS = 54;

type Face = "front" | "back";

export function AxiomParticleStudio({ niche, business }: { niche: ShopNiche; business?: string }) {
  "use no memo";
  const template = NICHES[niche];
  const film = NICHE_MEDIA[niche];
  const model = particleStudioModel({
    business,
    defaultName: template.defaultName,
    heroVideoUrl: film.heroVideoUrl,
    heroImageUrl: film.heroImageUrl,
    staffFront: film.staff[0],
    staffBack: film.staff[1],
    filmLabel: film.loopLabel,
  });
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brushRef = useRef(4.5);
  const coverRef = useRef(false);
  const [brush, setBrush] = useState(4.5);
  const [face, setFace] = useState<Face>("front");
  const [hidden, setHidden] = useState(1);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let frame = 0;
    let release: (() => void) | null = null;
    const cover = createCover(COLS, ROWS);
    let pointerId = -1;
    let down = false;

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(2, Math.floor(rect.width * dpr));
      const height = Math.max(2, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (coverRef.current) {
        cover.fill(1);
        coverRef.current = false;
      }
      const ink = getComputedStyle(canvas).color || "rgb(8, 8, 10)";
      const cellW = canvas.width / COLS;
      const cellH = canvas.height / ROWS;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = ink;
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          if ((cover[y * COLS + x] ?? 0) < 0.5) continue;
          ctx.globalAlpha = (x + y) % 5 === 0 ? 0.96 : 0.88;
          ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
        }
      }
      ctx.globalAlpha = 1;
    };

    const cellAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * COLS,
        y: ((clientY - rect.top) / rect.height) * ROWS,
      };
    };

    const onDown = (event: PointerEvent) => {
      down = true;
      pointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      const hit = cellAt(event.clientX, event.clientY);
      if (hit) revealStroke(cover, COLS, ROWS, hit.x, hit.y, brushRef.current);
    };

    const onMove = (event: PointerEvent) => {
      if (!down || event.pointerId !== pointerId) return;
      const hit = cellAt(event.clientX, event.clientY);
      if (!hit) return;
      revealStroke(cover, COLS, ROWS, hit.x, hit.y, brushRef.current);
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      down = false;
      setHidden(coveredShare(cover));
    };

    const loop = () => {
      if (dead) return;
      paint();
      frame = requestAnimationFrame(loop);
    };

    paint();
    setPainted(true);
    frame = requestAnimationFrame(loop);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    release = () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      release?.();
    };
  }, []);

  return (
    <section aria-label="Axiom particle studio" className="pointer-events-auto relative z-40 mx-auto mb-8 w-full max-w-5xl px-5 pt-6">
      <div className="glass-panel grid gap-0 overflow-hidden rounded-[24px] lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.8fr)]">
        <div className="relative min-h-64 bg-bg">
          {model.heroKind === "video" ? (
            <video
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              src={model.heroUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img src={model.heroUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          )}
          <canvas
            ref={canvasRef}
            aria-label="Swipe to reveal the hero film"
            className="pointer-events-auto absolute inset-0 h-full w-full touch-none text-bg"
          />
          {painted ? null : <div className="pointer-events-none absolute inset-0 bg-bg" />}
          <p className="pointer-events-none absolute left-4 top-4 text-sm text-fg">{model.line}</p>
          <p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-bg/70 px-3 py-1 text-sm text-fg">
            {hidden < 0.08 ? "Film open" : "Swipe to reveal"}
          </p>
        </div>
        <div className="pointer-events-auto flex flex-col gap-4 border-t border-line p-4 lg:border-l lg:border-t-0">
          <div className="pointer-events-auto [perspective:900px]">
            <motion.div
              className="relative h-64"
              animate={{ rotateY: face === "back" ? 180 : 0 }}
              transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <AvatarFace
                src={model.staffFront}
                kicker="Mark"
                title={model.line}
                detail={model.filmLabel}
                hidden={face === "back"}
              />
              <AvatarFace
                src={model.staffBack}
                kicker="AI preview"
                title={model.line}
                detail="The other side of the same desk."
                flipped
                hidden={face === "front"}
              />
            </motion.div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="pointer-events-auto inline-flex h-11 items-center rounded-full bg-fg px-4 text-sm font-medium text-bg"
              onClick={() => setFace((current) => (current === "front" ? "back" : "front"))}
            >
              {face === "front" ? "Show AI preview" : "Show the mark"}
            </button>
            <button
              type="button"
              className="pointer-events-auto inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-sm text-fg"
              onClick={() => {
                coverRef.current = true;
                setHidden(1);
              }}
            >
              Cover the film
            </button>
          </div>
          <label className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm text-muted">
            <span>Brush</span>
            <input
              type="range"
              min={1.4}
              max={12}
              step={0.1}
              value={brush}
              aria-label="Brush"
              className="pointer-events-auto h-11 w-full accent-accent"
              onChange={(event) => {
                const next = Number(event.target.value);
                brushRef.current = next;
                setBrush(next);
              }}
            />
            <span className="w-10 text-right text-fg">{brush.toFixed(1)}</span>
          </label>
        </div>
      </div>
    </section>
  );
}

function AvatarFace({
  src,
  kicker,
  title,
  detail,
  flipped = false,
  hidden = false,
}: {
  src: string;
  kicker: string;
  title: string;
  detail: string;
  flipped?: boolean;
  hidden?: boolean;
}) {
  return (
    <div
      aria-hidden={hidden}
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] border border-line bg-surface ${flipped ? "[transform:rotateY(180deg)]" : ""} [backface-visibility:hidden]`}
    >
      <img src={src} alt="" className="pointer-events-none h-full w-full object-cover" />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 left-1/3 w-1/4 bg-accent/15" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
        <p className="text-xs uppercase text-accent">{kicker}</p>
        <p className="font-display text-3xl text-fg">{title}</p>
        <p className="mt-1 text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}
