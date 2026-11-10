"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type Vapi from "@vapi-ai/web";

type CallState = "idle" | "connecting" | "live" | "error";

const PUBLIC_KEY = process.env.VITE_VAPI_PUBLIC_KEY ?? "";
const ASSISTANT_ID = process.env.VITE_VAPI_ASSISTANT_ID ?? "";

interface VoiceConciergeProps {
  /** Fallback when voice isn't configured or fails: send the visitor to the booking form. */
  onFallback: () => void;
}

const STATUS_COPY: Record<CallState, string> = {
  idle: "AI CONCIERGE · STANDBY",
  connecting: "ESTABLISHING NEURAL LINK…",
  live: "LINK ACTIVE · SPEAK NOW",
  error: "LINK FAILED · TAP TO RETRY",
};

export function VoiceConcierge({ onFallback }: VoiceConciergeProps) {
  const [state, setState] = useState<CallState>("idle");
  const [volume, setVolume] = useState(0);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const configured = PUBLIC_KEY.length > 0 && ASSISTANT_ID.length > 0;

  useEffect(() => {
    return () => {
      void vapiRef.current?.stop();
      vapiRef.current?.removeAllListeners();
    };
  }, []);

  const getClient = useCallback(async (): Promise<Vapi> => {
    if (vapiRef.current) return vapiRef.current;
    // Loaded on demand so the WebRTC SDK never weighs down first paint.
    const { default: VapiClient } = await import("@vapi-ai/web");
    const client = new VapiClient(PUBLIC_KEY);
    client.on("call-start", () => setState("live"));
    client.on("call-end", () => {
      setState("idle");
      setVolume(0);
      setAssistantSpeaking(false);
    });
    client.on("speech-start", () => setAssistantSpeaking(true));
    client.on("speech-end", () => setAssistantSpeaking(false));
    client.on("volume-level", (v: number) => setVolume(v));
    client.on("error", (e: unknown) => {
      console.error("[vapi]", e);
      setState("error");
    });
    vapiRef.current = client;
    return client;
  }, []);

  const toggle = useCallback(async () => {
    if (!configured) {
      onFallback();
      return;
    }
    if (state === "live" || state === "connecting") {
      await vapiRef.current?.stop();
      setState("idle");
      return;
    }
    try {
      setState("connecting");
      const client = await getClient();
      await client.start(ASSISTANT_ID);
    } catch (err) {
      console.error("[vapi] start failed", err);
      setState("error");
    }
  }, [configured, getClient, onFallback, state]);

  const live = state === "live";
  const ringScale = 1 + Math.min(volume, 1) * 0.35;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-2 sm:gap-3"
    >
      <button
        type="button"
        onClick={toggle}
        aria-pressed={live}
        aria-label={live ? "End neural consultation" : "Initialize neural consultation"}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan sm:h-24 sm:w-24"
      >
        {/* Outer pulsing neon rings */}
        <span className="absolute inset-0 animate-pulse rounded-full border-2 border-neon-red/70 shadow-[0_0_30px_var(--color-neon-red)]" />
        <motion.span
          className="absolute -inset-2 rounded-full border border-neon-cyan/60 shadow-[0_0_24px_var(--color-neon-cyan)]"
          animate={live ? { scale: ringScale } : { scale: [1, 1.08, 1] }}
          transition={live ? { duration: 0.1 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {(state === "connecting" || live) && (
          <span className="absolute -inset-4 animate-ping-slow rounded-full border border-neon-cyan/40" />
        )}
        {/* Core */}
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/70 backdrop-blur-2xl transition-transform group-hover:scale-105 group-active:scale-95 sm:h-16 sm:w-16">
          {live ? (
            <span className="flex items-end gap-[3px]" aria-hidden>
              {[0.6, 1, 0.75, 0.9, 0.5].map((base, i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-neon-cyan"
                  animate={{ height: 6 + (assistantSpeaking ? base * 18 : Math.min(volume, 1) * base * 22) }}
                  transition={{ duration: 0.12 }}
                />
              ))}
            </span>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-neon-red" aria-hidden>
              <path
                fill="currentColor"
                d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z"
              />
            </svg>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={toggle}
        className="relative overflow-hidden rounded-sm border border-neon-red/60 bg-neon-red/10 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] sm:px-5 sm:text-sm sm:tracking-[0.25em] text-white shadow-[0_0_20px_rgba(255,42,61,0.35)] backdrop-blur-2xl transition hover:bg-neon-red/25 focus-visible:outline-2 focus-visible:outline-neon-cyan sm:text-sm"
      >
        {live ? "TERMINATE CONSULTATION" : "INITIALIZE NEURAL CONSULTATION"}
      </button>

      <AnimatePresence mode="wait">
        <motion.p
          key={configured ? state : "offline"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={`text-center font-mono text-[9px] tracking-[0.2em] sm:text-[10px] sm:tracking-[0.3em] ${
            state === "error" ? "text-neon-red" : live ? "text-neon-cyan" : "text-slate-400"
          }`}
          aria-live="polite"
        >
          {configured ? STATUS_COPY[state] : "VOICE LINK OFFLINE · TAP TO BOOK"}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
