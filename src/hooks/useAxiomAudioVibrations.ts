"use client";

import { useEffect, useRef, useState } from "react";
import {
  attachCompanionMediaElement,
  attachCompanionMediaStream,
  companionVoiceIsSpeaking,
  getCompanionAnalyser,
  primeCompanionVoiceAudio,
  readCompanionAnalyserIntensity,
  subscribeCompanionVoice,
} from "@/lib/axiom/companion-voice-bus";

export type UseAxiomAudioVibrationsOptions = {
  enabled?: boolean;
  /** Optional HTML media element (TTS/file playback) to tap via Web Audio. */
  mediaElement?: HTMLMediaElement | null;
  /** Optional live MediaStream (mic / remote voice). */
  mediaStream?: MediaStream | null;
};

export type AxiomAudioVibrations = {
  /** Normalized 0–1 voice amplitude (volume + bass weight). */
  audioIntensity: number;
  /** True while speechSynthesis / attached media is active. */
  isSpeaking: boolean;
  /** Bass-leaning 0–1 slice for deeper liquid churn. */
  bassIntensity: number;
};

/**
 * Real-time companion voice intensity via AnalyserNode FFT + speech bus events.
 */
export function useAxiomAudioVibrations(
  options: UseAxiomAudioVibrationsOptions = {},
): AxiomAudioVibrations {
  const { enabled = true, mediaElement = null, mediaStream = null } = options;
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const raf = useRef<number | null>(null);
  const smooth = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const onGesture = () => primeCompanionVoiceAudio();
    window.addEventListener("pointerdown", onGesture, { once: true, passive: true });
    window.addEventListener("keydown", onGesture, { once: true });

    const unsub = subscribeCompanionVoice((state) => {
      setIsSpeaking(state.speaking || companionVoiceIsSpeaking());
    });

    const tick = () => {
      const speakingNow = companionVoiceIsSpeaking();
      setIsSpeaking(speakingNow);

      const analyser = getCompanionAnalyser();
      let next = 0;
      let bass = 0;
      if (analyser && speakingNow) {
        next = readCompanionAnalyserIntensity();
        const bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        const bassEnd = Math.max(2, Math.floor(bins.length * 0.18));
        let bassSum = 0;
        for (let i = 0; i < bassEnd; i += 1) bassSum += bins[i] ?? 0;
        bass = Math.min(1, bassSum / (bassEnd * 255) * 1.4);
      } else if (!speakingNow) {
        next = 0;
        bass = 0;
      }

      // Ease toward target so liquid motion feels viscous, not jittery.
      smooth.current += (next - smooth.current) * (speakingNow ? 0.28 : 0.16);
      const intensity = speakingNow ? Math.min(1, Math.max(0, smooth.current)) : smooth.current * 0.85;
      if (!speakingNow && intensity < 0.02) smooth.current = 0;

      setAudioIntensity(Number(intensity.toFixed(3)));
      setBassIntensity(Number((speakingNow ? bass : bass * 0.7).toFixed(3)));
      raf.current = window.requestAnimationFrame(tick);
    };
    raf.current = window.requestAnimationFrame(tick);

    return () => {
      unsub();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      if (raf.current != null) window.cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    attachCompanionMediaElement(mediaElement);
    return () => attachCompanionMediaElement(null);
  }, [enabled, mediaElement]);

  useEffect(() => {
    if (!enabled) return;
    attachCompanionMediaStream(mediaStream);
    return () => attachCompanionMediaStream(null);
  }, [enabled, mediaStream]);

  if (!enabled) {
    return { audioIntensity: 0, isSpeaking: false, bassIntensity: 0 };
  }

  return { audioIntensity, isSpeaking, bassIntensity };
}
