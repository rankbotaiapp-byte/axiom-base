"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { media, videoCrop } from "./config";
import { CrossfadeVideoLoop } from "./gl/videoLoop";
import styles from "./apex.module.css";
import type { StageProps } from "./stage-types";

/**
 * Low-power tier: no WebGL. Plays the pre-cropped, headline-free loop
 * (`apex-clean-loop.mp4`, baked with ffmpeg delogo + crop) as a pure CSS
 * object-fit: cover layer, still cross-dissolved so the loop point is invisible.
 */
export default function CssStage({ onReady, stageRef }: StageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [flashKey, setFlashKey] = useState(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useImperativeHandle(stageRef, () => ({ surge: () => setFlashKey((k) => k + 1) }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const clipLength = videoCrop.loop.end - videoCrop.loop.start;
    const loop = new CrossfadeVideoLoop(media.cleanLoop, { start: 0, end: clipLength - 0.05 }, 0.5);
    const focal = `${(videoCrop.focal.x * 100).toFixed(1)}% ${(videoCrop.focal.y * 100).toFixed(1)}%`;

    for (const v of [loop.a, loop.b]) {
      v.poster = media.poster;
      v.className = "absolute inset-0 h-full w-full object-cover";
      v.style.objectPosition = focal;
      v.style.filter = "contrast(1.1) saturate(1.12) brightness(0.96)";
      v.style.transform =
        "scale(calc(1.06 * var(--apex-zoom, 1))) translate3d(calc(var(--apex-tilt-x, 0) * -1.6%), calc(var(--apex-tilt-y, 0) * 1.2%), 0)";
      v.setAttribute("aria-hidden", "true");
      host.appendChild(v);
    }
    loop.b.style.opacity = "0";
    loop.a.addEventListener("playing", () => onReadyRef.current?.(), { once: true });

    const tryPlay = async () => {
      if (await loop.play()) window.removeEventListener("pointerdown", tryPlay);
    };
    void tryPlay();
    window.addEventListener("pointerdown", tryPlay);

    let raf = 0;
    const tick = () => {
      loop.update();
      loop.b.style.opacity = loop.weightB.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", tryPlay);
      loop.dispose();
      loop.a.remove();
      loop.b.remove();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div ref={hostRef} className="absolute inset-0" />
      {flashKey > 0 && <div key={flashKey} className={`pointer-events-none absolute inset-0 ${styles.launchFlash}`} />}
    </div>
  );
}
