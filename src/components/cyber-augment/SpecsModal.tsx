"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HARDWARE_SPECS } from "./data";

interface SpecsModalProps {
  open: boolean;
  onClose: () => void;
  onBook: () => void;
}

export function SpecsModal({ open, onClose, onBook }: SpecsModalProps) {
  const [activeId, setActiveId] = useState<string>(HARDWARE_SPECS[0].id);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const active = HARDWARE_SPECS.find((g) => g.id === activeId) ?? HARDWARE_SPECS[0];
  const accent = active.accent === "red" ? "text-neon-red" : "text-neon-cyan";

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close hardware specs"
            className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="specs-title"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="relative flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-white/[0.04] shadow-[0_0_80px_rgba(34,230,255,0.15)] backdrop-blur-2xl sm:rounded-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-red/10" />

            <header className="relative flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
              <div>
                <p className="font-mono text-[10px] tracking-[0.35em] text-neon-cyan">CAL // HARDWARE MANIFEST</p>
                <h2 id="specs-title" className="text-xl font-bold tracking-wide text-white sm:text-2xl">
                  Hardware Specifications
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="rounded-sm border border-white/15 p-2 text-slate-300 transition hover:border-neon-red hover:text-white focus-visible:outline-2 focus-visible:outline-neon-cyan"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path stroke="currentColor" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <div className="relative grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[220px_1fr] md:grid-rows-1">
              <nav
                className="flex gap-2 overflow-x-auto border-b border-white/10 p-3 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-4"
                aria-label="Hardware modules"
              >
                {HARDWARE_SPECS.map((g) => {
                  const selected = g.id === activeId;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveId(g.id)}
                      aria-current={selected}
                      className={`relative shrink-0 rounded-sm px-4 py-3 text-left transition ${
                        selected ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {selected && (
                        <motion.span
                          layoutId="spec-tab"
                          className={`absolute inset-y-2 left-0 w-[2px] ${
                            g.accent === "red" ? "bg-neon-red" : "bg-neon-cyan"
                          }`}
                        />
                      )}
                      <span className="block text-sm font-semibold">{g.label}</span>
                      <span className="block font-mono text-[10px] tracking-[0.2em] text-slate-500">{g.code}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="min-h-0 overflow-y-auto p-5 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className={`font-mono text-xs tracking-[0.3em] ${accent}`}>MODULE {active.code}</p>
                    <h3 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{active.label}</h3>
                    <p className="mt-3 max-w-2xl text-slate-300">{active.summary}</p>
                    <dl className="mt-6 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-2">
                      {active.specs.map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * i }}
                          className="bg-slate-950/70 px-4 py-3"
                        >
                          <dt className="font-mono text-[10px] tracking-[0.25em] text-slate-500">
                            {s.label.toUpperCase()}
                          </dt>
                          <dd className="mt-1 font-semibold text-white">{s.value}</dd>
                        </motion.div>
                      ))}
                    </dl>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <footer className="relative flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="font-mono text-[10px] tracking-[0.25em] text-slate-500">
                ALL HARDWARE FITTED &amp; CALIBRATED IN-HOUSE
              </p>
              <button
                type="button"
                onClick={onBook}
                className="rounded-sm bg-neon-red px-5 py-2.5 text-sm font-bold tracking-[0.2em] text-white shadow-[0_0_24px_rgba(255,42,61,0.5)] transition hover:brightness-110"
              >
                BOOK THIS UPGRADE
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
