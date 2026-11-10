"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ConservationFact, HabitatMetric } from "@/lib/otter/config";

interface ConservationModalProps {
  open: boolean;
  onClose: () => void;
  metrics: readonly HabitatMetric[];
  facts: readonly ConservationFact[];
  bookingUrl: string;
}

export function ConservationModal({ open, onClose, metrics, facts, bookingUrl }: ConservationModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const external = /^https?:\/\//.test(bookingUrl);

  // Focus management + Escape + simple focus trap
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          data-fx-ignore
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Close conservation specs"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-md"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="specs-title"
            className="relative flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950/70 shadow-[0_0_60px_rgba(6,182,212,0.25)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-cyan-500/20 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/80">Conservation Specs // Habitat Report</p>
                <h2 id="specs-title" className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  River Habitat Metrics
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-500/40 text-cyan-200 transition hover:bg-cyan-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto overscroll-contain px-5 py-5 [touch-action:pan-y] sm:px-7 sm:py-6">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {metrics.map((m, i) => (
                  <motion.li
                    key={m.label}
                    className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.4 }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{m.label}</span>
                      <span className="font-mono text-sm font-semibold text-cyan-100">{m.value}</span>
                    </div>
                    <div
                      className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800/80"
                      role="meter"
                      aria-label={`${m.label} score`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={m.score}
                    >
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-300 to-emerald-300 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${m.score}%` }}
                        transition={{ delay: 0.25 + i * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{m.detail}</p>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.title} className="border-l-2 border-cyan-400/50 pl-3">
                    <h3 className="text-sm font-semibold text-cyan-50">{f.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="flex flex-col gap-2 border-t border-cyan-500/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs text-slate-400">Metrics refresh with each seasonal field survey.</p>
              <a
                href={bookingUrl}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.45)] transition hover:shadow-[0_0_40px_rgba(34,211,238,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Book Expedition
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
