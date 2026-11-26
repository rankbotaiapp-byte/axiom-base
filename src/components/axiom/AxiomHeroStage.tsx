"use client";

import { AutopilotCockpitHero } from "@/components/autopilot/AutopilotCockpitHero";
import styles from "@/components/autopilot/autopilot.module.css";
import {
  LANDING_HERO_CLAIM,
  LANDING_HERO_HEADLINE,
  LANDING_HERO_PRICE,
  LANDING_HERO_PROOF,
} from "@/lib/axiom/landing-hero";

interface AxiomHeroStageProps {
  panelSrc?: string;
  onStart?: () => void;
  onProof?: () => void;
  priceNote?: string;
}

export default function AxiomHeroStage({
  panelSrc: _panelSrc,
  onStart,
  onProof,
  priceNote = LANDING_HERO_PRICE,
}: AxiomHeroStageProps) {
  return (
    <AutopilotCockpitHero>
      <div className={styles.ctaRow}>
        <button type="button" onClick={onStart} className="ax-btn-amber ax-btn-multiline min-h-12">
          {LANDING_HERO_CLAIM}
        </button>
        <button type="button" onClick={onProof} className="ax-btn-ghost min-h-12">
          {LANDING_HERO_PROOF}
        </button>
      </div>
      <p className={styles.price}>{priceNote}</p>
      <p className="sr-only">{LANDING_HERO_HEADLINE}</p>
    </AutopilotCockpitHero>
  );
}
