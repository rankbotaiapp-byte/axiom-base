"use client";

import { type ButtonHTMLAttributes, type PointerEvent } from "react";

type Variant = "primary" | "ghost" | "volt";

export function RippleButton({
  variant = "primary",
  className = "",
  onPointerDown,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    onPointerDown?.(e);
  };

  return (
    <button type="button" {...rest} onPointerDown={handlePointerDown} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
}
