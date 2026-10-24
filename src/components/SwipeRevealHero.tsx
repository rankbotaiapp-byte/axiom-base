import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { advanceSpeck, type Speck, spawnSpeck } from "@/lib/axiom/swipe-reveal";

export const PREY_REVEAL_BADGE = "ACTIVE INTERACTION: UNVEIL THE WILDLIFE.";

function mulberry(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function paintFerns(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const rand = mulberry(17042457);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#101910";
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  for (let i = 0; i < 90; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    ctx.strokeStyle = rand() > 0.5 ? "#1e3a28" : "#243628";
    ctx.lineWidth = 1 + rand() * 1.6;
    ctx.beginPath();
    const fan = 8 + Math.floor(rand() * 6);
    for (let n = 0; n < fan; n += 1) {
      const angle = -Math.PI * 0.85 + (n / fan) * Math.PI * 0.7 + rand() * 0.2;
      const length = 18 + rand() * 46;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 36; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const angle = -Math.PI / 2 + (rand() - 0.5) * 1.2;
    const length = Math.min(width, height) * (0.12 + rand() * 0.16);
    ctx.strokeStyle = rand() > 0.45 ? "#2f6a45" : "#3d7a4e";
    ctx.lineWidth = 2;
    const tipX = x + Math.cos(angle) * length;
    const tipY = y + Math.sin(angle) * length;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    for (let p = 1; p <= 6; p += 1) {
      const t = p / 6.4;
      const px = x + (tipX - x) * t;
      const py = y + (tipY - y) * t;
      const leaf = length * 0.22 * (1 - t * 0.35);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle + 0.8) * leaf, py + Math.sin(angle + 0.8) * leaf);
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle - 0.8) * leaf, py + Math.sin(angle - 0.8) * leaf);
      ctx.stroke();
    }
  }
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

