"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AxiomDarkAxiomAtmosphereLazy from "@/components/AxiomDarkAxiomAtmosphereLazy";

/** Particle-break film that ends on the locked DarkAxiom constellation frame. */
export const AXIOM_PARTICLE_FILM = "/media/studio-cyan-fog-loop.mp4";
const FILM_FALLBACKS = [
  "/media/axio-plumber-hero.mp4",
  "/media/studio-cyan-fog-loop.mp4",
] as const;

/**
 * Play-once → permanent freeze-lock stage behind Studio upload / landing.
 * Video never loops. Neon green fog + cyan/green rim backlight sit at z-0;
 * upload UI must remain z-10 with full pointer access.
 */
export function AxiomParticleCanvasBackground({
  className = "",
  opacityClass = "opacity-55",
  fixed = true,
  logoAnchor = "header",
  /** WebGL constellation + mist (default on). */
  atmosphere = true,
  src = AXIOM_PARTICLE_FILM,
}: {
  className?: string;
  opacityClass?: string;
  fixed?: boolean;
  logoAnchor?: "header" | "center";
  atmosphere?: boolean;
  /** Override primary MP4 (defaults to particle-logo-axiom.mp4). */
  src?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frozenRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [filmSrc, setFilmSrc] = useState(src);
  const [frozen, setFrozen] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(-1);

  const lockFinalFrame = useCallback(() => {
    if (frozenRef.current) return;
    frozenRef.current = true;
    const video = videoRef.current;
    if (video) {
      try {
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        if (dur > 0.05) video.currentTime = Math.max(0, dur - 0.05);
      } catch {
        // ignore seek errors
      }
      video.pause();
      video.loop = false;
    }
    setFrozen(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    frozenRef.current = false;
    setFrozen(false);
    setFilmSrc(src);
    setFallbackIndex(-1);
  }, [src]);

  useEffect(() => {
    if (reduceMotion) {
      setFrozen(true);
      return;
    }
    const video = videoRef.current;
    if (!video || !filmSrc) return;

    const onEnded = () => lockFinalFrame();
    const onTimeUpdate = () => {
      if (frozenRef.current) return;
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      if (video.currentTime >= dur - 0.08) lockFinalFrame();
    };

    video.loop = false;
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    void video.play().catch(() => undefined);

    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [filmSrc, reduceMotion, lockFinalFrame]);

  const onVideoError = () => {
    const next = fallbackIndex + 1;
    if (next < FILM_FALLBACKS.length) {
      frozenRef.current = false;
      setFrozen(false);
      setFallbackIndex(next);
      setFilmSrc(FILM_FALLBACKS[next]!);
    } else {
      lockFinalFrame();
    }
  };

  const headerWatermark = logoAnchor === "header";
  const shellPosition = fixed ? "fixed" : "absolute";

  return (
    <div
      className={`${shellPosition} inset-0 z-0 h-full w-full overflow-hidden pointer-events-none bg-[#030712] ${className}`}
      aria-hidden
      data-axiom-particle-stage=""
      data-frozen={frozen ? "" : undefined}
    >
      {/* Play-once particle film — freezes on final locked frame for the session */}
      {!reduceMotion ? (
        <video
          ref={videoRef}
          key={filmSrc}
          src={filmSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
          loop={false}
          tabIndex={-1}
          onError={onVideoError}
          className={`absolute inset-0 z-0 h-full w-full object-cover mix-blend-screen pointer-events-none ${opacityClass} ${
            headerWatermark ? "object-top" : "object-center"
          }`}
        />
      ) : (
        <div
          className="absolute inset-0 z-0 h-full w-full opacity-50"
          style={{
            background: headerWatermark
              ? "radial-gradient(ellipse at 50% 12%, rgba(0,242,254,0.28), transparent 55%)"
              : "radial-gradient(ellipse at 50% 45%, rgba(52,211,153,0.22), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(6,182,212,0.12), transparent 50%)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Neon green + cyan backlight staging behind the upload plate */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: [
            "radial-gradient(ellipse 55% 40% at 50% 42%, rgba(52,211,153,0.22), transparent 70%)",
            "radial-gradient(ellipse 45% 35% at 50% 48%, rgba(6,182,212,0.18), transparent 65%)",
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(3,7,18,0.85), transparent 55%)",
          ].join(","),
        }}
      />

      {/* Lightweight CSS volumetric mist — neon green / cyan soft orbs */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
        <span
          className="absolute animate-[axiomFogDrift_22s_ease-in-out_infinite] rounded-full blur-3xl [mix-blend-mode:screen]"
          style={{
            width: "min(55vw, 520px)",
            height: "min(40vw, 380px)",
            left: "8%",
            top: "18%",
            background: "radial-gradient(circle, rgba(52,211,153,0.35), transparent 70%)",
          }}
        />
        <span
          className="absolute animate-[axiomFogDrift_26s_ease-in-out_infinite] rounded-full blur-3xl [animation-delay:-6s] [mix-blend-mode:screen]"
          style={{
            width: "min(48vw, 460px)",
            height: "min(36vw, 340px)",
            right: "6%",
            top: "28%",
            background: "radial-gradient(circle, rgba(6,182,212,0.28), transparent 70%)",
          }}
        />
        <span
          className="absolute animate-[axiomFogDrift_20s_ease-in-out_infinite] rounded-full blur-3xl [animation-delay:-11s] [mix-blend-mode:screen]"
          style={{
            width: "min(60vw, 560px)",
            height: "min(42vw, 400px)",
            left: "22%",
            bottom: "8%",
            background: "radial-gradient(circle, rgba(16,185,129,0.22), transparent 72%)",
          }}
        />
      </div>

      {/* WebGL mist + freeze constellation behind UI */}
      {atmosphere && !reduceMotion ? (
        <AxiomDarkAxiomAtmosphereLazy
          mode="absolute"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
        />
      ) : null}

      {headerWatermark ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[48%] bg-gradient-to-b from-transparent via-[#030712]/55 to-[#030712]" />
      ) : null}

      <div
        className={`axiom-particle-vignette pointer-events-none absolute inset-0 z-[2] h-full w-full ${
          headerWatermark ? "axiom-particle-vignette--header" : ""
        }`}
      />
    </div>
  );
}
