import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, PhoneIncoming, PhoneMissed, RotateCcw, Zap } from "lucide-react";
import { missedCallScript, type MissedCallStep, type PlumbingStorefront } from "@/lib/axiom/plumbing-storefront";
import { FxButton } from "./fx-button";

export type MissedCallSimHandle = { run: () => void };

function useClock(): string {
  // Client-only so server and browser markup match.
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    tick();
    const t = window.setInterval(tick, 30_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/**
 * Plays the automated missed-call recovery on a phone mock: ring → missed →
 * instant text-back → the customer replies → the job is booked.
 * Purely a simulation — nothing is sent. Labeled as such in the UI.
 */
export const MissedCallSim = forwardRef<MissedCallSimHandle, { config: PlumbingStorefront }>(function MissedCallSim(
  { config },
  handle,
) {
  const script = useMemo(() => missedCallScript(config), [config]);
  const [shown, setShown] = useState<MissedCallStep[]>([]);
  const [typing, setTyping] = useState<"out" | "in" | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timers = useRef<number[]>([]);
  const feed = useRef<HTMLDivElement>(null);
  const now = useClock();

  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  const run = useCallback(() => {
    clear();
    setShown([]);
    setTyping(null);
    setRunning(true);
    setElapsed(0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduce ? 0.35 : 1;
    script.forEach((step, i) => {
      const at = step.at * speed;
      if ((step.kind === "sms-out" || step.kind === "sms-in") && !reduce) {
        timers.current.push(window.setTimeout(() => setTyping(step.kind === "sms-out" ? "out" : "in"), Math.max(0, at - 900)));
      }
      timers.current.push(
        window.setTimeout(() => {
          setTyping(null);
          setShown((list) => [...list, step]);
          setElapsed(step.at);
          if (i === script.length - 1) setRunning(false);
        }, at),
      );
    });
  }, [clear, script]);

  useImperativeHandle(handle, () => ({ run }), [run]);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [shown, typing]);

  const last = shown.at(-1);
  const ringing = running && (!last || last.kind === "ring");
  const booked = shown.find((s) => s.kind === "booked");
  const missedAt = shown.find((s) => s.kind === "missed");
  const firstText = shown.find((s) => s.kind === "sms-out");
  const recovery = missedAt && firstText ? ((firstText.at - missedAt.at) / 1000).toFixed(1) : null;

  return (
    <div className="mc-wrap">
      <div className="mc-phone" data-ringing={ringing || undefined}>
        <div className="mc-notch" aria-hidden />
        <div className="mc-status">
          <span>{now}</span>
          <span className="mc-sim-tag">
            <Zap size={11} /> Simulation
          </span>
        </div>

        <div className="mc-head">
          <div className="mc-avatar" aria-hidden>
            {config.missedCall.callerName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="mc-name">{config.missedCall.callerName}</p>
            <p className="mc-sub">Customer · texting {config.company}</p>
          </div>
        </div>

        <div ref={feed} className="mc-feed" aria-live="polite">
          {!running && shown.length === 0 && (
            <div className="mc-empty">
              <PhoneMissed size={28} />
              <p>Tap below to watch a missed emergency call turn into a booked job — automatically.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {shown.map((step, i) => (
              <motion.div
                key={`${step.kind}-${i}`}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={`mc-row is-${step.kind}`}
              >
                {step.kind === "ring" && (
                  <div className="mc-event is-ring">
                    <PhoneIncoming size={15} /> {step.label}
                  </div>
                )}
                {step.kind === "missed" && (
                  <div className="mc-event is-missed">
                    <PhoneMissed size={15} /> {step.label}
                  </div>
                )}
                {(step.kind === "sms-out" || step.kind === "sms-in") && <div className="mc-bubble">{step.body}</div>}
                {step.kind === "booked" && (
                  <div className="mc-booked">
                    <CalendarCheck size={20} />
                    <div>
                      <p className="mc-booked-title">{step.label}</p>
                      <p className="mc-booked-slot">{step.slot}</p>
                    </div>
                    <span className="mc-confetti" aria-hidden>
                      {Array.from({ length: 10 }, (_, k) => (
                        <i key={k} style={{ "--k": k } as React.CSSProperties} />
                      ))}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <div className={`mc-row is-${typing === "out" ? "sms-out" : "sms-in"}`}>
              <div className="mc-bubble mc-typing" aria-label="typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>

        <div className="mc-foot">
          <div className="mc-meter">
            <span>Response</span>
            <strong>{recovery ? `${recovery}s` : "—"}</strong>
          </div>
          <div className="mc-meter">
            <span>Elapsed</span>
            <strong>{(elapsed / 1000).toFixed(1)}s</strong>
          </div>
          <div className="mc-meter">
            <span>Status</span>
            <strong className={booked ? "is-ok" : ""}>{booked ? "Booked" : running ? "Recovering" : "Idle"}</strong>
          </div>
        </div>
      </div>

      <div className="mc-actions">
        <FxButton
          variant={shown.length ? "ghost" : "primary"}
          icon={shown.length ? <RotateCcw size={16} /> : <PhoneMissed size={16} />}
          onPress={run}
        >
          {shown.length ? "Replay simulation" : config.ctas.missedCallLabel}
        </FxButton>
      </div>
    </div>
  );
});
