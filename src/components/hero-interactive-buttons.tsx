import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { HeroHudButton } from "@/lib/axiom/hero-hud";

function waitFor(animation: HeroHudButton["clickAnimation"]): number {
  if (animation === "morph-success") return 2000;
  if (animation === "pulse-glow") return 400;
  return 700;
}

/** Storefront hero button: hover, press, and the click response picked in the studio. */
export function HeroInteractiveButton({
  button,
  className,
  children,
  onActivate,
}: {
  button: HeroHudButton;
  className: string;
  children: ReactNode;
  onActivate: (button: HeroHudButton) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const [live, setLive] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const morph = live && button.clickAnimation === "morph-success";

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function activate(event: React.MouseEvent<HTMLButtonElement>) {
    if (live) return;
    const box = ref.current?.getBoundingClientRect();
    if (box && button.clickAnimation === "ripple-shockwave") {
      setRipple({ x: event.clientX - box.left, y: event.clientY - box.top });
    }
    setLive(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setLive(false);
      setRipple(null);
      onActivate(button);
    }, reduce ? 0 : waitFor(button.clickAnimation || "pulse-glow"));
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      className={`${className}${live ? ` is-anim-${button.clickAnimation || "pulse-glow"}` : ""}`}
      style={{ left: `${button.x}%`, top: `${button.y}%` }}
      whileHover={live ? undefined : { scale: 1.05 }}
      whileTap={live ? undefined : { scale: 0.95 }}
      onClick={activate}
    >
      {morph ? (
        <>
          <Check aria-hidden className="size-4" />
          <span>{button.successMessage || "Done"}</span>
        </>
      ) : (
        children
      )}
      {live && button.clickAnimation === "particle-burst" ? (
        <span className="hud-burst" aria-hidden>
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className={`hud-spark is-${index}`} />
          ))}
        </span>
      ) : null}
      {ripple ? (
        <svg className="hud-ripple" aria-hidden>
          <motion.circle
            cx={ripple.x}
            cy={ripple.y}
            r={8}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
            initial={{ r: 8, opacity: 0.95 }}
            animate={{ r: 64, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          <motion.circle
            cx={ripple.x}
            cy={ripple.y}
            r={5}
            fill="none"
            stroke="color-mix(in srgb, var(--color-fg) 62%, var(--color-accent))"
            strokeWidth={1.5}
            initial={{ r: 5, opacity: 0.8 }}
            animate={{ r: 46, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
          />
        </svg>
      ) : null}
    </motion.button>
  );
}
