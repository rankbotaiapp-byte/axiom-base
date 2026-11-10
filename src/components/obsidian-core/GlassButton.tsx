"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState, type ReactNode } from "react";
import { useHudAudio } from "./HudAudio";
import type { Tone } from "./site";

type Ripple = { id: number; x: number; y: number };

const TONES: Record<Tone, { hex: string; ring: string; text: string; glow: string; pitch: number }> = {
  cyan: {
    hex: "#00ffcc",
    ring: "border-[#00ffcc]/70 hover:border-[#00ffcc]",
    text: "text-[#00ffcc]",
    glow: "hover:shadow-[0_0_28px_rgba(0,255,204,0.55),inset_0_0_18px_rgba(0,255,204,0.18)]",
    pitch: 620,
  },
  amber: {
    hex: "#f59e0b",
    ring: "border-amber-400/70 hover:border-amber-300",
    text: "text-amber-300",
    glow: "hover:shadow-[0_0_28px_rgba(245,158,11,0.55),inset_0_0_18px_rgba(245,158,11,0.18)]",
    pitch: 440,
  },
};

type Props = {
  tone?: Tone;
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

export function GlassButton({
  tone = "cyan",
  children,
  onClick,
  icon,
  type = "button",
  disabled,
  className = "",
}: Props) {
  const t = TONES[tone];
  const { blip, haptic } = useHudAudio();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [shock, setShock] = useState(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setRipples((prev) => [...prev, { id: performance.now(), x: e.clientX - r.left, y: e.clientY - r.top }]);
      setShock((n) => n + 1);
      blip(t.pitch);
      haptic(14);
    },
    [blip, haptic, t.pitch],
  );

  return (
    <motion.div className={`relative inline-flex ${className}`} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
      <AnimatePresence>
        {shock > 0 ? (
          <motion.span
            key={shock}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-2"
            style={{ borderColor: t.hex, boxShadow: `0 0 24px ${t.hex}` }}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.45 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
      </AnimatePresence>

      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        className={`obsidian-glass-3d group relative isolate inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border px-7 py-4 font-mono text-[13px] font-semibold tracking-[0.22em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] disabled:opacity-50 sm:px-9 ${t.ring} ${t.text} ${t.glow}`}
        style={{ ["--tw-ring-color" as string]: t.hex }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
        />
        {ripples.map((rp) => (
          <motion.span
            key={rp.id}
            aria-hidden
            className="pointer-events-none absolute -z-10 h-10 w-10 rounded-full"
            style={{
              left: rp.x - 20,
              top: rp.y - 20,
              background: `radial-gradient(circle, ${t.hex}aa 0%, ${t.hex}00 70%)`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 9, opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            onAnimationComplete={() => setRipples((prev) => prev.filter((p) => p.id !== rp.id))}
          />
        ))}
        {icon}
        <span className="relative">{children}</span>
      </button>
    </motion.div>
  );
}
