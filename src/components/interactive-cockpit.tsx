import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useMotionTemplate, useReducedMotion } from "framer-motion";
import { useBiokineticEngine } from "@/hooks/use-biokinetic-engine";
import { AUTO_HERO_SRC } from "@/lib/axiom/auto-sequence";

const POSTER = "/media/auto-hero.jpg";
/** Power glyph inside coastal-drive.mp4, as a fraction of the frame. */
const SCREEN_GLYPH = { x: 0.66, y: 0.724 };

const OFFERS = [
  {
    id: "diag",
    name: "Engine Diagnostics",
    detail: "A driveway scan and a plain-language report before any part is sold.",
    price: "$129",
  },
  {
    id: "mobile",
    name: "Mobile Service",
    detail: "The van comes to the curb. Battery, no-start, and the jobs that should not need a tow.",
    price: "$149",
  },
  {
    id: "brake",
    name: "Brake Care",
    detail: "Pads, rotors, and the inspection, booked before the light comes on.",
    price: "$189",
  },
] as const;

type Phase = 0 | 1 | 2 | 3 | 4;
type Scene = "rift" | "warp" | "drive";
type CheckoutMode = "book" | "claim";

let audioCtx: AudioContext | null = null;

function audio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = audioCtx ?? new Ctx();
  audioCtx = ctx;
  void ctx.resume();
  return ctx;
}

function playClick() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(210, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.05);
  gain.gain.setValueAtTime(0.07, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}

