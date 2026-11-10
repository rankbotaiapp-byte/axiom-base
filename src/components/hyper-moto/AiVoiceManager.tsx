"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ShopConfig } from "./config";

/* ------------------------------------------------------------------ */
/* Minimal Web Speech API typings (not shipped in lib.dom)            */
/* ------------------------------------------------------------------ */

type SpeechAlternative = { transcript: string; confidence: number };
type SpeechResult = { readonly isFinal: boolean; readonly length: number; [index: number]: SpeechAlternative };
type SpeechResultList = { readonly length: number; [index: number]: SpeechResult };
type SpeechRecognitionEventLike = Event & { readonly resultIndex: number; readonly results: SpeechResultList };
type SpeechRecognitionErrorLike = Event & { readonly error: string };

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/* ------------------------------------------------------------------ */
/* Booking conversation                                               */
/* ------------------------------------------------------------------ */

type Field = "name" | "bike" | "goal" | "phone";
export type Phase = "idle" | "speaking" | "listening" | "thinking" | "confirm" | "submitting" | "done" | "error";
type Line = { from: "concierge" | "client"; text: string };
type Answers = Record<Field, string>;

const FIELD_ORDER: readonly Field[] = ["name", "bike", "goal", "phone"];

const PROMPTS: Record<Exclude<Field, "name">, (a: Partial<Answers>) => string> = {
  bike: (a) => `Good to meet you, ${a.name}. What are you riding — year, make and model?`,
  goal: () => "What are you after? Street power, a full turbo build, or a ground-up Apex custom?",
  phone: () => "Last one. What's the best phone number for the chief engineer to reach you?",
};

function normalizePhone(raw: string): string | null {
  const words: Record<string, string> = {
    zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  };
  const digits = raw
    .toLowerCase()
    .split(/[\s,.-]+/)
    .map((w) => words[w] ?? w)
    .join("")
    .replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : null;
}

