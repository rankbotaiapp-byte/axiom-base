import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, MapPinned, X } from "lucide-react";
import type { LocalizedCompetitorLandGrab } from "@/lib/axiom/competitor-land-grab";

/** Live urgency banner for regional territory availability. */
export function LandGrabBanner({
  data,
  className = "",
}: {
  data: LocalizedCompetitorLandGrab;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!data.showBanner || dismissed) return;
    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, [data.showBanner, dismissed]);

  if (!data.showBanner || dismissed) return null;

  return (
    <div className={`land-grab-dock ${className}`.trim()} aria-live="polite">
      <AnimatePresence>
        {visible ? (
          <motion.aside
            className="land-grab-banner"
            initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <span className="land-grab-icon" aria-hidden>
              <MapPinned size={15} />
            </span>
            <div className="min-w-0">
              <p className="land-grab-line">{data.bannerLine}</p>
              <p className="land-grab-meta">
                <Lock size={12} aria-hidden />
                Trial start locks neighbors out in ~{data.lockMinutes} min
                <span className="land-grab-meter" aria-hidden>
                  <span style={{ width: `${Math.min(100, Math.max(8, data.pressurePct))}%` }} />
                </span>
                {data.sampleLabel ? <span className="land-grab-sample">{data.sampleLabel}</span> : null}
              </p>
            </div>
            <a className="land-grab-cta" href={data.ctaHref}>
              Lock it in
            </a>
            <button
              type="button"
              className="land-grab-close"
              aria-label="Dismiss territory alert"
              onClick={() => setDismissed(true)}
            >
              <X size={14} />
            </button>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
