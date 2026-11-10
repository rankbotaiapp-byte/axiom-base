import { useEffect, useId, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Calculator, Sparkles, TrendingDown } from "lucide-react";
import {
  formatRevenueLoss,
  monthlyRevenueLoss,
  type PlumbingStorefront,
} from "@/lib/axiom/plumbing-storefront";
import { FxButton } from "./fx-button";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export function RoiCalculator({ config }: { config: PlumbingStorefront }) {
  const { roi, ctas } = config;
  const baseId = useId();
  const [missed, setMissed] = useState(roi.missedCallsDefault);
  const [jobValue, setJobValue] = useState(roi.jobValueDefault);

  // Studio draft pushes re-seed the starting knobs without fighting mid-drag edits on the live page.
  useEffect(() => {
    setMissed(roi.missedCallsDefault);
    setJobValue(roi.jobValueDefault);
  }, [roi.missedCallsDefault, roi.jobValueDefault, roi.missedCallsMin, roi.missedCallsMax, roi.jobValueMin, roi.jobValueMax]);

  if (!roi.enabled) return null;

  const monthly = monthlyRevenueLoss(missed, jobValue, roi.weeksPerMonth);
  const weekly = Math.round(missed * jobValue);
  const missedPct =
    roi.missedCallsMax === roi.missedCallsMin
      ? 0
      : ((missed - roi.missedCallsMin) / (roi.missedCallsMax - roi.missedCallsMin)) * 100;
  const jobPct =
    roi.jobValueMax === roi.jobValueMin
      ? 0
      : ((jobValue - roi.jobValueMin) / (roi.jobValueMax - roi.jobValueMin)) * 100;

  return (
    <section id="roi" className="pl-section pl-roi-section" aria-labelledby={`${baseId}-title`}>
      <motion.div {...reveal} className="pl-roi">
        <div className="pl-roi-copy">
          <p className="pl-kicker">
            <Calculator size={14} /> Revenue recovery
          </p>
          <h2 id={`${baseId}-title`} className="pl-h2">
            {roi.headline}
          </h2>
          {roi.subhead ? <p className="pl-lede">{roi.subhead}</p> : null}
        </div>

        <div className="pl-roi-panel">
          <div className="pl-roi-sliders">
            <label className="pl-roi-slider" htmlFor={`${baseId}-missed`}>
              <span className="pl-roi-slider-head">
                <span>Missed calls / week</span>
                <strong>{missed}</strong>
              </span>
              <input
                id={`${baseId}-missed`}
                type="range"
                min={roi.missedCallsMin}
                max={roi.missedCallsMax}
                step={1}
                value={missed}
                style={{ "--pct": `${missedPct}%` } as CSSProperties}
                onChange={(e) => setMissed(Number(e.target.value))}
              />
              <span className="pl-roi-range">
                <span>{roi.missedCallsMin}</span>
                <span>{roi.missedCallsMax}</span>
              </span>
            </label>

            <label className="pl-roi-slider" htmlFor={`${baseId}-job`}>
              <span className="pl-roi-slider-head">
                <span>Average job value</span>
                <strong>{formatRevenueLoss(jobValue)}</strong>
              </span>
              <input
                id={`${baseId}-job`}
                type="range"
                min={roi.jobValueMin}
                max={roi.jobValueMax}
                step={roi.jobValueStep}
                value={jobValue}
                style={{ "--pct": `${jobPct}%` } as CSSProperties}
                onChange={(e) => setJobValue(Number(e.target.value))}
              />
              <span className="pl-roi-range">
                <span>{formatRevenueLoss(roi.jobValueMin)}</span>
                <span>{formatRevenueLoss(roi.jobValueMax)}</span>
              </span>
            </label>
          </div>

          <div className="pl-roi-result" aria-live="polite">
            <p className="pl-roi-result-label">
              <TrendingDown size={15} /> Monthly revenue left on the table
            </p>
            <p className="pl-roi-amount" key={monthly}>
              {formatRevenueLoss(monthly)}
            </p>
            <p className="pl-roi-breakdown">
              {missed} missed × {formatRevenueLoss(jobValue)} × {roi.weeksPerMonth} weeks ≈{" "}
              <span>{formatRevenueLoss(weekly)}/week</span>
            </p>
            {roi.ctaHint ? <p className="pl-roi-hint">{roi.ctaHint}</p> : null}
            <FxButton
              variant="primary"
              href={ctas.trialHref}
              className="pl-roi-cta"
              icon={<Sparkles size={16} />}
              successLabel="Opening your trial"
            >
              {ctas.trialLabel}
            </FxButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
