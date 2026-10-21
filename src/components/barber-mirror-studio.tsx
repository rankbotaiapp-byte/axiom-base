import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useBiokineticEngine, type GazeDwell } from "@/hooks/use-biokinetic-engine";
import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const ROOM = "/media/heroes/barber-hero.mp4";
const FRAME_SHIFT = { x: 28, y: 16 };
const DECK_SHIFT = { x: 48, y: 28 };

const DEFAULT_OFFERS = [
  { name: "Signature cut", description: "Consultation, cut, finish.", price: "$48" },
  { name: "Skin fade", description: "Tight blend, razor line.", price: "$54" },
  { name: "Beard sculpt", description: "Shape, line-up, oil.", price: "$28" },
] as const;

export type MirrorOffer = {
  name: string;
  description: string;
  price: string;
};

const BARBER = /\b(barbers?|barbershops?|haircuts?)\b/i;

/** The mirror replaces the cinematic hero for the barber book. */
export function usesBarberMirror(niche: string, text = ""): boolean {
  if (BARBER.test(`${niche} ${text}`)) return true;
  return niche === "location";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Nose offset from center, -1 to 1. Raw camera x: looking right lowers x. */
export function gazeShift(face: NormalizedLandmark[]) {
  const nose = face[1];
  if (!nose) return { x: 0, y: 0 };
  return {
    x: clamp((nose.x - 0.5) * 2.4, -1, 1),
    y: clamp((nose.y - 0.46) * 2.6, -1, 1),
  };
}

export function BarberMirrorStudio({
  businessName,
  bookHref,
  services,
  children,
}: {
  businessName: string;
  bookHref?: string;
  services?: readonly MirrorOffer[];
  children?: ReactNode;
}) {
  const offers = services && services.length > 0 ? services : DEFAULT_OFFERS;
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const frameX = useSpring(0, { stiffness: 180, damping: 22, mass: 0.45 });
  const frameY = useSpring(0, { stiffness: 180, damping: 22, mass: 0.45 });
  const deckX = useSpring(0, { stiffness: 160, damping: 20, mass: 0.5 });
  const deckY = useSpring(0, { stiffness: 160, damping: 20, mass: 0.5 });
  const gazeRef = useRef<GazeDwell | null>(null);
  const [live, setLive] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [details, setDetails] = useState(false);
  const [booking, setBooking] = useState(false);
  const [held, setHeld] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const biokinetic = useBiokineticEngine({
    cameraGranted: cameraError === "" && live,
    gazeRef,
    reducedMotion: reduce,
  });
  const offer = offers[index] ?? offers[0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let dead = false;
    let raf = 0;
    let lastStamp = -1;
    let marker: FaceLandmarker | null = null;
    let dwellSec = 0;
    let gazeAt = 0;
    let prevGaze = { x: 0, y: 0 };

    const aim = (x: number, y: number) => {
      const fx = x * FRAME_SHIFT.x;
      const fy = y * FRAME_SHIFT.y;
      const dx = x * DECK_SHIFT.x;
      const dy = y * DECK_SHIFT.y;
      if (reduce) {
        frameX.jump(fx);
        frameY.jump(fy);
        deckX.jump(dx);
        deckY.jump(dy);
        return;
      }
      frameX.set(fx);
      frameY.set(fy);
      deckX.set(dx);
      deckY.set(dy);
    };

    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      if (document.visibilityState !== "visible") return;
      if (!marker || video.readyState < 2) return;
      const now = performance.now();
      if (now <= lastStamp) return;
      lastStamp = now;
      const face = marker.detectForVideo(video, now).faceLandmarks[0];
      if (!face) {
        aim(0, 0);
        dwellSec = 0;
        gazeRef.current = null;
        return;
      }
      const shift = gazeShift(face);
      const moved = Math.hypot(shift.x - prevGaze.x, shift.y - prevGaze.y);
      const gazeDt = gazeAt ? Math.max(0, (now - gazeAt) / 1000) : 0;
      gazeAt = now;
      prevGaze = shift;
      dwellSec = moved < 0.12 ? Math.min(3, dwellSec + gazeDt) : 0;
      gazeRef.current = { dwellSec, stability: clamp(1 - moved / 0.45, 0, 1) };
      aim(shift.x, shift.y);
    };

    const stopStream = () => {
      const stream = video.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };

    const open = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser has no camera.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (dead) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setLive(true);
        setCameraError("");
        const { FaceLandmarker: Marker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        const options = {
          runningMode: "VIDEO" as const,
          numFaces: 1,
        };
        try {
          marker = await Marker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
          });
        } catch {
          marker = await Marker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
          });
        }
        if (dead) {
          marker.close();
          marker = null;
          return;
        }
        setTracking(true);
      } catch {
        if (!dead) setCameraError("The mirror needs the camera.");
      }
    };

    raf = requestAnimationFrame(tick);
    void open();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      marker?.close();
      stopStream();
    };
  }, [attempt, deckX, deckY, frameX, frameY, reduce]);

  return (
    <section
      className={
        booking
          ? "barber-stage relative z-50 h-screen min-h-[100dvh] w-full overflow-hidden"
          : "barber-stage relative h-screen min-h-[100dvh] w-full overflow-hidden"
      }
      aria-label="Barber mirror studio"
    >
      <motion.div className="barber-rig" style={{ scale: biokinetic.cameraDollyScale }}>
        <video className="barber-wall" src={ROOM} autoPlay loop muted playsInline />
        <div className="barber-mirror">
          <div className="barber-glass relative h-full w-full overflow-hidden rounded-2xl">
          <video
            ref={videoRef}
            className="barber-reflection"
            playsInline
            muted
            autoPlay
            width={1280}
            height={720}
          />
          <p className="barber-live">{tracking ? "Live mirror" : live ? "Finding a face" : "Mirror"}</p>
          {cameraError ? (
            <button type="button" className="barber-enable" onClick={() => setAttempt((n) => n + 1)}>
              {cameraError}
            </button>
          ) : null}
          </div>
        </div>
        <div className="barber-frame-slot">
          <motion.div className="barber-frame" style={{ x: frameX, y: frameY }} />
        </div>
        <div className="barber-vanity">
          <motion.div style={{ x: deckX, y: deckY }}>
          <div className="barber-unit" role="region" aria-label="Head unit">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">{businessName}</p>
            <p className="mt-2 font-display text-2xl text-fg">{offer.name}</p>
            <p className="text-sm text-accent">{offer.price}</p>
            {details ? <p className="mt-2 text-sm text-muted">{offer.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="barber-key"
                onClick={() => {
                  setIndex((n) => (n + 1) % offers.length);
                  setDetails(false);
                }}
              >
                Next
              </button>
              <button type="button" className="barber-key" onClick={() => setDetails((on) => !on)}>
                View Details
              </button>
              <button
                type="button"
                className="barber-key is-primary"
                onClick={() => {
                  setHeld(false);
                  setBooking(true);
                }}
              >
                Book chair
              </button>
            </div>
          </div>
          </motion.div>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="pointer-events-auto">{children}</div>
      </div>
      {booking ? (
        <div className="barber-book fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Book a chair">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-end px-5 py-8 sm:justify-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Chair book</p>
            <h2 className="mt-2 font-display text-4xl text-fg">{held ? "Held on the book." : offer.name}</h2>
            <p className="mt-2 text-sm text-muted">
              {held ? "The chair has the request. Nothing was charged." : `${offer.description} ${offer.price}.`}
            </p>
            {held ? null : (
              <form
                className="mt-6 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setHeld(true);
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
                <button type="submit" className="barber-key is-primary h-12">
                  Confirm {offer.price}
                </button>
              </form>
            )}
            <div className="mt-4 flex gap-2">
              {bookHref && !held ? (
                <a href={bookHref} className="barber-key inline-flex h-11 items-center">
                  Open the book
                </a>
              ) : null}
              <button
                type="button"
                className="barber-key"
                onClick={() => {
                  setBooking(false);
                  setHeld(false);
                }}
              >
                {held ? "Return to the mirror" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
