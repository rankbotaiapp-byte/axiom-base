"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActionDock from "./ActionDock";
import styles from "./apex.module.css";
import { defaultBuild, resolveBuild, type BuildSelection } from "./build";
import Configurator from "./Configurator";
import { lowTierLabel, media, tierSettings, videoCrop } from "./config";
import CssStage from "./CssStage";
import { EngineAudio } from "./engineAudio";
import HudFrame from "./HudFrame";
import SpecsModal from "./SpecsModal";
import type { StageHandle } from "./stage-types";
import TelemetryPanel from "./TelemetryPanel";
import { ApexMark, cx, glassPanel, Icon } from "./ui";
import { useDeviceTier } from "./useDeviceTier";
import { usePointerRig } from "./usePointerRig";
import { useTelemetry } from "./useTelemetry";
import VoiceConcierge from "./VoiceConcierge";

/** three.js is only downloaded on WebGL-capable tiers. */
const WebGLStage = lazy(() => import("./WebGLStage"));

const LAUNCH_COOLDOWN_MS = 2400;
type ModalId = "specs" | "config" | null;

function HudClock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("en-US", { hour12: false });
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className={styles.mono}>{now}</span>;
}

export default function ApexExperience() {
  const hostRef = useRef<HTMLElement>(null);
  const stageRef = useRef<StageHandle>(null);
  const audioRef = useRef<EngineAudio | null>(null);
  const launchingRef = useRef(false);

  const { tier, downgrade } = useDeviceTier();
  const rig = usePointerRig(hostRef, tier !== null && tier !== "low");
  const { telemetry, spike } = useTelemetry(true);

  const [ready, setReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchKey, setLaunchKey] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [modal, setModal] = useState<ModalId>(null);
  const [build, setBuild] = useState<BuildSelection>(defaultBuild);
  const [conciergeAttention, setConciergeAttention] = useState(0);

  const resolved = useMemo(() => resolveBuild(build), [build]);

  const getAudio = useCallback(() => {
    audioRef.current ??= new EngineAudio();
    return audioRef.current;
  }, []);

  useEffect(() => () => audioRef.current?.dispose(), []);

  // Never leave the poster up forever if a codec stalls.
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 3000);
    return () => window.clearTimeout(id);
  }, []);

  const launch = useCallback(() => {
    if (launchingRef.current) return;
    launchingRef.current = true;
    setLaunching(true);
    setLaunchKey((k) => k + 1);
    setShaking(true);
    stageRef.current?.surge();
    spike();
    void getAudio()
      .rev()
      .then(() => setSoundOn(getAudio().isEnabled));
    if ("vibrate" in navigator) navigator.vibrate([25, 40, 60, 30, 140]);
    window.setTimeout(() => setShaking(false), 760);
    window.setTimeout(() => {
      launchingRef.current = false;
      setLaunching(false);
    }, LAUNCH_COOLDOWN_MS);
  }, [getAudio, spike]);

  const toggleSound = useCallback(async () => {
    const audio = getAudio();
    if (audio.isEnabled) {
      audio.disable();
      setSoundOn(false);
    } else {
      setSoundOn(await audio.enable());
    }
  }, [getAudio]);

  const bookBuild = useCallback(() => {
    setModal(null);
    setConciergeAttention((n) => n + 1);
  }, []);

  // Keyboard shortcuts: L / S / C.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === "l") launch();
      else if (key === "s") setModal("specs");
      else if (key === "c") setModal("config");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [launch, modal]);

  const tierLabel = tier === null ? "DETECTING" : tier === "low" ? lowTierLabel : tierSettings[tier].label;
  const focal = `${videoCrop.focal.x * 100}% ${videoCrop.focal.y * 100}%`;

  return (
    <main
      ref={hostRef}
      className={cx("relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#030712] text-slate-100", styles.display)}
    >
      <div className="absolute inset-0 touch-none select-none">
        {/* ---------- stage ---------- */}
        <div className={cx("absolute inset-0", shaking && styles.shake)}>
          {tier !== null &&
            (tier === "low" ? (
              <CssStage rig={rig} flameHue={resolved.exhaust.hue} onReady={() => setReady(true)} stageRef={stageRef} />
            ) : (
              <Suspense fallback={null}><WebGLStage
                key={tier}
                tier={tier}
                rig={rig}
                flameHue={resolved.exhaust.hue}
                onReady={() => setReady(true)}
                onPerformanceDrop={downgrade}
                stageRef={stageRef}
              /></Suspense>
            ))}
          {/* eslint-disable-next-line @next/next/no-img-element -- static LCP poster, intentionally unoptimised */}
          <img
            src={media.poster}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className={cx(
              "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              ready ? "opacity-0" : "opacity-100",
            )}
            style={{ objectPosition: focal, transform: "scale(1.08)" }}
          />
        </div>

        {/* ---------- obsidian grade + vignette ---------- */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-slate-950/50" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-transparent" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 60% 55%, transparent 45%, rgba(2,6,23,0.75) 100%)" }}
        />

        <HudFrame />

        {/* ---------- HUD ---------- */}
        <div className={cx("absolute inset-0 z-20 flex flex-col px-5 pb-5 pt-5 sm:px-8 sm:pb-8 sm:pt-7 lg:px-10", styles.hudTilt)}>
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ApexMark className="h-6 w-12 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)] sm:h-7 sm:w-14" />
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-[0.38em] text-white sm:text-base">APEX MOTO</p>
                <p className="text-[9px] font-semibold tracking-[0.34em] text-cyan-300/90 sm:text-[10px]">APEX GT3 · PERFORMANCE LAB</p>
              </div>
            </div>

            <div className="hidden items-center gap-4 text-[10px] tracking-[0.24em] text-slate-400 md:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                ECU LINK
              </span>
              <span className="text-cyan-300/80">{tierLabel}</span>
              <HudClock />
            </div>

            <div className="flex items-center gap-2" data-rig-ignore>
              <button
                type="button"
                onClick={() => void toggleSound()}
                aria-pressed={soundOn}
                aria-label={soundOn ? "Mute engine audio" : "Enable engine audio"}
                className={cx(
                  glassPanel,
                  "grid h-10 w-10 place-items-center text-cyan-200 transition hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                )}
              >
                {soundOn ? <Icon.Volume /> : <Icon.Mute />}
              </button>
              <button
                type="button"
                onClick={bookBuild}
                className={cx(
                  glassPanel,
                  styles.sheen,
                  "hidden h-10 items-center px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:border-cyan-300 hover:bg-cyan-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:inline-flex",
                )}
              >
                Book a build
              </button>
            </div>
          </header>

          <section className="flex flex-1 items-start pt-6 sm:pt-10 lg:items-center lg:pt-0">
            <div className={cx("max-w-xl", styles.fadeUp)}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-300 sm:text-xs">
                Launch control <span className="text-slate-500">//</span>{" "}
                <span className={launching ? "text-white drop-shadow-[0_0_10px_rgba(34,211,238,1)]" : ""}>
                  {launching ? "Engaged" : "Armed"}
                </span>
              </p>
              <h1 className="mt-2 text-[34px] font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                The 911 GT3.
                <br />
                <span className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-sky-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]">
                  Unleashed.
                </span>
              </h1>
              <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-slate-300 sm:block sm:text-base">
                Twin-turbo conversions, launch-control calibration and dyno-verified power — engineered, tuned and delivered by APEX MOTO.
              </p>
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-[minmax(320px,380px)_1fr_minmax(280px,320px)] lg:items-end lg:gap-5">
            <div className="order-1">
              <TelemetryPanel telemetry={telemetry} />
            </div>
            <div className="order-3 flex justify-center lg:order-2 lg:pb-1">
              <div className="w-full max-w-xl">
                <ActionDock
                  onLaunch={launch}
                  onSpecs={() => setModal("specs")}
                  onConfigure={() => setModal("config")}
                  launching={launching}
                  cooldownMs={LAUNCH_COOLDOWN_MS}
                  launchKey={launchKey}
                />
              </div>
            </div>
            <div className="order-2 lg:order-3">
              <VoiceConcierge buildSummary={resolved.summary} attention={conciergeAttention} />
            </div>
          </div>
        </div>
      </div>

      <SpecsModal open={modal === "specs"} onClose={() => setModal(null)} onConfigure={() => setModal("config")} />
      <Configurator
        open={modal === "config"}
        onClose={() => setModal(null)}
        selection={build}
        onChange={setBuild}
        onBook={bookBuild}
      />
    </main>
  );
}
