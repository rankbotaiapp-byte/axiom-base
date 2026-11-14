"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";

type Tone = "ember" | "ice" | "ghost";

interface Props {
  href: string;
  tone?: Tone;
  children: ReactNode;
  sub?: string;
  className?: string;
  /** Analytics label sent with the `axiom:cta` event. */
  track?: string;
}

const BURST_COLORS: Record<Tone, string[]> = {
  ember: ["#ffb36b", "#ff7a1a", "#ffe2c2"],
  ice: ["#9be9ff", "#38c8ff", "#e9fbff"],
  ghost: ["#cfe8ff", "#ffffff"],
};

/**
 * Tactile CTA: cursor-tracked glow, ripple from the exact touch point, particle
 * burst, light haptic tick on phones — then routes instantly (route is prefetched
 * on hover / first touch so the funnel opens with no wait).
 */
export function TactileButton({ href, tone = "ember", children, sub, className = "", track }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);
  const prefetched = useRef(false);

  const prefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    router.prefetch(href);
  }, [href, router]);

  const onMove = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const fx = (x: number, y: number) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ripple = document.createElement("span");
    ripple.className = "tb-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });

    const colors = BURST_COLORS[tone];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("span");
      p.className = "tb-particle";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.background = colors[i % colors.length];
      el.appendChild(p);
      const a = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const d = 26 + Math.random() * 38;
      p.animate(
        [
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0.2)`, opacity: 0 },
        ],
        { duration: 520 + Math.random() * 220, easing: "cubic-bezier(.16,1,.3,1)" },
      ).onfinish = () => p.remove();
    }
  };

  const onDown = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    prefetch();
    const r = e.currentTarget.getBoundingClientRect();
    fx(e.clientX - r.left, e.clientY - r.top);
    if (e.pointerType === "touch" && "vibrate" in navigator) navigator.vibrate?.(8);
  };

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("axiom:cta", { detail: { label: track ?? href } }));
    // Let the burst read for a beat on touch, but never block the navigation.
    window.setTimeout(() => router.push(href), 90);
  };

  return (
    <a
      ref={ref}
      href={href}
      onPointerEnter={prefetch}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onFocus={prefetch}
      onClick={onClick}
      className={`tb tb-${tone} ${className}`}
    >
      <span className="tb-glow" aria-hidden />
      <span className="tb-label">
        {children}
        {sub ? <span className="tb-sub">{sub}</span> : null}
      </span>
    </a>
  );
}
