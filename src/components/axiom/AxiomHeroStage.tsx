"use client";

import { AutopilotCockpitHero } from "@/components/autopilot/AutopilotCockpitHero";
import styles from "@/components/autopilot/autopilot.module.css";
import { LANDING_HERO_CLAIM, LANDING_HERO_HEADLINE, LANDING_HERO_PRICE } from "@/lib/axiom/landing-hero";

interface AxiomHeroStageProps {
  panelSrc?: string;
  onStart?: () => void;
  onProof?: () => void;
  priceNote?: string;
}

export default function AxiomHeroStage({
  panelSrc: _panelSrc,
  onStart,
  onProof: _onProof,
  priceNote = LANDING_HERO_PRICE,
}: AxiomHeroStageProps) {
  return (
    <AutopilotCockpitHero>
      <div className={styles.ctaRow}>
        <button type="button" onClick={onStart} className={`${styles.ctaGold} ax-btn-multiline`}>
          {LANDING_HERO_CLAIM}
        </button>
      </div>
      <p className={styles.price}>{priceNote}</p>
      <p className="sr-only">{LANDING_HERO_HEADLINE}</p>
    </AutopilotCockpitHero>
  );
}
