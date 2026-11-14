import { motion } from "framer-motion";
import { ArrowRight, Bot, MessageSquareText, PhoneMissed, Sparkles, XCircle } from "lucide-react";
import type { LocalizedCompetitorLandGrab } from "@/lib/axiom/competitor-land-grab";

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

/** Side-by-side legacy stack vs Axiom replacement for demo / outreach storefronts. */
export function CompetitorReplacement({
  data,
  className = "",
}: {
  data: LocalizedCompetitorLandGrab;
  className?: string;
}) {
  if (!data.showComparison) return null;

  return (
    <section className={`comp-replace ${className}`.trim()} aria-labelledby="comp-replace-title">
      <motion.div {...reveal} className="comp-replace-inner">
        <p className="comp-replace-kicker">
          <PhoneMissed size={14} aria-hidden /> Competitor replacement
        </p>
        <h2 id="comp-replace-title" className="comp-replace-title">
          {data.headline}
        </h2>
        {data.subhead ? <p className="comp-replace-subhead">{data.subhead}</p> : null}

        <div className="comp-replace-grid" role="table" aria-label="Legacy stack versus Axiom">
          <div className="comp-replace-col is-legacy" role="rowgroup">
            <p className="comp-replace-col-head" role="columnheader">
              <XCircle size={14} aria-hidden /> {data.legacyColumn}
            </p>
            <ul>
              {data.rows.map((row) => (
                <li key={`l-${row.id}`}>{row.legacy}</li>
              ))}
            </ul>
          </div>
          <div className="comp-replace-col is-axiom" role="rowgroup">
            <p className="comp-replace-col-head" role="columnheader">
              <Sparkles size={14} aria-hidden /> {data.axiomColumn}
            </p>
            <ul>
              {data.rows.map((row) => (
                <li key={`a-${row.id}`}>{row.axiom}</li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="comp-replace-pills" aria-label="Axiom capabilities">
          <li>
            <MessageSquareText size={14} aria-hidden /> Instant text-back
          </li>
          <li>
            <Bot size={14} aria-hidden /> 24/7 AI booking
          </li>
          <li>
            <PhoneMissed size={14} aria-hidden /> Missed-call recovery
          </li>
        </ul>

        <a className="comp-replace-cta" href={data.ctaHref}>
          {data.ctaLabel} <ArrowRight size={16} aria-hidden />
        </a>
        {data.sampleLabel ? <p className="comp-replace-sample">{data.sampleLabel}</p> : null}
      </motion.div>
    </section>
  );
}
