"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./apex.module.css";
import { CornerBrackets, cx, Icon } from "./ui";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  /** `center` = expansive modal, `drawer` = right sheet (bottom sheet on mobile) that keeps the hero visible. */
  variant?: "center" | "drawer";
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export default function GlassModal({ open, onClose, title, eyebrow, variant = "center", children, footer }: GlassModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const drawer = variant === "drawer";

  return (
    <div
      data-rig-ignore
      className={cx(
        "fixed inset-0 z-50 flex",
        drawer ? "items-end justify-center md:items-stretch md:justify-end" : "items-end justify-center p-0 sm:items-center sm:p-6",
      )}
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className={cx("absolute inset-0 cursor-default", drawer ? "bg-slate-950/30 md:bg-transparent" : "bg-slate-950/70 backdrop-blur-sm")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "relative flex w-full flex-col border border-cyan-500/40 bg-slate-950/80 text-slate-100 backdrop-blur-2xl shadow-[0_0_35px_rgba(6,182,212,0.2)]",
          drawer
            ? cx("max-h-[82svh] md:m-4 md:max-h-none md:w-[440px]", styles.drawerIn)
            : cx("max-h-[92svh] sm:max-h-[86svh] sm:max-w-5xl", styles.modalIn),
        )}
      >
        <CornerBrackets size={18} />
        <header className="flex items-start justify-between gap-4 border-b border-cyan-500/20 px-5 py-4 sm:px-6">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300/80">{eyebrow}</p>
            )}
            <h2 id={titleId} className={cx("mt-1 text-lg font-semibold uppercase tracking-[0.12em] text-white sm:text-xl", styles.display)}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center border border-cyan-500/40 text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Icon.Close />
          </button>
        </header>
        <div className={cx("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6", styles.noScrollbar)}>{children}</div>
        {footer && <footer className="border-t border-cyan-500/20 px-5 py-4 sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}
