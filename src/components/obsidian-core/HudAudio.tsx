"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type HudAudioApi = {
  enabled: boolean;
  toggle: () => void;
  blip: (pitch?: number) => void;
  haptic: (ms?: number | number[]) => void;
};

const HudAudioContext = createContext<HudAudioApi | null>(null);

export function useHudAudio() {
  const ctx = useContext(HudAudioContext);
  if (!ctx) throw new Error("useHudAudio must be used inside <HudAudioProvider>");
  return ctx;
}

export function HudAudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const ensureGraph = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC();

    const master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 6;
    filter.connect(master);

    const pulse = ac.createGain();
    pulse.gain.value = 0.7;
    pulse.connect(filter);

    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.45;
    const lfoDepth = ac.createGain();
    lfoDepth.gain.value = 0.3;
    lfo.connect(lfoDepth).connect(pulse.gain);
    lfo.start();
    oscillatorsRef.current.push(lfo);

    const voices: Array<[OscillatorType, number, number]> = [
      ["sine", 55, 0.5],
      ["sine", 55.6, 0.5],
      ["triangle", 110, 0.12],
    ];
    voices.forEach(([type, freq, level]) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = ac.createGain();
      g.gain.value = level;
      o.connect(g).connect(pulse);
      o.start();
      oscillatorsRef.current.push(o);
    });

    ctxRef.current = ac;
    masterRef.current = master;
    return ac;
  }, []);

  useEffect(() => {
    return () => {
      for (const o of oscillatorsRef.current) {
        try {
          o.stop();
          o.disconnect();
        } catch {
          /* already stopped */
        }
      }
      oscillatorsRef.current = [];
      const ac = ctxRef.current;
      if (ac) {
        void ac.close().catch(() => undefined);
        ctxRef.current = null;
        masterRef.current = null;
      }
    };
  }, []);

  const toggle = useCallback(() => {
    const ac = ensureGraph();
    const master = masterRef.current!;
    const next = !enabled;
    if (next && ac.state === "suspended") void ac.resume();
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(next ? 0.22 : 0, ac.currentTime, 0.35);
    setEnabled(next);
    navigator.vibrate?.(next ? [10, 40, 18] : 8);
  }, [enabled, ensureGraph]);

  const blip = useCallback(
    (pitch = 660) => {
      const ac = ctxRef.current;
      if (!ac || !enabled) return;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(pitch, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(pitch * 2.2, ac.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.22);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.25);
    },
    [enabled],
  );

  const haptic = useCallback((ms: number | number[] = 12) => {
    navigator.vibrate?.(ms);
  }, []);

  useEffect(() => {
    const onVis = () => {
      const ac = ctxRef.current;
      if (!ac) return;
      if (document.hidden) void ac.suspend();
      else if (enabled) void ac.resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled]);

  return <HudAudioContext.Provider value={{ enabled, toggle, blip, haptic }}>{children}</HudAudioContext.Provider>;
}

export function AudioToggle() {
  const { enabled, toggle } = useHudAudio();
  const bars = [0.45, 0.85, 1, 0.7, 0.4];

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute ambient HUD audio" : "Enable ambient HUD audio"}
      className={`obsidian-glass group relative flex h-11 w-11 items-center justify-center gap-[3px] rounded-full border border-white/10 transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] ${
        enabled ? "border-[#00ffcc]/70 shadow-[0_0_18px_rgba(0,255,204,0.45)]" : "hover:border-[#00ffcc]/50"
      }`}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[#00ffcc] shadow-[0_0_6px_#00ffcc] transition-[height] duration-300"
          style={{
            height: enabled ? `${h * 18}px` : "3px",
            animation: enabled ? `obsidian-hud-wave 0.9s ease-in-out ${i * 0.12}s infinite alternate` : "none",
          }}
        />
      ))}
    </button>
  );
}
