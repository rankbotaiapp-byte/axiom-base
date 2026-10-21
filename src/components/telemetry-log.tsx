import { useEffect, useRef, useState } from "react";

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
  if (index === 0) return `GPU  ${snap.webgl ? "WebGL2 core online" : "WebGL core standby"}`;
  if (index === 1) return `FRAME  ${snap.fps > 0 ? snap.fps : "—"} fps`;
  if (index === 2) return `LINK  ${snap.secure ? "secure" : "open"}  ${snap.online ? "verified" : "down"}`;
  return "AI  engine standby";
}

/** Compact core log for the hero. Readings come from this browser, once a second. */
export function TelemetryLog() {
  const [snap, setSnap] = useState<Snapshot>({ webgl: true, fps: 0, secure: true, online: true });
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [script, setScript] = useState("GPU  WebGL2 core online");
  const snapRef = useRef(snap);
  snapRef.current = snap;

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
    setScript(lineFor(snapRef.current, index));
    setCount(0);
  }, [index]);

  const full = reduced ? lineFor(snap, index) : script;

  useEffect(() => {
    if (!reduced) return;
    const timer = window.setInterval(() => setIndex((n) => (n + 1) % 4), 2400);
    return () => window.clearInterval(timer);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    if (count < full.length) {
      const timer = window.setTimeout(() => setCount((n) => n + 1), TYPE_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setIndex((n) => (n + 1) % 4);
      setCount(0);
    }, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [count, full, reduced]);

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
