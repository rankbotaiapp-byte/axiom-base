"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, PhoneOff, Heart } from "lucide-react";
import { useVapi } from "@/lib/otter/use-vapi";
import { GlassPanel } from "./GlassPanel";

interface VoiceConciergeProps {
  publicKey: string;
  assistantId: string;
  /** Used when Vapi keys aren't set, so the CTA still converts. */
  fallbackHref: string;
}

const statusCopy = {
  unconfigured: "Adoption desk online",
  idle: "Concierge standing by",
  connecting: "Opening voice channel…",
  active: "Live — speak naturally",
  ending: "Closing channel…",
  error: "Channel interrupted",
} as const;

export function VoiceConcierge({ publicKey, assistantId, fallbackHref }: VoiceConciergeProps) {
  const { status, volume, assistantSpeaking, error, start, stop } = useVapi(publicKey, assistantId);
  const live = status === "active";
  const busy = status === "connecting" || status === "ending";
  const ringScale = 1 + Math.min(volume, 1) * 0.45;

  const ctaClass =
    "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 font-mono sm:py-3 text-xs font-bold uppercase tracking-[0.2em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:text-sm";

  return (
    <GlassPanel
      label="AI Voice Concierge"
      className="w-full"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 px-3 pt-3 sm:gap-4 sm:px-4 sm:py-4">
        {/* Pulsing neon ring orb */}
        <div className="relative grid h-11 w-11 shrink-0 place-items-center sm:h-16 sm:w-16" aria-hidden="true">
          <span className="absolute inset-0 animate-pulse rounded-full border-2 border-cyan-300/80 shadow-[0_0_25px_rgba(34,211,238,0.7),inset_0_0_18px_rgba(34,211,238,0.5)]" />
          <motion.span
            className="absolute inset-1 rounded-full border border-teal-300/60"
            animate={live ? { scale: ringScale, opacity: 0.4 + volume * 0.6 } : { scale: [1, 1.18, 1], opacity: [0.6, 0.15, 0.6] }}
            transition={live ? { type: "spring", stiffness: 300, damping: 18 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan-400/40 via-teal-500/20 to-sky-700/30 blur-[1px]" />
          {busy ? (
            <Loader2 className="relative h-5 w-5 animate-spin text-cyan-100" />
          ) : live ? (
            <span className="relative flex h-5 items-end gap-[3px]">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-cyan-100"
                  animate={{ height: assistantSpeaking ? ["30%", "100%", "45%", "85%", "30%"] : "30%" }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                  style={{ height: "30%" }}
                />
              ))}
            </span>
          ) : (
            <Mic className="relative h-5 w-5 text-cyan-100" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/90">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={status}
                className="inline-block"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
              >
                {statusCopy[status]}
              </motion.span>
            </AnimatePresence>
          </p>
          <p className="mt-0.5 text-xs leading-snug text-slate-200 sm:mt-1 sm:text-sm">
            {live
              ? "Ask about adoption tiers, habitat work, or guided river expeditions."
              : "Talk to Marina, our AI guide — adopt a river otter in minutes."}
          </p>
          {error ? <p role="alert" className="mt-1 text-xs text-rose-300">{error}</p> : null}
        </div>
      </div>

      <div className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-0">
        {status === "unconfigured" ? (
          <a
            href={`${fallbackHref}${fallbackHref.includes("?") ? "&" : "?"}intent=adopt`}
            className={`${ctaClass} bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.45)] hover:shadow-[0_0_45px_rgba(34,211,238,0.7)]`}
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            Adopt an Otter Today
          </a>
        ) : live || status === "ending" ? (
          <motion.button
            type="button"
            onClick={() => void stop()}
            disabled={status === "ending"}
            whileTap={{ scale: 0.97 }}
            className={`${ctaClass} border border-rose-400/50 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 disabled:opacity-60`}
          >
            <PhoneOff className="h-4 w-4" aria-hidden="true" />
            End Call
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={() => void start()}
            disabled={busy}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            className={`${ctaClass} bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-[length:200%_100%] text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.45)] hover:bg-[position:100%_0] hover:shadow-[0_0_45px_rgba(34,211,238,0.7)] disabled:opacity-70`}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Heart className="h-4 w-4" aria-hidden="true" />}
            {status === "error" ? "Try Again" : "Adopt an Otter Today"}
          </motion.button>
        )}
      </div>
    </GlassPanel>
  );
}
