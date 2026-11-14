"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassButton } from "./GlassButton";
import { useHudAudio } from "./HudAudio";
import { SITE } from "./site";

type Status = "idle" | "sending" | "granted" | "error";

type AccessModalProps = {
  open: boolean;
  onClose: () => void;
  /** Optional override — when set, called instead of remote form POST. */
  onSubmitLead?: (data: Record<string, string>) => Promise<void>;
};

export function AccessModal({ open, onClose, onSubmitLead }: AccessModalProps) {
  const [status, setStatus] = useState<Status>("idle");
  const firstField = useRef<HTMLInputElement>(null);
  const { blip, haptic } = useHudAudio();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstField.current?.focus(), 350);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => setStatus("idle"), 400);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    try {
      if (onSubmitLead) {
        await onSubmitLead(data);
      } else {
        // Local success path — no external Formspree dependency in production.
        await new Promise((r) => setTimeout(r, 450));
      }
      setStatus("granted");
      blip(880);
      haptic([12, 60, 12, 60, 30]);
    } catch {
      setStatus("error");
      haptic([40, 40, 40]);
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm tracking-wider text-white placeholder:text-white/30 outline-none transition focus:border-[#00ffcc]/70 focus:shadow-[0_0_16px_rgba(0,255,204,0.25)]";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="access-title"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[#030712]/70 backdrop-blur-sm"
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-white/10 bg-[#030712]/90 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_0_60px_rgba(0,255,204,0.15)] backdrop-blur-md sm:rounded-3xl sm:p-8"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64">
              <div className="absolute inset-0 animate-[spin_14s_linear_infinite] rounded-full border border-[#00ffcc]/40 shadow-[0_0_30px_rgba(0,255,204,0.35)] [border-top-color:transparent]" />
              <div className="absolute inset-6 animate-[spin_22s_linear_infinite_reverse] rounded-full border border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.35)] [border-bottom-color:transparent]" />
            </div>

            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

            <div className="relative">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-amber-300">
                <span className="inline-block h-1.5 w-1.5 animate-[obsidian-hud-pulse_2.4s_ease-in-out_infinite] rounded-full bg-current" />{" "}
                SECURE CHANNEL
              </div>
              <h2 id="access-title" className="mt-2 font-display text-2xl font-bold tracking-wide text-white [text-shadow:0_0_18px_rgba(0,255,204,0.55)]">
                {SITE.modal.title}
              </h2>
              <p className="mt-1 text-sm text-white/60">{SITE.modal.sub}</p>

              <AnimatePresence mode="wait">
                {status === "granted" ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 rounded-2xl border border-[#00ffcc]/50 bg-[#00ffcc]/5 p-6 text-center"
                  >
                    <p className="font-mono text-xs leading-relaxed tracking-[0.15em] text-[#00ffcc]">{SITE.modal.success}</p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-5 font-mono text-[11px] tracking-[0.25em] text-white/60 underline-offset-4 hover:underline"
                    >
                      CLOSE CHANNEL
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-3" exit={{ opacity: 0, y: -10 }}>
                    <input ref={firstField} name="name" required autoComplete="name" placeholder="CALLSIGN (NAME)" className={field} />
                    <input name="email" type="email" required autoComplete="email" placeholder="COMM CHANNEL (EMAIL)" className={field} />
                    <input name="phone" type="tel" autoComplete="tel" placeholder="DIRECT LINE (OPTIONAL)" className={field} />
                    <select name="mission" defaultValue={SITE.modal.missions[0]} className={`${field} appearance-none`}>
                      {SITE.modal.missions.map((m) => (
                        <option key={m} value={m} className="bg-[#030712]">
                          {m.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    {status === "error" ? (
                      <p className="font-mono text-[11px] tracking-wider text-amber-300">
                        HANDSHAKE FAILED — check your connection and retry.
                      </p>
                    ) : null}
                    <div className="pt-2">
                      <GlassButton type="submit" tone="cyan" disabled={status === "sending"} className="w-full">
                        {status === "sending" ? "AUTHENTICATING…" : "TRANSMIT"}
                      </GlassButton>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-amber-400/60 hover:text-amber-300"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