/** Low sweep that breaks into a short V8 roar. Starts only from the rift click. */
function playWarp() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.001, now);
  master.gain.exponentialRampToValueAtTime(0.24, now + 0.2);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
  master.connect(ctx.destination);

  const sweep = ctx.createOscillator();
  sweep.type = "sine";
  sweep.frequency.setValueAtTime(42, now);
  sweep.frequency.exponentialRampToValueAtTime(380, now + 0.26);
  sweep.connect(master);
  sweep.start(now);
  sweep.stop(now + 0.34);

  const roar = ctx.createOscillator();
  const roarGain = ctx.createGain();
  roar.type = "sawtooth";
  roar.frequency.setValueAtTime(55, now + 0.14);
  roar.frequency.exponentialRampToValueAtTime(96, now + 0.28);
  roar.frequency.exponentialRampToValueAtTime(46, now + 0.48);
  roarGain.gain.setValueAtTime(0.001, now);
  roarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  roarGain.gain.exponentialRampToValueAtTime(0.42, now + 0.3);
  roarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
  roar.connect(roarGain);
  roarGain.connect(master);
  roar.start(now);
  roar.stop(now + 0.54);

  const length = Math.floor(ctx.sampleRate * 0.36);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(160, now);
  filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.22, now + 0.28);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now + 0.12);
  noise.stop(now + 0.5);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function glyphOnVideo(video: HTMLVideoElement) {
  const width = video.clientWidth;
  const height = video.clientHeight;
  const frameW = video.videoWidth;
  const frameH = video.videoHeight;
  if (!width || !height || !frameW || !frameH) return { x: 66, y: 77 };
  const scale = Math.max(width / frameW, height / frameH);
  const drawnW = frameW * scale;
  const drawnH = frameH * scale;
  const cropX = (drawnW - width) / 2;
  const cropY = (drawnH - height) / 2;
  return {
    x: ((SCREEN_GLYPH.x * drawnW - cropX) / width) * 100,
    y: ((SCREEN_GLYPH.y * drawnH - cropY) / height) * 100,
  };
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function InteractiveCockpit({
  businessName,
  bookHref,
  children,
}: {
  businessName: string;
  bookHref?: string;
  children?: ReactNode;
}) {
  const [scene, setScene] = useState<Scene>("rift");
  const [phase, setPhase] = useState<Phase>(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [details, setDetails] = useState(false);
  const [mode, setMode] = useState<CheckoutMode>("book");
  const [booked, setBooked] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [gyro, setGyro] = useState({ x: 0, y: 0 });
  const [hot, setHot] = useState({ x: 66, y: 77 });
  const stageRef = useRef<HTMLElement>(null);
  const coastRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const biokinetic = useBiokineticEngine({ cameraGranted: false, reducedMotion: reduce });
  const glassBlur = useMotionTemplate`blur(${biokinetic.backdropBlurAmount}px)`;
  const offer = OFFERS[picked ?? index];

  useEffect(() => {
    if (scene !== "drive") return;
    const video = coastRef.current;
    if (!video) return;
    const place = () => setHot(glyphOnVideo(video));
    place();
    video.addEventListener("loadedmetadata", place);
    const observer = new ResizeObserver(place);
    observer.observe(video);
    return () => {
      video.removeEventListener("loadedmetadata", place);
      observer.disconnect();
    };
  }, [scene]);

  useEffect(() => {
    const onOrient = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;
      setGyro({
        x: Math.max(-1, Math.min(1, gamma / 28)),
        y: Math.max(-1, Math.min(1, (beta - 35) / 40)),
      });
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  const lookX = Math.max(-1, Math.min(1, look.x * 0.8 + gyro.x * 0.7));
  const lookY = Math.max(-1, Math.min(1, look.y * 0.45 + gyro.y * 0.4));
  const dolly = scene === "drive" && (phase === 1 || phase === 2);

  function engage() {
    if (scene !== "rift") return;
    playWarp();
    setScene("warp");
    window.setTimeout(() => setScene("drive"), reducedMotion() ? 0 : 400);
  }

  function ignite() {
    if (scene !== "drive" || phase !== 0) return;
    playClick();
    setPhase(1);
    window.setTimeout(() => setPhase(2), reducedMotion() ? 0 : 880);
  }

  function openCheckout(next: CheckoutMode) {
    playClick();
    setMode(next);
    setBooked(false);
    setPhase(3);
  }

  function returnToDrive() {
    setPhase(4);
    window.setTimeout(() => {
      setPhase(0);
      setDetails(false);
      setBooked(false);
    }, reducedMotion() ? 0 : 720);
  }

  return (
    <section
      ref={stageRef}
      className={
        phase === 3
          ? "cockpit-stage relative z-50 h-screen min-h-[100dvh] w-full overflow-hidden"
          : "cockpit-stage relative h-screen min-h-[100dvh] w-full overflow-hidden"
      }
      style={{ ["--look-x" as string]: lookX.toFixed(3), ["--look-y" as string]: lookY.toFixed(3) }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        setLook({
          x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
          y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
        });
      }}
    >
      <motion.div className="absolute inset-0" style={{ scale: biokinetic.cameraDollyScale }}>
      {scene !== "drive" ? (
        <motion.div
          className="cockpit-rift"
          animate={
            scene === "warp"
              ? {
                  scale: [1, 1.3, 1],
                  filter: ["brightness(1)", "brightness(3)", "brightness(1)"],
                  opacity: [1, 0, 1],
                }
              : { scale: 1, filter: "brightness(1)", opacity: 1 }
          }
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <video className="cockpit-film" src={AUTO_HERO_SRC} poster={POSTER} autoPlay loop muted playsInline />
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-[5]" style={{ backdropFilter: glassBlur }} />
          {scene === "rift" ? (
            <button type="button" className="cockpit-warp" onClick={engage}>
              ENGAGE TIME-WARP // ENTER COCKPIT
            </button>
          ) : null}
        </motion.div>
      ) : (
        <motion.div
          className="cockpit-dolly"
          initial={false}
          animate={dolly ? { scale: 1.62 } : { scale: 1 }}
          transition={{ duration: reduce ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: `${hot.x}% ${hot.y}%` }}
        >
          <div className="cockpit-rig">
          <video
            ref={coastRef}
            src={AUTO_HERO_SRC}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-[5]" style={{ backdropFilter: glassBlur }} />
          {phase === 0 ? (
            <button
              type="button"
              className="cockpit-ignition"
              style={{ left: `${hot.x}%`, top: `${hot.y}%` }}
              onClick={ignite}
              aria-label="Touch to initialize"
            >
              <span className="cockpit-ignition-core" />
            </button>
          ) : null}
          </div>
        </motion.div>
      )}
      </motion.div>
      {scene === "drive" && (phase === 1 || phase === 2) ? (
        <div
          className={phase === 1 ? "cockpit-screen is-booting" : "cockpit-screen"}
          style={{ left: `${hot.x}%`, top: `${hot.y}%`, transform: "translate(-50%, -50%)" }}
          role="region"
          aria-label="Head unit"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">{businessName}</p>
          {phase === 1 ? (
            <p className="cockpit-boot font-display text-3xl">Northline</p>
          ) : (
            <>
              <p className="mt-2 font-display text-2xl text-fg">{offer.name}</p>
              <p className="text-sm text-accent">{offer.price}</p>
              {details ? <p className="mt-2 text-sm text-muted">{offer.detail}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="cockpit-key"
                  onClick={() => {
                    setIndex((n) => (n + 1) % OFFERS.length);
                    setPicked(null);
                    setDetails(false);
                  }}
                >
                  Next
                </button>
                <button
                  type="button"
                  className="cockpit-key"
                  onClick={() => {
                    setPicked(index);
                    playClick();
                  }}
                >
                  Select
                </button>
                <button type="button" className="cockpit-key" onClick={() => setDetails((on) => !on)}>
                  View Details
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="cockpit-key is-primary" onClick={() => openCheckout("book")}>
                  Book Service
                </button>
                <button type="button" className="cockpit-key" onClick={() => openCheckout("claim")}>
                  Claim Storefront
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="pointer-events-auto">{children}</div>
      </div>
      {phase === 3 && scene === "drive" ? (
        <div className="cockpit-checkout fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Book service">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-end px-5 py-8 sm:justify-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              {mode === "claim" ? "Claim this book" : "Head unit checkout"}
            </p>
            <h2 className="mt-2 font-display text-4xl text-fg">{booked ? "Held on the book." : offer.name}</h2>
            <p className="mt-2 text-sm text-muted">
              {booked
                ? "The van has the request. Nothing was charged."
                : `${offer.detail} ${offer.price} at the curb.`}
            </p>
            {mode === "book" && !booked ? (
              <form
                className="mt-6 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setBooked(true);
                }}
              >
                <label className="text-sm text-muted">
                  Name
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl bg-surface-2 px-3 text-fg"
                  />
                </label>
                <label className="text-sm text-muted">
                  Phone
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl bg-surface-2 px-3 text-fg"
                  />
                </label>
                <button type="submit" className="cockpit-key is-primary h-12">
                  Confirm {offer.price}
                </button>
              </form>
            ) : null}
            {mode === "claim" && !booked ? (
              <Link
                to="/onboard"
                search={{ niche: "field" }}
                className="cockpit-key is-primary mt-6 inline-flex h-12 items-center justify-center"
              >
                Claim Storefront
              </Link>
            ) : null}
            <div className="mt-4 flex gap-2">
              {bookHref && mode === "book" && !booked ? (
                <a href={bookHref} className="cockpit-key inline-flex h-11 items-center">
                  Open the book
                </a>
              ) : null}
              <button type="button" className="cockpit-key" onClick={returnToDrive}>
                {booked ? "Return to drive" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
