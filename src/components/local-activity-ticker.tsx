import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, X } from "lucide-react";
import type { LocalizedGeoSocialProof } from "@/lib/axiom/geo-social-proof";

/** Non-intrusive rotating banner of recent local activations. */
export function LocalActivityTicker({
  proof,
  className = "",
}: {
  proof: LocalizedGeoSocialProof;
  className?: string;
}) {
  const items = proof.ticker;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!proof.tickerEnabled || items.length === 0 || dismissed) return;
    const first = window.setTimeout(() => setOpen(true), 1800);
    const cycle = window.setInterval(() => {
      setOpen(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setOpen(true);
      }, 420);
    }, Math.max(2500, proof.tickerIntervalMs));
    return () => {
      window.clearTimeout(first);
      window.clearInterval(cycle);
    };
  }, [proof.tickerEnabled, proof.tickerIntervalMs, items.length, dismissed]);

  if (!proof.tickerEnabled || items.length === 0 || dismissed) return null;
  const item = items[index % items.length];
  if (!item) return null;

  return (
    <div className={`geo-ticker-dock ${className}`.trim()} aria-live="polite">
      <AnimatePresence>
        {open ? (
          <motion.div
            key={item.id + index}
            className="geo-ticker"
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <span className="geo-ticker-icon" aria-hidden>
              <Activity size={14} />
            </span>
            <div className="min-w-0">
              <p className="geo-ticker-line">{item.line}</p>
              <p className="geo-ticker-meta">
                <span className="geo-ticker-dot" /> {item.place}
                {proof.sampleLabel ? <span className="geo-ticker-sample">{proof.sampleLabel}</span> : null}
              </p>
            </div>
            <button
              type="button"
              className="geo-ticker-close"
              aria-label="Hide local activity"
              onClick={() => setDismissed(true)}
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
