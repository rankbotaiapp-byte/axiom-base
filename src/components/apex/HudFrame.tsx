import styles from "./apex.module.css";
import { cx } from "./ui";

/** Obsidian monitor bezel: glowing cyan frame, tactical brackets, tick scales, scanlines. */
export default function HudFrame() {
  const bracket = "absolute h-10 w-10 border-cyan-300 sm:h-14 sm:w-14 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      <div className={cx("absolute inset-0", styles.scanlines)} />
      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: "100%" }}>
        <div className={cx("absolute inset-x-0", styles.sweep)} />
      </div>

      <div className="absolute inset-2 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2),inset_0_0_60px_rgba(6,182,212,0.08)] sm:inset-4">
        <span className={cx(bracket, "-left-px -top-px border-l-2 border-t-2")} />
        <span className={cx(bracket, "-right-px -top-px border-r-2 border-t-2")} />
        <span className={cx(bracket, "-bottom-px -left-px border-b-2 border-l-2")} />
        <span className={cx(bracket, "-bottom-px -right-px border-b-2 border-r-2")} />

        {/* top centre notch */}
        <div className="absolute left-1/2 top-0 h-[3px] w-28 -translate-x-1/2 bg-cyan-400/80 shadow-[0_0_14px_rgba(34,211,238,0.9)] sm:w-44" />

        {/* side tick scales */}
        <div className="absolute inset-y-[22%] left-1.5 hidden flex-col justify-between md:flex">
          {Array.from({ length: 13 }, (_, i) => (
            <span key={i} className={cx("h-px bg-cyan-400/50", i % 4 === 0 ? "w-3" : "w-1.5")} />
          ))}
        </div>
        <div className="absolute inset-y-[22%] right-1.5 hidden flex-col items-end justify-between md:flex">
          {Array.from({ length: 13 }, (_, i) => (
            <span key={i} className={cx("h-px bg-cyan-400/50", i % 4 === 0 ? "w-3" : "w-1.5")} />
          ))}
        </div>
      </div>
    </div>
  );
}
