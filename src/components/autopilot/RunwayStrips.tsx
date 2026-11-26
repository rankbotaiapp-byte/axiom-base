import { RUNWAY_LANES } from "./runway-lanes";
import styles from "./autopilot.module.css";

export function RunwayStrips() {
  return (
    <div className={styles.strips} aria-hidden>
      {RUNWAY_LANES.map((lane) => (
        <div
          key={lane.id}
          className={styles.lane}
          style={{
            left: lane.left,
            width: lane.width,
            color: lane.color,
            backgroundColor: lane.color,
            animationDelay: lane.delay,
            animationDuration: lane.duration,
          }}
        />
      ))}
    </div>
  );
}
