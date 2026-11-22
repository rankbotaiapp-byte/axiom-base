"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SendHorizontal, Square, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  companionHaptic,
  companionPulseSpeak,
  companionRadioBurst,
} from "@/lib/axiom/companion-comms";
import {
  companionVoiceBeginSpeech,
  companionVoiceEndSpeech,
  companionVoiceSpeechBoundary,
  primeCompanionVoiceAudio,
} from "@/lib/axiom/companion-voice-bus";

const QUICK_ACTIONS = [
  { id: "book", label: "Book an appointment", prompt: "I'd like to book an appointment. What do you need from me?" },
  { id: "pricing", label: "Check service pricing", prompt: "Can you walk me through typical service pricing and how quotes work?" },
  { id: "hours", label: "Operating hours", prompt: "What are your operating hours, and when can someone come out?" },
] as const;

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compact bright launcher from the hook-section collapsed player — not a character icon. */
export const AXIOM_COMPACT_FAB_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#00f2fe] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#030712] shadow-[0_14px_40px_-12px_#00f2fe] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f2fe]";

export type AxiomChatDrawerProps = {
  /** Controlled open state; omit for self-managed FAB. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the floating trigger (use when parent owns the open control). */
  hideTrigger?: boolean;
  className?: string;
  /** Shop / desk label shown in the drawer chrome. */
  deskLabel?: string;
  /** Pre-fill the composer when the drawer opens (e.g. quote lock-in). */
  seedDraft?: string;
};

/**
 * Glassmorphic Cyber-Obsidian chat drawer — streams `/api/chat` and pulses
 * the companion voice bus on conversation events.
 */
export function AxiomChatDrawer({
  open: openProp,
  onOpenChange,
  hideTrigger = false,
  className = "",
  deskLabel = "Axiom desk",
  seedDraft,
}: AxiomChatDrawerProps) {
  const reduceMotion = useReducedMotion();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setInternalOpen(next);
    },
    [onOpenChange, openProp],
  );

  const [draft, setDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastSpokenId = useRef<string | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport,
    onFinish: ({ message, isAbort, isError }) => {
      companionVoiceEndSpeech();
      if (isAbort || isError) return;
      const text = messageText(message);
      if (!text || lastSpokenId.current === message.id) return;
      lastSpokenId.current = message.id;
      companionPulseSpeak(text);
    },
    onError: () => {
      companionVoiceEndSpeech();
      companionHaptic([40, 60, 40]);
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "streaming") {
      primeCompanionVoiceAudio();
      companionVoiceBeginSpeech();
      companionRadioBurst(0.05);
      companionHaptic([18, 24, 18]);
      const tick = window.setInterval(() => {
        companionVoiceSpeechBoundary(Math.floor(Math.random() * 40));
      }, 220);
      return () => {
        window.clearInterval(tick);
      };
    }
    if (status === "ready" || status === "error") {
      // Speech finish handler / onError own end; avoid double-stop mid-utterance after onFinish.
    }
    return undefined;
  }, [status]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    if (!open) return;
    if (seedDraft?.trim()) setDraft(seedDraft.trim().slice(0, 500));
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open, seedDraft]);

  const submit = useCallback(
    async (text: string) => {
      const line = text.replace(/\s+/g, " ").trim();
      if (!line || busy) return;
      setDraft("");
      clearError();
      companionHaptic([22, 30]);
      companionRadioBurst(0.06);
      await sendMessage({ text: line });
    },
    [busy, clearError, sendMessage],
  );

  return (
    <div className={`pointer-events-none fixed inset-0 z-[65] ${className}`} aria-live="polite">
      {!hideTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`pointer-events-auto fixed bottom-6 right-6 z-[66] sm:bottom-8 sm:right-8 ${AXIOM_COMPACT_FAB_CLASS}`}
          aria-label="Open Axiom chat"
        >
          ▶ Ask Axiom
        </button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              key="axiom-chat-scrim"
              aria-label="Close chat"
              className="pointer-events-auto absolute inset-0 bg-[#030712]/55 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="axiom-chat-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Axiom receptionist chat"
              className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[#00f2fe]/25 bg-[#030712]/82 shadow-[-24px_0_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
              initial={reduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0.85 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0.85 }}
              transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.85 }}
            >
              {/* Tactical corner crosshairs */}
              <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-[#00f2fe]/70" aria-hidden />
              <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-[#00f2fe]/70" aria-hidden />
              <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[#00f2fe]/70" aria-hidden />
              <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[#00f2fe]/70" aria-hidden />

              <header className="relative z-[1] flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00f2fe]">
                    Live receptionist
                  </p>
                  <h2 className="mt-1 font-display text-xl text-white">{deskLabel}</h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    24/7 booking · lead qualify · cyan HUD
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 p-2 text-zinc-300 transition hover:border-[#00f2fe]/40 hover:text-[#00f2fe]"
                  aria-label="Close chat drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div
                ref={scrollerRef}
                className="relative z-[1] flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-[#00f2fe]/15 bg-white/[0.03] px-4 py-5">
                    <p className="text-sm leading-relaxed text-zinc-300">
                      Hi — I&apos;m Axiom. I can book visits, outline pricing, or take a callback for the shop.
                      Tap a chip below or ask anything.
                    </p>
                  </div>
                ) : null}

                {messages.map((message) => {
                  const text = messageText(message);
                  if (!text && message.role === "assistant" && busy) {
                    return (
                      <div
                        key={message.id}
                        className="mr-8 rounded-2xl border border-[#00f2fe]/20 bg-[#00f2fe]/5 px-3.5 py-2.5 text-sm text-[#00f2fe]/90"
                      >
                        <span className="inline-flex gap-1">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00f2fe]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00f2fe] [animation-delay:120ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00f2fe] [animation-delay:240ms]" />
                        </span>
                      </div>
                    );
                  }
                  if (!text) return null;
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={
                        isUser
                          ? "ml-8 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm text-zinc-100"
                          : "mr-8 rounded-2xl border border-[#00f2fe]/20 bg-[#00f2fe]/[0.07] px-3.5 py-2.5 text-sm text-zinc-100 shadow-[0_0_24px_rgba(0,242,254,0.06)]"
                      }
                    >
                      {!isUser ? (
                        <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#00f2fe]/80">
                          Axiom
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                    </div>
                  );
                })}

                {error ? (
                  <p className="rounded-xl border border-[#ff2a3d]/35 bg-[#ff2a3d]/10 px-3 py-2 text-xs text-[#ff8a95]">
                    {error.message || "Chat failed. Try again in a moment."}
                  </p>
                ) : null}
              </div>

              <div className="relative z-[1] border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      disabled={busy}
                      onClick={() => void submit(chip.prompt)}
                      className="rounded-full border border-[#00f2fe]/30 bg-[#00f2fe]/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#00f2fe] transition hover:border-[#00f2fe]/70 hover:bg-[#00f2fe]/12 disabled:opacity-40"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit(draft);
                  }}
                >
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask Axiom…"
                    disabled={busy && status === "submitted"}
                    className="min-h-11 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#00f2fe]/50"
                    autoComplete="off"
                  />
                  {busy ? (
                    <button
                      type="button"
                      onClick={() => void stop()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ff2a3d]/40 text-[#ff2a3d] transition hover:bg-[#ff2a3d]/10"
                      aria-label="Stop generating"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#00f2fe]/45 bg-[#00f2fe]/15 text-[#00f2fe] transition hover:bg-[#00f2fe]/25 disabled:opacity-40"
                      aria-label="Send message"
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </button>
                  )}
                </form>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
