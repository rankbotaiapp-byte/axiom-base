import { useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { CorePresenceBar } from "@/components/core-presence-bar";
import { CoreSphere } from "@/components/CoreSphere";
import type { CoreStateId } from "@/lib/axiom/core-presence";
import { cn } from "@/lib/utils";

export type OrbAskPhase = "idle" | "ready" | "listening" | "composing" | "melting";

export function GoopyOrb({
  phase,
  question,
  answer = "",
  name = "",
  videoRef,
  onEngage,
  onAsk,
  onClear,
  onHoverChange,
}: {
  phase: OrbAskPhase;
  question: string;
  answer?: string;
  /** Resting letterforms. A question, then its answer, replaces this inside the glass. */
  name?: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
  onEngage: () => void;
  onAsk: (question: string) => void;
  onClear?: () => void;
  onHoverChange: (hovering: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [fluidOn, setFluidOn] = useState(true);
  const [coreState, setCoreState] = useState<CoreStateId>("water");
  const [portal, setPortal] = useState<"orbit" | "inside">("orbit");
  const [fresh, setFresh] = useState<string | null>(null);
  const melting = phase === "melting";
  const spoken = phase === "composing" ? "" : answer.trim() || question.trim();
  const response = fresh !== null ? fresh : spoken || name;
  const fluid = Boolean(videoRef) && fluidOn;

  return (
    <div
      className={cn("orb-ask", phase === "composing" && "is-composing")}
      data-fluid={fluid ? "on" : "off"}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {fluid && videoRef ? (
        <>
          <CoreSphere
            text={response}
            videoRef={videoRef}
            reduced={Boolean(reduce)}
            state={coreState}
            portal={portal}
            room={portal === "inside"}
            onTap={onEngage}
            onUnavailable={() => setFluidOn(false)}
          />
          <CorePresenceBar
            state={coreState}
            portal={portal}
            onState={setCoreState}
            onPortal={setPortal}
            onFresh={() => {
              onClear?.();
              setFresh("");
              window.setTimeout(() => setFresh(null), 40);
            }}
          />
        </>
      ) : (
        <button type="button" className="orb-ask-hit" aria-label="Ask the assistant" onClick={onEngage} />
      )}
      {phase === "idle" || phase === "ready" ? (
        <p className="orb-question is-hint" aria-hidden="true">
          Ask the orb
        </p>
      ) : null}
      {phase === "listening" && !question ? <p className="orb-question is-hint">Listening</p> : null}
      {response && !fluid ? <p className={cn("orb-question", melting && "is-melting")}>{response}</p> : null}
      {phase === "composing" ? (
        <form
          className="orb-compose"
          onSubmit={(event) => {
            event.preventDefault();
            const next = draft.trim();
            if (!next) return;
            setDraft("");
            onAsk(next);
          }}
        >
          <label className="sr-only" htmlFor="orb-question">
            Your question
          </label>
          <input
            id="orb-question"
            value={draft}
            autoFocus
            placeholder="Ask the orb"
            onChange={(event) => setDraft(event.target.value)}
          />
        </form>
      ) : null}
    </div>
  );
}
