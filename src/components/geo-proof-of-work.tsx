import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import type { LocalizedGeoSocialProof } from "@/lib/axiom/geo-social-proof";

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

/** Regional project completions + local success stats for demo storefronts. */
export function GeoProofOfWork({
  proof,
  className = "",
}: {
  proof: LocalizedGeoSocialProof;
  className?: string;
}) {
  if (!proof.proofEnabled || proof.stats.length === 0) return null;

  return (
    <section className={`geo-proof ${className}`.trim()} aria-labelledby="geo-proof-title">
      <motion.div {...reveal} className="geo-proof-inner">
        <p className="geo-proof-kicker">
          <MapPin size={14} aria-hidden /> Proof of work · {proof.city}
        </p>
        <h2 id="geo-proof-title" className="geo-proof-title">
          {proof.headline}
        </h2>
        {proof.subhead ? <p className="geo-proof-subhead">{proof.subhead}</p> : null}
        <ul className="geo-proof-stats">
          {proof.stats.map((stat, i) => (
            <motion.li
              key={stat.id}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.06 }}
              className="geo-proof-stat"
            >
              <span className="geo-proof-stat-value">{stat.value}</span>
              <span className="geo-proof-stat-label">{stat.label}</span>
            </motion.li>
          ))}
        </ul>
        {proof.sampleLabel ? (
          <p className="geo-proof-sample">
            <Sparkles size={12} aria-hidden /> {proof.sampleLabel}
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}