function validate(field: Field, value: string): { ok: true; value: string } | { ok: false; retry: string } {
  const v = value.trim();
  if (field === "phone") {
    const phone = normalizePhone(v);
    return phone ? { ok: true, value: phone } : { ok: false, retry: "I didn't catch a full 10-digit number. Could you say it again?" };
  }
  if (v.length < 2) return { ok: false, retry: "Sorry, I missed that. One more time?" };
  if (field === "name") {
    const cleaned = v.replace(/^(my name is|i'm|i am|this is|it's)\s+/i, "");
    return { ok: true, value: cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
  return { ok: true, value: v };
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export type ConciergeState = { open: boolean; phase: Phase };

type Props = {
  concierge: ShopConfig["concierge"];
  brand: string;
  /** Reports open/phase so a host panel can react (e.g. close itself). */
  onStateChange?: (state: ConciergeState) => void;
  /** Custom closed-state launcher. Receives the start handler. */
  launcher?: (start: () => void) => ReactNode;
  /** false = render without its own glass card (host provides the frame). */
  framed?: boolean;
  /** Increment to open the concierge from elsewhere on the page (e.g. a tier CTA). */
  openSignal?: number;
};

export default function AiVoiceManager({
  concierge,
  brand,
  onStateChange,
  launcher,
  framed = true,
  openSignal = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [muted, setMuted] = useState(false);

  const stepRef = useRef(0);
  const answersRef = useRef<Partial<Answers>>({});
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const mutedRef = useRef(false);
  const handleAnswerRef = useRef<(raw: string) => void>(() => {});

  useEffect(() => {
    setVoiceSupported(getRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    onStateChange?.({ open, phase });
  }, [open, phase, onStateChange]);

  useEffect(() => {
    mutedRef.current = muted;
    if (muted && typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [muted]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, interim]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );

  const listen = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setPhase("listening"); // text input stays available
      return;
    }
    recognitionRef.current?.abort();
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = "";

    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceSupported(false);
        setLines((l) => [...l, { from: "concierge", text: "Mic access is blocked — no problem, just type your answer below." }]);
      }
    };
    rec.onend = () => {
      setInterim("");
      if (finalText.trim()) handleAnswerRef.current(finalText);
      else setPhase((p) => (p === "listening" ? "listening" : p));
    };

    recognitionRef.current = rec;
    setPhase("listening");
    try {
      rec.start();
    } catch {
      setPhase("listening");
    }
  }, []);

  const say = useCallback(
    (text: string, then?: () => void) => {
      setLines((l) => [...l, { from: "concierge", text }]);
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth || mutedRef.current) {
        then?.();
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.04;
      u.pitch = 0.95;
      const voice = synth
        .getVoices()
        .find((v) => v.lang.startsWith("en") && /(Google US English|Samantha|Daniel|Aaron|Natural)/i.test(v.name));
      if (voice) u.voice = voice;
      setPhase("speaking");
      u.onend = () => then?.();
      u.onerror = () => then?.();
      synth.speak(u);
    },
    [],
  );

  const ask = useCallback(() => {
    const field = FIELD_ORDER[stepRef.current];
    if (!field) return;
    const prompt = field === "name" ? concierge.greeting : PROMPTS[field](answersRef.current);
    say(prompt, listen);
  }, [concierge.greeting, listen, say]);

  const handleAnswer = useCallback(
    (raw: string) => {
      const field = FIELD_ORDER[stepRef.current];
      if (!field) return;
      setLines((l) => [...l, { from: "client", text: raw.trim() }]);
      setPhase("thinking");
      const result = validate(field, raw);
      if (!result.ok) {
        say(result.retry, listen);
        return;
      }
      answersRef.current = { ...answersRef.current, [field]: result.value };
      stepRef.current += 1;
      if (stepRef.current < FIELD_ORDER.length) {
        ask();
      } else {
        const a = answersRef.current as Answers;
        say(
          `Perfect. ${a.name}, ${a.bike}, goal: ${a.goal}. We'll call ${a.phone}. Shall I lock in the consultation request?`,
          () => setPhase("confirm"),
        );
      }
    },
    [ask, listen, say],
  );

  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  const start = () => {
    setOpen(true);
    setLines([]);
    stepRef.current = 0;
    answersRef.current = {};
    ask();
  };

  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  });
  useEffect(() => {
    if (openSignal > 0) startRef.current();
  }, [openSignal]);

  const close = () => {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setOpen(false);
    setPhase("idle");
    setInterim("");
  };

  const submit = async () => {
    setPhase("submitting");
    try {
      const res = await fetch("/api/hyper-moto/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answersRef.current,
          transcript: lines,
          source: "hyper-moto-voice-concierge",
          page: window.location.href,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setPhase("done");
      say(`You're booked in the queue. The chief engineer will call you within one business day. Welcome to ${brand}.`);
    } catch {
      setPhase("error");
      setLines((l) => [
        ...l,
        { from: "concierge", text: `Something went wrong sending that. Call us directly at ${concierge.phoneDisplay}.` },
      ]);
    }
  };

  const onTypedSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!typed.trim()) return;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    const value = typed;
    setTyped("");
    handleAnswer(value);
  };

  const active = phase === "listening" || phase === "speaking";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={
        framed
          ? "relative w-full overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/60 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-xl"
          : "relative w-full"
      }
    >
      {!open && launcher ? (
        launcher(start)
      ) : !open ? (
        <button
          type="button"
          onClick={start}
          className="group flex w-full items-center gap-4 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-cyan-400/60"
              animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="absolute inset-1 rounded-full bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.6)]" />
            <span className="relative h-7 w-7 rounded-full border-[3px] border-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)] transition-transform group-hover:scale-110" />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[10px] tracking-[0.25em] text-cyan-400/80 uppercase">
              {concierge.name}
            </span>
            <span className="block text-base font-semibold text-slate-100">Talk with the Workshop Concierge</span>
            <span className="block text-xs text-slate-400">Book a custom build consultation in under a minute</span>
          </span>
        </button>
      ) : (
        <div className="flex flex-col" role="dialog" aria-label={`${concierge.name} booking`}>
          <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <motion.span
                className={`h-2.5 w-2.5 rounded-full ${phase === "listening" ? "bg-red-500" : "bg-cyan-400"}`}
                animate={active ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                transition={{ duration: 1, repeat: active ? Infinity : 0 }}
              />
              <span className="font-mono text-[11px] tracking-[0.2em] text-slate-300 uppercase">
                {phase === "listening" ? "Listening" : phase === "speaking" ? "Concierge speaking" : concierge.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="rounded-md px-2 py-1 font-mono text-[10px] tracking-widest text-slate-400 uppercase hover:text-cyan-300"
                aria-pressed={muted}
              >
                {muted ? "Voice off" : "Voice on"}
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-md px-2 py-1 text-slate-400 hover:text-red-400"
                aria-label="Close concierge"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={logRef} className="max-h-56 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
            <AnimatePresence initial={false}>
              {lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    line.from === "concierge"
                      ? "bg-cyan-500/10 text-cyan-100"
                      : "ml-auto bg-slate-800/80 text-slate-100"
                  }`}
                >
                  {line.text}
                </motion.p>
              ))}
            </AnimatePresence>
            {interim && <p className="ml-auto max-w-[90%] text-right text-sm text-slate-500 italic">{interim}…</p>}
          </div>

          <div className="border-t border-cyan-500/20 p-3">
            {phase === "confirm" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submit}
                  className="flex-1 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold tracking-wide text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:bg-cyan-300"
                >
                  Lock it in
                </button>
                <button
                  type="button"
                  onClick={start}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:border-red-500/60"
                >
                  Start over
                </button>
              </div>
            ) : phase === "done" ? (
              <p className="inline-flex w-full items-center justify-center gap-1.5 text-center text-sm text-cyan-300">
                Request received <Check className="h-4 w-4" aria-hidden />
              </p>
            ) : phase === "error" ? (
              <a
                href={concierge.phoneHref}
                className="block rounded-xl bg-red-500 px-4 py-2.5 text-center text-sm font-bold text-white"
              >
                Call {concierge.phoneDisplay}
              </a>
            ) : (
              <form onSubmit={onTypedSubmit} className="flex gap-2">
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={voiceSupported ? "Speak, or type here…" : "Type your answer…"}
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  aria-label="Your answer"
                  disabled={phase === "submitting"}
                />
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={listen}
                    className={`rounded-xl border px-3 text-sm ${
                      phase === "listening"
                        ? "border-red-500/70 text-red-400"
                        : "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                    }`}
                    aria-label="Speak your answer"
                  >
                    🎙
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
