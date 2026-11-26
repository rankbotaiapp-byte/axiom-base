import type { ReactNode } from "react";
import { AutopilotPitchPanel } from "./AutopilotPitchPanel";
import styles from "./autopilot.module.css";

const COCKPIT_SRC = "/autopilot/axiom-autopilot-cockpit.webp";

export function AutopilotCockpitHero({ children }: { children?: ReactNode }) {
  return (
    <section className={styles.hero} aria-labelledby="ax-hero-title">
      <div className={styles.coverBox}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COCKPIT_SRC} alt="Axiom Autopilot cockpit over a neon social runway" />
        <div className={styles.lowerShade} aria-hidden />
        <div className={styles.metalSheen} aria-hidden />
        <div className={styles.hudLift} aria-hidden />
        <div className={styles.panelSlot}>
          <AutopilotPitchPanel>{children}</AutopilotPitchPanel>
        </div>
      </div>
    </section>
  );
}
