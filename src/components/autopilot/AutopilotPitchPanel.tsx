import type { ReactNode } from "react";
import styles from "./autopilot.module.css";

const CHANNELS = [
  { name: "Facebook", color: "#3fb0ff" },
  { name: "Instagram", color: "#ff4f9a" },
  { name: "YouTube", color: "#ff4d4f" },
  { name: "LinkedIn", color: "#3dff8a" },
  { name: "TikTok", color: "#b05cff" },
] as const;

export function AutopilotPitchPanel({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.panel}>
      <span className={`${styles.bracket} ${styles.tl}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.tr}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bl}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.br}`} aria-hidden />
      <div className={styles.scanlines} aria-hidden />
      <div className={styles.glare} aria-hidden />

      <div className={styles.status}>
        <span>
          <span className={styles.live}>●</span> AUTOPILOT ENGAGED
        </span>
        <span className={styles.statusGo}>ALL CHANNELS · GO</span>
      </div>

      <h1 id="ax-hero-title" className={styles.headline}>
        <span className={styles.kicker}>AXIOM AUTOPILOT:</span>{" "}
        <span className={styles.titleRest}>FULL-SPECTRUM WEB PRESENCE MANAGEMENT</span>
      </h1>

      <p className={styles.body}>
        Stop manually managing your web presence. Axiom is your dedicated flight crew, automatically
        generating content and deploying ad campaigns across every channel—Facebook, Instagram, YouTube,
        LinkedIn, and TikTok. From daily posts to optimized engagement, we handle the complexity so you
        don&apos;t have to.{" "}
        <strong className={styles.fly}>Focus on your business; we&apos;ll fly the brand.</strong>
      </p>

      <div className={styles.channels} aria-label="Channels">
        {CHANNELS.map((ch) => (
          <span key={ch.name} style={{ color: ch.color }}>
            {ch.name}
          </span>
        ))}
      </div>

      {children}
    </div>
  );
}
