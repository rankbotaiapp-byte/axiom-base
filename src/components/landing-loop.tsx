import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Beat = "idle" | "pending" | "lock" | "solid";

const WAIT_MS = 1650;
const LOCK_MS = 1200;
const HOLD_MS = 2200;
const GAP_MS = 2800;

const DETAIL = "Signature cut · Tue, Oct 14, 2:00 PM";

/** The shop ring, replaying a guest booking from request through lock-in. */
export function LandingBookingLoop() {
  const [beat, setBeat] = useState<Beat>("idle");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let timer = 0;
    const later = (ms: number, next: () => void) => {
      timer = window.setTimeout(next, ms);
    };
    const run = () => {
      setCycle((n) => n + 1);
      setBeat("pending");
      later(WAIT_MS, () => {
        setCycle((n) => n + 1);
        setBeat("lock");
        later(LOCK_MS, () => {
          setBeat("solid");
          later(HOLD_MS, () => {
            setBeat("idle");
            later(GAP_MS, run);
          });
        });
      });
    };
    later(GAP_MS, run);
    return () => window.clearTimeout(timer);
  }, []);

  const state = beat === "pending" ? "pulse" : beat === "lock" ? "lock" : beat === "solid" ? "solid" : "idle";
  const message = beat === "pending" ? "Waiting for confirmation" : beat === "lock" ? "You're booked — locked in" : null;
  const locked = beat === "lock" || beat === "solid";

  return (
    <>
      <div
        key={cycle}
        className="axiom-ring"
        data-state={state}
        style={{ ["--ring-color" as string]: "var(--color-accent)" }}
        aria-hidden="true"
      >
        <span className="axiom-ring-bloom" />
        <span className="axiom-ring-edge" />
      </div>
      <AnimatePresence>
        {message ? (
          <motion.div
            key={`${cycle}-${message}`}
            initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 top-0 z-[10000] flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]"
            aria-live="polite"
          >
            <p className="rounded-full bg-surface/90 px-4 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.1)]">
              {message}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {locked ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[10000] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-md rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Locked in</p>
            <p className="mt-2 text-sm">{DETAIL}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
