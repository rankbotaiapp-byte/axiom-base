import { useEffect, useRef, useState } from "react";
import { BROWSER_LOG_ORDER } from "@/lib/axiom/hero-films";

const TYPE_MS = 32;
const HOLD_MS = 1100;

type Snapshot = {
  webgl: boolean;
  fps: number;
  secure: boolean;
  online: boolean;
};

function readLink(): Pick<Snapshot, "secure" | "online" | "webgl"> {
  return {
    webgl:
      typeof WebGL2RenderingContext !== "undefined" &&
      !document.documentElement.classList.contains("fluid-off"),
    secure: window.isSecureContext,
    online: navigator.onLine,
  };
}

function lineFor(snap: Snapshot, index: number) {
  const key = BROWSER_LOG_ORDER[index];
  if (key === "GPU") return `GPU  ${snap.webgl ? "WebGL2 core online" : "WebGL core standby"}`;
  if (key === "FRAME") return `FRAME  ${snap.fps > 0 ? snap.fps : "—"} fps`;
  if (key === "LINK") return `LINK  ${snap.secure ? "secure" : "open"}  ${snap.online ? "verified" : "down"}`;
  return "AI  engine standby";
}

/** Readable desk feed: bookings and operator actions, newest first. */
export function TelemetryLog({
  dataset = [],
  variant = "ticker",
}: {
  dataset?: readonly string[];
  variant?: "ticker" | "desk";
}) {
  if (variant === "desk") return <TelemetryDesk lines={dataset} />;
  return <TelemetryTicker dataset={dataset} />;
}

function TelemetryDesk({ lines }: { lines: readonly string[] }) {
  const shown = lines.map((line) => line.trim()).filter(Boolean).slice(0, 12);
  return (
    <section className="mission-log" aria-label="Activity log">
      <header className="flex items-center gap-2">
        <span className="telemetry-live" aria-hidden />
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Activity</p>
      </header>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Quiet book. Confirmations land here.</p>
      ) : (
        <ol className="mt-3 grid gap-2">
          {shown.map((line, index) => (
            <li key={`${index}-${line}`} className="mission-log-line">
              {line}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TelemetryTicker({ dataset }: { dataset: readonly string[] }) {
  const extra = dataset.map((line) => line.trim()).filter(Boolean).slice(0, 3);
  const total = BROWSER_LOG_ORDER.length + extra.length;
  const [snap, setSnap] = useState<Snapshot>({ webgl: true, fps: 0, secure: true, online: true });
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [script, setScript] = useState(extra[0] || "GPU  WebGL2 core online");
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const extraKey = extra.join("\n");

  const lineAt = (shot: Snapshot, cursor: number) => {
    if (cursor < extra.length) return extra[cursor] ?? "";
    return lineFor(shot, cursor - extra.length);
  };

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(motion.matches);
    const onMotion = () => setReduced(motion.matches);
    motion.addEventListener("change", onMotion);

    let frames = 0;
    let last = performance.now();
    let raf = 0;
    let dead = false;
    const loop = (now: number) => {
      if (dead) return;
      raf = 0;
      if (document.visibilityState !== "visible") return;
      frames += 1;
      if (now - last >= 1000) {
        const fps = Math.round((frames * 1000) / (now - last));
        const link = readLink();
        setSnap({ fps, ...link });
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    const onVisibility = () => {
      if (dead) return;
      if (document.visibilityState !== "visible") {
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);

    const onNet = () => setSnap((prev) => ({ ...prev, ...readLink() }));
    window.addEventListener("online", onNet);
    window.addEventListener("offline", onNet);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
      window.removeEventListener("online", onNet);
      window.removeEventListener("offline", onNet);
    };
  }, []);

  useEffect(() => {
    setScript(lineAt(snapRef.current, index));
    setCount(0);
  }, [index, extraKey]);

  const full = reduced ? lineAt(snap, index) : script;

  useEffect(() => {
    if (!reduced) return;
    const timer = window.setInterval(() => setIndex((n) => (n + 1) % total), 2400);
    return () => window.clearInterval(timer);
  }, [reduced, total]);

  useEffect(() => {
    if (reduced) return;
    if (count < full.length) {
      const timer = window.setTimeout(() => setCount((n) => n + 1), TYPE_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setIndex((n) => (n + 1) % total);
      setCount(0);
    }, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [count, full, reduced, total]);

  const shown = reduced ? full : full.slice(0, count);

  return (
    <aside className="telemetry-panel pointer-events-none left-3 top-[5.25rem] sm:left-8" aria-label="System core log">
      <span className="telemetry-live" aria-hidden />
      <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-fg/80">
        <span className="text-emerald">CORE</span>
        <span className="mx-1.5 text-faint">/</span>
        <span>{shown}</span>
        {reduced ? null : <span className="telemetry-caret" aria-hidden />}
      </p>
    </aside>
  );
}
