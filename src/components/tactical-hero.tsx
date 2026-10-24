import { useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function TacticalHero({
  videoUrl,
  imageUrl,
  label,
  compact = false,
  children,
}: {
  videoUrl?: string;
  imageUrl?: string;
  label: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.94, 1]);
  const fieldId = useId();
  const [line, setLine] = useState("");
  const [melting, setMelting] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    const clean = question.trim();
    if (!clean || busy) return;
    setLine("");
    setMelting(clean);
    setAnswer("");
    setBusy(true);
    window.setTimeout(() => setMelting(""), 1500);
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
      setBusy(false);
    }
  }

  return (
    <section ref={ref} className={compact ? "tactical-hero is-compact" : "tactical-hero is-stage"} aria-label={label}>
      <motion.div className="tactical-plate" style={{ scale }}>
        {videoUrl ? (
          <video
            key={videoUrl}
            className="tactical-media"
            src={videoUrl}
            poster={imageUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : imageUrl ? (
          <img className="tactical-media" src={imageUrl} alt="" />
        ) : null}
        <div className="tactical-rim" aria-hidden />
        <span className="tactical-corner is-nw" aria-hidden />
        <span className="tactical-corner is-ne" aria-hidden />
        <span className="tactical-corner is-sw" aria-hidden />
        <span className="tactical-corner is-se" aria-hidden />
        {children}
        <form
          className="tactical-inquiry"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(line);
          }}
        >
          <label className="sr-only" htmlFor={fieldId}>
            Ask about this trade
          </label>
          {melting ? <p className="orb-question is-melting">{melting}</p> : null}
          {answer ? <p className="tactical-answer">{answer}</p> : null}
          <input
            id={fieldId}
            value={line}
            placeholder={busy ? "Shaping the answer" : "Ask about this trade"}
            disabled={busy}
            onChange={(event) => setLine(event.target.value)}
          />
        </form>
      </motion.div>
    </section>
  );
}
