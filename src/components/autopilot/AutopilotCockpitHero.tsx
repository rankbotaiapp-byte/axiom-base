"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AutopilotPitchPanel } from "./AutopilotPitchPanel";
import styles from "./autopilot.module.css";

/** Wide Autopilot Status Console — served from public/ for Vercel + local. */
export const AUTOPILOT_CONSOLE_SRC = "/autopilot/watermarked_img_17581725829818372770.png";

const HUD = [
  { id: "content", label: "Content creation", note: "Daily stills & loops" },
  { id: "social", label: "Social publishing", note: "Auto-post 24/7" },
  { id: "web", label: "Web presence", note: "GBP + site refresh" },
  { id: "book", label: "Job bookings", note: "Calendar + owner SMS" },
] as const;

export function AutopilotCockpitHero({ children }: { children?: ReactNode }) {
  const [engaged, setEngaged] = useState(true);
  const [rev, setRev] = useState(0);

  const pulse = () => {
    setRev((n) => n + 1);
  };

  return (
    <>
      <section className={styles.hero} aria-label="Axiom Autopilot status console">
        <div className={`${styles.consoleFrame} ${engaged ? styles.consoleLive : styles.consoleIdle}`}>
          <div
            className={`${styles.consoleStage} ${engaged ? styles.consolePulse : ""}`}
            style={{ "--rev-scale": String(1 + Math.min(rev, 8) * 0.008) } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.heroMedia}
              src={AUTOPILOT_CONSOLE_SRC}
              alt="Axiom Autopilot status console: system integrity 872 of 1000, social and web presence live"
              width={1600}
              height={720}
              decoding="async"
            />
          </div>
          <div className={styles.vignette} aria-hidden />
          <div className={styles.rimGlow} aria-hidden />

          <ul className={styles.hudRail} aria-label="Autopilot live systems">
            {HUD.map((item) => (
              <li key={item.id} className={styles.hudChip}>
                <span className={styles.hudDot} data-live={engaged ? "on" : "off"} />
                <span>
                  <strong>{item.label}</strong>
                  <em>{item.note}</em>
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.consoleControls}>
            <motion.button
              type="button"
              className={engaged ? styles.modeOn : styles.modeOff}
              aria-pressed={engaged}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setEngaged((on) => !on);
                pulse();
              }}
            >
              {engaged ? "Autopilot engaged" : "Autopilot idle"}
            </motion.button>
            <motion.button
              type="button"
              className={styles.revBtn}
              whileTap={{ scale: 0.96 }}
              onClick={pulse}
            >
              Rev
            </motion.button>
          </div>
        </div>
      </section>
      <section className={styles.copyBand} aria-labelledby="ax-hero-title">
        <AutopilotPitchPanel>{children}</AutopilotPitchPanel>
      </section>
    </>
  );
}
