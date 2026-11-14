"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface VideoBackdropProps {
  src: string;
  poster: string;
}

/**
 * Edge-to-edge looping hero video with an obsidian gradient and blue-water scrim.
 * The source file has a crossfade baked into its last second, so `loop` is seamless.
 */
export function VideoBackdrop({ src, poster }: VideoBackdropProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // iOS Safari sometimes ignores the autoplay attribute until play() is called explicitly.
    const tryPlay = () => {
      video.muted = true;
      void video.play().catch(() => undefined);
    };
    tryPlay();

    // Save battery: pause when tab is hidden.
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else tryPlay();
    };
    // Retry on first interaction (Low Power Mode blocks autoplay).
    const onFirstTouch = () => tryPlay();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onFirstTouch, { once: true, passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onFirstTouch);
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
      {/* Poster shows instantly; video fades in once it can play through */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${poster})` }}
      />
      <motion.video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        onCanPlay={() => setReady(true)}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 1.08 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Obsidian base scrim */}
      <div className="absolute inset-0 bg-slate-950/20" />
      {/* Vertical obsidian gradient — deepest at top & bottom where HUD text sits */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/80" />
      {/* Ambient blue-water cinematic scrim */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(8,145,178,0.22),transparent_60%)] mix-blend-screen" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(2,6,23,0.7)_100%)]" />
      {/* Caustic light shimmer */}
      <motion.div
        className="absolute -inset-[20%] opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(165,243,252,0.9) 0px, transparent 2px, transparent 38px), repeating-linear-gradient(65deg, rgba(103,232,249,0.6) 0px, transparent 2px, transparent 52px)",
        }}
        animate={{ x: ["0%", "4%", "0%"], y: ["0%", "-3%", "0%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Scanlines for the monitor feel */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
