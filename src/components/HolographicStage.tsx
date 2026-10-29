"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GoopyOrb, type OrbAskPhase } from "@/components/GoopyOrb";
import { useAudioQuery } from "@/hooks/useAudioQuery";
import {
  ASSISTANT_CONFIG_EVENT,
  hairHex,
  readAssistantConfig,
  showsHair,
  type AssistantConfig,
} from "@/lib/axiom/assistant-config";

export type HolographicStageProps = {
  businessName?: string;
  /** Public shop page: the framed orb only, without the studio status wall. */
  customer?: boolean;
  filmUrl?: string;
  posterUrl?: string;
};

export function HolographicStage({
  businessName = "Axiom desk",
  customer = false,
  filmUrl = "/media/orb-explosion-hero-animation.mp4",
  posterUrl = "/media/goopy-orb-base.jpg",
}: HolographicStageProps) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const meltTimer = useRef(0);
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [Assistant, setAssistant] = useState<ComponentType<{
    boundsRef: RefObject<HTMLElement | null>;
    listening: boolean;
    question: string;
    answer: string;
    asking: boolean;
    error: string | null;
    onToggle: () => void;
  }> | null>(null);
  const [hovering, setHovering] = useState(false);
  const [composing, setComposing] = useState(false);
  const [meltingText, setMeltingText] = useState("");
  const [inquiry, setInquiry] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const orb = config?.baseType === "Colored Orb";

  const ask = useCallback(async (question: string) => {
    const clean = question.trim();
    if (!clean) return;
    setComposing(false);
    setInquiry(clean);
    setMeltingText(clean);
    setAsking(true);
    setAnswer("");
    window.clearTimeout(meltTimer.current);
    meltTimer.current = window.setTimeout(() => setMeltingText(""), 1500);
    try {
      const res = await fetch("/api/orb-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean }),
      });
      const payload = (await res.json()) as { ok?: boolean; text?: string; error?: string };
      setAnswer(payload.ok && payload.text ? payload.text : payload.error || "The assistant could not answer.");
    } catch {
      setAnswer("The assistant could not answer.");
    } finally {
      setAsking(false);
    }
  }, []);

  const audio = useAudioQuery(ask);

  const clearSlate = useCallback(() => {
    setInquiry("");
    setAnswer("");
    setMeltingText("");
    setComposing(false);
  }, []);

  const engage = useCallback(() => {
    if (audio.isListening) {
      audio.stop();
      return;
    }
    if (audio.supported) {
      void audio.start();
      return;
    }
    setComposing(true);
  }, [audio]);

  const phase: OrbAskPhase = meltingText
    ? "melting"
    : audio.isListening
      ? "listening"
      : composing
        ? "composing"
        : hovering
          ? "ready"
          : "idle";

  useEffect(() => {
    const load = () => setConfig(readAssistantConfig());
    load();
    window.addEventListener(ASSISTANT_CONFIG_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(ASSISTANT_CONFIG_EVENT, load);
      window.removeEventListener("storage", load);
      window.clearTimeout(meltTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!orb) return;
    let active = true;
    void import("@/components/DraggableAssistant").then((mod) => {
      if (active) setAssistant(() => mod.DraggableAssistant);
    });
    return () => {
      active = false;
    };
  }, [orb]);

  const frame = (
    <AssistantFrame videoRef={videoRef} filmUrl={filmUrl} posterUrl={posterUrl}>
      <GoopyOrb
        phase={phase}
        name={businessName}
        question={audio.isListening ? audio.transcript || inquiry : inquiry}
        answer={answer}
        videoRef={videoRef}
        onEngage={engage}
        onAsk={(value) => void ask(value)}
        onClear={clearSlate}
        onHoverChange={setHovering}
      />
    </AssistantFrame>
  );

  if (customer) {
    return (
      <section ref={stageRef} className="tactical-hero storefront-assistant" aria-label={`${businessName} assistant`}>
        {frame}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button type="button" className="glass-btn h-11 rounded-full px-4 text-sm text-fg" onClick={engage}>
            {audio.isListening ? "Listening" : "Ask aloud"}
          </button>
          {audio.error ? <p className="text-center text-xs text-muted">{audio.error}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section ref={stageRef} className="holo-void" aria-label="Holographic assistant stage">
      <div className="holo-void-atmosphere" aria-hidden="true" />
      <div className="relative z-10 grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="flex min-w-0 flex-col items-center justify-end gap-4">
          <div className="relative w-full" style={{ perspective: 1200 }}>
            <motion.div
              className="holo-stage mx-auto w-full max-w-sm"
              whileHover={reduce ? undefined : { rotateY: 5, rotateX: -5 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className={`relative ${orb ? "" : "overflow-hidden"}`}>
                {frame}
                {config && showsHair(config.baseType) && config.hairColor ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[18%] left-1/2 z-[1] h-8 w-24 -translate-x-1/2 rounded-full opacity-80"
                    style={{ background: hairHex(config.hairColor), boxShadow: `0 0 24px ${hairHex(config.hairColor)}` }}
                  />
                ) : null}
              </div>
              <div className="mx-8 -mt-2">
                <div className="holo-plate" aria-hidden="true" />
              </div>
            </motion.div>
            {orb && Assistant ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
                <Assistant
                  boundsRef={stageRef}
                  listening={audio.isListening}
                  question={audio.transcript}
                  answer={answer}
                  asking={asking}
                  error={audio.error}
                  onToggle={engage}
                />
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-2">
                <button type="button" className="glass-btn h-11 rounded-full px-4 text-sm text-fg" onClick={engage}>
                  {audio.isListening ? "Listening" : "Ask aloud"}
                </button>
                {audio.error ? <p className="text-center text-xs text-muted">{audio.error}</p> : null}
              </div>
            )}
          </div>
          <p className="font-mono text-xs tracking-[0.18em] text-cyan-200 uppercase">
            {config ? `${config.selectedArchetype} · ${config.outfit}` : "Awaiting a selection"}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-slate-900/60 p-4 backdrop-blur-md">
          <p className="font-mono text-[11px] tracking-[0.16em] text-cyan-300 uppercase">System status</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Status term="Projector" value="Live" />
            <Status term="Scanline" value="Stable" />
            <Status term="Desk" value={businessName} />
            <Status term="Archetype" value={config?.selectedArchetype ?? "None"} />
            <Status term="Base" value={config?.baseType ?? "Unset"} />
            <Status term="Outfit" value={config?.outfit ?? "Unset"} />
            <Status term="Voice" value={config?.voice ?? "Unset"} />
            <Status term="Personality" value={config?.personality ?? "Unset"} />
          </dl>
        </div>
      </div>
    </section>
  );
}

function AssistantFrame({
  videoRef,
  filmUrl,
  posterUrl,
  children,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  filmUrl: string;
  posterUrl: string;
  children: ReactNode;
}) {
  return (
    <div className="tactical-hero assistant-frame">
      <div className="tactical-plate">
        <video
          ref={videoRef}
          className="tactical-media"
          src={filmUrl}
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="storefront-orb-scrim" aria-hidden />
        <div className="tactical-rim" aria-hidden />
        <span className="tactical-corner is-nw" aria-hidden />
        <span className="tactical-corner is-ne" aria-hidden />
        <span className="tactical-corner is-sw" aria-hidden />
        <span className="tactical-corner is-se" aria-hidden />
      </div>
      <div className="assistant-loop pointer-events-auto">{children}</div>
    </div>
  );
}

function Status({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{term}</dt>
      <dd className="truncate font-medium text-cyan-100">{value}</dd>
    </div>
  );
}

