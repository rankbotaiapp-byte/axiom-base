"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type Vapi from "@vapi-ai/web";
import styles from "./apex.module.css";
import { CornerBrackets, cx, glassPanel, Icon, PanelLabel } from "./ui";

type CallState = "idle" | "connecting" | "live" | "ending" | "error";

const VAPI_PUBLIC_KEY = process.env.VITE_VAPI_PUBLIC_KEY ?? "";
const VAPI_ASSISTANT_ID = process.env.VITE_VAPI_ASSISTANT_ID ?? "";
const voiceEnabled = VAPI_PUBLIC_KEY.length > 0 && VAPI_ASSISTANT_ID.length > 0;

interface VoiceConciergeProps {
  buildSummary: string;
  /** Increment to pulse-highlight the card (e.g. from "Book this build"). */
  attention: number;
}

interface CallbackForm {
  name: string;
  phone: string;
  email: string;
}

export default function VoiceConcierge({ buildSummary, attention }: VoiceConciergeProps) {
  const vapiRef = useRef<Vapi | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<CallState>("idle");
  const [volume, setVolume] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CallbackForm>({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (attention === 0) return;
    setHighlight(true);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    cardRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const id = window.setTimeout(() => setHighlight(false), 2400);
    return () => window.clearTimeout(id);
  }, [attention]);

  useEffect(
    () => () => {
      void vapiRef.current?.stop();
      vapiRef.current?.removeAllListeners();
    },
    [],
  );

  const startCall = useCallback(async () => {
    setError(null);
    setState("connecting");
    try {
      if (!vapiRef.current) {
        const { default: VapiClient } = await import("@vapi-ai/web");
        const vapi = new VapiClient(VAPI_PUBLIC_KEY);
        vapi.on("call-start", () => setState("live"));
        vapi.on("call-end", () => {
          setState("idle");
          setVolume(0);
          setAgentSpeaking(false);
        });
        vapi.on("speech-start", () => setAgentSpeaking(true));
        vapi.on("speech-end", () => setAgentSpeaking(false));
        vapi.on("volume-level", (v: number) => setVolume(v));
        vapi.on("error", () => {
          setState("error");
          setError("Voice line dropped. Try again or request a callback.");
        });
        vapiRef.current = vapi;
      }
      await vapiRef.current.start(VAPI_ASSISTANT_ID, {
        variableValues: { buildSummary, source: "apex-moto-gt3 landing" },
      });
    } catch {
      setState("error");
      setError("Microphone blocked or voice unavailable. Request a callback instead.");
    }
  }, [buildSummary]);

  const endCall = useCallback(async () => {
    setState("ending");
    await vapiRef.current?.stop();
    setState("idle");
  }, []);

  const submitCallback = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/apex-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, build: buildSummary, channel: voiceEnabled ? "voice-fallback" : "callback" }),
      });
      const data = (await res.json()) as { ok: boolean; reference?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Request failed");
      setReference(data.reference ?? "CONFIRMED");
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const live = state === "live";
  const busy = state === "connecting" || state === "ending";
  const bars = 14;

  return (
    <section
      ref={cardRef}
      aria-label="AI voice concierge"
      data-rig-ignore
      className={cx(glassPanel, "p-3 transition-shadow sm:p-4", highlight && "border-cyan-300 shadow-[0_0_60px_rgba(34,211,238,0.55)]")}
    >
      <CornerBrackets />
      <PanelLabel right={<span className={styles.mono}>{live ? "ON AIR" : voiceEnabled ? "VAPI · READY" : "CALLBACK"}</span>}>
        AI Concierge
      </PanelLabel>

      <div className="mt-3 flex items-center gap-3.5">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center">
          <span className={cx("absolute inset-0 rounded-full border border-cyan-400/70", styles.ringPing)} />
          <span className={cx("absolute inset-0 rounded-full border border-cyan-400/50", styles.ringPingDelayed)} />
          <span
            className={cx(
              "absolute inset-0 rounded-full border-2 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.8)]",
              !live && "animate-pulse",
            )}
            style={live ? { transform: `scale(${1 + volume * 0.35})`, transition: "transform 80ms linear" } : undefined}
          />
          <button
            type="button"
            onClick={() => {
              if (!voiceEnabled) setFormOpen((o) => !o);
              else if (live) void endCall();
              else if (!busy) void startCall();
            }}
            disabled={busy}
            aria-pressed={live}
            aria-label={voiceEnabled ? (live ? "End voice call" : "Start voice call with the build concierge") : "Request a callback"}
            className={cx(
              "relative grid h-11 w-11 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200",
              live ? "bg-cyan-400 text-slate-950" : "bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/35",
            )}
          >
            {voiceEnabled ? live ? <Icon.Close /> : <Icon.Mic /> : <Icon.Phone />}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className={cx("text-sm font-semibold uppercase tracking-[0.12em] text-white", styles.display)}>
            {live ? (agentSpeaking ? "Concierge speaking…" : "Listening…") : "Book a custom turbo build"}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
            {reference
              ? `Request ${reference} received — a build engineer will call you shortly.`
              : busy
                ? state === "connecting"
                  ? "Securing voice channel…"
                  : "Closing line…"
                : voiceEnabled
                  ? "Talk live with our AI build engineer — specs, pricing, open slots."
                  : "Leave your number and a build engineer calls you back today."}
          </p>
          {live && (
            <div className="mt-2 flex h-4 items-end gap-[3px]" aria-hidden="true">
              {Array.from({ length: bars }, (_, i) => {
                const wave = Math.abs(Math.sin((i / bars) * Math.PI * 2 + volume * 9));
                return (
                  <span
                    key={i}
                    className="w-[3px] rounded-sm bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.8)]"
                    style={{ height: `${Math.max(12, Math.min(100, volume * 140 * (0.35 + wave)))}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {voiceEnabled && !live && !reference && (
        <button
          type="button"
          onClick={() => setFormOpen((o) => !o)}
          className="mt-2 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          Prefer a callback?
        </button>
      )}

      {formOpen && !reference && (
        <form onSubmit={submitCallback} className="mt-3 grid gap-2">
          <input
            required
            autoComplete="name"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-cyan-500/30 bg-slate-950/70 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              type="tel"
              autoComplete="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="min-w-0 border border-cyan-500/30 bg-slate-950/70 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
            />
            <input
              type="email"
              autoComplete="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="min-w-0 border border-cyan-500/30 bg-slate-950/70 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={cx(
              styles.display,
              "rounded-full border border-cyan-300/90 bg-cyan-500/25 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-cyan-400/35 disabled:opacity-60",
            )}
          >
            {submitting ? "Sending…" : "Call me back"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}
