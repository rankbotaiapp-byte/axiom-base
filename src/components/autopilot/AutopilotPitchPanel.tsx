import type { ReactNode } from "react";
import styles from "./autopilot.module.css";

const CHANNELS = [
  { name: "Google Business", color: "#00ffcc" },
  { name: "Facebook", color: "#3fb0ff" },
  { name: "Instagram", color: "#ff4f9a" },
  { name: "YouTube", color: "#ff4d4f" },
  { name: "TikTok", color: "#b05cff" },
  { name: "LinkedIn", color: "#3dff8a" },
] as const;

const BADGES = [
  "DAILY AUTO-CONTENT & WEB UPDATES",
  "ACTIVE SONAR LEAD CAPTURE",
  "24/7 CALENDAR BOOKING + INSTANT OWNER ALERTS",
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

      <p className={styles.status}>
        <span>
          <span className={styles.live}>●</span> AUTOPILOT ENGAGED · 24/7 CONTENT &amp; BOOKING MACHINE
        </span>
      </p>

      <h1 id="ax-hero-title" className={styles.headline}>
        AXIOM DOESN&apos;T JUST HOLD A NET. IT HUNTS, CREATES &amp; BOOKS 24/7.
      </h1>

      <p className={styles.body}>
        Most websites are like mounting a net to the side of a boat and hoping a few leads drift in as you
        drive by. Axiom is giving that net to an automated machine equipped with underwater sonar and the
        power to steer straight to where the jobs are—creating daily content, updating your web presence
        across Google and social feeds, and actively landing booked jobs on your calendar while sending
        instant alerts to your phone around the clock.
      </p>

      <div className={styles.badges} aria-label="Capabilities">
        {BADGES.map((badge, i) => (
          <span key={badge} className={i === 1 ? styles.badgeGold : styles.badgeCyan}>
            {badge}
          </span>
        ))}
      </div>

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
