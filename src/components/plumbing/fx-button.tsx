import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

type Ripple = { id: number; x: number; y: number };
type Spark = { id: number; x: number; y: number; angle: number; dist: number; size: number; hue: number };

export type FxVariant = "primary" | "ghost" | "danger";

let seq = 0;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tactile CTA used across the Emergency Plumbing storefront.
 * - idle: rotating neon border + breathing glow (`pulse-glow`)
 * - hover: a light that follows the pointer
 * - press: shockwave rings from the touch point, a particle burst, a short haptic tick
 * - success: the label morphs into a check + `successLabel`, then settles back
 */
export function FxButton({
  children,
  variant = "primary",
  glow = variant === "primary",
  href,
  onPress,
  successLabel,
  successMs = 2400,
  className = "",
  icon,
  ariaLabel,
  style,
}: {
  children: ReactNode;
  variant?: FxVariant;
  glow?: boolean;
  href?: string;
  onPress?: () => void | Promise<unknown>;
  successLabel?: string;
  successMs?: number;
  className?: string;
  icon?: ReactNode;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const router = useRouter();
  const ref = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function burst(clientX: number, clientY: number) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const x = clientX ? clientX - box.left : box.width / 2;
    const y = clientY ? clientY - box.top : box.height / 2;
    try {
      navigator.vibrate?.(12);
    } catch {
      /* some browsers throw outside a user gesture */
    }
    if (reducedMotion()) return;
    const r = { id: ++seq, x, y };
    setRipples((list) => [...list, r]);
    later(() => setRipples((list) => list.filter((item) => item.id !== r.id)), 900);
    const next: Spark[] = Array.from({ length: 12 }, (_, i) => ({
      id: ++seq,
      x,
      y,
      angle: (i / 12) * 360 + Math.random() * 24,
      dist: 34 + Math.random() * 46,
      size: 3 + Math.random() * 4,
      hue: variant === "danger" ? 0 : 172 + Math.random() * 30,
    }));
    setSparks((list) => [...list, ...next]);
    later(() => setSparks((list) => list.filter((s) => !next.includes(s))), 800);
  }

  async function press(event: React.MouseEvent<HTMLButtonElement>) {
    if (state === "busy") return;
    burst(event.clientX, event.clientY);
    const external = href && /^(tel:|sms:|mailto:|https?:)/i.test(href);
    if (href && external) {
      later(() => window.location.assign(href), reducedMotion() ? 0 : 220);
      return;
    }
    if (href) {
      later(() => void router.history.push(href), reducedMotion() ? 0 : 340);
      if (!successLabel) return;
    }
    if (onPress) {
      setState("busy");
      try {
        await onPress();
      } finally {
        setState(successLabel ? "done" : "idle");
      }
    } else if (successLabel) {
      setState("done");
    }
    if (successLabel) later(() => setState("idle"), successMs);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      layout
      transition={{ layout: { type: "spring", stiffness: 420, damping: 32 } }}
      aria-label={ariaLabel}
      aria-live="polite"
      data-state={state}
      className={`fx-btn is-${variant}${glow ? " is-glow" : ""} ${className}`}
      style={style}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - box.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - box.top}px`);
      }}
      onClick={press}
    >
      <span className="fx-btn-light" aria-hidden />
      <AnimatePresence mode="popLayout" initial={false}>
        {state === "done" ? (
          <motion.span
            key="done"
            className="fx-btn-label"
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          >
            <motion.span
              className="fx-btn-check"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
            >
              <Check size={16} strokeWidth={3} />
            </motion.span>
            {successLabel}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            className="fx-btn-label"
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: state === "busy" ? 0.7 : 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          >
            {icon}
            {children}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="fx-btn-fx" aria-hidden>
        {ripples.map((r) => (
          <span key={r.id} className="fx-shockwave" style={{ left: r.x, top: r.y }}>
            <span />
            <span />
          </span>
        ))}
        {sparks.map((s) => (
          <span
            key={s.id}
            className="fx-spark"
            style={
              {
                left: s.x,
                top: s.y,
                width: s.size,
                height: s.size,
                "--a": `${s.angle}deg`,
                "--d": `${s.dist}px`,
                "--h": s.hue,
              } as CSSProperties
            }
          />
        ))}
      </span>
    </motion.button>
  );
}
