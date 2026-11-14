import { Component, Suspense, lazy, useEffect, useState, type ReactNode, type RefObject } from "react";

const HoloGlassScene = lazy(() => import("./HoloGlassScene"));

class LayerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* A WebGL failure must never take the hero down: the video + CSS grade stay as-is. */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Client-only holographic glass overlay for a cinematic hero.
 * Lazy-loads three.js, pauses off-screen, and opts out for reduced motion, no WebGL, or Save-Data.
 */
export function HoloGlassLayer({
  video,
  host,
  dimmed = false,
  disabled = false,
}: {
  video: RefObject<HTMLVideoElement | null>;
  host: RefObject<HTMLElement | null>;
  /** Lower intensity while another effect owns the frame (e.g. the freeze-pan orbit). */
  dimmed?: boolean;
  disabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    setEnabled(!reduce && !saveData && webglAvailable());
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [host]);

  if (!enabled || disabled) return null;

  return (
    <div className="holo-glass-layer" aria-hidden>
      <LayerBoundary>
        <Suspense fallback={null}>
          <HoloGlassScene video={video} host={host} intensity={dimmed ? 0.35 : 1} running={visible} />
        </Suspense>
      </LayerBoundary>
    </div>
  );
}
