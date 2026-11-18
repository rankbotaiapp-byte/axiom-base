"use client";

import { useCallback, useEffect, useState, type SyntheticEvent } from "react";

export type GracefulVideoOptions = {
  /** When false, start in poster mode immediately. */
  enabled?: boolean;
  /** Skip prefers-reduced-motion auto-fallback (default true for aggressive mode). */
  honorReducedMotion?: boolean;
  /** Skip navigator.connection.saveData auto-fallback (default true for aggressive mode). */
  honorSaveData?: boolean;
  /** Treat suspend-with-empty-buffer as fatal (default true). */
  fallbackOnSuspend?: boolean;
  /** Treat play() promise rejection as fatal (default true). */
  fallbackOnPlayReject?: boolean;
};

/**
 * Detects failed HTML5 video playback and signals a static poster fallback.
 * Pass relaxed options for companions that must keep looping whenever possible.
 */
export function useGracefulVideo(options: boolean | GracefulVideoOptions = true) {
  const opts: Required<GracefulVideoOptions> =
    typeof options === "boolean"
      ? {
          enabled: options,
          honorReducedMotion: true,
          honorSaveData: true,
          fallbackOnSuspend: true,
          fallbackOnPlayReject: true,
        }
      : {
          enabled: options.enabled ?? true,
          honorReducedMotion: options.honorReducedMotion ?? true,
          honorSaveData: options.honorSaveData ?? true,
          fallbackOnSuspend: options.fallbackOnSuspend ?? true,
          fallbackOnPlayReject: options.fallbackOnPlayReject ?? true,
        };

  const [showVideo, setShowVideo] = useState(opts.enabled);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!opts.enabled) {
      setShowVideo(false);
      return;
    }
    setShowVideo(true);
    setFailed(false);

    const reduce =
      opts.honorReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      opts.honorSaveData &&
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    if (reduce || saveData) {
      setShowVideo(false);
      setFailed(true);
    }
  }, [
    opts.enabled,
    opts.honorReducedMotion,
    opts.honorSaveData,
  ]);

  const fail = useCallback(() => {
    setFailed(true);
    setShowVideo(false);
  }, []);

  const onError = useCallback(
    (_event?: SyntheticEvent<HTMLVideoElement>) => {
      fail();
    },
    [fail],
  );

  const onSuspend = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      if (!opts.fallbackOnSuspend) return;
      const el = event.currentTarget;
      if (el.readyState < 2 && el.networkState === HTMLMediaElement.NETWORK_IDLE) {
        fail();
      }
    },
    [fail, opts.fallbackOnSuspend],
  );

  const onStalled = useCallback(() => {
    /* soft signal — wait for a hard media error */
  }, []);

  const tryPlay = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el || !showVideo) return;
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      void el.play().catch(() => {
        if (opts.fallbackOnPlayReject) fail();
      });
    },
    [fail, opts.fallbackOnPlayReject, showVideo],
  );

  return {
    showVideo: showVideo && !failed,
    failed,
    onError,
    onSuspend,
    onStalled,
    tryPlay,
    fail,
  };
}
