import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function ParticleField({ color }: { color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.3,
      s: Math.random() * 0.00025 + 0.00008,
      a: Math.random() * 0.35 + 0.08,
    }));

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.s * height;
        if (p.y < -0.02) p.y = 1.02;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = p.a;
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [color]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

export function CinematicHero({
  imageUrl,
  videoUrl,
  blendPercent,
  ringColor,
  className,
  children,
}: {
  imageUrl: string;
  videoUrl?: string | null;
  blendPercent: number;
  ringColor: string;
  className?: string;
  children: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(Boolean(videoUrl));
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      setShowVideo(false);
      return;
    }
    const t = window.setTimeout(() => setShowVideo(false), 5200);
    return () => window.clearTimeout(t);
  }, [reduced, videoUrl]);

  return (
    <section
      className={cn("relative isolate min-h-[100dvh] overflow-hidden bg-bg", className)}
      style={{ ["--hero-blend" as string]: `${blendPercent}%` }}
    >
      <div className="hero-blend absolute inset-0">
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 z-0 h-full w-full object-cover outline-none"
        />
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: showVideo && !reduced ? 1 : 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {videoUrl && !reduced ? (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              src={videoUrl}
              autoPlay
              muted
              playsInline
              preload="metadata"
              onEnded={() => setShowVideo(false)}
              onError={() => setShowVideo(false)}
            />
          ) : (
            <ParticleField color={ringColor} />
          )}
          <div className="absolute inset-0 bg-bg/25" />
        </motion.div>
      </div>
      <div className="relative z-20 flex min-h-[100dvh] flex-col">{children}</div>
    </section>
  );
}
