"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Pause, Play } from "lucide-react";
import SparkField from "./SparkField";
import { haptic } from "./haptics";
import { AXIOM_COLORS, landingConfig, type LandingConfig } from "./landing.config";
import { HeroStudioLivePreview } from "@/components/axiom-landing/HeroStudioLivePreview";
import { AxiomLogoMark } from "@/components/axiom-landing/AxiomLogoMark";

const { cyan, amber } = AXIOM_COLORS;

/**
 * Top-of-page brand hero: the obsidian stone logo loop inside a tilting glass
 * frame. The loop plays on its own; Play pauses it.
 */
export default function AxiomBrandHero({
  hero = landingConfig.hero,
  onLaunch,
}: {
  hero?: LandingConfig["hero"];
  onLaunch?: () => void;
}) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [loaded, setLoaded] = useState(true);
  const [burstKey, setBurstKey] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  // Hover tilt: pointer position -> spring -> rotation. Touch devices never fire this.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 18 });
  const sy = useSpring(py, { stiffness: 140, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const sheenX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  // Gyro tilt on phones. Android fires this without asking; iOS needs the
  // permission requested from a tap, which toggle() does below.
  const [gyro, setGyro] = useState(false);
  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      px.set(Math.max(-0.5, Math.min(0.5, e.gamma / 50)));
      py.set(Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 50)));
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, [reduced, gyro, px, py]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    haptic(playing ? 10 : [16, 40, 24]);
    const DOE = (typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : undefined) as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
      | undefined;
    if (!gyro && DOE?.requestPermission && window.matchMedia("(pointer: coarse)").matches) {
      DOE.requestPermission().then((r) => setGyro(r === "granted")).catch(() => {});
    }
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
      return;
    }
    setLoaded(true);
    setBurstKey((k) => k + 1);
    setPlaying(true);
    // src is attached on first play, so wait a tick for React to commit it.
    requestAnimationFrame(() => video.play().catch(() => setPlaying(false)));
  };

  return (
    <section id="top" className="relative isolate overflow-hidden bg-[#050507] px-4 pb-10 pt-24 text-white sm:px-6 sm:pt-28 lg:pb-14">
      {/* Ambient glow behind the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[520px] w-[min(1100px,120vw)] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: `radial-gradient(closest-side, ${cyan}55, ${amber}22 55%, transparent)` }}
      />

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <AxiomLogoMark href="#top" />
          </div>
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {hero.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/70 sm:text-lg">{hero.subhead}</p>
        </div>

        <div className="mx-auto mt-6 flex max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
          <a
            href={hero.primaryCta.href}
            onClick={(event) => {
              haptic(14);
              if (!onLaunch) return;
              event.preventDefault();
              onLaunch();
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-full px-7 text-center text-base font-semibold text-[#030712] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ background: cyan, boxShadow: `0 0 32px ${cyan}66` }}
          >
            {hero.primaryCta.label}
          </a>
          <a
            href={hero.secondaryCta.href}
            onClick={() => haptic(14)}
            className="inline-flex min-h-12 items-center justify-center rounded-full border px-7 text-base font-semibold transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ borderColor: `${amber}99`, color: amber }}
          >
            {hero.secondaryCta.label}
          </a>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-white/65">{hero.feeLine}</p>

        <div className="mx-auto mt-8 max-w-4xl [perspective:1400px] sm:mt-10" onPointerMove={onMove} onPointerLeave={onLeave}>
          <motion.div
            className="relative"
            initial={false}
            animate={live ? { opacity: [0, 1], scale: [0.94, 1] } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: live ? 0.12 : 0 }}
            whileHover={{ scale: 1.02, rotate: -0.4 }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          >
            {/* Glass frame. Height follows the media, so the logo loop is never cropped. */}
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_30px_120px_-20px_rgba(0,255,204,0.35)] backdrop-blur-xl sm:p-2.5">
              <div className="relative w-full overflow-hidden rounded-[18px] bg-black">
                <img
                  src={hero.image}
                  alt={hero.imageAlt}
                  width={1280}
                  height={720}
                  fetchPriority="high"
                  decoding="async"
                  className={`block h-auto w-full object-contain ${playing ? "hidden" : ""}`}
                  style={{ objectFit: "contain" }}
                />
                <video
                  ref={videoRef}
                  src={loaded ? hero.loop : undefined}
                  poster={hero.image}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-hidden={!playing}
                  className={`block h-auto w-full object-contain ${playing ? "" : "hidden"}`}
                  style={{ objectFit: "contain" }}
                />

                <SparkField colors={[cyan, amber]} burstKey={burstKey} />

                {/* Specular sheen that follows the cursor */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mix-blend-screen"
                  style={{
                    background: useTransform(
                      sheenX,
                      (x) => `radial-gradient(600px circle at ${x} 0%, rgba(255,255,255,0.14), transparent 60%)`,
                    ),
                  }}
                />

                <button
                  type="button"
                  onClick={toggle}
                  aria-pressed={playing}
                  className="absolute bottom-3 left-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 text-sm font-medium backdrop-blur-md transition hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffcc] sm:bottom-5 sm:left-5"
                >
                  <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full" style={{ background: playing ? amber : cyan, color: "#050507" }}>
                    {playing ? <Pause className="h-3 w-3" fill="currentColor" aria-hidden="true" /> : <Play className="h-3 w-3" fill="currentColor" aria-hidden="true" />}
                  </span>
                  {playing ? "Pause animation" : "Play animation"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl sm:mt-10">
          <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: cyan }}>
            Hero Studio · live before you sign up
          </p>
          <HeroStudioLivePreview />
        </div>

      </div>
    </section>
  );
}