function glowSprite() {
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 64;
  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(45, 212, 191, 0.95)");
  glow.addColorStop(0.45, "rgba(45, 212, 191, 0.35)");
  glow.addColorStop(1, "rgba(45, 212, 191, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  return sprite;
}

export function SwipeRevealHero({
  baseVideoSrc,
  coverImageSrc,
  poster,
  badgeText = PREY_REVEAL_BADGE,
  heading,
  subheading,
  scratchLabel = "Swipe the cover to reveal the layer underneath",
  className,
}: {
  baseVideoSrc: string;
  coverImageSrc: string;
  poster?: string;
  badgeText?: string;
  heading?: string;
  subheading?: string;
  scratchLabel?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLCanvasElement>(null);
  const moteRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hold = () => {
      if (reduce.matches) video.pause();
    };
    video.addEventListener("loadeddata", hold);
    reduce.addEventListener("change", hold);
    return () => {
      video.removeEventListener("loadeddata", hold);
      reduce.removeEventListener("change", hold);
    };
  }, [baseVideoSrc]);

  useEffect(() => {
    const root = rootRef.current;
    const cover = coverRef.current;
    const motes = moteRef.current;
    if (!root || !cover || !motes) return;
    const coverCtx = cover.getContext("2d");
    const moteCtx = motes.getContext("2d");
    if (!coverCtx || !moteCtx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprite = glowSprite();
    const specks: Speck[] = [];
    let frame = 0;
    let running = true;
    let drawing = false;
    let last = { x: 0, y: 0 };
    let width = 0;
    let height = 0;
    const coverImage = new Image();
    coverImage.src = coverImageSrc;

    const paintCover = () => {
      if (width < 2 || height < 2) return;
      if (coverImage.complete && coverImage.naturalWidth > 0) {
        drawCoverImage(coverCtx, coverImage, width, height);
        return;
      }
      paintFerns(coverCtx, width, height);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const nextW = Math.max(2, Math.floor(rect.width * dpr));
      const nextH = Math.max(2, Math.floor(rect.height * dpr));
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      cover.width = width;
      cover.height = height;
      motes.width = width;
      motes.height = height;
      paintCover();
    };

    const erase = (x: number, y: number) => {
      const radius = Math.max(width, height) * 0.035;
      coverCtx.save();
      coverCtx.globalCompositeOperation = "destination-out";
      const brush = coverCtx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
      brush.addColorStop(0, "rgba(0,0,0,1)");
      brush.addColorStop(1, "rgba(0,0,0,0)");
      coverCtx.fillStyle = brush;
      coverCtx.beginPath();
      coverCtx.arc(x, y, radius, 0, Math.PI * 2);
      coverCtx.fill();
      coverCtx.restore();
    };

    const stroke = (x: number, y: number) => {
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.hypot(dx, dy) || 1;
      const steps = Math.max(1, Math.ceil(dist / 12));
      for (let i = 1; i <= steps; i += 1) {
        const px = last.x + (dx * i) / steps;
        const py = last.y + (dy * i) / steps;
        erase(px, py);
        if (!reduce && specks.length < 140) {
          specks.push(spawnSpeck(px, py, dx / dist, dy / dist, Math.random));
        }
      }
      last = { x, y };
    };

    const local = (event: PointerEvent) => {
      const rect = cover.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        x: ((event.clientX - rect.left) / rect.width) * width,
        y: ((event.clientY - rect.top) / rect.height) * height,
      };
    };

    const onDown = (event: PointerEvent) => {
      const point = local(event);
      if (!point) return;
      drawing = true;
      last = point;
      try {
        cover.setPointerCapture(event.pointerId);
      } catch {
        /* A pointer that is already gone still leaves a scratch. */
      }
      erase(point.x, point.y);
    };
    const onMove = (event: PointerEvent) => {
      if (!drawing) return;
      const point = local(event);
      if (!point) return;
      stroke(point.x, point.y);
    };
    const onUp = () => {
      drawing = false;
    };

    const tick = () => {
      if (!running) return;
      frame = requestAnimationFrame(tick);
      if (document.visibilityState !== "visible") return;
      moteCtx.clearRect(0, 0, width, height);
      if (specks.length === 0) return;
      moteCtx.globalCompositeOperation = "lighter";
      for (let i = specks.length - 1; i >= 0; i -= 1) {
        const current = specks[i];
        if (!current) continue;
        const next = advanceSpeck(current, 1 / 60);
        if (!next) {
          specks.splice(i, 1);
          continue;
        }
        specks[i] = next;
        moteCtx.globalAlpha = Math.max(0, next.life / 0.8);
        moteCtx.drawImage(sprite, next.x - next.size, next.y - next.size, next.size * 2, next.size * 2);
      }
      moteCtx.globalAlpha = 1;
    };

    resize();
    frame = requestAnimationFrame(tick);
    coverImage.addEventListener("load", paintCover);
    coverImage.addEventListener("error", paintCover);
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    cover.addEventListener("pointerdown", onDown);
    cover.addEventListener("pointermove", onMove);
    cover.addEventListener("pointerup", onUp);
    cover.addEventListener("pointercancel", onUp);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      coverImage.removeEventListener("load", paintCover);
      coverImage.removeEventListener("error", paintCover);
      cover.removeEventListener("pointerdown", onDown);
      cover.removeEventListener("pointermove", onMove);
      cover.removeEventListener("pointerup", onUp);
      cover.removeEventListener("pointercancel", onUp);
    };
  }, [coverImageSrc]);

  return (
    <div ref={rootRef} className={cn("swipe-reveal", className)}>
      <video
        ref={videoRef}
        className="swipe-reveal-video"
        src={baseVideoSrc}
        poster={
          poster ??
          (/owl[-_](?:prey-hero|midnight_dive)\.mp4(?:$|[?#])/.test(baseVideoSrc)
            ? "/media/heroes/owl-prey-still.jpg"
            : undefined)
        }
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <canvas
        ref={coverRef}
        className="swipe-reveal-cover"
        aria-label={scratchLabel}
      />
      <canvas ref={moteRef} className="swipe-reveal-motes" aria-hidden />
      {heading || subheading ? (
        <div className="swipe-reveal-copy">
          {heading ? <h2>{heading}</h2> : null}
          {subheading ? <p>{subheading}</p> : null}
        </div>
      ) : null}
      <p className="swipe-reveal-badge">{badgeText}</p>
    </div>
  );
}
